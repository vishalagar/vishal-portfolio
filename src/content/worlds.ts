/**
 * "Choose your world": same content, five looks. Spec: tasks/worlds-spec/.
 * Everything a world changes lives here (copy, palettes for both modes, fonts, units, layouts);
 * components read it through useWorld() and CSS reads the variables built in src/lib/worlds/css.ts.
 */
import type { EventTag } from "./career";

export const WORLD_IDS = ["football", "gp", "gaming", "run", "ai"] as const;
export type WorldId = (typeof WORLD_IDS)[number];
export const DEFAULT_WORLD: WorldId = "football";

export type Mode = "night" | "day";

export interface Palette {
  bg: string;
  surface: string;
  surface2: string;
  line: string;
  ink: string;
  muted: string;
  pitchA: string;
  pitchB: string;
  chalk: string;
  shadow: string;
  blue: string;
  red: string;
  green: string;
  accent: string;
  onAccent: string;
  accentText: string;
  liveBg: string;
  liveInk: string;
  /** CSS background of the hero stage and of the line-up formation. */
  stage: string;
  formation: string;
  shirt: {
    bg: string;
    ink: string;
    line: string;
    radius: string;
    tagBg: string;
    tagInk: string;
  };
  /** Phone play-mode controller shell. */
  shell: {
    body: string;
    bezel: string;
    bezelInk: string;
    ink: string;
    btn: string;
    btnInk: string;
    dpad: string;
    pill: string;
    grille: string;
  };
}

export type LineupLayout =
  "formation" | "grid" | "select" | "corrals" | "network";
export type GameId = "football" | "race" | "pace" | "label" | "snake";
export type FeaturedId = "sports" | "snake" | "pacecoach" | "retrain";
export type Headgear = "helmet" | "headset" | "headband" | "visor";
export type PropShape = "ball" | "tyre" | "coin" | "bottle" | "cube";

export interface PlayDef {
  title: string;
  kicker: string;
  /** Labels for the phone A / B / R buttons; null hides the button. */
  a: string | null;
  b: string | null;
  r: string | null;
  /** Width / height of the game box: desk in theatre mode, phone in the Game Boy split. */
  desk: number;
  phone: number;
  legend: ReadonlyArray<{ key: string; does: string }>;
}

export interface World {
  id: WorldId;
  name: string;
  /** Tile / switcher swatch. */
  swatch: string;
  fonts: { display: string; label: string; scale: number };
  gear: Headgear | null;
  scorebug: { live: string; home: string; score: string; away: string };
  hero: {
    kicker: string;
    cam: string;
    cta: string;
    /** Detection box label while the costume is on. */
    box: string;
    /** The thing on the hero stage and under the team talk quote. */
    prop: {
      shape: PropShape;
      a: string;
      b: string;
      c: string;
      label: string;
      hint: string;
    };
  };
  /** Assistant name: "Ask the {assistant}". */
  assistant: string;
  /** How the assistant talks in this world (fed to the model with the assistant name). */
  voice: string;
  talk: string;
  review: { word: string; check: string };
  footerKicker: string;
  sections: {
    lineup: {
      kicker: string;
      title: string;
      sub: string;
      bench: string;
      layout: LineupLayout;
    };
    timeline: { kicker: string; title: string };
    highlights: { kicker: string; title: string };
    offpitch: { kicker: string; title: string };
    pundit: { kicker: string };
  };
  tags: Record<EventTag, string>;
  /** Theme toggle labels: [night, day]. */
  theme: readonly [string, string];
  /** Label on the PrintSafe card, featured first in every world. */
  topLabel: string;
  featured: FeaturedId;
  game: { id: GameId; kicker: string; start: string; blurb: string };
  intro: { tag: string; blurb: string };
  modes: Record<Mode, Palette>;
}

const PLAY_COMMON = [
  { key: "Enter", does: "restart" },
  { key: "Esc", does: "exit" },
] as const;

