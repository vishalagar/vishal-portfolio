/** Canned answers for the question chips. These never call the API. */
export const PUNDIT_QA: ReadonlyArray<{ q: string; a: string }> = [
  {
    q: "What does he do at Samsung?",
    a: "Right, so he has built an autonomous model-retraining platform. FastAPI workflows for classification, segmentation and YOLO across 8+ factory machines. Accuracy drops, the system spots it, retrains, and checks the result. Manual intervention down by half. Lovely bit of engineering, that.",
  },
  {
    q: "Best goal this season?",
    a: "Has to be PrintSafe. His visa documents were sitting on a print shop’s WhatsApp, so he built the fix: encrypted in the browser, a one-time link, gone after printing. Top corner.",
  },
  {
    q: "How does he build?",
    a: "Spec first, screens second, code third. Clear requirements, test it like a real user, then a firm yes or no. Very disciplined going forward.",
  },
  {
    q: "Toughest bug?",
    a: "Netweb, summer 2024. His VPC module worked alone but clashed with the Transit Gateway’s address plan. He went back, read the whole multi-account IP plan, reassigned the CIDRs and passed review. Then fixed the team’s Terraform state collisions with S3 plus DynamoDB locking. Learns from the miss, that one.",
  },
];

export const PUNDIT_COPY = {
  intro: "Answers questions about my work in full commentary mode, grounded in my resume and projects.",
  placeholder: "Ask about his work or a project (3 a day)…",
  label: "Your question",
  ask: "Ask",
  thinking: "Checking the replay…",
  errors: {
    rate_limited: "That’s your three questions for today. Pick one of the questions above, or email Vishal directly.",
    busy: "The studio is full today. Pick one of the questions above, or email Vishal directly.",
    not_configured: "The studio mic is off right now. Pick one of the questions above, or email Vishal directly.",
    invalid: "Ask a question between 3 and 280 characters.",
    failed: "Lost the feed for a moment. Try again, or pick one of the questions above.",
  },
} as const;

export type PunditErrorCode = keyof typeof PUNDIT_COPY.errors;

/**
 * The only facts the Pundit may use (spec §7). Keep in sync with the page content.
 * Never add: phone numbers, recommenders' names or contact details, LinkedIn analytics,
 * heart-rate data, "open to work" status or grad-school plans.
 */
export const PUNDIT_FACTS = `
NOW
- AI Engineer, Samsung Electro-Mechanics, Bengaluru (Aug 2025 – present). Promoted from ML Intern there (Jan–Jul 2025).
- Built an autonomous model-retraining platform: FastAPI workflows for classification, segmentation and YOLO models across 8+ factory machines; MySQL tracking of 10,000+ records; Optuna hyperparameter tuning; manual intervention down 50%; 450+ backend tests written after decoupling from other teams' modules; a dataset and model versioning schema; an in-house annotation tool; led the UI team for it.
- Image-generation platform for synthetic training data (real defects are rare): APIs for 8 modules used by 5+ teams; GANs and diffusion; transfer learning across SiT S/2 to XL with layers modified for new channel setups; image-set generation time cut from about 1 day to half a day, checked with FID.
- Local LLM integration with session context.

BEFORE
- Netweb Technologies, Cloud Engineer Intern (May–Jul 2024): AWS Landing Zone Terraform modules (VPC, IAM); S3 + DynamoDB Terraform state locking; an Azure CycleCloud Slurm HPC checklist. Toughest bug: his VPC module clashed with the Transit Gateway's address plan; he read the whole multi-account IP plan, reassigned the CIDRs and passed review.
- Afame Technologies, ML Intern (Mar–Apr 2024).
- Manipal Institute of Technology (MIT Manipal), B.Tech CSE (AI & ML), 2021–2025, minor in Big Data Analytics.

PROJECTS
- Capstone: federated YOLOv8 fire and smoke detection for manufacturing sites. Five federated clients, 1,000+ synthetic rare-event images made with Wan 2.1, mAP@0.5 from 0.734 to 0.812, false positives from 14 to 3.2 per shift.
- Snake DQN: tabular Q-learning for chess hit the state-space wall, so he moved to a Deep Q-Network for Snake. 11-feature state, 11 → 256 → 3 network, 100k-transition replay memory, averaged 37 points over 1,000 evaluation games, best 75.
- B&W cartoon colorization: 4,500 grayscale + 4,500 colour frames; compared CNN, autoencoder and U-Net on Kaggle GPUs; U-Net won with SSIM 0.897, MSE 0.0206.
- Metal surface defect classification: 24 GLCM features, SVM at 91%.
- Federated learning simulation with FedProx, about 79.5%.
- PrintSafe.in (live, Mar 2026): self-destructing document sharing, born from his visa paperwork sitting on a print shop's WhatsApp. AES-256-GCM encryption in the browser with the key in the URL fragment so the server never sees it; direct-to-Cloudflare-R2 presigned uploads; deleted after viewing; 500+ visits. Stack: Next.js 14, TypeScript, Cloudflare R2, Upstash, Supabase, Vercel.
- Sports Detection (Sep 2026; previously called Football Vision): tracks players, ball, possession and passes from a match clip entirely in the browser with YOLOv8n via ONNX Runtime Web (WebGPU, WebAssembly fallback); footage never leaves the device. It works on any sport.
- PaceCoach (built for OpenAI Build Week, July 2026; not deployed): an AI running coach. Set a race, log or import runs, and the plan adapts after every one. GPT-5.6 vision reads screenshots of past runs from any app and the runner reviews the rows before they are saved. Versioned plans, a conservative finish-time estimate and a coach note explaining every re-plan. Weather-aware via Open-Meteo; reporting pain switches to a rest-only week. Stack: FastAPI, React, SQLite, GPT-5.6, Open-Meteo.
- Also: Terminal (a Bloomberg-style app), India Trading Bot, AI D-Day.
- Skills: Python, PyTorch, YOLOv8, OpenCV, FastAPI, NumPy, Pandas, MySQL, Azure, Next.js, TypeScript, TensorFlow, scikit-learn, Optuna, Terraform, AWS, Slurm, Streamlit, Supabase, ONNX Runtime.
- How he builds: spec first, screens second, code third; clear requirements, test like a real user, then a firm yes or no.

OFF THE PITCH
- Mayo College, Ajmer (2012–2021): school hockey team, sitar in the college orchestra, college monitor.
- Round Square International Service Project in Borneo (Dec 2019): 15 days with 60 students from around the world.
- Wipro Bengaluru Marathon half (21.097 km), Sep 2026: about 2:16 from watch splits, 6:21/km average, fastest kilometre was the last full one (the 21st) at 5:45.
- Hockey for MIT Manipal, always shirt No. 4: Inter-MAHE winners twice ('24 and '25), Revels runners-up twice ('23 and '24).

CONTACT
- Email agarwal.vishal2003@gmail.com · github.com/vishalagar · linkedin.com/in/vishal-agarwal123 · printsafe.in
`.trim();
