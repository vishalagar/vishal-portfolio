export type DemoKind = "printsafe" | "retrain" | "gen" | "snake" | "fire" | "colorize";

export interface Project {
  kind: DemoKind;
  min: string;
  title: string;
  blurb: string;
  /** "VAR check" points: three verifiable facts. */
  checks: readonly [string, string, string];
  stack: readonly string[];
  href: string;
  cta: string;
}

/** The world's game card shows the real project that game belongs to (worlds-spec §7). */
export interface FeaturedProject {
  min: string;
  title: string;
  /** One line about the project; the world's game blurb follows it. */
  line: string;
  checks: readonly [string, string, string];
  stack: readonly string[];
  href: string;
  cta: string;
}

export const SPORTS_DETECTION: FeaturedProject = {
  min: "ET 102'",
  title: "Sports Detection",
  line: "Drop in a match clip and it tracks players, ball, possession and passes, entirely in the browser.",
  checks: ["YOLOv8n via ONNX Runtime Web", "WebGPU, WebAssembly fallback", "Footage never leaves the device"],
  stack: ["TypeScript", "ONNX Runtime Web", "WebGPU"],
  // update when the repo is renamed
  href: "https://github.com/vishalagar/football-analysis",
  cta: "Code",
};

/** Facts from github.com/vishalagar/RunningCoach only. Not deployed, so the card links to the code. */
export const PACECOACH: FeaturedProject = {
  min: "ET 98'",
  title: "PaceCoach",
  line: "An AI running coach built for OpenAI Build Week (July 2026): set a race, log or import your runs, and the plan adapts after every one.",
  checks: [
    "GPT-5.6 vision reads screenshots of past runs from any app; you review the rows before they are saved",
    "Versioned plans, a conservative finish-time estimate and a coach note explaining every re-plan",
    "Weather-aware via Open-Meteo; reporting pain switches to a rest-only week",
  ],
  stack: ["FastAPI", "React", "SQLite", "GPT-5.6", "Open-Meteo"],
  href: "https://github.com/vishalagar/RunningCoach",
  cta: "Code",
};

export const PROJECTS: ReadonlyArray<Project> = [
  {
    kind: "printsafe",
    min: "90+4'",
    title: "PrintSafe.in",
    blurb:
      "Self-destructing document sharing, born from visa paperwork stuck on a print shop’s WhatsApp. Upload, one-time link, printed, gone.",
    checks: [
      "AES-256-GCM in the browser; key lives in the URL fragment, never sent to the server",
      "Direct-to-R2 presigned uploads to get past Vercel’s body limit",
      "Auto-delete after viewing; 500+ visits",
    ],
    stack: ["Next.js", "TypeScript", "Cloudflare R2", "Upstash", "Supabase"],
    href: "https://printsafe.in",
    cta: "Live site",
  },
  {
    kind: "retrain",
    min: "83'",
    title: "Autonomous Retraining",
    blurb: "At Samsung Electro-Mechanics: agents that notice a model’s accuracy drop, then retrain and re-tune it.",
    checks: [
      "Dataset and model versioning schema, in-house annotation tool",
      "450+ backend tests after decoupling from other teams’ modules",
      "Manual intervention down 50% across 8+ factory machines",
    ],
    stack: ["FastAPI", "MySQL", "Optuna", "YOLO"],
    href: "#pundit",
    cta: "Ask the Pundit",
  },
  {
    kind: "gen",
    min: "75'",
    title: "Image Generation Platform",
    blurb: "Synthetic training data for when real defects are rare. GANs, diffusion and blending behind one set of APIs.",
    checks: [
      "Transfer learning across SiT S/2 to XL, layers modified for new channel setups",
      "Image-set generation cut from ~1 day to half a day (FID-checked)",
      "APIs for 8 modules, used by 5+ teams",
    ],
    stack: ["PyTorch", "Diffusion", "GANs", "LLMs"],
    href: "#pundit",
    cta: "Ask the Pundit",
  },
  {
    kind: "snake",
    min: "55'",
    title: "Snake DQN",
    blurb:
      "Tabular Q-learning for chess hit the state-space wall, so he pivoted to a Deep Q-Network for Snake. Beat the bot, or take control.",
    checks: [
      "11-feature state: danger, direction, food position",
      "11 → 256 → 3 network, 100k-transition replay memory",
      "Avg 37 points over 1,000 eval games, best 75",
    ],
    stack: ["PyTorch", "Pygame", "RL"],
    href: "https://github.com/vishalagar/RL-Project",
    cta: "Code",
  },
  {
    kind: "fire",
    min: "79'",
    title: "Fire & Smoke Detection",
    blurb: "Capstone: privacy-preserving detector for manufacturing-site incident prevention.",
    checks: [
      "Five-client federated training",
      "1,000+ Wan 2.1 synthetic rare-event images",
      "mAP@0.5 0.734 → 0.812; false positives 14 → 3.2 per shift",
    ],
    stack: ["YOLOv8", "Federated learning", "Wan 2.1"],
    href: "#pundit",
    cta: "Ask the Pundit",
  },
  {
    kind: "colorize",
    min: "60'",
    title: "B&W Cartoon Colorization",
    blurb:
      "Final-year deep learning project: give a grayscale cartoon frame its colours back, where one shade of grey could be many colours.",
    checks: [
      "4,500 grayscale + 4,500 colour training frames",
      "CNN vs autoencoder vs U-Net, moved to Kaggle GPUs",
      "U-Net won: SSIM 0.897, MSE 0.0206",
    ],
    stack: ["PyTorch", "U-Net", "OpenCV"],
    href: "https://github.com/vishalagar/COLORIZATION-OF-B-W-IMAGES",
    cta: "Code",
  },
];

export const SQUAD = [
  "Metal Surface Defects (GLCM + SVM, 91%)",
  "Federated Learning Sim (FedProx)",
  "Terminal",
  "India Trading Bot",
  "AI D-Day",
  "PaceCoach",
] as const;
