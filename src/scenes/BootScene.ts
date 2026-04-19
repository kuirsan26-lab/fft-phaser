import * as Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  preload(): void {
    // All assets are procedurally generated — nothing to load
    // Show a simple loading screen
    const { width, height } = this.scale;
    const title = this.add.text(width / 2, height / 2 - 30, 'FFT PHASER', {
      fontSize: '36px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#88aaff',
      stroke: '#000033',
      strokeThickness: 4,
    }).setOrigin(0.5);

    const sub = this.add.text(width / 2, height / 2 + 20, 'Tactical RPG', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#556688',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: [title, sub],
      alpha: { from: 0, to: 1 },
      duration: 600,
      ease: 'Power2',
    });
  }

  create(): void {
    this.time.delayedCall(900, () => {
      this.scene.start('SquadCreationScene');
    });
  }
}
