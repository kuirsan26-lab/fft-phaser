import { Unit } from '../entities/Unit';
import type { AbilityId } from '../data/UnitData';
import { ABILITIES } from '../data/UnitData';

export interface CombatResult {
  damage: number;
  heal: number;
  missed: boolean;
  stunned: boolean;
  provoked: boolean;
  ability: AbilityId;
  targets: Unit[];
}

export function executeAbility(
  actor: Unit,
  ability: AbilityId,
  targets: Unit[],
): CombatResult {
  const def = ABILITIES[ability];
  const result: CombatResult = { damage: 0, heal: 0, missed: false, stunned: false, provoked: false, ability, targets };

  if (!actor.spendMp(def.mpCost)) {
    result.missed = true;
    return result;
  }

  for (const target of targets) {
    if (target.isDead) continue;

    if (def.healMultiplier > 0) {
      // Healing — works on allies
      const raw = Math.floor(actor.mag * 3 * def.healMultiplier);
      const actual = target.restoreHp(raw);
      result.heal += actual;
    } else if (def.dmgMultiplier > 0) {
      const isMagic = ['fire', 'blizzard', 'thunder'].includes(ability);
      const raw = isMagic
        ? Math.floor(actor.mag * 2.5 * def.dmgMultiplier)
        : Math.floor(actor.atk * 1.8 * def.dmgMultiplier);
      const mitigation = isMagic ? target.mag * 0.3 : target.def * 0.5;
      const final = Math.max(1, Math.floor(raw - mitigation + (Math.random() * 6 - 3)));
      const actual = target.takeDamage(final);
      result.damage += actual;

      if (ability === 'shield_bash' && !target.isDead) {
        target.addStatus({ type: 'stun', turnsLeft: 1 });
        result.stunned = true;
      }
    }

    if (ability === 'provoke' && !target.isDead) {
      target.addStatus({ type: 'provoked', turnsLeft: 2, sourceId: actor.id });
      result.provoked = true;
    }
  }

  return result;
}

// Simple AI: find the best action for an enemy unit
export function aiChooseAction(actor: Unit, allUnits: Unit[]): {
  ability: AbilityId;
  targets: Unit[];
  moveTo: [number, number] | null;
} {
  let enemies = allUnits.filter(u => u.team !== actor.team && !u.isDead);

  // If provoked, can only target the provoker
  if (actor.isProvoked) {
    const provokerId = actor.provokedBy;
    const provoker = enemies.find(u => u.id === provokerId);
    if (provoker) enemies = [provoker];
  }

  // Find attack targets in range
  for (const abilityId of actor.abilities) {
    if (abilityId === 'attack') continue;
    const def = ABILITIES[abilityId];
    if (actor.mp < def.mpCost) continue;

    const inRange = enemies.filter(e => {
      const dist = Math.abs(e.col - actor.col) + Math.abs(e.row - actor.row);
      return dist <= def.range;
    });

    if (inRange.length > 0) {
      return { ability: abilityId, targets: [inRange[0]], moveTo: null };
    }
  }

  // Default: melee attack closest enemy
  const def = ABILITIES['attack'];
  const melee = enemies.filter(e => {
    const dist = Math.abs(e.col - actor.col) + Math.abs(e.row - actor.row);
    return dist <= def.range;
  });

  if (melee.length > 0) {
    melee.sort((a, b) => a.hp - b.hp); // prefer weakest
    return { ability: 'attack', targets: [melee[0]], moveTo: null };
  }

  // Move toward closest enemy
  const closest = enemies.slice().sort((a, b) => {
    const da = Math.abs(a.col - actor.col) + Math.abs(a.row - actor.row);
    const db = Math.abs(b.col - actor.col) + Math.abs(b.row - actor.row);
    return da - db;
  })[0];

  const moveTo: [number, number] | null = closest
    ? [
        actor.col + Math.sign(closest.col - actor.col),
        actor.row + Math.sign(closest.row - actor.row),
      ]
    : null;

  return { ability: 'attack', targets: [], moveTo };
}
