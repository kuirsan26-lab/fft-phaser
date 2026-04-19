import * as Phaser from 'phaser';
import { GridSystem } from '../systems/GridSystem';
import { TurnManager } from '../systems/TurnManager';
import { getReachableCells, getCellsInRange, findPath } from '../systems/Pathfinder';
import { executeAbility, aiChooseAction } from '../systems/CombatSystem';
import type { MenuAction } from '../ui/ActionMenu';
import { ActionMenu } from '../ui/ActionMenu';
import { TurnOrderPanel } from '../ui/TurnOrderPanel';
import { BattleLog } from '../ui/BattleLog';
import { Unit } from '../entities/Unit';
import type { AbilityId } from '../data/UnitData';
import { UNIT_TEMPLATES, ABILITIES } from '../data/UnitData';
import { PLAYER_STARTS, ENEMY_STARTS } from '../data/MapData';

type Phase = 'waiting' | 'player_menu' | 'player_move' | 'player_act' | 'ai_turn' | 'game_over';

export class BattleScene extends Phaser.Scene {
  private grid!: GridSystem;
  private turnManager!: TurnManager;
  private units: Unit[] = [];
  private actionMenu!: ActionMenu;
  private turnOrderPanel!: TurnOrderPanel;
  private battleLog!: BattleLog;

  private phase: Phase = 'waiting';
  private selectedAbility: AbilityId | null = null;
  private moveableCells: [number, number][] = [];
  private unitSpriteMap: Map<string, Phaser.GameObjects.Container> = new Map();
  private unitHpBarMap: Map<string, Phaser.GameObjects.Graphics> = new Map();
  private infoPanel!: Phaser.GameObjects.Container;

  constructor() { super({ key: 'BattleScene' }); }

  create(): void {
    this.grid = new GridSystem(this);
    this.actionMenu = new ActionMenu(this);
    this.turnOrderPanel = new TurnOrderPanel(this);
    this.battleLog = new BattleLog(this);

    this.spawnUnits();
    this.drawAllUnits();

    this.turnManager = new TurnManager(this.units);
    this.createInfoPanel();
    this.setupInput();

    this.time.delayedCall(100, () => this.nextTurn());
  }

  // ─── Spawning ────────────────────────────────────────────────────────────────

  private spawnUnits(): void {
    const playerJobs: Array<keyof typeof UNIT_TEMPLATES> = ['warrior', 'mage', 'archer', 'knight'];
    const enemyJobs: Array<keyof typeof UNIT_TEMPLATES> = ['warrior', 'archer', 'mage', 'knight'];

    PLAYER_STARTS.forEach(([row, col], i) => {
      const job = playerJobs[i % playerJobs.length];
      const unit = new Unit(`p${i}`, UNIT_TEMPLATES[job], 'player', col, row);
      this.units.push(unit);
    });

    ENEMY_STARTS.forEach(([row, col], i) => {
      const job = enemyJobs[i % enemyJobs.length];
      const unit = new Unit(`e${i}`, UNIT_TEMPLATES[job], 'enemy', col, row);
      // Enemies start with CT stagger offset
      unit.ct = Math.floor(Math.random() * 50);
      this.units.push(unit);
    });
  }

  // ─── Sprite creation ─────────────────────────────────────────────────────────

  private drawAllUnits(): void {
    for (const unit of this.units) this.drawUnit(unit);
  }

