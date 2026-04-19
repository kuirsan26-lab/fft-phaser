import { MAP_DATA, MAP_COLS, MAP_ROWS } from '../data/MapData';
import { Unit } from '../entities/Unit';

interface Node {
  col: number;
  row: number;
  cost: number;
}

// BFS that respects height-jump limits and passability
export function getReachableCells(
  unit: Unit,
  allUnits: Unit[],
): [number, number][] {
  const occupied = new Set(
    allUnits.filter(u => !u.isDead && u !== unit).map(u => `${u.col},${u.row}`)
  );

  const visited = new Map<string, number>(); // key -> cost
  const queue: Node[] = [{ col: unit.col, row: unit.row, cost: 0 }];
  const key = (c: number, r: number) => `${c},${r}`;
  visited.set(key(unit.col, unit.row), 0);

  const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];

  while (queue.length > 0) {
    const { col, row, cost } = queue.shift()!;
    if (cost >= unit.move) continue;

    for (const [dc, dr] of dirs) {
      const nc = col + dc;
      const nr = row + dr;
      if (nc < 0 || nc >= MAP_COLS || nr < 0 || nr >= MAP_ROWS) continue;
      const tile = MAP_DATA[nr][nc];
      if (!tile.passable) continue;

      const fromH = MAP_DATA[row][col].height;
      const toH = tile.height;
      if (Math.abs(toH - fromH) > unit.jump) continue;

      const k = key(nc, nr);
      if (occupied.has(k)) continue;
      const newCost = cost + 1;
      if (visited.has(k) && visited.get(k)! <= newCost) continue;

      visited.set(k, newCost);
      queue.push({ col: nc, row: nr, cost: newCost });
    }
  }

  // Return all reachable cells excluding starting position
  const result: [number, number][] = [];
  visited.forEach((_, k) => {
    const [c, r] = k.split(',').map(Number);
    if (c !== unit.col || r !== unit.row) result.push([c, r]);
  });
  return result;
}

// Returns tiles within range (Manhattan distance), ignoring obstacles (for abilities)
export function getCellsInRange(
  col: number,
  row: number,
  range: number,
  aoe: number = 0,
): [number, number][] {
  const result: [number, number][] = [];
  for (let c = 0; c < MAP_COLS; c++) {
    for (let r = 0; r < MAP_ROWS; r++) {
      const dist = Math.abs(c - col) + Math.abs(r - row);
      if (dist > 0 && dist <= range + aoe) result.push([c, r]);
    }
  }
  return result;
}

// BFS path from start to target, returns waypoints (excludes start)
export function findPath(
  fromCol: number, fromRow: number,
  toCol: number, toRow: number,
  unit: Unit,
  allUnits: Unit[],
): [number, number][] {
  const occupied = new Set(
    allUnits.filter(u => !u.isDead && u !== unit).map(u => `${u.col},${u.row}`)
  );
  const key = (c: number, r: number) => `${c},${r}`;
  const prev = new Map<string, string>();
  const queue: [number, number][] = [[fromCol, fromRow]];
  const visited = new Set([key(fromCol, fromRow)]);

  const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];

  while (queue.length > 0) {
    const [col, row] = queue.shift()!;
    if (col === toCol && row === toRow) break;

    for (const [dc, dr] of dirs) {
      const nc = col + dc;
      const nr = row + dr;
      if (nc < 0 || nc >= MAP_COLS || nr < 0 || nr >= MAP_ROWS) continue;
      const tile = MAP_DATA[nr][nc];
      if (!tile.passable) continue;
      const fromH = MAP_DATA[row][col].height;
      if (Math.abs(tile.height - fromH) > unit.jump) continue;
      const k = key(nc, nr);
      if (visited.has(k)) continue;
      if (occupied.has(k) && !(nc === toCol && nr === toRow)) continue;
      visited.add(k);
      prev.set(k, key(col, row));
      queue.push([nc, nr]);
    }
  }

  // Reconstruct path
  const path: [number, number][] = [];
  let cur = key(toCol, toRow);
  const start = key(fromCol, fromRow);
  while (cur && cur !== start) {
    const [c, r] = cur.split(',').map(Number);
    path.unshift([c, r]);
    cur = prev.get(cur) ?? '';
  }
  return path;
}
