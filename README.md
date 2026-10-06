# Smile Score

A Next.js app: **register → upload a photo → get a smile score from 0 to 100.**

## Run locally

Requires **Node 22** (`.nvmrc` included). Create `.env.local` with `JWT_SECRET=` (32+ chars, e.g. `openssl rand -base64 48`), then:

```bash
npm install
npm run db:migrate   # creates local.db
npm run dev          # http://localhost:3000
npm test             # unit + integration tests
```

Without `BLOB_STORE_ID`, uploads are saved to `public/uploads/` in development.

## Architecture

| Layer | Choice | Why |
|---|---|---|
| App | Next.js 16 App Router, React 19, TypeScript, Tailwind v4 | One deployable for UI and API |
| Database | SQLite / Turso via Drizzle | Same code for a local file, in-memory tests and hosted DB |
| Images | Vercel Blob | First-party on Vercel, returns a CDN URL |
| Smile analysis | `@vladmandic/face-api` (WASM) + `sharp`, on the server | Score can't be tampered with; no native build needed |
| Auth | bcryptjs + JWT (`jose`) in an httpOnly cookie | Small and explicit |

**Upload flow** (`POST /api/uploads`): check session → validate file (JPG/PNG/WebP, ≤ 4 MB) → analyze → store in Blob → save row → return score.
The photo is analyzed **before** it is stored, so a photo with no face is never saved (422).

**Score** = the model's `happy` probability × 100. Labels: 0–20 *Not smiling*, 21–50 *Hint of a smile*, 51–80 *Smiling*, 81–100 *Big smile*.

**Next.js:** Server Components load data (`dashboard/page.tsx`), Client Components only for interaction (forms, upload),
Route Handlers are the API (`src/app/api`), and `src/proxy.ts` (Next 16's middleware) redirects based on the session.

**Tests:** unit tests for scoring, auth and validation; integration tests call the route handlers against an in-memory DB with the face model and storage mocked.

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

### What I would do differently with more time

- **Background analysis:** run the face model in a background job instead of inside the upload request.
- **Maintained model:** use `@vladmandic/human` instead of the archived face-api.
- **Operations:** logging, error reporting and a health check that confirms the model loads.
