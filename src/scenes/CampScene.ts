import * as Phaser from 'phaser';
import type { CampaignState } from '../data/Campaign';
import { XP_THRESHOLDS, MAX_LEVEL } from '../data/Campaign';
import { UNIT_TEMPLATES } from '../data/UnitData';

interface CampData { campaign: CampaignState }

export class CampScene extends Phaser.Scene {
  constructor() { super({ key: 'CampScene' }); }

  create(data: CampData): void {
    const campaign = data.campaign;
    const { width, height } = this.scale;
    const won = campaign.battlesCompleted >= 10;

    this.add.graphics().fillStyle(0x07090f, 1).fillRect(0, 0, width, height);

    if (won) {
      this.buildVictoryScreen(campaign, width, height);
    } else {
      this.buildCampScreen(campaign, width, height);
    }
  }

  private buildVictoryScreen(campaign: CampaignState, width: number, height: number): void {
    this.add.text(width / 2, height / 2 - 100, 'CAMPAIGN COMPLETE!', {
      fontSize: '36px', fontFamily: 'monospace', fontStyle: 'bold',
      color: '#ffdd44', stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 - 50,
      `"${campaign.squadName}" conquered all 10 battles.`, {
      fontSize: '16px', fontFamily: 'monospace', color: '#aabbcc',
    }).setOrigin(0.5);

    const alive = campaign.units.filter(u => !u.isDead).length;
    this.add.text(width / 2, height / 2 - 20, `${alive} of 4 warriors survived.`, {
      fontSize: '14px', fontFamily: 'monospace', color: '#778899',
    }).setOrigin(0.5);

    this.buildButton(width / 2, height / 2 + 60, 'START NEW CAMPAIGN', '#ffdd44', '#332200', () => {
      this.scene.start('SquadCreationScene');
    });
  }

  private buildCampScreen(campaign: CampaignState, width: number, height: number): void {
    const nextBattle = campaign.battlesCompleted + 1;

    this.add.text(width / 2, 40, 'CAMP', {
      fontSize: '28px', fontFamily: 'monospace', fontStyle: 'bold', color: '#7799ee',
    }).setOrigin(0.5);

    this.add.text(width / 2, 74,
      `"${campaign.squadName}"  ·  Battle ${campaign.battlesCompleted}/10 complete`, {
      fontSize: '13px', fontFamily: 'monospace', color: '#445566',
    }).setOrigin(0.5);

    // Progress bar
    const pbx = width / 2 - 200, pby = 96;
    this.add.graphics()
      .fillStyle(0x111a22, 1).fillRect(pbx, pby, 400, 8)
      .fillStyle(0x4488ff, 1).fillRect(pbx, pby, 400 * (campaign.battlesCompleted / 10), 8);

    // Unit cards
    campaign.units.forEach((cu, i) => {
      this.buildUnitCard(cu, i, width);
    });

    // Placeholder for future: upgrade / equip
    this.add.text(width / 2, height - 150, '[ Upgrade & Equip — coming soon ]', {
      fontSize: '11px', fontFamily: 'monospace', color: '#1e2e3e',
    }).setOrigin(0.5);

    // Heal All button
    const aliveUnits = campaign.units.filter(u => !u.isDead);
    const needsHeal = aliveUnits.some(u => u.currentHp < u.maxHp || u.currentMp < u.maxMp);
    if (needsHeal) {
      this.buildButton(width / 2 - 160, height - 70, 'HEAL ALL  ✦', '#44ffaa', '#0a1e14', () => {
        aliveUnits.forEach(u => { u.currentHp = u.maxHp; u.currentMp = u.maxMp; });
        this.scene.restart({ campaign });
      });
    }

    this.buildButton(width / 2 + (needsHeal ? 80 : 0), height - 70,
      `BATTLE ${nextBattle}  ⟶`, '#55ddff', '#0a1a22', () => {
        this.scene.start('BattleScene', { campaign });
        this.scene.launch('UIScene');
      },
    );
  }

  private buildUnitCard(cu: CampaignState['units'][number], index: number, width: number): void {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const cw = 380, ch = 96;
    const x = col === 0 ? width / 2 - cw - 10 : width / 2 + 10;
    const y = 130 + row * (ch + 14);

    const isDead = cu.isDead;
    const g = this.add.graphics();
    g.fillStyle(isDead ? 0x1a0a0a : 0x0d1827, 1)
     .lineStyle(1, isDead ? 0x440000 : 0x1e3044, 1)
     .fillRoundedRect(x, y, cw, ch, 5)
     .strokeRoundedRect(x, y, cw, ch, 5);

    const tmpl = UNIT_TEMPLATES[cu.job];
    const circleG = this.add.graphics();
    if (isDead) {
      circleG.fillStyle(0x333333, 1).fillCircle(x + 36, y + ch / 2, 20);
    } else {
      circleG.fillStyle(tmpl.color, 1).fillCircle(x + 36, y + ch / 2, 20)
             .lineStyle(2, 0xffffff, 0.2).strokeCircle(x + 36, y + ch / 2, 20);
    }

    this.add.text(x + 36, y + ch / 2, isDead ? '†' : cu.job[0].toUpperCase(), {
      fontSize: '14px', fontFamily: 'monospace', fontStyle: 'bold',
      color: isDead ? '#553333' : '#ffffff',
    }).setOrigin(0.5);

    // Name + job
    this.add.text(x + 68, y + 10, cu.name, {
      fontSize: '14px', fontFamily: 'monospace', fontStyle: 'bold',
      color: isDead ? '#553333' : '#ccddee',
    });
    this.add.text(x + 68, y + 27, cu.job.toUpperCase(), {
      fontSize: '10px', fontFamily: 'monospace', color: isDead ? '#442222' : '#445566',
    });

    // Level badge
    const levelColor = cu.levelUps > 0 ? '#ffdd44' : (isDead ? '#443333' : '#7799ee');
    this.add.text(x + cw - 12, y + 10, `LV ${cu.level}`, {
      fontSize: '11px', fontFamily: 'monospace', fontStyle: 'bold', color: levelColor,
    }).setOrigin(1, 0);

    if (cu.levelUps > 0) {
      this.add.text(x + cw - 12, y + 25, `▲ LEVEL UP!`, {
        fontSize: '9px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ffdd44',
      }).setOrigin(1, 0);
    }

    if (isDead) {
      this.add.text(x + cw / 2 + 10, y + ch / 2 + 8, 'K I A', {
        fontSize: '18px', fontFamily: 'monospace', fontStyle: 'bold', color: '#552222',
      }).setOrigin(0.5);
    } else {
      this.drawBar(x + 68, y + 46, 240, 10, cu.currentHp, cu.maxHp, 0x44bb44, 0x113311);
      this.drawBar(x + 68, y + 60, 240, 8,  cu.currentMp, cu.maxMp, 0x4488ff, 0x112244);
      this.add.text(x + 68 + 244, y + 46, `${cu.currentHp}/${cu.maxHp}`, {
        fontSize: '9px', fontFamily: 'monospace', color: '#336633',
      });

      // XP bar
      const level = cu.level;
      const atMax = level >= MAX_LEVEL;
      const xpCur = atMax ? XP_THRESHOLDS[MAX_LEVEL] : cu.xp - XP_THRESHOLDS[level];
      const xpNext = atMax ? 1 : XP_THRESHOLDS[level + 1] - XP_THRESHOLDS[level];
      this.drawBar(x + 68, y + 75, 240, 6, atMax ? xpNext : xpCur, xpNext, 0xddaa22, 0x1a1400);
      this.add.text(x + 68 + 244, y + 74, atMax ? 'MAX' : `${xpCur}/${xpNext}`, {
        fontSize: '8px', fontFamily: 'monospace', color: '#886622',
      });
      this.add.text(x + 68, y + 74, 'XP', {
        fontSize: '8px', fontFamily: 'monospace', color: '#554411',
      });
    }
  }

  private drawBar(x: number, y: number, w: number, h: number,
                  cur: number, max: number, fill: number, bg: number): void {
    this.add.graphics()
      .fillStyle(bg, 1).fillRect(x, y, w, h)
      .fillStyle(fill, 1).fillRect(x, y, Math.round(w * (cur / max)), h);
  }

  private buildButton(cx: number, cy: number, label: string,
                      color: string, bgHex: string, cb: () => void): void {
    const bgNum = parseInt(bgHex.replace('#', ''), 16);
    const tw = label.length * 9 + 32;
    const bx = cx - tw / 2, by = cy - 18;
    const btn = this.add.graphics()
      .fillStyle(bgNum, 1).lineStyle(1, parseInt(color.replace('#', ''), 16), 0.8)
      .fillRoundedRect(bx, by, tw, 36, 5)
      .strokeRoundedRect(bx, by, tw, 36, 5);
    btn.setInteractive(new Phaser.Geom.Rectangle(bx, by, tw, 36), Phaser.Geom.Rectangle.Contains);
    btn.on('pointerdown', cb);
    this.add.text(cx, cy, label, {
      fontSize: '13px', fontFamily: 'monospace', fontStyle: 'bold', color,
    }).setOrigin(0.5).setDepth(1);
  }
}
