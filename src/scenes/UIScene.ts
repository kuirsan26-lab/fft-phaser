import * as Phaser from 'phaser';

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

    const onCampaignInfo = (squadName: string, battleNum: number) => {
      campaignText.setText(`${squadName}  ·  БИТВА ${battleNum}/10`).setColor('#5577aa');
    };
    const onTurnStart = (unitName: string, team: string) => {
      this.statusText.setText(`Ход: ${unitName}`).setColor(team === 'player' ? '#4488ff' : '#ff4444');
    };
    const onBattleOver = (winner: string, isCampaign: boolean) => {
      const color = winner === 'player' ? '#44ff88' : '#ff4444';
      const msg   = winner === 'player' ? 'ПОБЕДА!' : 'ПОРАЖЕНИЕ!';
      this.add.text(w / 2, this.scale.height / 2, msg, {
        fontSize: '48px', fontFamily: 'monospace', fontStyle: 'bold',
        color, stroke: '#000000', strokeThickness: 6,
      }).setOrigin(0.5).setDepth(300);

      const sub = isCampaign
        ? (winner === 'player' ? 'Направляемся в лагерь...' : 'Кампания окончена. Возврат к вербовке...')
        : 'Нажми R для перезапуска';
      this.add.text(w / 2, this.scale.height / 2 + 64, sub, {
        fontSize: '16px', fontFamily: 'monospace', color: '#888899',
      }).setOrigin(0.5).setDepth(300);
    };

    battleScene.events.on('campaignInfo', onCampaignInfo);
    battleScene.events.on('turnStart',    onTurnStart);
    battleScene.events.on('battleOver',   onBattleOver);

    // Удаляем слушатели при остановке сцены, иначе при перезапуске
    // UIScene они останутся на emitter BattleScene и будут ссылаться
    // на уничтоженные объекты.
    this.events.once('shutdown', () => {
      battleScene.events.off('campaignInfo', onCampaignInfo);
      battleScene.events.off('turnStart',    onTurnStart);
      battleScene.events.off('battleOver',   onBattleOver);
    });
  }
}
