import * as Phaser from 'phaser';
import { Unit } from '../entities/Unit';
import type { AbilityId } from '../data/UnitData';
import { ABILITIES } from '../data/UnitData';

export type MenuAction = 'move' | 'ability' | 'wait' | AbilityId;

export class ActionMenu {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private visible: boolean = false;
  private onSelect: ((action: MenuAction) => void) | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);
    this.container.setDepth(100);
    this.container.setVisible(false);
  }

  show(unit: Unit, onSelect: (action: MenuAction) => void): void {
    this.onSelect = onSelect;
    this.container.removeAll(true);

    const items: { label: string; action: MenuAction; enabled: boolean }[] = [];

    if (!unit.hasMoved) items.push({ label: '⟶  Move',  action: 'move',  enabled: true });

    if (!unit.hasActed) {
      for (const id of unit.abilities) {
        const def = ABILITIES[id];
        items.push({
          label: `✦  ${def.name}${def.mpCost > 0 ? ` (${def.mpCost}MP)` : ''}`,
          action: id,
          enabled: unit.canUseAbility(id),
        });
      }
    }

    items.push({ label: '⏸  Wait', action: 'wait', enabled: true });

    const x = 20;
    const y = this.scene.scale.height - 40 - items.length * 38;
    const itemH = 36;
    const menuW = 210;

    // Background panel
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x0d1117, 0.92);
    bg.lineStyle(1, 0x334455, 1);
    bg.fillRoundedRect(0, 0, menuW, items.length * itemH + 16, 6);
    bg.strokeRoundedRect(0, 0, menuW, items.length * itemH + 16, 6);
    this.container.add(bg);

    items.forEach((item, i) => {
      const iy = 8 + i * itemH;
      const row = this.scene.add.graphics();
      row.fillStyle(0xffffff, 0);
      row.fillRect(4, iy, menuW - 8, itemH - 2);
      row.setInteractive(new Phaser.Geom.Rectangle(4, iy, menuW - 8, itemH - 2), Phaser.Geom.Rectangle.Contains);

      if (item.enabled) {
        row.on('pointerover', () => { row.clear(); row.fillStyle(0x1a2a3a, 0.95); row.fillRect(4, iy, menuW - 8, itemH - 2); });
        row.on('pointerout',  () => { row.clear(); row.fillStyle(0xffffff, 0); row.fillRect(4, iy, menuW - 8, itemH - 2); });
        row.on('pointerdown', () => { if (item.enabled) { this.hide(); this.onSelect?.(item.action); } });
      }

      const text = this.scene.add.text(14, iy + 8, item.label, {
        fontSize: '14px',
        fontFamily: 'monospace',
        color: item.enabled ? '#ddeeff' : '#445566',
      });

      this.container.add([row, text]);
    });

    this.container.setPosition(x, y);
    this.container.setVisible(true);
    this.visible = true;
  }

  hide(): void {
    this.container.setVisible(false);
    this.visible = false;
  }

  isVisible(): boolean { return this.visible; }
}
