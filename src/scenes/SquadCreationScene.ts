import * as Phaser from 'phaser';
import type { JobClass } from '../data/UnitData';
import { UNIT_TEMPLATES } from '../data/UnitData';
import { createCampaignUnit, HERO_NAMES, type CampaignState } from '../data/Campaign';

const JOBS: JobClass[] = ['warrior', 'mage', 'archer', 'knight'];
const SLOT_X = [120, 340, 560, 780];
const SLOT_Y = 250;
const SLOT_W = 180;
const SLOT_H = 210;

interface SlotRefs {
  circle: Phaser.GameObjects.Graphics;
  letter: Phaser.GameObjects.Text;
  jobText: Phaser.GameObjects.Text;
  statsText: Phaser.GameObjects.Text;
  statsText2: Phaser.GameObjects.Text;
}

export class SquadCreationScene extends Phaser.Scene {
  private squadName = 'IRON FIST';
  private slotJobs: JobClass[] = ['warrior', 'mage', 'archer', 'knight'];
  private nameText!: Phaser.GameObjects.Text;
  private slotRefs: SlotRefs[] = [];

  constructor() { super({ key: 'SquadCreationScene' }); }

  create(): void {
    const { width, height } = this.scale;

    this.add.graphics()
      .fillStyle(0x07090f, 1).fillRect(0, 0, width, height);

    this.add.text(width / 2, 50, 'ASSEMBLE YOUR SQUAD', {
      fontSize: '26px', fontFamily: 'monospace', fontStyle: 'bold', color: '#7799ee',
    }).setOrigin(0.5);

    this.add.text(width / 2, 82, 'Ten battles await. Only the prepared will survive.', {
      fontSize: '12px', fontFamily: 'monospace', color: '#334455',
    }).setOrigin(0.5);

    this.buildNameInput(width);
    for (let i = 0; i < 4; i++) this.buildSlot(i);
    this.buildStartButton(width, height);
  }

