# FFT Phaser — Living Architecture Document

> This document is updated continuously as the project evolves.  
> Last updated: 2026-04-20 (campaign mode added)

---

## Project Vision

A browser-based tactical RPG inspired by **Final Fantasy Tactics**, built with **Phaser 3 + TypeScript + Vite**.  
No external art assets — all visuals are procedurally drawn with Phaser's Graphics API.

---

## Current Status: **Phase 1 — Core Loop + Campaign Mode**

### ✅ Done
- Private GitHub repo: `kuirsan26-lab/fft-phaser`
- Phaser 3 + Vite + TypeScript scaffold
- Isometric grid renderer (10×8 map, 4 terrain types, height levels 0-3)
- CT-based turn manager (FFT-style charge-time system)
- BFS pathfinding with jump/height limits
- Combat system: melee, ranged, magic (Fire/Blizzard/Thunder), healing, AoE, stun
- AI: moves toward enemies, chooses best ability
- UI: action menu, turn order panel, unit info tooltip, battle log, floating damage numbers
- 4 job classes: Warrior, Knight, Mage, Archer
- Auto-battle toggle: button (top-right) + A key; player units use AI when active
- **Campaign mode:** squad creation → 10 battles → victory
  - `SquadCreationScene`: name your squad, pick 4 jobs (click to cycle)
  - `CampScene`: roster view, HP/MP carry over, Heal All button, progress bar
  - Permadeath: dead units free their slot permanently
  - Enemy scaling: stat multiplier grows with battle number (×0.7 → ×1.7)
  - Post-battle auto-navigation: victory → camp, defeat → squad creation

### 🔲 Camp — not yet implemented
- [ ] Upgrade characters (stat growth / level up)
- [ ] Equipment slots (weapons, armor affect stats)
- [ ] Revive fallen characters (cost resource)

### 🔲 Next Steps (Phase 2)
- [ ] Sprite sheets / pixel art assets (replace procedural circles)
- [ ] Map selection screen with 2-3 different maps
- [ ] Job advancement (unlock new classes)
- [ ] Save/load via localStorage
- [ ] Sound effects (Phaser Web Audio)
- [ ] Camera pan/zoom for larger maps
- [ ] More abilities per class (status effects: Slow, Haste, Sleep)

### 🔲 Phase 3 (Future)
- [ ] Story mode with cutscenes (Phaser timeline)
- [ ] Multiplayer (WebSocket, Colyseus)
- [ ] Map editor

---

## Architecture Overview

```
src/
├── main.ts               — Phaser Game config, scene registration
├── scenes/
│   ├── BootScene.ts           — Loading screen → SquadCreationScene
│   ├── SquadCreationScene.ts  — Pick squad name + 4 jobs, starts campaign
│   ├── BattleScene.ts         — Core game loop; campaign-aware (accepts CampaignState)
│   ├── CampScene.ts           — Between-battle rest: roster, heal, proceed
│   └── UIScene.ts             — Parallel: title bar, turn info, battle-over overlay
├── systems/
│   ├── GridSystem.ts     — Isometric rendering, tile highlighting, coordinate math
│   ├── TurnManager.ts    — CT-based turn order, unit queue
│   ├── Pathfinder.ts     — BFS movement, range calculation, path reconstruction
│   └── CombatSystem.ts   — Damage formulas, ability execution, AI decision-making
├── entities/
│   └── Unit.ts           — Unit class: stats, HP/MP, status effects, sprite refs
├── data/
│   ├── UnitData.ts       — Job templates, ability definitions
│   ├── MapData.ts        — Tile height map, spawn positions
│   └── Campaign.ts       — CampaignState types, enemy loadout per battle, stat scaling
└── ui/
    ├── ActionMenu.ts     — In-world action menu (Move / Abilities / Wait)
    ├── TurnOrderPanel.ts — Top strip showing upcoming turns + CT bars
    └── BattleLog.ts      — Side log + floating damage numbers
```

---

## Key Design Decisions

### CT System (Charge Time)
Each unit has `ct` that increments by `unit.spd` per tick. When `ct >= 100` the unit acts, then `ct -= 100`. This means faster units act more frequently, matching FFT's feel.

### Isometric Projection
```
screen_x = (col - row) * TILE_W/2   + offsetX
screen_y = (col + row) * TILE_H/2   + offsetY  - height * TILE_DEPTH
```
Tiles are drawn back-to-front sorted by `col + row` (painter's algorithm).

### Scene Communication
`BattleScene` emits Phaser events (`turnStart`, `battleOver`). `UIScene` listens via `scene.get('BattleScene').events.on(...)`. This keeps UI concerns separate.

### AI Architecture
Simple priority AI in `CombatSystem.aiChooseAction`:
1. Try to use non-attack ability on in-range enemy
2. Fall back to melee attack on weakest reachable enemy
3. If nothing in range — move toward closest enemy

### Combat Formula
- Physical: `(atk × 1.8 × multiplier) - (def × 0.5) ± 0-5 random`
- Magical: `(mag × 2.5 × multiplier) - (mag_target × 0.3) ± 0-5 random`
- Healing: `mag × 3 × multiplier`

---

## Running Locally

```bash
npm install
npm run dev    # http://localhost:5173
npm run build  # dist/
```

## Controls

| Input | Action |
|-------|--------|
| Click unit | Select / open info |
| Click blue tile | Move (during move phase) |
| Click red tile | Target ability |
| ESC | Cancel / back to menu |
| R | Restart battle |
| A | Toggle auto-battle (player units use AI) |
| R | Restart battle (free battle only; disabled in campaign) |

---

## Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| Phaser | 3.x | Game engine |
| TypeScript | 5.x | Type safety |
| Vite | 6.x | Dev server & bundler |
