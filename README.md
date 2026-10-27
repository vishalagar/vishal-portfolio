# Vishal Agarwal · Live Coverage

Portfolio site where every project card is a playable demo. Visitors pick one of five worlds (Football, Grand Prix, Gaming, Running, AI), each with its own look, sound, game and costume for the pixel sprite. Demos include a 2v2 football match, a race, Snake, a pace run, Label Rush, a self-retraining model, a diffusion-style image generator, PrintSafe's encrypt-print-shred flow, and "Ask the Pundit", an OpenAI chat grounded in Vishal's resume and voiced per world.

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # unit tests
npm run test:e2e   # Playwright (run `npx playwright install chromium` once)
```

Environment variables are optional; see `.env.example`. Project conventions and architecture: `CLAUDE.md`. Design specs: `tasks/portfolio-spec/` and `tasks/worlds-spec/`. Analytics (PostHog through `/relay`, Vercel) and what the Pundit knows: `tasks/portfolio-spec/09-analytics-and-pundit-ai.md`.
