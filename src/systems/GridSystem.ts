import * as Phaser from 'phaser';
import { MAP_DATA, MAP_COLS, MAP_ROWS } from '../data/MapData';
import type { TileData } from '../data/MapData';

export const TILE_W = 64;
export const TILE_H = 32;
export const TILE_DEPTH = 16;

export function isoToScreen(col: number, row: number, height = 0): { x: number; y: number } {
  return {
    x: (col - row) * (TILE_W / 2),
    y: (col + row) * (TILE_H / 2) - height * TILE_DEPTH,
  };
}

const TERRAIN_COLORS: Record<TileData['terrain'], { top: number; left: number; right: number }> = {
  normal: { top: 0x4a7c59, left: 0x2d5238, right: 0x366344 },
  water:  { top: 0x1a6b9e, left: 0x0d4266, right: 0x115580 },
  forest: { top: 0x2d6e2d, left: 0x1a441a, right: 0x235623 },
  wall:   { top: 0x888888, left: 0x444444, right: 0x666666 },
};

// Draw a diamond (top face of isometric tile) using fillPath
function diamond(
  gfx: Phaser.GameObjects.Graphics,
  cx: number, cy: number,
  hw: number, hh: number,
  color: number, alpha = 1,
): void {
  gfx.fillStyle(color, alpha);
  gfx.beginPath();
  gfx.moveTo(cx,      cy);
  gfx.lineTo(cx + hw, cy + hh);
  gfx.lineTo(cx,      cy + hh * 2);
  gfx.lineTo(cx - hw, cy + hh);
  gfx.closePath();
  gfx.fillPath();
}

function diamondStroke(
  gfx: Phaser.GameObjects.Graphics,
  cx: number, cy: number,
  hw: number, hh: number,
  color: number, alpha = 1, lw = 1,
): void {
  gfx.lineStyle(lw, color, alpha);
  gfx.beginPath();
  gfx.moveTo(cx,      cy);
  gfx.lineTo(cx + hw, cy + hh);
  gfx.lineTo(cx,      cy + hh * 2);
  gfx.lineTo(cx - hw, cy + hh);
  gfx.closePath();
  gfx.strokePath();
}

// Draw left face of cube (parallelogram)
function leftFace(
  gfx: Phaser.GameObjects.Graphics,
  cx: number, cy: number,
  hw: number, hh: number, depth: number, color: number,
): void {
  gfx.fillStyle(color, 1);
  gfx.beginPath();
  gfx.moveTo(cx - hw, cy + hh);
  gfx.lineTo(cx,      cy + hh * 2);
  gfx.lineTo(cx,      cy + hh * 2 + depth);
  gfx.lineTo(cx - hw, cy + hh + depth);
  gfx.closePath();
  gfx.fillPath();
}

// Draw right face of cube
function rightFace(
  gfx: Phaser.GameObjects.Graphics,
  cx: number, cy: number,
  hw: number, hh: number, depth: number, color: number,
): void {
  gfx.fillStyle(color, 1);
  gfx.beginPath();
  gfx.moveTo(cx + hw, cy + hh);
  gfx.lineTo(cx,      cy + hh * 2);
  gfx.lineTo(cx,      cy + hh * 2 + depth);
  gfx.lineTo(cx + hw, cy + hh + depth);
  gfx.closePath();
  gfx.fillPath();
}

export class GridSystem {
  private scene: Phaser.Scene;
  private tileGraphics: Map<string, Phaser.GameObjects.Graphics> = new Map();
  private overlayGraphics: Map<string, Phaser.GameObjects.Graphics> = new Map();
  private dangerGraphics: Map<string, Phaser.GameObjects.Graphics> = new Map();
  private container: Phaser.GameObjects.Container;

