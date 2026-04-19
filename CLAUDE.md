# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Vite dev server at http://localhost:5173
npm run build    # tsc + vite build → dist/
npm run preview  # Preview production build locally
```

No test or lint scripts are configured.

## Architecture

Browser-based tactical RPG inspired by Final Fantasy Tactics. All visuals are **procedurally drawn** using Phaser's Graphics API — no external image assets.

**Tech stack:** Phaser 4, TypeScript (strict), Vite.

### Scene Flow

```
BootScene (900ms splash) → BattleScene (core loop) + UIScene (parallel overlay)
```

- `BattleScene` orchestrates everything: creates systems, manages the input state machine, draws units
- `UIScene` is passive — it listens to `BattleScene` events via `this.scene.get('BattleScene').events.on(...)`
- BattleScene emits: `turnStart`, `battleOver`

### Systems

| System | File | Responsibility |
|---|---|---|
| GridSystem | `src/systems/GridSystem.ts` | Isometric rendering, tile↔screen coordinate math, tile highlighting |
| TurnManager | `src/systems/TurnManager.ts` | CT-based turn queue; `advanceToNextTurn()` simulates ticks until a unit hits 100 CT |
| Pathfinder | `src/systems/Pathfinder.ts` | BFS movement (`getReachableCells`), Manhattan range (`getCellsInRange`), path reconstruction |
| CombatSystem | `src/systems/CombatSystem.ts` | `executeAbility()` resolves damage/healing/status; `aiChooseAction()` drives enemy AI |

### Input State Machine (BattleScene)

```
waiting → player_menu → player_move → player_act → back to waiting
                      ↘ ai_turn ↗
                      → game_over
```

Phase transitions happen on tile/unit clicks and keyboard shortcuts (ESC to cancel, R to restart).

### Key Design Decisions

- **CT system:** each unit's CT increments by its SPD each tick; acting costs 100 CT (`ct -= 100`). Faster units act more often.
- **Isometric projection:** tiles drawn back-to-front (painter's algorithm); height offset applied to screen Y.
- **No asset pipeline:** adding sprite sheets requires introducing a Phaser preload step and updating `drawUnit()` in BattleScene.
- **Data is immutable:** job templates and ability definitions live in `src/data/` and are never mutated at runtime.

### Roadmap (Phase 2)

Sprite assets, map selection screen, equipment system, save/load, sound — see `ARCHITECTURE.md` for full details.
