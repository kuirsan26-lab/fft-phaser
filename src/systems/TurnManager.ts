import { Unit } from '../entities/Unit';

export class TurnManager {
  private units: Unit[] = [];
  activeUnit: Unit | null = null;

  constructor(units: Unit[]) {
    this.units = units;
  }

  get aliveUnits(): Unit[] {
    return this.units.filter(u => !u.isDead);
  }

  // Advance CT until the next unit is ready (CT >= 100)
  // Returns the unit whose turn it is
  advanceToNextTurn(): Unit {
    let ticks = 0;
    while (true) {
      for (const unit of this.aliveUnits) {
        unit.ct += unit.spd;
      }
      const ready = this.aliveUnits
        .filter(u => u.ct >= 100)
        .sort((a, b) => b.ct - a.ct); // highest CT goes first
      if (ready.length > 0) {
        const next = ready[0];
        next.ct -= 100;
        next.resetTurnFlags();
        next.tickStatuses();
        next.regenMp();
        this.activeUnit = next;
        return next;
      }
      if (++ticks > 10000) throw new Error('TurnManager: infinite loop guard');
    }
  }

  removeUnit(unit: Unit): void {
    // unit stays in array but isDead — aliveUnits filters it
    if (this.activeUnit === unit) this.activeUnit = null;
  }

  getOrderPreview(count: number = 8): Unit[] {
    // Snapshot current CT values and simulate
    const snapshot = this.aliveUnits.map(u => ({ unit: u, ct: u.ct }));
    const result: Unit[] = [];

    for (let i = 0; i < count; i++) {
      while (true) {
        for (const s of snapshot) s.ct += s.unit.spd;
        const ready = snapshot.filter(s => s.ct >= 100).sort((a, b) => b.ct - a.ct);
        if (ready.length > 0) {
          ready[0].ct -= 100;
          result.push(ready[0].unit);
          break;
        }
      }
    }
    return result;
  }
}
