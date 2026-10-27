/** Site-wide copy. Every fact traces to tasks/portfolio-spec/ §7. */

export const SITE = {
  name: "Vishal Agarwal",
  initials: "VA",
  role: "AI Engineer",
  employer: "Samsung Electro-Mechanics",
  city: "Bengaluru",
  title: "Vishal Agarwal · AI engineer who builds models that see",
  description:
    "Vishal Agarwal is an AI Engineer at Samsung Electro-Mechanics in Bengaluru. Computer vision, self-retraining ML pipelines, synthetic data, and side projects like PrintSafe.in. Every project on the site is playable.",
  email: "agarwal.vishal2003@gmail.com",
  links: {
    github: "https://github.com/vishalagar",
    linkedin: "https://www.linkedin.com/in/vishal-agarwal123/",
    printsafe: "https://printsafe.in",
  },
  /** Drop the PDF at public/resume.pdf (phone number removed) and the button appears. */
  resumePath: "/resume.pdf",
} as const;

/** Header scorebug. The "6 – 0 bugs" joke is the approved mock wording; see the open decision in the spec §10.1. */
export const SCOREBUG = { live: "Live", home: "VA", score: "6 – 0", away: "Bugs" } as const;

export const NAV = [
  { href: "#lineup", label: "Line-up" },
  { href: "#timeline", label: "Timeline" },
  { href: "#highlights", label: "Highlights" },
  { href: "#pundit", label: "Pundit" },
  { href: "#fulltime", label: "Contact" },
] as const;

export const TICKER = [
  "Sports Detection ships in extra time",
  "PrintSafe.in passes 500+ visits",
  "Half marathon done: 21.097 km",
  "Promoted: ML Intern to AI Engineer, Samsung E-M",
  "Capstone mAP@0.5 up from 0.734 to 0.812",
] as const;

export const HERO = {
  kicker: "Matchday · Live from Bengaluru",
  title: "AI engineer.",
  titleAccent: "Builds models that see.",
  intro:
    "I'm Vishal, an AI Engineer at Samsung Electro-Mechanics. I build vision systems that retrain themselves, and ship side projects on weekends.",
  primary: { href: "#highlights", label: "Watch highlights" },
  secondary: { href: "#pundit", label: "Ask the Pundit" },
  detection: "vishal 0.99",
} as const;

/** Half-time team talk. Words marked `accent` light up in the accent colour. */
export const TEAM_TALK: ReadonlyArray<{ word: string; accent?: boolean }> = [
  { word: "I" },
  { word: "build" },
  { word: "models" },
  { word: "that" },
  { word: "see,", accent: true },
  { word: "pipelines" },
  { word: "that" },
  { word: "retrain", accent: true },
  { word: "themselves,", accent: true },
  { word: "and" },
  { word: "products" },
  { word: "people" },
  { word: "actually" },
  { word: "use.", accent: true },
];

export const FOOTER = {
  kicker: "Full time · post-match interview",
  title: "Let's build",
  titleAccent: "something that sees.",
  copyright: "© 2026 Vishal Agarwal",
  hint: "psst — type VAR anywhere",
  privacy: "This site uses PostHog and Vercel Analytics to see how it’s used, including session replays with typed text masked. Questions sent to the Pundit are logged so I can see what people ask.",
} as const;
