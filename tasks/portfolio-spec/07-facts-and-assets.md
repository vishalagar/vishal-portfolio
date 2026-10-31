# Portfolio spec: §7 Facts (source of truth), §8 Assets

Part of `tasks/portfolio-spec/` (index: `README.md`).

## 7. Facts (source of truth)

- **Now:** AI Engineer, Samsung Electro-Mechanics, Bengaluru (Aug 2025 – present), promoted from ML Intern (Jan–Jul 2025).
  - Autonomous model-retraining platform: FastAPI workflows for classification, segmentation and YOLO; 8+ factory machines; MySQL tracking of 10,000+ records; Optuna; manual intervention down 50%; 450+ backend tests; versioning schema; annotation tool; led the UI team.
  - Image-generation platform: APIs for 8 modules used by 5+ teams; GAN and diffusion; SiT S/2 to XL transfer learning; generation time down from about 1 day to half a day.
  - Local LLM integration with session context.
- **Netweb Technologies**, Cloud Engineer Intern (May–Jul 2024): AWS Landing Zone Terraform modules (VPC, IAM), S3 + DynamoDB state locking, an Azure CycleCloud Slurm HPC checklist.
- **Afame Technologies**, ML Intern (Mar–Apr 2024).
- **Manipal Institute of Technology**, B.Tech CSE (AI & ML), 2021–2025, minor in Big Data Analytics.
  - Capstone: federated YOLOv8 fire and smoke detection (five clients, 1,000+ Wan 2.1 images, mAP@0.5 0.734 → 0.812, false positives 14 → 3.2 per shift).
  - Snake DQN (avg 37, best 75).
  - Metal surface defects (24 GLCM features, SVM 91%).
  - Colorization (U-Net SSIM 0.897).
  - FedProx simulation (about 79.5%).
- **Side projects:** PrintSafe.in (Next.js 14, TS, Cloudflare R2, Upstash, Supabase, Vercel; 500+ visits), Football Vision, Terminal (Bloomberg-style app), India Trading Bot, AI D-Day, PaceCoach.
- **Off the pitch:** Mayo College, Ajmer (2012–2021: hockey, sitar, college monitor); Round Square, Borneo (Dec 2019); Wipro Bengaluru half marathon (Sep 2026); hockey for MIT, shirt No. 4: Inter-MAHE winners twice ('25 white/grey kit, '24 purple kit), Revels runners-up twice ('24 blue kit, '23 black kit).
- **Links:** github.com/vishalagar · linkedin.com/in/vishal-agarwal123 · printsafe.in

---

## 8. Assets

| Path | What it is |
|---|---|
| `design/pixel-me/vishal_bust.json`, `generate_sprite.py` | The approved bust (palette + pixel rows) and its generator |
| `design/pixel-me/generate_frames.py` → `vishal_frames.json`, `vishal_sheet_8x.png` | The 5 eye frames. Only the eye pixels are repainted. |
| `design/pixel-me/generate_kits.py` → `kits/*_8x.png`, `kits_preview.png` | The 4 shirts, front and back |
| `design/pixel-me/generate_jersey.py` → `jersey_8x.png` | First single-shirt version (superseded by the kits) |
| `design/assets/medal.jpg` | Real medal photo, resized to 900×1200 |
| `design/assets/bnw_in.png`, `bnw_out.png` | Colorization input and U-Net output, from the project notebook (`Main .ipynb`, cell 16) |
| `design/mock/*.dc.html`, `canvas.json` | Mock source: Main + PrintSafeDemo, RetrainDemo, GenDemo, SnakeDemo, FootballGame |
| `design/mock/sim/` | Node harnesses for the football engine: `_match.js` (stats), `_bias2.js` (team balance), `_mirror.js` (symmetry), `_human.js` (scripted input), plus `check.py` (markup and `renderVals` smoke test). Run them from that folder. |

---
