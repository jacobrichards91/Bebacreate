# Bebacreate — Project Context for Claude

## Project Overview

A browser-based game project. The `game/` folder contains a self-contained HTML5 game featuring robotic vacuum cleaner brands (Roborock, iRobot, Eufy, iLife, Samsung). Served via a shell script (`serve.sh`).

> **Note:** The README is minimal. Fill this in with more context as the project develops.

---

## Stack

| Layer | Choice |
|---|---|
| Runtime | Browser-only (no backend, no build step) |
| Language | Vanilla JavaScript |
| Entry point | `game/index.html` |
| Audio | `game/audio.js` |
| Game logic | `game/game.js`, `game/parts.js` |
| Serving | `serve.sh` (likely a simple local HTTP server) |

---

## Architecture

```
Bebacreate/
  game/
    index.html      ← Entry point
    game.js         ← Core game logic
    parts.js        ← Game parts/components
    audio.js        ← Sound handling
    *.png           ← Brand assets (Roborock, iRobot, Eufy, iLife, Samsung)
  serve.sh          ← Local dev server launcher
```

---

## Conventions

- No bundler, no npm — plain JS. Keep it that way unless Jacob decides to upgrade.
- Asset filenames match brand names — keep them consistent.
- No external dependencies unless absolutely necessary.

---

## Notes

- Project purpose and full game design TBD — update this file once the concept is fleshed out.
- The brand assets suggest this may be a vacuum-brand-themed game or interactive demo.
- To run: `bash serve.sh` or open `game/index.html` directly in a browser.