export const PLAY: Record<GameId, PlayDef> = {
  football: {
    title: "Sports Detection",
    kicker: "Match of the day",
    a: "Shoot",
    b: "Pass",
    r: "Sprint",
    desk: 2,
    phone: 1.3,
    legend: [
      { key: "Arrows / WASD", does: "move" },
      { key: "Space (hold)", does: "shoot, tap to tackle" },
      { key: "X", does: "pass" },
      { key: "Shift", does: "sprint" },
      ...PLAY_COMMON,
    ],
  },
  race: {
    title: "Grand Prix",
    kicker: "Race of the day",
    a: "DRS",
    b: "Brake",
    r: null,
    desk: 1.6,
    phone: 0.85,
    legend: [
      { key: "← →", does: "steer" },
      { key: "Space", does: "DRS, 3 per race" },
      { key: "X or ↓", does: "brake" },
      ...PLAY_COMMON,
    ],
  },
  pace: {
    title: "PaceCoach pace run",
    kicker: "Run of the day",
    a: "Left foot",
    b: "Right foot",
    r: null,
    desk: 2,
    phone: 1.35,
    legend: [
      { key: "← → alternate", does: "run" },
      { key: "Space / X alternate", does: "run" },
      { key: "↑ ↓", does: "change lane" },
      ...PLAY_COMMON,
    ],
  },
  label: {
    title: "Label Rush",
    kicker: "Eval of the day",
    a: "Crack",
    b: "Clean",
    r: null,
    desk: 2,
    phone: 1.35,
    legend: [
      { key: "Space or ←", does: "label crack" },
      { key: "X or →", does: "label clean" },
      ...PLAY_COMMON,
    ],
  },
  snake: {
    title: "Snake DQN",
    kicker: "Take control",
    a: "Again",
    b: null,
    r: null,
    desk: 1.6,
    phone: 1.6,
    legend: [
      { key: "Arrows / WASD", does: "steer" },
      { key: "Space", does: "play again" },
      ...PLAY_COMMON,
    ],
  },
};

const FOOTBALL_SHIRT = {
  bg: "#f3eee2",
  ink: "#0b1610",
  line: "#08130e",
  radius: "0",
  tagBg: "#08130e",
  tagInk: "#eef3ea",
};
const FOOTBALL_SHELL = {
  body: "#2f6b3a",
  bezel: "#1b1f1d",
  bezelInk: "#cfe0d4",
  ink: "#eef3ea",
  btn: "#f5d547",
  btnInk: "#0b1610",
  dpad: "#14181a",
  pill: "#4f5a52",
  grille: "#1d4527",
};
const stripes = (dir: string, a: string, b: string, w: number) =>
  `repeating-linear-gradient(${dir}, ${a} 0px, ${a} ${w}px, ${b} ${w}px, ${b} ${w * 2}px)`;

const GP_STAGE = stripes("90deg", "#3a3a40", "#34343a", 64);
const GP_FORMATION = stripes("0deg", "#3a3a40", "#34343a", 56);
const GAMING_STAGE =
  "radial-gradient(ellipse at 50% 60%, #26305a 0%, #0d0e14 72%)";
const GAMING_FORMATION = stripes("0deg", "#14151d", "#191a24", 56);
const RUN_STAGE =
  "linear-gradient(180deg, #7fb4ff 0%, #bcd8ff 54%, #1747a6 54%)";
const AI_GRID = (alpha: string, size: number) =>
  `linear-gradient(#7a4dff${alpha} 1px, transparent 1px) 0 0 / ${size}px ${size}px, linear-gradient(90deg, #7a4dff${alpha} 1px, transparent 1px) 0 0 / ${size}px ${size}px`;

