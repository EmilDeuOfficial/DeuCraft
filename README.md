# DeuCraft

Ein browserbasiertes Voxel-Spiel inspiriert von Minecraft — läuft komplett im Browser, ohne Installation.

🌐 **[Jetzt spielen → emildeuofficial.github.io/DeuCraft](https://emildeuofficial.github.io/DeuCraft)**

---

## Features

### Welt & Terrain
- Prozedurale Welten mit Seed-System (Gras, Erde, Stein, Sand, Holz, Laub)
- Tag/Nacht-Zyklus mit Sonnenaufgang und Sonnenuntergang
- Werkzeug-basierter Abbau (Spitzhacke, Axt, Schaufel — je schneller mit passendem Werkzeug)
- Platzieren von Blöcken, Fackeln, Truhen, Werkbänken und Öfen

### Spielmodi
- **Überleben**: Hunger, Herzen, Fallschaden, Zombies nachts
- **Kreativ**: Fliegen (Doppel-Leertaste), sofortiger Abbau, unbegrenzte Blöcke

### Crafting & Items
- 2×2 Handwerk (Hotbar) und 3×3 Werkbank
- Ofen zum Schmelzen (Steak, gebratenes Hammelfleisch, Sand → Glas)
- Werkzeuge aus Holz und Stein (Spitzhacke, Axt, Schaufel, Schwert)
- Essen: Äpfel, Rohes/Gebratenes Rind- und Hammelfleisch
- Truhen zum Lagern

### Gegner & Tiere
- Kühe und Schafe wandern durch die Welt (droppen Fleisch und Wolle)
- Zombies spawnen nachts — Fackeln in einem 5-Block-Radius verhindern das Spawnen
- Kampfsystem mit Schwert oder Faust

### Grafik & UI
- Pixel-Art Texturen (16×16, prozedural generiert)
- **3D Handmodell**: gehaltene Blöcke als echter 3D-Würfel, Werkzeuge/Items als extrudierte Voxel — genau wie in Minecraft
- SVG-Icons für Inventar, Pause, Ofen und Crafting-Pfeile
- Erster-Person-Kamera mit FOV-Anpassung beim Sprinten

### Multiplayer
- P2P-Multiplayer über WebRTC (PeerJS) — kein Server nötig
- Host teilt einen 6-stelligen Code; bis zu mehrere Spieler gleichzeitig
- Host-autoritatives System mit interpolierten Spieler-Avataren

### Mobile
- Vollständig touch-optimiert: Joystick, Sprung-Button, Kameraschwenk
- Abbau-/Platzier-Moduswechsel per Tap

---

## Technologie

| Bibliothek | Version | Zweck |
|---|---|---|
| [Three.js](https://threejs.org) | r128 | 3D-Rendering (WebGL) |
| [PeerJS](https://peerjs.com) | 1.5.4 | WebRTC P2P Multiplayer |

Kein Build-Tool, kein Framework — reines HTML/CSS/JS, direkt im Browser lauffähig.

---

## Steuerung

### Desktop
| Taste | Aktion |
|---|---|
| `WASD` | Bewegen |
| `Strg + W` / Doppel-`W` | Sprinten |
| `Leertaste` | Springen / Doppel: Fliegen (Kreativ) |
| `E` | Inventar öffnen |
| `1–9` | Hotbar-Slot wählen |
| `G` | Spielmodus wechseln (nur mit Cheats) |
| Mausklick links | Abbauen / Angreifen |
| Mausklick rechts | Platzieren / Benutzen |

### Mobile
| Geste | Aktion |
|---|---|
| Linker Joystick | Bewegen |
| Wischgeste rechts | Kamera drehen |
| Kurzer Tap rechts | Abbauen / Platzieren (je nach Modus) |
| ⛏ Button | Modus wechseln (Abbauen ↔ Platzieren) |
| ▲ / ▼ | Springen / Sinken (Kreativ) |

---

## Lokal ausführen

```bash
git clone https://github.com/EmilDeuOfficial/DeuCraft.git
cd DeuCraft
# Einen lokalen HTTP-Server starten (z.B. mit Python):
python3 -m http.server 8000
# Dann im Browser: http://localhost:8000
```

> Direktes Öffnen als Datei (`file://`) funktioniert **nicht**, da der Browser für lokale Dateien keine Cross-Origin-Anfragen erlaubt.

---

## Lizenz

Siehe [LICENSE](LICENSE).
