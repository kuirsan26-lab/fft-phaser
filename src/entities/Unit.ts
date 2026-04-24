import * as Phaser from 'phaser';
import type { UnitTemplate, AbilityId } from '../data/UnitData';
import { ABILITIES } from '../data/UnitData';

export type Team = 'player' | 'enemy';

export type StatusEffect =
  | { type: 'stun'; turnsLeft: number }
  | { type: 'provoked'; turnsLeft: number; sourceId: string };

export class Unit {
  id: string;
  name: string;
  job: string;
  team: Team;

  // Position on grid
  col: number;
  row: number;

  // Base stats
  maxHp: number;
  maxMp: number;
  atk: number;
  def: number;
  mag: number;
  spd: number;
  move: number;
  jump: number;
  color: number;
  abilities: AbilityId[];

  // Current state
  hp: number;
  mp: number;
  ct: number = 0; // Charge Time — when >= 100 unit gets a turn
  statuses: StatusEffect[] = [];

  // Visual
  sprite: Phaser.GameObjects.Container | null = null;
  hpBar: Phaser.GameObjects.Graphics | null = null;

  // Per-turn state
  hasMoved: boolean = false;
  hasActed: boolean = false;

  constructor(id: string, template: UnitTemplate, team: Team, col: number, row: number) {
    this.id = id;
    this.name = `${team === 'player' ? '' : 'E.'}${template.name}`;
    this.job = template.job;
    this.team = team;
    this.col = col;
    this.row = row;
    this.maxHp = template.hp;
    this.maxMp = template.mp;
    this.atk = template.atk;
    this.def = template.def;
    this.mag = template.mag;
    this.spd = template.spd;
    this.move = template.move;
    this.jump = template.jump;
    this.color = template.color;
    this.abilities = [...template.abilities];
    this.hp = template.hp;
    this.mp = template.mp;
    // Stagger starting CT so turns feel natural
    this.ct = Math.floor(Math.random() * 60);
  }

  get isDead(): boolean { return this.hp <= 0; }

  get isStunned(): boolean { return this.statuses.some(s => s.type === 'stun'); }

  get isProvoked(): boolean { return this.statuses.some(s => s.type === 'provoked'); }

  get provokedBy(): string | null {
    const s = this.statuses.find(s => s.type === 'provoked');
    return s?.type === 'provoked' ? s.sourceId : null;
  }

  takeDamage(amount: number): number {
    const actual = Math.max(1, amount);
    this.hp = Math.max(0, this.hp - actual);
    return actual;
  }

  restoreHp(amount: number): number {
    const actual = Math.min(amount, this.maxHp - this.hp);
    this.hp += actual;
    return actual;
  }

  spendMp(amount: number): boolean {
    if (this.mp < amount) return false;
    this.mp -= amount;
    return true;
  }

  addStatus(effect: StatusEffect): void {
    this.statuses = this.statuses.filter(s => s.type !== effect.type);
    this.statuses.push(effect);
  }

  tickStatuses(): void {
    this.statuses = this.statuses
      .map(s => ({ ...s, turnsLeft: s.turnsLeft - 1 }))
      .filter(s => s.turnsLeft > 0);
  }

  resetTurnFlags(): void {
    this.hasMoved = false;
    this.hasActed = false;
  }

  canUseAbility(id: AbilityId): boolean {
    const ability = ABILITIES[id];
    return this.mp >= ability.mpCost;
  }

  updateHpBar(): void {
    if (!this.hpBar) return;
    this.hpBar.clear();
    const pct = this.hp / this.maxHp;
    const w = 28;
    this.hpBar.fillStyle(0x222222);
    this.hpBar.fillRect(-w / 2, -22, w, 4);
    this.hpBar.fillStyle(pct > 0.5 ? 0x44ff44 : pct > 0.25 ? 0xffaa00 : 0xff3333);
    this.hpBar.fillRect(-w / 2, -22, Math.floor(w * pct), 4);
  }
}
