export const MARATHON = {
  tag: "Wipro Bengaluru Marathon · Sep 2026",
  distance: "21.097 km",
  stats: [
    { value: "≈2:16", label: "finish, from watch splits" },
    { value: "6:21", label: "average per km" },
    { value: "5:45", label: "fastest km: the 21st" },
  ],
  /** min:sec per km for km 1–21, then the final 0.4 km. Heart rate is deliberately not shown. */
  splits: [
    "7:09", "6:10", "6:50", "6:29", "6:45", "6:00", "6:29", "6:12", "6:23", "6:26", "6:45",
    "6:25", "6:50", "6:02", "5:55", "5:57", "6:16", "6:02", "6:25", "6:52", "5:45", "5:10",
  ],
  chartLabel:
    "Pace per kilometre: started at 7:09, settled between 6:00 and 6:50, finished with a 5:45 final kilometre and a 5:10 pace sprint.",
  closing: "Saved the fastest kilometre for last. Then built PaceCoach to plan the next one.",
  medalAlt: "The silver 21.097K Bengaluru Marathon finisher medal in front of the stadium pitch",
} as const;

export interface SplitBar {
  label: string;
  /** Bar height in px: faster kilometres are taller. */
  height: number;
  sprint: boolean;
}

export function splitBars(splits: readonly string[]): SplitBar[] {
  return splits.map((p, i) => {
    const [m, s] = p.split(":").map(Number);
    const sec = m * 60 + s;
    return {
      label: `${i < 21 ? `km ${i + 1}` : "last 0.4 km"}: ${p} /km`,
      height: Math.round(24 + (440 - sec)),
      sprint: i >= 20,
    };
  });
}

export type KitResult = "Winners" | "Runners-up";

export interface Kit {
  id: "blue" | "grey" | "purple" | "black";
  title: string;
  note: string;
  result: KitResult;
  /** Sway period in seconds; each shirt differs so they never move in step. */
  sway: number;
  backAlt: string;
  frontAlt: string;
}

/** Captions confirmed by Vishal (2026-10-25). Crests on the pixel shirts are generic stand-ins. */
export const KITS: ReadonlyArray<Kit> = [
  {
    id: "blue",
    title: "MIT Hockey",
    note: "Revels",
    result: "Runners-up",
    sway: 3.1,
    backAlt: "Blue speckled MIT Hockey shirt, back: gold VISHAL and a big 4",
    frontAlt: "Blue speckled MIT Hockey shirt, front: gold shoulder stripes and MIT HOCKEY",
  },
  {
    id: "grey",
    title: "MIT Manipal",
    note: "Inter-MAHE · medal + Certificate of Merit",
    result: "Winners",
    sway: 3.7,
    backAlt: "Grey MIT Manipal shirt with black sleeves, back: MIT MANIPAL, 4, VISHAL",
    frontAlt: "Grey MIT Manipal shirt with black sleeves, front: side panels and crest",
  },
  {
    id: "purple",
    title: "MIT Manipal",
    note: "Inter-MAHE",
    result: "Winners",
    sway: 2.9,
    backAlt: "Purple and white MIT Manipal shirt, back: white MIT MANIPAL and 4",
    frontAlt: "Purple and white MIT Manipal shirt, front: white diagonal chest band",
  },
  {
    id: "black",
    title: "MIT Hockey",
    note: "Revels '23",
    result: "Runners-up",
    sway: 3.4,
    backAlt: "Black MIT Hockey shirt with yellow lines, back: yellow VISHAL 4",
    frontAlt: "Black MIT Hockey shirt with yellow lines, front: MIT HOCKEY and crests",
  },
];

export const KIT_ROOM = {
  kicker: "The kit room",
  title: "Always No. 4",
  intro: "Hockey at Mayo College, then MIT. Different shirts, same number. Tap a shirt to turn it round.",
} as const;

export const OFF_PITCH_CARDS = [
  {
    kicker: "Youth academy · 2012–2021",
    title: "Mayo College, Ajmer",
    body: "Hockey team. Sitar in the college orchestra. College monitor.",
  },
  {
    kicker: "Away day · Dec 2019",
    title: "Borneo service project",
    body: "15 days on a Round Square International Service Project, working with 60 students from around the world.",
  },
] as const;
