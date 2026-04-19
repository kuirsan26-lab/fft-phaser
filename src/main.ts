import * as Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { SquadCreationScene } from './scenes/SquadCreationScene';
import { BattleScene } from './scenes/BattleScene';
import { CampScene } from './scenes/CampScene';
import { UIScene } from './scenes/UIScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 960,
  height: 640,
  backgroundColor: '#0a0a0f',
  pixelArt: true,
  scene: [BootScene, SquadCreationScene, BattleScene, CampScene, UIScene],
  parent: document.body,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

new Phaser.Game(config);
