# Pour Judgment 🍷

Snap a photo of a wine list, get a recommendation matched to your taste, and sound a little smarter doing it.

## What's here (MVP)

- **Onboarding** — pick wine types you like/dislike, set taste sliders (acidity, sweetness, body, tannin, oak, fizz) in plain language, optional freeform notes.
- **Capture** — take/upload a photo of a wine list.
- **Analyze** — a Vercel serverless function (`/api/analyze`) sends the photo + your taste profile straight to Claude's vision API, which reads the list and returns ranked picks with plain-language reasoning, tasting notes, and a "sound smart" talking point.
- **Feedback loop** — rate each recommendation (good / so-so / miss). Feedback is stored locally and folded into the prompt for future recommendations, so picks improve over time.

**Storage:** everything (profile + feedback history) lives in `localStorage` for now — no backend database yet. Fastest path to a working prototype. Easy to swap for real accounts + a DB (e.g. Supabase) later, which you'll want before shipping to iOS/Android since local storage won't sync across devices.

## Run it locally

```bash
npm install
npm install -g vercel   # if you don't have it
cp .env.example .env    # then add your real Anthropic API key
vercel dev
```

`vercel dev` runs both the Vite frontend and the `/api/analyze` serverless function together, so the fetch calls work exactly like production.

(Plain `npm run dev` will start the frontend only — the photo analysis call will fail since there's no API route without `vercel dev` or a deployed backend.)

## Deploy

```bash
vercel
```

Then in the Vercel dashboard → your project → Settings → Environment Variables, add:

```
ANTHROPIC_API_KEY = sk-ant-...
```

Redeploy after adding the env var.

## Next steps worth considering

- Swap localStorage for a real backend (Supabase/Postgres) once you want accounts that sync across devices — this also sets you up for the mobile app.
- React Native (Expo) is the natural next step for iOS/Android — most components and the taste-profile logic can be reused directly; the camera capture and API call are the main pieces to redo.
- Consider caching parsed wines by restaurant (e.g. keyed on a rough image hash or manually entered restaurant name) so repeat visits don't re-spend a vision API call.
- The feedback loop right now just feeds recent ratings back into the prompt as text. Once you have more data, this could evolve into adjusting the taste-profile sliders automatically based on patterns in what gets rated "miss."
