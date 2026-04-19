export interface TileData {
  height: number; // 0-3 visual stacking levels
  passable: boolean;
  terrain: 'normal' | 'water' | 'forest' | 'wall';
}

// 10x8 battle map — height 0=ground, 1/2=raised, 3=wall/impassable
const H = (h: number, terrain: TileData['terrain'] = 'normal'): TileData => ({
  height: h,
  passable: terrain !== 'wall' && terrain !== 'water',
  terrain,
});

export const MAP_COLS = 10;
export const MAP_ROWS = 8;

// Row-major: [row][col]
export const MAP_DATA: TileData[][] = [
  [H(0),H(0),H(1),H(1),H(2),H(2),H(1),H(0),H(0),H(0)],
  [H(0),H(1),H(1),H(2),H(2),H(2),H(2),H(1),H(0),H(0)],
  [H(0),H(1),H(2),H(2),H(3,'wall'),H(3,'wall'),H(2),H(1),H(1),H(0)],
  [H(0),H(1),H(2),H(2),H(2),H(2),H(2),H(2),H(1),H(0)],
  [H(0),H(0),H(1),H(2),H(2),H(2),H(2),H(1),H(0),H(0)],
  [H(0),H(0),H(1),H(1),H(2),H(1),H(1),H(0),H(0),H(0)],
  [H(0,'water'),H(0,'water'),H(0),H(1),H(1),H(1),H(0),H(0),H(0,'water'),H(0,'water')],
  [H(0,'water'),H(0,'water'),H(0),H(0),H(0),H(0),H(0),H(0),H(0,'water'),H(0,'water')],
];

export const PLAYER_STARTS: [number, number][] = [
  [6, 1], [6, 2], [7, 2], [7, 1],
];

export const ENEMY_STARTS: [number, number][] = [
  [1, 7], [1, 8], [2, 7], [2, 8],
];