  private drawUnit(unit: Unit): void {
    const pos = this.grid.getUnitPosition(unit.col, unit.row);

    const gfx = this.add.graphics();
    const r = 14;
    const teamBorder = unit.team === 'player' ? 0xffffff : 0xff8888;

    gfx.fillStyle(unit.color, 1);
    gfx.fillCircle(0, 0, r);
    gfx.lineStyle(2, teamBorder, 1);
    gfx.strokeCircle(0, 0, r);

    // Job letter
    const label = this.add.text(0, 0, unit.job[0].toUpperCase(), {
      fontSize: '13px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5, 0.5);

    const hpBar = this.add.graphics();

    const container = this.add.container(pos.x, pos.y, [gfx, label, hpBar]);
    container.setDepth(50 + unit.col + unit.row);
    container.setInteractive(new Phaser.Geom.Circle(0, 0, r), Phaser.Geom.Circle.Contains);

    unit.sprite = container;
    unit.hpBar = hpBar;
    unit.updateHpBar();

    this.unitSpriteMap.set(unit.id, container);
    this.unitHpBarMap.set(unit.id, hpBar);

    container.on('pointerover', () => this.showUnitInfo(unit));
    container.on('pointerout', () => this.hideUnitInfo());
    container.on('pointerdown', (_p: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.onUnitClick(unit);
    });
  }

  // ─── Turn flow ────────────────────────────────────────────────────────────────

  private nextTurn(): void {
    if (this.checkBattleOver()) return;

    const unit = this.turnManager.advanceToNextTurn();
    this.events.emit('turnStart', unit.name, unit.team);
    this.turnOrderPanel.update(this.units, unit);
    this.battleLog.log(`${unit.name}'s turn`);
    this.highlightActiveUnit(unit);

    if (unit.isStunned) {
      this.battleLog.log(`${unit.name} is stunned!`);
      this.time.delayedCall(700, () => this.nextTurn());
      return;
    }

    if (unit.team === 'player') {
      this.phase = 'player_menu';
      this.actionMenu.show(unit, (action) => this.onMenuAction(action, unit));
    } else {
      this.phase = 'ai_turn';
      this.time.delayedCall(600, () => this.runAI(unit));
    }
  }

  private highlightActiveUnit(unit: Unit): void {
    // Pulse the active unit sprite
    if (unit.sprite) {
      this.tweens.add({
        targets: unit.sprite,
        scaleX: 1.2, scaleY: 1.2,
        duration: 180,
        yoyo: true,
        ease: 'Power2',
      });
    }
  }

  // ─── Player input ─────────────────────────────────────────────────────────────

  private onMenuAction(action: MenuAction, unit: Unit): void {
    if (action === 'move') {
      this.phase = 'player_move';
      this.moveableCells = getReachableCells(unit, this.units);
      this.grid.highlightTiles(this.moveableCells, 'move');
      this.battleLog.log('Click a blue tile to move');
    } else if (action === 'wait') {
      this.endPlayerTurn(unit);
    } else {
      // Ability selected
      const abilityId = action as AbilityId;
      const def = ABILITIES[abilityId];
      this.selectedAbility = abilityId;
      this.phase = 'player_act';

      const range = getCellsInRange(unit.col, unit.row, def.range, def.aoe);
      this.grid.highlightTiles(range, 'attack');
      this.battleLog.log(`${def.name}: click target (range ${def.range})`);
    }
  }

  private onUnitClick(target: Unit): void {
    const active = this.turnManager.activeUnit;
    if (!active || active.team !== 'player') return;

    if (this.phase === 'player_act' && this.selectedAbility) {
      const def = ABILITIES[this.selectedAbility];
      const dist = Math.abs(target.col - active.col) + Math.abs(target.row - active.row);
      if (dist > def.range) {
        this.battleLog.log('Out of range!');
        return;
      }

      // AoE: collect all units near target
      const targets = this.units.filter(u => {
        if (u.isDead) return false;
        const d = Math.abs(u.col - target.col) + Math.abs(u.row - target.row);
        // Heals hit allies; attacks hit enemies (or all for AoE)
        const isHeal = def.healMultiplier > 0;
        if (isHeal) return u.team === active.team && d <= def.aoe;
        return u.team !== active.team && d <= def.aoe;
      });
      if (!targets.includes(target) && !target.isDead) targets.push(target);

      this.performAbility(active, this.selectedAbility, targets);
      active.hasActed = true;
      this.selectedAbility = null;
      this.grid.clearHighlights();

      if (active.hasMoved || !getReachableCells(active, this.units).length) {
        this.endPlayerTurn(active);
      } else {
        this.phase = 'player_menu';
        this.actionMenu.show(active, (action) => this.onMenuAction(action, active));
      }
    }
  }

  private setupInput(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const active = this.turnManager.activeUnit;
      if (!active || active.team !== 'player') return;

      if (this.phase === 'player_move') {
        const { col, row } = this.screenToGrid(pointer.x, pointer.y);
        const isReachable = this.moveableCells.some(([c, r]) => c === col && r === row);
        if (isReachable) {
          this.moveUnit(active, col, row);
          active.hasMoved = true;
          this.grid.clearHighlights();

          if (active.hasActed) {
            this.endPlayerTurn(active);
          } else {
            this.phase = 'player_menu';
            this.actionMenu.show(active, (action) => this.onMenuAction(action, active));
          }
        } else if (!this.actionMenu.isVisible()) {
          this.grid.clearHighlights();
          this.phase = 'player_menu';
          this.actionMenu.show(active, (action) => this.onMenuAction(action, active));
        }
      }
    });

    // R = restart both scenes (UIScene holds the overlay and event listeners)
    this.input.keyboard?.on('keydown-R', () => {
      this.scene.get('UIScene').scene.restart();
      this.scene.restart();
    });

    // ESC = cancel / back to menu
    this.input.keyboard?.on('keydown-ESC', () => {
      const active = this.turnManager.activeUnit;
      if (!active || active.team !== 'player') return;
      this.grid.clearHighlights();
      this.selectedAbility = null;
      if (this.phase !== 'player_menu') {
        this.phase = 'player_menu';
        this.actionMenu.show(active, (action) => this.onMenuAction(action, active));
      }
    });
  }

