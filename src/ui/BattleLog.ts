import * as Phaser from 'phaser';

export class BattleLog {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private lines: string[] = [];
  private maxLines = 5;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);
    this.container.setDepth(90);
  }

  log(msg: string): void {
    this.lines.push(msg);
    if (this.lines.length > this.maxLines) this.lines.shift();
    this.redraw();
  }

  private redraw(): void {
    this.container.removeAll(true);
    const x = this.scene.scale.width - 260;
    const y = this.scene.scale.height - this.lines.length * 20 - 10;
    const w = 250;

    const bg = this.scene.add.graphics();
    bg.fillStyle(0x060a10, 0.8);
    bg.fillRoundedRect(0, 0, w, this.lines.length * 20 + 12, 4);
    this.container.add(bg);

    this.lines.forEach((line, i) => {
      const alpha = 0.4 + 0.6 * ((i + 1) / this.lines.length);
      const text = this.scene.add.text(8, 6 + i * 20, line, {
        fontSize: '12px',
        fontFamily: 'monospace',
        color: '#aaccdd',
      }).setAlpha(alpha);
      this.container.add(text);
    });

    this.container.setPosition(x, y);
  }

  showFloating(x: number, y: number, text: string, color: string = '#ffffff'): void {
    const t = this.scene.add.text(x, y, text, {
      fontSize: '18px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5, 1).setDepth(200);

    this.scene.tweens.add({
      targets: t,
      y: y - 50,
      alpha: 0,
      duration: 900,
      ease: 'Power2',
      onComplete: () => t.destroy(),
    });
  }
}
