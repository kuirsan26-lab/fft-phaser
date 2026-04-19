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
}

export interface CampaignState {
  squadName: string;
  battlesCompleted: number; // 0–9; === 10 means campaign won
  units: CampaignUnit[];
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
