import * as Phaser from 'phaser';

// UIScene runs in parallel with BattleScene and handles top-level overlays.
// The heavy UI widgets live in BattleScene for simplicity (they need scene.add and tweens).
// This scene displays a permanent title bar and receives events from BattleScene.
export class UIScene extends Phaser.Scene {
  private statusText!: Phaser.GameObjects.Text;

  constructor() { super({ key: 'UIScene' }); }

  create(): void {
    const w = this.scale.width;

    // Semi-transparent header strip
    const bg = this.add.graphics();
    bg.fillStyle(0x060a10, 0.75);
    bg.fillRect(0, this.scale.height - 0, w, 0); // placeholder

    this.add.text(w / 2, 6, 'FFT PHASER', {
      fontSize: '11px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#4466aa',
    }).setOrigin(0.5, 0).setDepth(150);

    this.statusText = this.add.text(w - 10, 6, '', {
      fontSize: '11px',
      fontFamily: 'monospace',
      color: '#334455',
    }).setOrigin(1, 0).setDepth(150);

    // Listen to events from BattleScene
    const battleScene = this.scene.get('BattleScene');
    battleScene.events.on('turnStart', (unitName: string, team: string) => {
      const color = team === 'player' ? '#4488ff' : '#ff4444';
      this.statusText.setText(`Turn: ${unitName}`).setColor(color);
    });
    battleScene.events.on('battleOver', (winner: string) => {
      const color = winner === 'player' ? '#44ff88' : '#ff4444';
      const msg = winner === 'player' ? 'VICTORY!' : 'DEFEAT!';
      this.add.text(this.scale.width / 2, this.scale.height / 2, msg, {
        fontSize: '48px',
        fontFamily: 'monospace',
        fontStyle: 'bold',
        color,
        stroke: '#000000',
        strokeThickness: 6,
      }).setOrigin(0.5).setDepth(300);

      this.add.text(this.scale.width / 2, this.scale.height / 2 + 60, 'Press R to restart', {
        fontSize: '18px',
        fontFamily: 'monospace',
        color: '#aaaaaa',
      }).setOrigin(0.5).setDepth(300);
    });
  }
}
