# Portfolio spec: §6.1–6.4 PrintSafe, retraining, image generation, Snake

Part of `tasks/portfolio-spec/` (index: `README.md`).

## 6. Interactive components

The mock builds each one as a separate component so its own timer doesn't re-render the page. Keep that separation in the real build: one React component and one hook per demo.

### 6.1 PrintSafe demo

- Matches PrintSafe's real look: background `#8ec6e8` with a `#ffffff59` grid at 22px, white cards, `#0d0d0d` borders and 3px shadows, yellow `#f5c518` buttons, blue `#1a6fa8`, red `#d6384a` "Printed" stamp.
- One click runs the whole sequence:

| Stage | Time | What happens |
|---|---|---|
| 0 | idle | "Share privately. Delete automatically." Button: Encrypt & create link |
| 1 | 0–1.4s | The file's lines scramble into hex every 90ms; lock badge appears |
| 2 | 1.4–3.4s | One-time link `printsafe.in/v/3f9c2a1e#k=Zx7q…`, key part highlighted |
| 3 | 3.4–4.7s | "Shop opens it once", Printed stamp |
| 4 | 4.7–6.0s | The file splits into 7 strips that fall and tilt (shred) |
| 5 | end | "Gone. Zero trace." with a dashed "0 bytes" outline. Button: Run it again |

### 6.2 Autonomous retraining demo

- Model label `defect-yolo v14`. An accuracy chart of 24 points, ticking every 260ms.
- Accuracy drifts down by 0.002–0.006 per tick, plus noise. Bars below the dashed **0.88** threshold turn red.
- On a breach: an alert for 4 ticks, then 4 pipeline stages of 5 ticks each:
  1. Data checks: duplicates and labels
  2. Optuna tuning (trial counter climbs to 12)
  3. Retrain on a free GPU
  4. Validate and register the next version
- Then it deploys: accuracy goes back to 0.95, the version number goes up, and it serves again.
- "Inject drift" forces an immediate drop to 0.865.
- In simulation one full cycle takes about 13 seconds.

### 6.3 Image generation demo

- A 16×16 grid denoises over T = 20 steps, one every 90ms. Each cell blends from hashed noise to the target colour with weight `w = (t/T)^1.3`.
- It holds the finished image for 22 ticks, then the next one starts.
- Targets alternate between an **MLCC chip capacitor with a crack** and a **clean** one; Samsung Electro-Mechanics makes MLCCs.
- "Generate" starts the next image straight away.

### 6.4 Snake

- A 16×10 grid, ticking every 140ms. The bot plays until the visitor takes over (arrow keys, WASD, or the on-screen d-pad). There's a game-over screen and a best score.
- **Bot logic** (a stand-in for the real DQN): consider straight, left and right; drop any move that crashes; prefer moves that leave at least snake length + 2 reachable cells (flood fill); then pick the move closest to the food, with a 0.3 bias toward going straight. In simulation the bot's best score was 59.
- **Upgrade:** export the real DQN weights (an 11 → 256 → 3 network, about 4k parameters) to JSON and run Vishal's actual agent in JS.
