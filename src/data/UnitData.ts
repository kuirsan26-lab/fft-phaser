export type JobClass = 'warrior' | 'mage' | 'archer' | 'knight';

export interface UnitTemplate {
  name: string;
  job: JobClass;
  hp: number;
  mp: number;
  atk: number;
  def: number;
  mag: number;
  spd: number;
  move: number;
  jump: number;
  color: number;
  abilities: AbilityId[];
}

export type AbilityId = 'attack' | 'fire' | 'blizzard' | 'thunder' | 'heal' | 'shoot' | 'shield_bash' | 'provoke';

export interface AbilityDef {
  id: AbilityId;
  name: string;
  range: number;
  aoe: number;
  mpCost: number;
  dmgMultiplier: number;
  healMultiplier: number;
  description: string;
}

export const ABILITIES: Record<AbilityId, AbilityDef> = {
  attack:      { id: 'attack',      name: 'Attack',      range: 1, aoe: 0, mpCost: 0,  dmgMultiplier: 1.0, healMultiplier: 0, description: 'Basic melee attack' },
  shield_bash: { id: 'shield_bash', name: 'Shield Bash', range: 1, aoe: 0, mpCost: 0,  dmgMultiplier: 0.8, healMultiplier: 0, description: 'Stuns target 1 turn' },
  provoke:     { id: 'provoke',     name: 'Provoke',     range: 2, aoe: 0, mpCost: 4,  dmgMultiplier: 0,   healMultiplier: 0, description: 'Forces enemy to target self' },
  fire:        { id: 'fire',        name: 'Fire',        range: 4, aoe: 0, mpCost: 8,  dmgMultiplier: 1.4, healMultiplier: 0, description: 'Fire magic damage' },
  blizzard:    { id: 'blizzard',    name: 'Blizzard',    range: 4, aoe: 1, mpCost: 12, dmgMultiplier: 1.2, healMultiplier: 0, description: 'Ice magic, small AoE' },
  thunder:     { id: 'thunder',     name: 'Thunder',     range: 3, aoe: 0, mpCost: 10, dmgMultiplier: 1.6, healMultiplier: 0, description: 'Lightning, high damage' },
  heal:        { id: 'heal',        name: 'Heal',        range: 3, aoe: 0, mpCost: 8,  dmgMultiplier: 0,   healMultiplier: 1.2, description: 'Restore HP to ally' },
  shoot:       { id: 'shoot',       name: 'Shoot',       range: 5, aoe: 0, mpCost: 0,  dmgMultiplier: 0.9, healMultiplier: 0, description: 'Ranged arrow attack' },
};

export const UNIT_TEMPLATES: Record<JobClass, UnitTemplate> = {
  warrior: {
    name: 'Warrior', job: 'warrior',
    hp: 80, mp: 20, atk: 14, def: 10, mag: 4, spd: 9, move: 4, jump: 3,
    color: 0x4488ff,
    abilities: ['attack', 'shield_bash'],
  },
  knight: {
    name: 'Knight', job: 'knight',
    hp: 100, mp: 16, atk: 12, def: 14, mag: 3, spd: 7, move: 3, jump: 2,
    color: 0xaaaaff,
    abilities: ['attack', 'shield_bash', 'provoke'],
  },
  mage: {
    name: 'Mage', job: 'mage',
    hp: 48, mp: 80, atk: 6, def: 5, mag: 16, spd: 8, move: 3, jump: 3,
    color: 0xff44aa,
    abilities: ['attack', 'fire', 'blizzard', 'thunder', 'heal'],
  },
  archer: {
    name: 'Archer', job: 'archer',
    hp: 60, mp: 24, atk: 11, def: 7, mag: 6, spd: 10, move: 4, jump: 4,
    color: 0x44ff88,
    abilities: ['attack', 'shoot'],
  },
};
