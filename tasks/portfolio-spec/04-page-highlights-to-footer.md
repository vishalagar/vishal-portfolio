# Portfolio spec: §5 Page structure: highlights, off the pitch, Pundit, footer

Part of `tasks/portfolio-spec/` (index: `README.md`).

### 03 · Highlights: "Goals & VAR reviews"

**Match of the day: Football Vision.** A wide card with the playable football match (§6.5). Its "VAR check" points:
- YOLOv8n via ONNX Runtime Web
- WebGPU, WebAssembly fallback
- Footage never leaves the device

**Project cards.** Each has a playable demo, a minute badge, a blurb, three "VAR check" points, stack chips and a link.

| Card | Demo | VAR checks |
|---|---|---|
| PrintSafe.in (90+4') | §6.1 | AES-256-GCM in the browser, with the key in the URL fragment so it is never sent to the server · direct-to-R2 presigned uploads to get past Vercel's body limit · auto-delete after viewing; 500+ visits |
| Autonomous Retraining (83') | §6.2 | dataset and model versioning schema, in-house annotation tool · 450+ backend tests after decoupling from other teams' modules · manual intervention down 50% across 8+ factory machines |
| Image Generation Platform (75') | §6.3 | transfer learning across SiT S/2 to XL, with layers modified for new channel setups · image-set generation cut from about 1 day to half a day (checked with FID) · APIs for 8 modules, used by 5+ teams |
| Snake DQN (55') | §6.4 | 11-feature state (danger, direction, food position) · 11 → 256 → 3 network, 100k-transition replay memory · averaged 37 points over 1,000 evaluation games, best 75 |
| Fire & Smoke Detection (79') | CSS animation: pixel flame, rising smoke, "fire 0.93" / "smoke 0.88" boxes, "client 3 of 5 · federated" | five-client federated training · 1,000+ Wan 2.1 synthetic rare-event images · mAP@0.5 0.734 → 0.812; false positives 14 → 3.2 per shift |
| B&W Cartoon Colorization (60') | The real notebook output: the grayscale input wipes across to the U-Net's colour output on a loop | 4,500 grayscale + 4,500 colour training frames · CNN vs autoencoder vs U-Net, moved to Kaggle GPUs · U-Net won: SSIM 0.897, MSE 0.0206 |

**"Also in the squad":** Metal Surface Defects (GLCM + SVM, 91%), Federated Learning Sim (FedProx), Terminal, India Trading Bot, AI D-Day, PaceCoach.

### 04 · Off the pitch: "Match fitness"

**Marathon card.**
- Tag: Wipro Bengaluru Marathon · Sep 2026.
- Distance: 21.097 km.
- Stats: about 2:16 (summed from watch splits; swap in the official chip time if Vishal provides it), 6:21/km average, fastest km was the 21st at 5:45.
- A 22-bar pace chart: km 1–21 plus the final 0.4 km at 5:10/km, with the last two bars in the accent colour.
- Closing line: "Saved the fastest kilometre for last. Then built PaceCoach to plan the next one."
- Beside it, the **real medal photo** (not pixelated).

Splits (min/km): 7:09, 6:10, 6:50, 6:29, 6:45, 6:00, 6:29, 6:12, 6:23, 6:26, 6:45, 6:25, 6:50, 6:02, 5:55, 5:57, 6:16, 6:02, 6:25, 6:52, 5:45, then 5:10 for the last 0.4 km.

**Kit room: "Always No. 4"** (§6.6).

Two smaller cards:
- **Mayo College, Ajmer** (2012–2021): hockey team, sitar in the college orchestra, college monitor.
- **Borneo service project** (Dec 2019): 15 days on a Round Square International Service Project with 60 students from around the world.

### 05 · Studio: "Ask the Pundit"

- The sprite blinks and glances on its own timing.
- Four question chips with canned answers in the mock:
  - What does he do at Samsung?
  - Best goal this season?
  - How does he build?
  - Toughest bug? (the Netweb CIDR clash and the Terraform state-locking fix)
- A text input. In the real build this calls Claude (§9).

### Full time (footer)

- Sprite, then "Let's build **something that sees.**"
- Buttons: Email (`agarwal.vishal2003@gmail.com`), GitHub, LinkedIn, Resume [PDF].
- Footer line: "© 2026 Vishal Agarwal" plus the "psst — type VAR anywhere" hint (football world only, like the easter egg itself).

---
