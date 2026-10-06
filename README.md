# Smile Score

A Next.js app: **register → upload a photo → get a smile score from 0 to 100, plus a short tip from an AI coach.**

## Run locally

Requires **Node 22** (`.nvmrc` included). Create `.env.local` with `JWT_SECRET=` (32+ chars, e.g. `openssl rand -base64 48`), then:

```bash
npm install
npm run db:migrate   # creates local.db
npm run dev          # http://localhost:3000
npm test             # unit + integration tests
```

Without `BLOB_STORE_ID`, uploads are saved to `public/uploads/` in development.

**Smile coach (optional):** add `GEMINI_API_KEY=` to `.env.local` (free key from [Google AI Studio](https://aistudio.google.com/apikey)).
Without it the app works the same, just without coach feedback. After editing the tips in `src/lib/coach/tips.ts`, run
`npm run tips:embed` to refresh `tips-embeddings.json` (committed, so this is not needed on a fresh clone).

## Architecture

| Layer | Choice | Why |
|---|---|---|
| App | Next.js 16 App Router, React 19, TypeScript, Tailwind v4 | One deployable for UI and API |
| Database | SQLite / Turso via Drizzle | Same code for a local file, in-memory tests and hosted DB |
| Images | Vercel Blob | First-party on Vercel, returns a CDN URL |
| Smile analysis | `@vladmandic/face-api` (WASM) + `sharp`, on the server | Score can't be tampered with; no native build needed |
| Auth | bcryptjs + JWT (`jose`) in an httpOnly cookie | Small and explicit |
| Smile coach | Gemini (`@google/genai`) + retrieval over 15 hand-written tips | Grounded, cheap feedback; optional |

**Upload flow** (`POST /api/uploads`): check session → validate file (JPG/PNG/WebP, ≤ 4 MB) → analyze → store in Blob → coach feedback → save row → return score.
The photo is analyzed **before** it is stored, so a photo with no face is never saved (422).

**Score** = the model's `happy` probability × 100. Labels: 0–20 *Not smiling*, 21–50 *Hint of a smile*, 51–80 *Smiling*, 81–100 *Big smile*.

## Smile coach (LLM + RAG)

face-api gives the number; an LLM turns it into one or two sentences of advice. Each tool does what it is best at:
the local model is free and consistent, the LLM is good at language.

```
1. Once, offline   15 tips ──► Gemini embeddings (256 numbers each) ──► tips-embeddings.json   (npm run tips:embed)
2. Per upload      result ──► a question, e.g. "How do I go from a serious face to a natural smile…?" ──► embed it
3. Retrieve        cosine similarity against the 15 tip vectors ──► top 3 tips
4. Generate        fixed instructions + score + the 3 tips ──► Gemini Flash-Lite ──► saved on the upload row
```

Code: `src/lib/coach/` — `retrieval.ts` (cosine + top-k, no API calls), `prompt.ts` (system prompt, query and message builders),
`index.ts` (`generateCoachFeedback`).

**Grounding:** the model is told to use only the retrieved tips, so advice comes from our knowledge base, not from guesses.
I checked retrieval on sample results and rewrote the query as the question a user would ask, which fixed irrelevant matches.

**Cost and performance**
- Tips are embedded once and committed; per upload there is one short embedding and one short generation (~250 input, ~35 output tokens, ~1.5 s).
- Feedback is saved with the upload and never regenerated; page reloads cost nothing.
- Only numbers are sent, never the photo, and only the top 3 tips, not all 15.
- Small vectors (256 dims), minimal thinking and a 300-token output cap.
- Rejected photos (no face, bad file) never reach the LLM.
- The fixed instructions come first, so provider-side prompt caching can reuse them (our prompt is below the size where that kicks in today).
- Token usage is logged per call (`Coach tokens:` in the server log).

**Reliability:** the coach is optional. If the key is missing or Gemini fails, the error is logged, `coach` is null and the upload still succeeds.

**Limits:** search is brute force (fine for 15 tips; a vector index such as Turso's at scale), the call adds ~1.5 s to the upload,
and the Gemini free tier may use prompts to improve Google's models (only scores are sent).

**Next.js:** Server Components load data (`dashboard/page.tsx`), Client Components only for interaction (forms, upload),
Route Handlers are the API (`src/app/api`), and `src/proxy.ts` (Next 16's middleware) redirects based on the session.

**Tests:** unit tests for scoring, auth, validation, coach retrieval and prompt building; integration tests call the route handlers against an in-memory DB with the face model, storage and coach mocked (including "coach fails → upload still succeeds").

## Assumptions

- Smile score = the model's confidence that the face is *happy*, not the size of the smile.
- With several faces, the largest face is scored.
- Uploads are capped at 4 MB (Vercel rejects request bodies over 4.5 MB).
- Email + password only; no email verification or password reset.

## Next steps

- Delete uploads (DB row + Blob file).
- Rate limiting on login and upload.
- Access + refresh tokens so sessions can be revoked.
- Upload directly from the browser to Blob to remove the 4 MB limit.
- One Playwright test: register → upload → see score.
- Generate the coach feedback in the background (or stream it) so the score appears without waiting for the LLM.
- A small retrieval eval set (result → expected tips) so changes to tips or query text are measured, not eyeballed.

### What I would do differently with more time

- **Background analysis:** run the face model in a background job instead of inside the upload request.
- **Maintained model:** use `@vladmandic/human` instead of the archived face-api.
- **Operations:** logging, error reporting and a health check that confirms the model loads.