export const WORLDS: Record<WorldId, World> = {
  football: {
    id: "football",
    name: "Football",
    swatch: "#2f7a43",
    fonts: { display: "Barlow Condensed", label: "Silkscreen", scale: 1 },
    gear: null,
    scorebug: { live: "Live", home: "VA", score: "6 – 0", away: "Bugs" },
    hero: {
      kicker: "Matchday · Live from Bengaluru",
      cam: "Cam 1",
      cta: "Watch highlights",
      box: "vishal 0.99",
      prop: {
        shape: "ball",
        a: "#f3eee2",
        b: "#120e14",
        c: "#120e14",
        label: "Kick the ball",
        hint: "tap the ball",
      },
    },
    assistant: "Pundit",
    voice:
      "a warm football pundit in the TV studio, talking in match-commentary style; at most one light football metaphor",
    talk: "Half-time team talk",
    review: { word: "VAR", check: "VAR check complete" },
    footerKicker: "Full time · post-match interview",
    sections: {
      lineup: {
        kicker: "01 · Team sheet",
        title: "Starting XI",
        sub: "4-3-3",
        bench: "Bench",
        layout: "formation",
      },
      timeline: { kicker: "02 · Match timeline", title: "Career so far" },
      highlights: { kicker: "03 · Highlights", title: "Goals & VAR reviews" },
      offpitch: { kicker: "04 · Off the pitch", title: "Match fitness" },
      pundit: { kicker: "05 · Studio" },
    },
    tags: {
      "Kick-off": "Kick-off",
      "Sub on": "Sub on",
      Goal: "Goal",
      Promoted: "Promoted",
    },
    theme: ["Floodlights on", "Day match"],
    topLabel: "Goal of the season",
    featured: "sports",
    game: {
      id: "football",
      kicker: "Match of the day",
      start: "Kick off",
      blurb:
        "Here it is tracking a real mini match: you are #4 with #9 alongside, against the CPU. Sprint, pass, charge your shot. Ninety seconds.",
    },
    intro: { tag: "Matchday", blurb: "Floodlights, VAR and a 2v2 match." },
    modes: {
      night: {
        bg: "#08130e",
        surface: "#0f1f17",
        surface2: "#16291f",
        line: "#3a6150",
        ink: "#eef3ea",
        muted: "#a7bcae",
        pitchA: "#103020",
        pitchB: "#143826",
        chalk: "#cfe0d4",
        shadow: "#020604",
        blue: "#8fb0d9",
        red: "#e5432f",
        green: "#6fd08c",
        accent: "#f5d547",
        onAccent: "#0b1610",
        accentText: "#f5d547",
        liveBg: "#e5432f",
        liveInk: "#ffffff",
        stage: stripes("90deg", "#103020", "#143826", 64),
        formation: stripes("0deg", "#103020", "#143826", 56),
        shirt: FOOTBALL_SHIRT,
        shell: FOOTBALL_SHELL,
      },
      day: {
        bg: "#eef2e8",
        surface: "#ffffff",
        surface2: "#e1e9da",
        line: "#0d1f16",
        ink: "#0d1f16",
        muted: "#43574a",
        pitchA: "#3f8a50",
        pitchB: "#47965a",
        chalk: "#f4f8f1",
        shadow: "#0d1f16",
        blue: "#8fb0d9",
        red: "#d23a2a",
        green: "#1f7a3c",
        accent: "#f5d547",
        onAccent: "#0b1610",
        accentText: "#7a5f00",
        liveBg: "#d23a2a",
        liveInk: "#ffffff",
        stage: stripes("90deg", "#3f8a50", "#47965a", 64),
        formation: stripes("0deg", "#3f8a50", "#47965a", 56),
        shirt: FOOTBALL_SHIRT,
        shell: FOOTBALL_SHELL,
      },
    },
  },

  gp: {
    id: "gp",
    name: "Grand Prix",
    swatch: "#c8102e",
    fonts: { display: "Titillium Web", label: "Silkscreen", scale: 0.92 },
    gear: "helmet",
    scorebug: { live: "Live", home: "VA", score: "P1", away: "Lap 6/6" },
    hero: {
      kicker: "Race day · Live from Bengaluru",
      cam: "Onboard · car 4",
      cta: "Watch onboards",
      box: "driver 0.99",
      prop: {
        shape: "tyre",
        a: "#16161a",
        b: "#c8102e",
        c: "#ffffff",
        label: "Spin the tyre",
        hint: "tap the tyre",
      },
    },
    assistant: "Race Engineer",
    voice:
      "a calm Grand Prix race engineer on team radio, short and clipped; at most one racing term",
    talk: "Pit radio",
    review: { word: "Review", check: "Stewards: no further action" },
    footerKicker: "Chequered flag · post-race interview",
    sections: {
      lineup: {
        kicker: "01 · Garage",
        title: "Starting grid",
        sub: "11 cars",
        bench: "Reserve drivers",
        layout: "grid",
      },
      timeline: { kicker: "02 · Race history", title: "Career laps" },
      highlights: {
        kicker: "03 · Highlights",
        title: "Overtakes & steward reviews",
      },
      offpitch: { kicker: "04 · Off track", title: "Driver fitness" },
      pundit: { kicker: "05 · Pit wall" },
    },
    tags: {
      "Kick-off": "Lights out",
      "Sub on": "Driver change",
      Goal: "Race win",
      Promoted: "Race seat",
    },
    theme: ["Night race", "Day race"],
    topLabel: "Race win of the season",
    featured: "sports",
    game: {
      id: "race",
      kicker: "Race of the day",
      start: "Lights out",
      blurb:
        "It works on any sport, so here it is tracking a Grand Prix. You start last in car 4: steer past seven rivals, brake when it gets tight and use DRS three times. Three laps.",
    },
    intro: { tag: "Race day", blurb: "Helmet on, lights out, three laps." },
    modes: {
      night: {
        bg: "#0e0e12",
        surface: "#17171d",
        surface2: "#202029",
        line: "#3a3a46",
        ink: "#f4f4f6",
        muted: "#b4b4c0",
        pitchA: "#3a3a40",
        pitchB: "#34343a",
        chalk: "#ffffff",
        shadow: "#000000",
        blue: "#f4f4f6",
        red: "#e10600",
        green: "#ffd400",
        accent: "#e10600",
        onAccent: "#ffffff",
        accentText: "#ff4d42",
        liveBg: "#ffd400",
        liveInk: "#0e0e12",
        stage: GP_STAGE,
        formation: GP_FORMATION,
        shirt: {
          bg: "#e10600",
          ink: "#ffffff",
          line: "#000000",
          radius: "0",
          tagBg: "#f4f4f6",
          tagInk: "#0e0e12",
        },
        shell: {
          body: "#202029",
          bezel: "#0e0e12",
          bezelInk: "#b4b4c0",
          ink: "#f4f4f6",
          btn: "#e10600",
          btnInk: "#ffffff",
          dpad: "#0e0e12",
          pill: "#3a3a46",
          grille: "#3a3a46",
        },
      },
      day: {
        bg: "#f4f4f1",
        surface: "#ffffff",
        surface2: "#e7e7e2",
        line: "#15151a",
        ink: "#15151a",
        muted: "#4b4b55",
        pitchA: "#3a3a40",
        pitchB: "#34343a",
        chalk: "#ffffff",
        shadow: "#15151a",
        blue: "#15151a",
        red: "#c8102e",
        green: "#1f7a3c",
        accent: "#c8102e",
        onAccent: "#ffffff",
        accentText: "#b00d28",
        liveBg: "#c8102e",
        liveInk: "#ffffff",
        stage: GP_STAGE,
        formation: GP_FORMATION,
        shirt: {
          bg: "#ffffff",
          ink: "#c8102e",
          line: "#15151a",
          radius: "0",
          tagBg: "#15151a",
          tagInk: "#ffffff",
        },
        shell: {
          body: "#c8102e",
          bezel: "#16161a",
          bezelInk: "#ffd9d4",
          ink: "#ffffff",
          btn: "#ffffff",
          btnInk: "#c8102e",
          dpad: "#16161a",
          pill: "#8a0a1f",
          grille: "#8a0a1f",
        },
      },
    },
  },

  gaming: {
    id: "gaming",
    name: "Gaming",
    swatch: "#9fa2ad",
    fonts: { display: "Orbitron", label: "Silkscreen", scale: 0.6 },
    gear: "headset",
    scorebug: { live: "1P", home: "VA", score: "LV 6", away: "0 bugs" },
    hero: {
      kicker: "Player 1 · Press start",
      cam: "Player 1",
      cta: "Press start",
      box: "player 1 · 0.99",
      prop: {
        shape: "coin",
        a: "#ffd43b",
        b: "#b8860b",
        c: "#fff3b0",
        label: "Grab the coin",
        hint: "tap the coin",
      },
    },
    assistant: "Guide",
    voice:
      "a friendly in-game guide character in a video game; at most one light gaming reference",
    talk: "Cutscene",
    review: { word: "Aim assist", check: "Achievement unlocked" },
    footerKicker: "Game over · continue?",
    sections: {
      lineup: {
        kicker: "01 · Party",
        title: "Character select",
        sub: "11 unlocked",
        bench: "Inventory",
        layout: "select",
      },
      timeline: { kicker: "02 · Save file", title: "Story so far" },
      highlights: { kicker: "03 · Trophies", title: "Boss fights & replays" },
      offpitch: { kicker: "04 · Side quests", title: "Real-life stats" },
      pundit: { kicker: "05 · Strategy guide" },
    },
    tags: {
      "Kick-off": "New game",
      "Sub on": "Party member",
      Goal: "Boss beaten",
      Promoted: "Level up",
    },
    theme: ["Lights off", "Lights on"],
    topLabel: "Main quest",
    featured: "snake",
    game: {
      id: "snake",
      kicker: "Game of the day",
      start: "Press start",
      blurb:
        "Watch the bot play, then press start and take over: arrows or WASD to steer, and try to beat its score.",
    },
    intro: {
      tag: "Press start",
      blurb: "Boss fights and Snake against the bot.",
    },
    modes: {
      night: {
        bg: "#0d0e13",
        surface: "#16171f",
        surface2: "#1e2029",
        line: "#3b3f52",
        ink: "#e8eaf2",
        muted: "#a3a8bd",
        pitchA: "#14151d",
        pitchB: "#191a24",
        chalk: "#4a5170",
        shadow: "#000000",
        blue: "#5b84ff",
        red: "#ff4d8d",
        green: "#39c26a",
        accent: "#5b84ff",
        onAccent: "#0d0e13",
        accentText: "#8aa6ff",
        liveBg: "#ff4d8d",
        liveInk: "#0d0e13",
        stage: GAMING_STAGE,
        formation: GAMING_FORMATION,
        shirt: {
          bg: "#5b84ff",
          ink: "#0d0e13",
          line: "#e8eaf2",
          radius: "50%",
          tagBg: "#e8eaf2",
          tagInk: "#0d0e13",
        },
        shell: {
          body: "#1c1d24",
          bezel: "#0d0e13",
          bezelInk: "#a3a8bd",
          ink: "#e8eaf2",
          btn: "#5b84ff",
          btnInk: "#0d0e13",
          dpad: "#0d0e13",
          pill: "#3b3f52",
          grille: "#3b3f52",
        },
      },
      day: {
        bg: "#c3c4c9",
        surface: "#d9dade",
        surface2: "#b0b2b9",
        line: "#22232b",
        ink: "#15161c",
        muted: "#3a3c46",
        pitchA: "#14151d",
        pitchB: "#191a24",
        chalk: "#4a5170",
        shadow: "#22232b",
        blue: "#2346b8",
        red: "#d6336c",
        green: "#2b8a3e",
        accent: "#2346b8",
        onAccent: "#ffffff",
        accentText: "#1d3a9e",
        liveBg: "#d6336c",
        liveInk: "#ffffff",
        stage: GAMING_STAGE,
        formation: GAMING_FORMATION,
        shirt: {
          bg: "#2346b8",
          ink: "#ffffff",
          line: "#15161c",
          radius: "50%",
          tagBg: "#15161c",
          tagInk: "#e8ecff",
        },
        shell: {
          body: "#b9bac1",
          bezel: "#2a2b33",
          bezelInk: "#c8cde6",
          ink: "#15161c",
          btn: "#2346b8",
          btnInk: "#ffffff",
          dpad: "#2a2b33",
          pill: "#8c8e98",
          grille: "#8c8e98",
        },
      },
    },
  },

  run: {
    id: "run",
    name: "Running",
    swatch: "#1d4fbf",
    fonts: { display: "Anton", label: "Silkscreen", scale: 1 },
    gear: "headband",
    scorebug: { live: "Live", home: "VA", score: "21.1 km", away: "≈2:16" },
    hero: {
      kicker: "Race day · Bengaluru half marathon",
      cam: "Cam 4 · km 21",
      cta: "See the splits",
      box: "runner #4 · 0.99",
      prop: {
        shape: "bottle",
        a: "#7fd3ff",
        b: "#1d4fbf",
        c: "#ffffff",
        label: "Grab the water",
        hint: "tap the bottle",
      },
    },
    assistant: "Coach",
    voice:
      "an upbeat running coach at the finish line; at most one running reference",
    talk: "Halfway split",
    review: { word: "Chip timing", check: "Chip time verified" },
    footerKicker: "Finish line · cool-down",
    sections: {
      lineup: {
        kicker: "01 · Start line",
        title: "Start corrals",
        sub: "11 runners",
        bench: "Waitlist",
        layout: "corrals",
      },
      timeline: { kicker: "02 · Splits", title: "Career splits" },
      highlights: { kicker: "03 · Highlights", title: "PBs & photo finishes" },
      offpitch: { kicker: "04 · Cross-training", title: "Race day" },
      pundit: { kicker: "05 · Coach's corner" },
    },
    tags: {
      "Kick-off": "Start gun",
      "Sub on": "Joined pack",
      Goal: "PB",
      Promoted: "Pace group",
    },
    theme: ["Night run", "Morning run"],
    topLabel: "Season PB",
    featured: "pacecoach",
    game: {
      id: "pace",
      kicker: "Run of the day",
      start: "Start gun",
      blurb:
        "Now hold its plan: 6:20 per km for a half marathon. Alternate left and right (A and B on a phone) to run, change lanes to get past, grab water at km 7 and 14. Every km is scored on pace, too fast or too slow.",
    },
    intro: {
      tag: "21.1 km",
      blurb: "Splits, race bibs and a PaceCoach pace run.",
    },
    modes: {
      night: {
        bg: "#1d4fbf",
        surface: "#2459cf",
        surface2: "#1a46aa",
        line: "#0b2a6b",
        ink: "#ffffff",
        muted: "#dbe6ff",
        pitchA: "#1747a6",
        pitchB: "#1a4db3",
        chalk: "#ffffff",
        shadow: "#0b2a6b",
        blue: "#d8ff3a",
        red: "#ff6b6b",
        green: "#d8ff3a",
        accent: "#d8ff3a",
        onAccent: "#0b2a6b",
        accentText: "#d8ff3a",
        liveBg: "#ffffff",
        liveInk: "#1d4fbf",
        stage: RUN_STAGE,
        formation:
          "repeating-linear-gradient(0deg, #1747a6 0px, #1747a6 53px, #ffffff 53px, #ffffff 56px)",
        shirt: {
          bg: "#ffffff",
          ink: "#0b2a6b",
          line: "#0b2a6b",
          radius: "4px",
          tagBg: "#0b2a6b",
          tagInk: "#ffffff",
        },
        shell: {
          body: "#1d4fbf",
          bezel: "#0b2a6b",
          bezelInk: "#dbe6ff",
          ink: "#ffffff",
          btn: "#d8ff3a",
          btnInk: "#0b2a6b",
          dpad: "#0b2a6b",
          pill: "#1747a6",
          grille: "#1747a6",
        },
      },
      day: {
        bg: "#f2f5fb",
        surface: "#ffffff",
        surface2: "#e2e9f7",
        line: "#0b2a6b",
        ink: "#0b2a6b",
        muted: "#3f557f",
        pitchA: "#1d4fbf",
        pitchB: "#2459cf",
        chalk: "#ffffff",
        shadow: "#0b2a6b",
        blue: "#1d4fbf",
        red: "#d9363e",
        green: "#2b8a3e",
        accent: "#d8ff3a",
        onAccent: "#0b2a6b",
        accentText: "#1d4fbf",
        liveBg: "#1d4fbf",
        liveInk: "#ffffff",
        stage: RUN_STAGE,
        formation:
          "repeating-linear-gradient(0deg, #2459cf 0px, #2459cf 53px, #ffffff 53px, #ffffff 56px)",
        shirt: {
          bg: "#ffffff",
          ink: "#0b2a6b",
          line: "#0b2a6b",
          radius: "4px",
          tagBg: "#0b2a6b",
          tagInk: "#ffffff",
        },
        shell: {
          body: "#1d4fbf",
          bezel: "#0b2a6b",
          bezelInk: "#dbe6ff",
          ink: "#ffffff",
          btn: "#d8ff3a",
          btnInk: "#0b2a6b",
          dpad: "#0b2a6b",
          pill: "#1747a6",
          grille: "#1747a6",
        },
      },
    },
  },

  ai: {
    id: "ai",
    name: "AI",
    swatch: "#2de2e6",
    fonts: { display: "Chakra Petch", label: "Share Tech Mono", scale: 0.86 },
    gear: "visor",
    scorebug: { live: "Online", home: "VA", score: "acc 0.99", away: "0 bugs" },
    hero: {
      kicker: "Boot sequence · node: bengaluru",
      cam: "cam://node-01",
      cta: "Run inference",
      box: "human 0.99 · cyborg 0.01",
      prop: {
        shape: "cube",
        a: "#2de2e6",
        b: "#ff2a6d",
        c: "#ffffff",
        label: "Ping the cube",
        hint: "tap the cube",
      },
    },
    assistant: "Agent",
    voice:
      "a precise AI agent answering in a terminal, dry and exact; at most one machine-learning reference",
    talk: "System prompt",
    review: { word: "Inference", check: "Eval passed" },
    footerKicker: "EOF · end of stream",
    sections: {
      lineup: {
        kicker: "01 · Model card",
        title: "Architecture",
        sub: "11 neurons",
        bench: "Fine-tuning pool",
        layout: "network",
      },
      timeline: { kicker: "02 · Training log", title: "Career epochs" },
      highlights: { kicker: "03 · Benchmarks", title: "Evals & ablations" },
      offpitch: { kicker: "04 · Offline", title: "Human mode" },
      pundit: { kicker: "05 · Terminal" },
    },
    tags: {
      "Kick-off": "Init",
      "Sub on": "New data",
      Goal: "Release",
      Promoted: "To prod",
    },
    theme: ["Dark mode", "Light mode"],
    topLabel: "Flagship model",
    featured: "retrain",
    game: {
      id: "label",
      kicker: "Eval of the day",
      start: "Run batch",
      blurb:
        "Its in-house annotation tool feeds the pipeline, so here you are the annotator. MLCC chips roll through the scan zone: label crack (A) or clean (B) before the model guesses. Every 8 labels it retrains and speeds up.",
    },
    intro: { tag: "Boot sequence", blurb: "Neon, evals and Label Rush." },
    modes: {
      night: {
        bg: "#0a0614",
        surface: "#140c26",
        surface2: "#1d1236",
        line: "#4b2d8a",
        ink: "#efeaff",
        muted: "#b2a8dc",
        pitchA: "#120a24",
        pitchB: "#160d2c",
        chalk: "#7a4dff",
        shadow: "#ff2a6d",
        blue: "#2de2e6",
        red: "#ff2a6d",
        green: "#2de2e6",
        accent: "#2de2e6",
        onAccent: "#0a0614",
        accentText: "#2de2e6",
        liveBg: "#ff2a6d",
        liveInk: "#0a0614",
        stage: `${AI_GRID("33", 32)}, radial-gradient(ellipse at 50% 80%, #2a1450 0%, #0a0614 70%)`,
        formation: `${AI_GRID("33", 28)}, #120a24`,
        shirt: {
          bg: "#0a0614",
          ink: "#2de2e6",
          line: "#2de2e6",
          radius: "0",
          tagBg: "#ff2a6d",
          tagInk: "#0a0614",
        },
        shell: {
          body: "#140c26",
          bezel: "#0a0614",
          bezelInk: "#b2a8dc",
          ink: "#efeaff",
          btn: "#2de2e6",
          btnInk: "#0a0614",
          dpad: "#2a1d4d",
          pill: "#ff2a6d",
          grille: "#4b2d8a",
        },
      },
      day: {
        bg: "#f5f3fb",
        surface: "#ffffff",
        surface2: "#ebe6f8",
        line: "#2a1a55",
        ink: "#140c26",
        muted: "#4d4370",
        pitchA: "#ece8f7",
        pitchB: "#e4def5",
        chalk: "#7a4dff",
        shadow: "#ff2a6d",
        blue: "#0f8f94",
        red: "#d81b60",
        green: "#0f8f94",
        accent: "#2de2e6",
        onAccent: "#140c26",
        accentText: "#6a2cd8",
        liveBg: "#ff2a6d",
        liveInk: "#140c26",
        stage: `${AI_GRID("26", 32)}, radial-gradient(ellipse at 50% 80%, #e3d9ff 0%, #f5f3fb 70%)`,
        formation: `${AI_GRID("1f", 28)}, #f5f3fb`,
        shirt: {
          bg: "#ffffff",
          ink: "#6a2cd8",
          line: "#2a1a55",
          radius: "0",
          tagBg: "#140c26",
          tagInk: "#2de2e6",
        },
        shell: {
          body: "#ebe6f8",
          bezel: "#140c26",
          bezelInk: "#b2a8dc",
          ink: "#140c26",
          btn: "#2de2e6",
          btnInk: "#140c26",
          dpad: "#2a1a55",
          pill: "#ff2a6d",
          grille: "#b2a8dc",
        },
      },
    },
  },
};

