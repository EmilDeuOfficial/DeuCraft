# DeuCraft

A browser-based voxel game inspired by Minecraft — runs entirely in the browser, no installation required.

🌐 **[Play now → emildeuofficial.github.io/DeuCraft](https://emildeuofficial.github.io/DeuCraft)**

---

## Features

### World & Terrain
- Procedural worlds with a seed system (grass, dirt, stone, sand, wood, leaves)
- Day/night cycle with sunrise and sunset
- Tool-based block breaking (pickaxe, axe, shovel — faster with the right tool)
- Place blocks, torches, chests, workbenches, and furnaces

### Game Modes
- **Survival**: hunger, hearts, fall damage, zombies at night
- **Creative**: fly (double-tap space), instant breaking, unlimited blocks

### Crafting & Items
- 2×2 hand crafting and 3×3 workbench
- Furnace for smelting (steak, cooked mutton)
- Wooden and stone tools (pickaxe, axe, shovel, sword)
- Food: apples, raw/cooked beef and mutton
- Chests for storage

### Mobs & Animals
- Cows and sheep roam the world (drop meat and wool)
- Zombies spawn at night — placing a torch within 5 blocks prevents spawning
- Combat with sword or bare fist

### Graphics & UI
- Pixel-art textures (16×16, procedurally generated)
- **3D hand model**: held blocks render as real 3D cubes, tools/items as extruded voxels — just like Minecraft
- SVG icons for inventory, pause, furnace, and crafting arrows
- First-person camera with FOV zoom while sprinting

### Multiplayer
- P2P multiplayer via WebRTC (PeerJS) — no server needed
- Host shares a 6-digit code; multiple players can join simultaneously
- Host-authoritative with interpolated player avatars

### Mobile
- Fully touch-optimised: joystick, jump button, camera swipe
- Break/place mode toggle with a single tap

---

## Tech Stack

| Library | Version | Purpose |
|---|---|---|
| [Three.js](https://threejs.org) | r128 | 3D rendering (WebGL) |
| [PeerJS](https://peerjs.com) | 1.5.4 | WebRTC P2P multiplayer |

No build tools, no framework — plain HTML/CSS/JS, runs directly in any modern browser.

---

## Controls

### Desktop
| Key | Action |
|---|---|
| `WASD` | Move |
| `Ctrl + W` / double `W` | Sprint |
| `Space` | Jump / double-tap: fly (Creative) |
| `E` | Open inventory |
| `1–9` | Select hotbar slot |
| `G` | Toggle game mode (cheats only) |
| Left click | Break / attack |
| Right click | Place / use |

### Mobile
| Input | Action |
|---|---|
| Left joystick | Move |
| Swipe right side | Look around |
| Short tap right side | Break / place (depends on mode) |
| ⛏ button | Toggle break ↔ place mode |
| ▲ / ▼ | Jump / descend (Creative) |

---

## Running Locally

```bash
git clone https://github.com/EmilDeuOfficial/DeuCraft.git
cd DeuCraft
# Start a local HTTP server (e.g. with Python):
python3 -m http.server 8000
# Then open: http://localhost:8000
```

> Opening the file directly via `file://` will **not** work due to browser CORS restrictions on local files.

---

## License

See [LICENSE](LICENSE).
