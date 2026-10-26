export interface Player {
  n: number;
  name: string;
}

/** Starting XI, 4-3-3, front line first. */
export const LINEUP: ReadonlyArray<ReadonlyArray<Player>> = [
  [
    { n: 9, name: "YOLOv8" },
    { n: 10, name: "Next.js" },
    { n: 11, name: "TypeScript" },
  ],
  [
    { n: 6, name: "OpenCV" },
    { n: 8, name: "PyTorch" },
    { n: 7, name: "FastAPI" },
  ],
  [
    { n: 2, name: "NumPy" },
    { n: 4, name: "MySQL" },
    { n: 5, name: "Pandas" },
    { n: 3, name: "Azure" },
  ],
  [{ n: 1, name: "Python" }],
];

export const BENCH = [
  "TensorFlow",
  "scikit-learn",
  "Optuna",
  "Terraform",
  "AWS",
  "Slurm",
  "Streamlit",
  "Supabase",
  "ONNX Runtime",
] as const;

export type EventTag = "Kick-off" | "Sub on" | "Goal" | "Promoted";

export interface CareerEvent {
  min: string;
  tag: EventTag;
  title: string;
  when: string;
}

/** Match minutes map 2021 → 0' and 2026 → 90' (18' per year). */
export const TIMELINE: ReadonlyArray<CareerEvent> = [
  { min: "0'", tag: "Kick-off", title: "B.Tech CSE (AI & ML), Manipal Institute of Technology", when: "2021" },
  { min: "40'", tag: "Sub on", title: "ML Intern, Afame Technologies", when: "Mar–Apr 2024" },
  {
    min: "42'",
    tag: "Sub on",
    title: "Cloud Engineer Intern, Netweb: AWS Landing Zone in Terraform, Azure HPC cluster",
    when: "May–Jul 2024",
  },
  { min: "72'", tag: "Sub on", title: "ML Intern, Samsung Electro-Mechanics", when: "Jan–Jul 2025" },
  { min: "79'", tag: "Goal", title: "Capstone: federated YOLOv8 fire & smoke detector", when: "2025" },
  { min: "83'", tag: "Promoted", title: "AI Engineer, Samsung Electro-Mechanics", when: "Aug 2025 – now" },
  { min: "90+4'", tag: "Goal", title: "PrintSafe.in goes live", when: "Mar 2026" },
  { min: "ET 102'", tag: "Goal", title: "Sports Detection ships", when: "Sep 2026" },
];
