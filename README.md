
# Beat ’Em Up — Vanilla JS (iPad-ready)

2D action **beat ’em up** prototype built with **HTML/CSS/JS only** (no frameworks). Designed to run as static files. Touch-friendly with a **virtual joystick** and action buttons for iPad; keyboard controls for desktop.

> **Inspiration:** Lookism (no copyrighted names/art used).

## Features
- Canvas 2D + `requestAnimationFrame` + **delta time**
- **DPR scaling** (Retina crisp) + **letterbox** layout
- Prevents accidental mobile gestures: `viewport-fit=cover`, `user-scalable=no`, `touch-action:none`, passive listeners where appropriate
- **Controls**
  - Desktop: WASD/Arrows = Move, **J** = Light, **K** = Heavy, **L** = Dash, **I** = Parry
  - iPad: virtual joystick (left), action buttons (right), multi-touch
- **Stats:** STR/SPD/TEC/DUR
- **Combat:** light/heavy combo chain, **dash with i-frames**, **parry** (success → counter + **0.6× slow‑mo 250ms**), **hitstop**
- **AABB hitboxes**, simple physics, floating damage numbers
- **Enemies (AI state machine):** idle → patrol → chase → attack → evade → stunned (two types: *thug*, *striker*)
- **Progression:** EXP/Level, stat points, in-game **Upgrade** panel (open by button or **U** key), soft caps (via sqrt scaling)
- **HUD:** HP/EXP bars, combo counter, stats, mini buttons
- **Save:** `localStorage` (player stats/level/exp); **RESET** button
- **Performance/mobile:** placeholder visuals, preloader, **debounced** resize/orientation
- **PWA (optional):** `manifest.json` + `sw.js` (offline-first)

## Run
Any static server works. Two simple options:
```bash
# Option A: using npx http-server
npx http-server -p 8080

# Option B: VS Code Live Server extension (or similar)
# Right-click index.html → "Open with Live Server"
```
Then open: `http://localhost:8080/`

> iPad Safari should reach ~60 FPS on the test arena (≥ 5 enemies), rotate works, multi-touch (3+) works.

## Files
```
index.html
styles.css
main.js
engine/
  math.js
  input.js
  loop.js
  physics.js
  stats.js
  storage.js
  ai.js
assets/
  icon-192.png
  icon-512.png
manifest.json
sw.js
README.md
```

## Balance Panel
Press **~** to toggle **Balance Panel**. Adjust STR/SPD/TEC/DUR live and see a frametime graph. Close via button.

## Formulas
- `DR(DUR) = DUR / (DUR + 100)`
- `damage = base * (1 + STR/100) * comboMult * critMult * (1 - DR(DUR_target))`
- `SPD` affects move speed and attack interval
- `TEC` affects parry/combo windows

## Notes / TODO
- Add more enemy archetypes & boss with phase changes
- Expand combo system & aerials
- SFX/Music via WebAudio (placeholder currently none)
- Scene management & stage clear → stat point award screen
