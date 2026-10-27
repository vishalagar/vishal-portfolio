# Portfolio spec: §5 Page structure: header, hero, team talk, Starting XI, career

Part of `tasks/portfolio-spec/` (index: `README.md`).

## 5. Page structure

### Header

- **Scorebug:** `LIVE · VA 6 – 0 BUGS`. VA is Vishal Agarwal, 6 is his shipped side projects, 0 bugs is a joke. **Decision pending** (see §10).
- **Nav:** Line-up, Timeline, Highlights, Pundit, Contact.
- **Sound toggle and theme toggle.** The theme toggle is labelled "Floodlights on" or "Day match", and its lamp icon fills with the accent at night.
- **Ticker items:**
  - Football Vision ships in extra time
  - PrintSafe.in passes 500+ visits
  - Half marathon done: 21.097 km
  - Promoted: ML Intern to AI Engineer, Samsung E-M
  - Capstone mAP@0.5 up from 0.734 to 0.812

**Theme switch "lights" sequence:**
- To night: a full-screen black overlay flickers like stadium lights warming up, two light beams sweep from the top corners, and the theme swaps at 420ms (1.3s total).
- To day: the beams power down, the screen blacks out, the theme swaps at 380ms, then it fades back in.

### Hero (kick-off)

- Kicker: "Matchday · Live from Bengaluru".
- H1: "AI engineer. **Builds models that see.**"
- Line: "I'm Vishal, an AI Engineer at Samsung Electro-Mechanics. I build vision systems that retrain themselves, and ship side projects on weekends."
- Buttons: "Watch highlights" and "Ask the Pundit".
- The pitch panel shows "Cam 1" and the pixel sprite, which bobs, blinks, follows the cursor with its eyes, and looks at the ball when it's kicked.
- Tapping the ball kicks it. A `VAR: on/off` button toggles the detection box, labelled "vishal 0.99", with its scan line.

### Half-time team talk

"I build models that **see**, pipelines that **retrain themselves**, and products people actually **use**." The highlighted words are in the accent colour. Below it rolls the current world's pixel prop, the same one as the hero (football: the ball).

### 01 · Starting XI (4-3-3)

| Line | Players |
|---|---|
| Forwards | 9 YOLOv8, 10 Next.js, 11 TypeScript |
| Midfield | 6 OpenCV, 8 PyTorch, 7 FastAPI |
| Defence | 2 NumPy, 4 MySQL, 5 Pandas, 3 Azure |
| Goalkeeper | 1 Python |
| Bench | TensorFlow, scikit-learn, Optuna, Terraform, AWS, Slurm, Streamlit, Supabase, ONNX Runtime |

### 02 · Career so far

Pinned sideways scroll. Match minutes map 2021 to 0' and 2026 to 90' (18' per year).

| Minute | Tag | Event | When |
|---|---|---|---|
| 0' | Kick-off | B.Tech CSE (AI & ML), Manipal Institute of Technology | 2021 |
| 40' | Sub on | ML Intern, Afame Technologies | Mar–Apr 2024 |
| 42' | Sub on | Cloud Engineer Intern, Netweb: AWS Landing Zone in Terraform, Azure HPC cluster | May–Jul 2024 |
| 72' | Sub on | ML Intern, Samsung Electro-Mechanics | Jan–Jul 2025 |
| 79' | Goal | Capstone: federated YOLOv8 fire & smoke detector | 2025 |
| 83' | Promoted | AI Engineer, Samsung Electro-Mechanics | Aug 2025 – now |
| 90+4' | Goal | PrintSafe.in goes live | Mar 2026 |
| ET 102' | Goal | Football Vision ships | Sep 2026 |
