import * as Phaser from 'phaser';

// UIScene runs in parallel with BattleScene and handles top-level overlays.
// The heavy UI widgets live in BattleScene for simplicity (they need scene.add and tweens).
// This scene displays a permanent title bar and receives events from BattleScene.
export class UIScene extends Phaser.Scene {
  private statusText!: Phaser.GameObjects.Text;

  constructor() { super({ key: 'UIScene' }); }

  create(): void {
    const w = this.scale.width;

    this.statusText = this.add.text(w - 10, 6, '', {
      fontSize: '11px', fontFamily: 'monospace', color: '#334455',
    }).setOrigin(1, 0).setDepth(150);

    const campaignText = this.add.text(w / 2, 6, '', {
      fontSize: '11px', fontFamily: 'monospace', color: '#445566',
    }).setOrigin(0.5, 0).setDepth(150);

    const battleScene = this.scene.get('BattleScene');

    battleScene.events.on('campaignInfo', (squadName: string, battleNum: number) => {
      campaignText.setText(`${squadName}  ·  BATTLE ${battleNum}/10`).setColor('#5577aa');
    });

    battleScene.events.on('turnStart', (unitName: string, team: string) => {
      this.statusText.setText(`Turn: ${unitName}`).setColor(team === 'player' ? '#4488ff' : '#ff4444');
    });

    battleScene.events.on('battleOver', (winner: string, isCampaign: boolean) => {
      const color = winner === 'player' ? '#44ff88' : '#ff4444';
      const msg   = winner === 'player' ? 'VICTORY!' : 'DEFEAT!';
      this.add.text(w / 2, this.scale.height / 2, msg, {
        fontSize: '48px', fontFamily: 'monospace', fontStyle: 'bold',
        color, stroke: '#000000', strokeThickness: 6,
      }).setOrigin(0.5).setDepth(300);

      const sub = isCampaign
        ? (winner === 'player' ? 'Heading to camp...' : 'Campaign over. Returning to recruitment...')
        : 'Press R to restart';
      this.add.text(w / 2, this.scale.height / 2 + 64, sub, {
        fontSize: '16px', fontFamily: 'monospace', color: '#888899',
      }).setOrigin(0.5).setDepth(300);
    });
  }
}