  private buildNameInput(width: number): void {
    this.add.text(width / 2, 130, 'SQUAD NAME', {
      fontSize: '10px', fontFamily: 'monospace', color: '#334455',
    }).setOrigin(0.5);

    const bx = width / 2 - 160, by = 143;
    this.add.graphics()
      .fillStyle(0x0d1827, 1).lineStyle(1, 0x2244aa, 1)
      .fillRoundedRect(bx, by, 320, 38, 4)
      .strokeRoundedRect(bx, by, 320, 38, 4);

    this.nameText = this.add.text(width / 2, by + 19, '', {
      fontSize: '17px', fontFamily: 'monospace', fontStyle: 'bold', color: '#99bbff',
    }).setOrigin(0.5);

    let cursorOn = true;
    this.time.addEvent({
      delay: 500, loop: true,
      callback: () => { cursorOn = !cursorOn; this.refreshName(cursorOn); },
    });
    this.refreshName(true);

    this.input.keyboard!.on('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Backspace') {
        this.squadName = this.squadName.slice(0, -1);
      } else if (e.key.length === 1 && this.squadName.length < 16) {
        this.squadName += e.key.toUpperCase();
      }
      this.refreshName(cursorOn);
    });
  }

  private refreshName(cursor: boolean): void {
    this.nameText?.setText(this.squadName + (cursor ? '|' : ' '));
  }

  private buildSlot(i: number): void {
    const cx = SLOT_X[i];
    const bg = this.add.graphics();
    this.drawSlotBg(bg, cx, false);
    bg.setInteractive(
      new Phaser.Geom.Rectangle(cx - SLOT_W / 2, SLOT_Y, SLOT_W, SLOT_H),
      Phaser.Geom.Rectangle.Contains,
    );
    bg.on('pointerover', () => this.drawSlotBg(bg, cx, true));
    bg.on('pointerout',  () => this.drawSlotBg(bg, cx, false));
    bg.on('pointerdown', () => {
      this.slotJobs[i] = JOBS[(JOBS.indexOf(this.slotJobs[i]) + 1) % JOBS.length];
      this.updateSlot(i);
    });

    const circle = this.add.graphics();
    const letter = this.add.text(cx, SLOT_Y + 52, '', {
      fontSize: '18px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(cx, SLOT_Y + 88, HERO_NAMES[i], {
      fontSize: '13px', fontFamily: 'monospace', fontStyle: 'bold', color: '#bbccdd',
    }).setOrigin(0.5);

    const jobText = this.add.text(cx, SLOT_Y + 108, '', {
      fontSize: '10px', fontFamily: 'monospace', color: '#556677',
    }).setOrigin(0.5);

    const statsText = this.add.text(cx, SLOT_Y + 138, '', {
      fontSize: '10px', fontFamily: 'monospace', color: '#3d5060',
    }).setOrigin(0.5);

    const statsText2 = this.add.text(cx, SLOT_Y + 155, '', {
      fontSize: '10px', fontFamily: 'monospace', color: '#3d5060',
    }).setOrigin(0.5);

    this.add.text(cx, SLOT_Y + SLOT_H - 12, '▲ click to change class ▲', {
      fontSize: '8px', fontFamily: 'monospace', color: '#223344',
    }).setOrigin(0.5);

    this.slotRefs[i] = { circle, letter, jobText, statsText, statsText2 };
    this.updateSlot(i);
  }

  private drawSlotBg(g: Phaser.GameObjects.Graphics, cx: number, hover: boolean): void {
    g.clear()
      .fillStyle(hover ? 0x0f1e2e : 0x0b1520, 1)
      .lineStyle(1, hover ? 0x3355aa : 0x1e2e3e, 1)
      .fillRoundedRect(cx - SLOT_W / 2, SLOT_Y, SLOT_W, SLOT_H, 6)
      .strokeRoundedRect(cx - SLOT_W / 2, SLOT_Y, SLOT_W, SLOT_H, 6);
  }

  private updateSlot(i: number): void {
    const { circle, letter, jobText, statsText, statsText2 } = this.slotRefs[i];
    const cx = SLOT_X[i];
    const t = UNIT_TEMPLATES[this.slotJobs[i]];

    circle.clear()
      .fillStyle(t.color, 1).fillCircle(cx, SLOT_Y + 52, 22)
      .lineStyle(2, 0xffffff, 0.2).strokeCircle(cx, SLOT_Y + 52, 22);
    letter.setText(t.job[0].toUpperCase());
    jobText.setText(t.job.toUpperCase());
    statsText.setText(`HP ${t.hp}   ATK ${t.atk}   DEF ${t.def}`);
    statsText2.setText(`MAG ${t.mag}   SPD ${t.spd}   MOV ${t.move}`);
  }

  private buildStartButton(width: number, height: number): void {
    const bx = width / 2 - 140, by = height - 72;
    const btn = this.add.graphics()
      .fillStyle(0x112a1a, 1).lineStyle(2, 0x33aa66, 1)
      .fillRoundedRect(bx, by, 280, 44, 6)
      .strokeRoundedRect(bx, by, 280, 44, 6);
    btn.setInteractive(new Phaser.Geom.Rectangle(bx, by, 280, 44), Phaser.Geom.Rectangle.Contains);
    btn.on('pointerover', () => {
      btn.clear().fillStyle(0x1a3a26, 1).lineStyle(2, 0x55ffaa, 1)
        .fillRoundedRect(bx, by, 280, 44, 6).strokeRoundedRect(bx, by, 280, 44, 6);
    });
    btn.on('pointerout', () => {
      btn.clear().fillStyle(0x112a1a, 1).lineStyle(2, 0x33aa66, 1)
        .fillRoundedRect(bx, by, 280, 44, 6).strokeRoundedRect(bx, by, 280, 44, 6);
    });
    btn.on('pointerdown', () => this.startCampaign());
    this.add.text(width / 2, by + 22, 'MARCH TO WAR  ⟶', {
      fontSize: '15px', fontFamily: 'monospace', fontStyle: 'bold', color: '#55ee99',
    }).setOrigin(0.5).setDepth(1);
  }

  private startCampaign(): void {
    const campaign: CampaignState = {
      squadName: this.squadName.trim() || 'UNNAMED',
      battlesCompleted: 0,
      units: this.slotJobs.map((job, i) => createCampaignUnit(i, job)),
    };
    this.scene.start('BattleScene', { campaign });
    this.scene.launch('UIScene');
  }
}
