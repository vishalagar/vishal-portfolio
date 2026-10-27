# Vishal Agarwal · Live Coverage

Portfolio site styled as a live football broadcast. Every project card is a playable demo: a 2v2 football match, Snake, a self-retraining model, a diffusion-style image generator, PrintSafe's encrypt-print-shred flow, and an "Ask the Pundit" chat grounded in Vishal's resume.

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # unit tests
npm run test:e2e   # Playwright (run `npx playwright install chromium` once)
```

Environment variables are optional; see `.env.example`. Project conventions and architecture: `CLAUDE.md`. Full design spec: `tasks/portfolio-spec/`.