  private screenToGrid(sx: number, sy: number): { col: number; row: number } {
    // Approximation: find the tile whose screen center is closest to the click
    let bestCol = 0, bestRow = 0, bestDist = Infinity;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 10; c++) {
        const pos = this.grid.getUnitPosition(c, r);
        const dist = Math.hypot(pos.x - sx, pos.y - sy);
        if (dist < bestDist) { bestDist = dist; bestCol = c; bestRow = r; }
      }
    }
    return { col: bestCol, row: bestRow };
  }

  // ─── Movement ─────────────────────────────────────────────────────────────────

  private moveUnit(unit: Unit, col: number, row: number): void {
    const path = findPath(unit.col, unit.row, col, row, unit, this.units);
    unit.col = col;
    unit.row = row;

    const pos = this.grid.getUnitPosition(col, row);
    if (path.length > 0 && unit.sprite) {
      const tweenPath = path.map(([c, r]) => {
        const p = this.grid.getUnitPosition(c, r);
        return { x: p.x, y: p.y };
      });
      this.tweens.chain({
        targets: unit.sprite,
        tweens: tweenPath.map(p => ({
          x: p.x, y: p.y,
          duration: 120,
          ease: 'Linear',
        })),
        onComplete: () => { unit.sprite?.setDepth(50 + col + row); },
      });
    } else {
      unit.sprite?.setPosition(pos.x, pos.y);
    }
    this.battleLog.log(`${unit.name} → (${col},${row})`);
  }

  // ─── Combat ───────────────────────────────────────────────────────────────────

  private performAbility(actor: Unit, abilityId: AbilityId, targets: Unit[]): void {
    const result = executeAbility(actor, abilityId, targets);
    const def = ABILITIES[abilityId];

    if (result.missed) {
      this.battleLog.log(`${actor.name} has no MP!`);
      return;
    }

    this.battleLog.log(`${actor.name} uses ${def.name}`);

    targets.forEach(target => {
      if (result.heal > 0) {
        const pos = this.grid.getUnitPosition(target.col, target.row);
        this.battleLog.showFloating(pos.x, pos.y, `+${result.heal}`, '#44ff88');
        this.battleLog.log(`  → Healed ${target.name} for ${result.heal}`);
      }
      if (result.damage > 0) {
        const pos = this.grid.getUnitPosition(target.col, target.row);
        this.battleLog.showFloating(pos.x, pos.y, `-${result.damage}`, '#ff4444');
        this.battleLog.log(`  → ${target.name} takes ${result.damage} dmg`);
        this.shakeSprite(target);
      }
      if (result.stunned) this.battleLog.log(`  → ${target.name} is stunned!`);

      target.updateHpBar();

      if (target.isDead) {
        this.battleLog.log(`${target.name} is defeated!`);
        this.killUnit(target);
      }
    });

    for (const u of this.units.filter(u => u.isDead)) {
      this.turnManager.removeUnit(u);
    }
  }

  private shakeSprite(unit: Unit): void {
    if (!unit.sprite) return;
    this.tweens.add({
      targets: unit.sprite,
      x: { from: unit.sprite.x - 4, to: unit.sprite.x },
      duration: 80,
      yoyo: true,
      repeat: 2,
      ease: 'Sine.easeInOut',
    });
  }

  private killUnit(unit: Unit): void {
    this.time.delayedCall(200, () => {
      this.tweens.add({
        targets: unit.sprite,
        alpha: 0,
        scaleX: 0.3,
        scaleY: 0.3,
        duration: 400,
        ease: 'Power2',
        onComplete: () => unit.sprite?.destroy(),
      });
    });
    this.checkBattleOver();
  }

  private endPlayerTurn(_unit: Unit): void {
    this.actionMenu.hide();
    this.grid.clearHighlights();
    this.phase = 'waiting';
    this.time.delayedCall(300, () => this.nextTurn());
  }

  // ─── AI ───────────────────────────────────────────────────────────────────────

  private runAI(unit: Unit): void {
    const { ability, targets, moveTo } = aiChooseAction(unit, this.units);

    // Move first if needed
    if (moveTo && !unit.hasMoved) {
      const reachable = getReachableCells(unit, this.units);
      const best = reachable.sort((a, b) => {
        const da = Math.abs(a[0] - moveTo[0]) + Math.abs(a[1] - moveTo[1]);
        const db = Math.abs(b[0] - moveTo[0]) + Math.abs(b[1] - moveTo[1]);
        return da - db;
      })[0];

      if (best) {
        this.moveUnit(unit, best[0], best[1]);
        unit.hasMoved = true;
      }
    }

    // Act after movement delay
    this.time.delayedCall(500, () => {
      if (targets.length > 0 && !unit.hasActed) {
        this.performAbility(unit, ability, targets);
        unit.hasActed = true;
      }

      this.time.delayedCall(500, () => {
        this.phase = 'waiting';
        this.nextTurn();
      });
    });
  }

  // ─── Win condition ────────────────────────────────────────────────────────────

  private checkBattleOver(): boolean {
    const playersAlive = this.units.some(u => u.team === 'player' && !u.isDead);
    const enemiesAlive = this.units.some(u => u.team === 'enemy' && !u.isDead);

    if (!playersAlive || !enemiesAlive) {
      this.phase = 'game_over';
      const winner = playersAlive ? 'player' : 'enemy';
      this.events.emit('battleOver', winner);
      this.turnOrderPanel.update(this.units, null);
      return true;
    }
    return false;
  }

  // ─── Info panel ───────────────────────────────────────────────────────────────

  private createInfoPanel(): void {
    this.infoPanel = this.add.container(0, 0).setDepth(95).setVisible(false);
  }

  private showUnitInfo(unit: Unit): void {
    this.infoPanel.removeAll(true);

    const lines = [
      unit.name,
      `HP  ${unit.hp}/${unit.maxHp}`,
      `MP  ${unit.mp}/${unit.maxMp}`,
      `ATK ${unit.atk}  DEF ${unit.def}`,
      `MAG ${unit.mag}  SPD ${unit.spd}`,
      `MOV ${unit.move}  JMP ${unit.jump}`,
    ];
    const w = 150, lh = 18, pad = 8;

    const bg = this.add.graphics();
    bg.fillStyle(0x0d1117, 0.92);
    bg.lineStyle(1, unit.team === 'player' ? 0x334488 : 0x883344);
    bg.fillRoundedRect(0, 0, w, lines.length * lh + pad * 2, 5);
    bg.strokeRoundedRect(0, 0, w, lines.length * lh + pad * 2, 5);
    this.infoPanel.add(bg);

    lines.forEach((line, i) => {
      const color = i === 0 ? `#${unit.color.toString(16).padStart(6, '0')}` : '#aaccdd';
      const style = i === 0 ? 'bold' : 'normal';
      this.infoPanel.add(this.add.text(pad, pad + i * lh, line, {
        fontSize: '13px', fontFamily: 'monospace', fontStyle: style, color,
      }));
    });

    const pos = this.grid.getUnitPosition(unit.col, unit.row);
    let ix = pos.x + 20;
    let iy = pos.y - 60;
    if (ix + w > this.scale.width - 10) ix = pos.x - w - 20;
    if (iy < 70) iy = 70;

    this.infoPanel.setPosition(ix, iy).setVisible(true);
  }

  private hideUnitInfo(): void {
    this.infoPanel.setVisible(false);
  }
}