  offsetX: number;
  offsetY: number;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);

    const mapPixelH = (MAP_COLS + MAP_ROWS) * (TILE_H / 2);
    this.offsetX = scene.scale.width / 2;
    this.offsetY = (scene.scale.height - mapPixelH) / 2 + 80;

    this.buildTiles();
  }

  private key(col: number, row: number): string { return `${col},${row}`; }

  private buildTiles(): void {
    const order: [number, number][] = [];
    for (let r = 0; r < MAP_ROWS; r++)
      for (let c = 0; c < MAP_COLS; c++)
        order.push([c, r]);
    order.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]));

    for (const [col, row] of order) {
      const tile = MAP_DATA[row][col];
      const gfx = this.scene.add.graphics();
      this.drawTile(gfx, col, row, tile, false);
      this.container.add(gfx);
      this.tileGraphics.set(this.key(col, row), gfx);
    }
  }

  private drawTile(
    gfx: Phaser.GameObjects.Graphics,
    col: number, row: number,
    tile: TileData,
    highlight: boolean,
  ): void {
    gfx.clear();
    const { x, y } = isoToScreen(col, row, 0);
    const px = x + this.offsetX;
    const py = y + this.offsetY;
    const hw = TILE_W / 2;
    const hh = TILE_H / 2;
    const colors = highlight
      ? { top: 0x88ccff, left: 0x4488aa, right: 0x5599bb }
      : TERRAIN_COLORS[tile.terrain];

    const baseY = py - tile.height * TILE_DEPTH;

    // Draw side faces for elevated tiles (only bottom visible faces)
    if (tile.height > 0) {
      leftFace(gfx,  px, baseY, hw, hh, tile.height * TILE_DEPTH, colors.left);
      rightFace(gfx, px, baseY, hw, hh, tile.height * TILE_DEPTH, colors.right);
    }

    // Top face
    diamond(gfx, px, baseY, hw, hh, colors.top);
    diamondStroke(gfx, px, baseY, hw, hh,
      highlight ? 0xffffff : 0x000000,
      highlight ? 0.8 : 0.2, 1);

    // Mark impassable tiles
    if (!tile.passable) {
      diamond(gfx, px, baseY, hw, hh, 0x000000, 0.35);
    }
  }

  getTile(col: number, row: number): TileData | null {
    if (col < 0 || col >= MAP_COLS || row < 0 || row >= MAP_ROWS) return null;
    return MAP_DATA[row][col];
  }

  highlightTiles(cells: [number, number][], style: 'move' | 'attack' | 'none'): void {
    this.overlayGraphics.forEach(g => g.destroy());
    this.overlayGraphics.clear();
    if (style === 'none') return;

    const color = style === 'move' ? 0x44aaff : 0xff4444;
    const sorted = [...cells].sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]));
    for (const [col, row] of sorted) {
      const tile = this.getTile(col, row);
      if (!tile) continue;
      const { x, y } = isoToScreen(col, row, tile.height);
      const px = x + this.offsetX;
      const py = y + this.offsetY;
      const hw = TILE_W / 2;
      const hh = TILE_H / 2;

      const gfx = this.scene.add.graphics();
      diamond(gfx, px, py, hw, hh, color, 0.35);
      diamondStroke(gfx, px, py, hw, hh, color, 0.9, 2);
      this.container.add(gfx);
      this.overlayGraphics.set(this.key(col, row), gfx);
    }
  }

  clearHighlights(): void {
    this.overlayGraphics.forEach(g => g.destroy());
    this.overlayGraphics.clear();
  }

  showDangerZone(cells: [number, number][]): void {
    this.clearDangerZone();
    const sorted = [...cells].sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]));
    for (const [col, row] of sorted) {
      const tile = this.getTile(col, row);
      if (!tile) continue;
      const { x, y } = isoToScreen(col, row, tile.height);
      const px = x + this.offsetX;
      const py = y + this.offsetY;
      const gfx = this.scene.add.graphics();
      diamond(gfx, px, py, TILE_W / 2, TILE_H / 2, 0xff6600, 0.18);
      diamondStroke(gfx, px, py, TILE_W / 2, TILE_H / 2, 0xff8800, 0.75, 1);
      this.container.add(gfx);
      this.dangerGraphics.set(this.key(col, row), gfx);
    }
  }

  clearDangerZone(): void {
    this.dangerGraphics.forEach(g => g.destroy());
    this.dangerGraphics.clear();
  }

  getUnitPosition(col: number, row: number): { x: number; y: number } {
    const tile = this.getTile(col, row);
    const h = tile ? tile.height : 0;
    const { x, y } = isoToScreen(col, row, h);
    return {
      x: x + this.offsetX,
      y: y + this.offsetY + TILE_H / 2,
    };
  }

  isInBounds(col: number, row: number): boolean {
    return col >= 0 && col < MAP_COLS && row >= 0 && row < MAP_ROWS;
  }
}
