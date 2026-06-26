# Einbürgerungstest Trainer

An adaptive, bilingual (DE + EN) trainer for the German citizenship test, built to
exercise the Vercel platform. Features a Leitner-based adaptive review queue and a
fact-bounded **AI tutor** (via Vercel AI Gateway).

> ⚠️ **Sample data only.** This repo ships a handful of clearly-marked sample
> questions so the app runs end-to-end. The full, verified official BAMF catalogue
> (300 general + 16×10 state questions) must be imported before using this for real
> exam prep. Never fabricate official questions or answers.

## Run locally

```bash
npm install
npm run dev   # http://localhost:3000
```

The app runs fully offline. The AI tutor returns a deterministic fact-only fallback
until an AI Gateway key is configured (see below).

## Features

- **Üben / Practice** — immediate feedback + "Explain" tutor on every question.
- **Prüfung / Mock exam** — official format (30 general + 3 state, pass 17/33, 60 min);
  with sample data it scales the count, time, and pass mark proportionally.
- **Wiederholen / Review** — adaptive Leitner queue, weakest questions first.
- **Bundesland selector** — explicit choice (geo is only ever a hint, never authority).
- **Anonymous device sessions** — progress stored per-device, with a one-click reset.

## Architecture / swap seams

Everything runs locally now, with single-point seams to swap in Vercel services:

| Concern | Local today | Swap to (Vercel) |
| --- | --- | --- |
| Question data | `lib/questions.ts` (`getAllQuestions`) | Vercel Postgres (+ pgvector) |
| Device progress / SRS | `lib/store.ts` (localStorage) | Vercel KV + Postgres |
| AI tutor | `app/api/explain/route.ts` (fallback) | Vercel AI Gateway |
| Question images | none | Vercel Blob |
| Bundesland geo hint | explicit selector | Edge Middleware |

## Connect Vercel (Hobby)

1. Create a free Hobby account at vercel.com (sign in with GitHub).
2. `npx vercel link` in this folder.
3. Add an **AI Gateway** key, then set `AI_GATEWAY_API_KEY` (locally in `.env.local`,
   and in Project → Settings → Environment Variables). Copy `.env.example` to start.
4. Provision Postgres / KV / Blob from the dashboard when wiring those phases.
5. `npx vercel` to deploy a preview, `npx vercel --prod` for production.

## Roadmap (next phases)

- Import & verify the official BAMF catalogue into Postgres (+ embeddings).
- Move SRS/attempts to KV/Postgres; cache + human-verify AI explanations.
- Conversational AI examiner (`useChat` + tool calling).
- Cron (question of the day), Edge Config flags, Web Analytics + Speed Insights.
