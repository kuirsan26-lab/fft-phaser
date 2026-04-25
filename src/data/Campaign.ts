import type { JobClass, UnitTemplate } from './UnitData';
import { UNIT_TEMPLATES } from './UnitData';

export interface CampaignUnit {
  id: string;
  name: string;
  job: JobClass;
  currentHp: number;
  maxHp: number;
  currentMp: number;
  maxMp: number;
  isDead: boolean;
  level: number;
  xp: number;
  levelUps: number; // levels gained in the last battle, reset each camp visit
}

export interface CampaignState {
  squadName: string;
  battlesCompleted: number; // 0–9; === 10 means campaign won
  units: CampaignUnit[];
}

// Cumulative XP needed to reach each level (index = level, value = total XP required)
export const XP_THRESHOLDS = [0, 0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700];
export const MAX_LEVEL = XP_THRESHOLDS.length - 1;

export function xpForBattle(battleNum: number): number {
  return 50 + 10 * battleNum;
}

export interface StatBonus { atk: number; def: number; mag: number; spd: number; maxHp: number }

export function statBonusPerLevel(job: JobClass): StatBonus {
  switch (job) {
    case 'warrior': return { atk: 2, def: 0, mag: 0, spd: 0, maxHp: 5 };
    case 'knight':  return { atk: 0, def: 2, mag: 0, spd: 0, maxHp: 5 };
    case 'mage':    return { atk: 0, def: 0, mag: 2, spd: 0, maxHp: 3 };
    case 'archer':  return { atk: 1, def: 0, mag: 0, spd: 1, maxHp: 4 };
  }
}

export function applyLevelBonuses(base: UnitTemplate, job: JobClass, level: number): UnitTemplate {
  if (level <= 1) return base;
  const bonus = statBonusPerLevel(job);
  const lvls = level - 1;
  return {
    ...base,
    atk:   base.atk   + bonus.atk   * lvls,
    def:   base.def   + bonus.def   * lvls,
    mag:   base.mag   + bonus.mag   * lvls,
    spd:   base.spd   + bonus.spd   * lvls,
    hp:    base.hp    + bonus.maxHp * lvls,
    mp:    base.mp,
  };
}

export function grantXpAfterBattle(campaign: CampaignState, battleNum: number): void {
  const xp = xpForBattle(battleNum);
  for (const cu of campaign.units) {
    if (cu.isDead) continue;
    cu.levelUps = 0;
    cu.xp += xp;
    while (cu.level < MAX_LEVEL && cu.xp >= XP_THRESHOLDS[cu.level + 1]) {
      cu.level++;
      cu.levelUps++;
      // Increase maxHp on level-up; keep current HP ratio
      const hpGain = statBonusPerLevel(cu.job).maxHp;
      const prevMax = cu.maxHp;
      cu.maxHp += hpGain;
      cu.currentHp = Math.round((cu.currentHp / prevMax) * cu.maxHp);
    }
  }
}

export const HERO_NAMES = ['Aldric', 'Sera', 'Torin', 'Lyra'];

export function createCampaignUnit(slotIndex: number, job: JobClass): CampaignUnit {
  const t = UNIT_TEMPLATES[job];
  return {
    id: `p${slotIndex}`,
    name: HERO_NAMES[slotIndex],
    job,
    currentHp: t.hp,
    maxHp: t.hp,
    currentMp: t.mp,
    maxMp: t.mp,
    isDead: false,
    level: 1,
    xp: 0,
    levelUps: 0,
  };
}

export interface EnemySlot { job: JobClass; mult: number }

export function getEnemyLoadout(battleNum: number): EnemySlot[] {
  const m = battleNum <= 2 ? 0.7
          : battleNum <= 4 ? 1.0
          : battleNum <= 7 ? 1.35
          : 1.7;

  if (battleNum === 1) return [{ job: 'warrior', mult: m }, { job: 'archer', mult: m }];
  if (battleNum === 2) return [{ job: 'warrior', mult: m }, { job: 'mage',   mult: m }, { job: 'archer', mult: m }];
  if (battleNum <= 4)  return [{ job: 'warrior', mult: m }, { job: 'warrior', mult: m }, { job: 'archer', mult: m }, { job: 'mage',   mult: m }];
  if (battleNum <= 6)  return [{ job: 'knight',  mult: m }, { job: 'warrior', mult: m }, { job: 'archer', mult: m }, { job: 'mage',   mult: m }];
  if (battleNum <= 8)  return [{ job: 'knight',  mult: m }, { job: 'knight',  mult: m }, { job: 'mage',   mult: m }, { job: 'archer', mult: m }];
  return [
    { job: 'knight', mult: m },
    { job: 'knight', mult: m },
    { job: 'mage',   mult: m * 1.1 },
    { job: 'archer', mult: m * 1.1 },
  ];
}

export function scaleTemplate(base: UnitTemplate, mult: number): UnitTemplate {
  return {
    ...base,
    hp:  Math.max(10, Math.round(base.hp  * mult)),
    mp:  Math.max(0,  Math.round(base.mp  * mult)),
    atk: Math.max(1,  Math.round(base.atk * mult)),
    def: Math.max(1,  Math.round(base.def * mult)),
    mag: Math.max(1,  Math.round(base.mag * mult)),
  };
}
