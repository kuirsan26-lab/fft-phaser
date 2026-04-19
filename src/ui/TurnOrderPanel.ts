import * as Phaser from 'phaser';
import { Unit } from '../entities/Unit';

export class TurnOrderPanel {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);
    this.container.setDepth(90);
  }

  update(units: Unit[], activeUnit: Unit | null): void {
    this.container.removeAll(true);

    const panelW = this.scene.scale.width;
    const iconSize = 44;
    const padding = 6;
    const panelH = iconSize + padding * 2;

    // Background strip
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x060a10, 0.88);
    bg.fillRect(0, 0, panelW, panelH);
    bg.lineStyle(1, 0x223344, 1);
    bg.lineBetween(0, panelH, panelW, panelH);
    this.container.add(bg);

    const alive = units.filter(u => !u.isDead);
    const sorted = [...alive].sort((a, b) => b.ct - a.ct);

    sorted.forEach((unit, i) => {
      const x = padding + i * (iconSize + padding);
      const y = padding;
      const isActive = unit === activeUnit;

      const frame = this.scene.add.graphics();
      frame.lineStyle(isActive ? 2 : 1, isActive ? 0xffffff : 0x334455, 1);
      frame.fillStyle(0x0a1520, 1);
      frame.fillRoundedRect(x, y, iconSize, iconSize, 4);
      frame.strokeRoundedRect(x, y, iconSize, iconSize, 4);

      // Team color band at top
      const bandColor = unit.team === 'player' ? 0x4488ff : 0xff4444;
      frame.fillStyle(bandColor, 1);
      frame.fillRect(x + 2, y + 2, iconSize - 4, 5);

      // Job initial
      const jobLabel = this.scene.add.text(x + iconSize / 2, y + iconSize / 2 + 2, unit.job[0].toUpperCase(), {
        fontSize: '16px',
        fontFamily: 'monospace',
        fontStyle: 'bold',
        color: `#${unit.color.toString(16).padStart(6, '0')}`,
      }).setOrigin(0.5, 0.5);

      // CT bar below icon
      const ctPct = Math.min(unit.ct / 100, 1);
      const ctBar = this.scene.add.graphics();
      ctBar.fillStyle(0x223344);
      ctBar.fillRect(x, y + iconSize + 2, iconSize, 3);
      ctBar.fillStyle(isActive ? 0xffffff : 0x4488aa);
      ctBar.fillRect(x, y + iconSize + 2, Math.floor(iconSize * ctPct), 3);

      if (isActive) {
        const indicator = this.scene.add.graphics();
        indicator.fillStyle(0xffffff);
        indicator.fillTriangle(x + iconSize / 2, y - 5, x + iconSize / 2 - 5, y - 10, x + iconSize / 2 + 5, y - 10);
        this.container.add(indicator);
      }

      this.container.add([frame, jobLabel, ctBar]);
    });

    this.container.setPosition(0, 0);
  }
}