export function isWorldId(v: unknown): v is WorldId {
  return typeof v === "string" && (WORLD_IDS as readonly string[]).includes(v);
}

/** "90+4'" → 94, "ET 102'" → 102. */
export function parseMinute(min: string): number {
  return min
    .replace(/[^0-9+]/g, "")
    .split("+")
    .filter(Boolean)
    .reduce((a, b) => a + Number(b), 0);
}

const RACE_LAPS = 58;
const HALF_KM = 21.1;

/**
 * A match minute in the world's unit. Stoppage and extra time land on the last lap / the finish line
 * instead of running past the race.
 */
export function worldMinute(world: WorldId, min: string): string {
  const m = parseMinute(min);
  switch (world) {
    case "gp":
      return `L${m === 0 ? 1 : Math.min(RACE_LAPS, Math.round((m / 90) * (RACE_LAPS - 1)) + 1)}`;
    case "gaming":
      return `Lv ${1 + Math.floor(m / 6)}`;
    case "run":
      return `km ${Math.min(HALF_KM, (m / 90) * HALF_KM).toFixed(1)}`;
    case "ai":
      return `ep ${m}`;
    default:
      return min;
  }
}

export function palette(world: WorldId, mode: Mode): Palette {
  return WORLDS[world].modes[mode];
}
