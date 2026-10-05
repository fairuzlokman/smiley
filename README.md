# Smile Score

A small full-stack app: register, upload a photo, get a **smile score** from 0 to 100.

Built with Next.js 16 (App Router, TypeScript, Tailwind v4), SQLite/Turso via Drizzle, Vercel Blob for images, and `@vladmandic/face-api` running server-side on the TensorFlow.js WASM backend.

## Quick start

Requires **Node 22** (TensorFlow.js does not support Node 23+). An `.nvmrc` is included.

```bash
npm install
cp .env.example .env.local      # then set JWT_SECRET (openssl rand -base64 48)
npm run db:migrate              # creates local.db with the schema
npm run dev                     # http://localhost:3000
```

That is enough to run everything locally: the database is a SQLite file and, when no
`BLOB_READ_WRITE_TOKEN` is set, uploads are written to `public/uploads/` (development only).

```bash
npm test          # unit + integration tests (in-memory SQLite, analyzer/storage mocked)
npm run lint
npm run typecheck
npm run analyze path/to/photo.jpg   # run the real analyzer on an image from the CLI
```

## How it works

```
Browser ──(multipart POST /api/uploads)──▶ Route handler (Node runtime)
                                             1. auth: verify the JWT session cookie
                                             2. validate the file (jpeg/png/webp, ≤ 4 MB)
                                             3. SmileAnalyzer.analyze(buffer)   ← face-api (WASM) + sharp
                                             4. ImageStorage.upload(buffer)     ← Vercel Blob → public URL
                                             5. insert into `uploads`           ← Drizzle → SQLite/Turso
                                             6. 201 { upload: { score, label, imageUrl, … } }
```

The image is analyzed **before** it is stored, so a photo with no face never reaches
storage or the database (the API answers `422`).

**Scoring.** face-api returns seven expression probabilities. The score is the `happy`
probability × 100, rounded. If several faces are detected, the largest one is scored.
Labels: 0–20 *Not smiling*, 21–50 *Hint of a smile*, 51–80 *Smiling*, 81–100 *Big smile*.
This lives in `src/lib/smile/score.ts` as pure functions and is fully unit tested.

### Project layout

```
src/
  app/                         pages (Server Components) and route handlers
    (auth)/login, register     auth pages
    dashboard/                 upload + history (requires session)
    api/auth/*                 register / login / logout
    api/uploads                POST upload+score, GET history
  components/                  UI; only AuthForm, UploadForm, Dashboard, LogoutButton are client components
    ui/                        Button, Field, Card, Alert primitives (token-based)
  db/                          Drizzle schema, client, migration runner
  lib/
    auth/                      password hashing (bcryptjs), JWT sessions (jose), auth use-cases
    smile/                     SmileAnalyzer interface, pure scoring, face-api implementation
    storage/                   ImageStorage interface, Vercel Blob + local-disk implementations
    repositories/              the only place SQL queries live
    validation/                zod schemas shared by API and forms
  proxy.ts                     redirects: /dashboard needs a session, /login and /register must not have one
drizzle/                       generated SQL migrations (committed)
weights/                       face-api model weights (tiny face detector + expression net, ~520 KB)
tests/unit, tests/integration  Vitest
design-system/smile-score/     design direction generated with the ui-ux-pro-max skill
```

### Key decisions

| Area | Choice | Why |
|---|---|---|
| Database | Turso (libSQL) + Drizzle | Same code for a local file, in-memory tests and a hosted DB. No server to run, no binary downloads for tests. |
| Images | Vercel Blob | First-party on Vercel, free tier, returns a CDN URL. Behind an `ImageStorage` interface; a local-disk implementation is used in dev without a token. |
| Analysis | Server-side, WASM backend | The score is computed where it can't be tampered with and can be integration-tested. The WASM build needs no native `tfjs-node`/`canvas`, so it deploys on Vercel. Cold start ≈ 1–3 s, then ≈ 100–300 ms per image. |
| Auth | bcryptjs + JWT in an httpOnly cookie | Small and explicit. `proxy.ts` only verifies the signature (edge-safe); pages and routes re-check it. |
| API style | Route handlers, not Server Actions | Keeps upload/auth as an explicit HTTP contract that is curl-able and tested directly. |
| Tests | Vitest unit + route-handler integration | Handlers are called as plain functions with real `Request` objects against in-memory SQLite with the real migrations. The analyzer and storage are mocked, so tests need no network and run in about a second. |

### UI

Tokens live in `src/app/globals.css` (Tailwind v4 `@theme`); components never use raw hex.
The palette, fonts and checklist came from the `ui-ux-pro-max` skill
(`design-system/smile-score/MASTER.md`), with one change: primary buttons use the blue accent
because white text on the orange primary does not reach 4.5:1 contrast. Forms have visible
labels, blur validation, inline errors wired with `aria-describedby`, loading states with
`aria-busy`, and keyboard-visible focus. Motion respects `prefers-reduced-motion`.

## Deploying to Vercel

1. Push the repo and import it in Vercel. Set the project's Node.js version to **22.x**.
2. **Storage → Blob**: create a store and connect it; this injects `BLOB_READ_WRITE_TOKEN`.
3. **Marketplace → Turso**: create a database and connect it; this injects
   `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`.
4. Add `JWT_SECRET` (≥ 32 random characters).
5. Apply the schema once against the hosted database:
   `TURSO_DATABASE_URL=libsql://… TURSO_AUTH_TOKEN=… npm run db:migrate`
6. Deploy. `next.config.ts` marks face-api/TensorFlow/sharp as external and traces the
   `weights/` folder and the `.wasm` binaries into the `/api/uploads` function.

## Assumptions

- "Smile score" = probability of the *happy* expression. It is a confidence, not a measure of smile width.
- One score per photo; with several faces the most prominent (largest) face is used.
- Uploads are capped at 4 MB because Vercel functions reject bodies over 4.5 MB.
- Email + password only, no verification or password reset. Passwords need 8+ characters.
- Light theme only.

## Next steps

- Upload directly from the browser to Blob (`@vercel/blob` client upload) to lift the 4 MB cap and keep large bodies off the function.
- `@vladmandic/face-api` was archived in Feb 2025; its successor `@vladmandic/human` is a drop-in candidate behind the same `SmileAnalyzer` interface.
- Delete uploads (DB row + Blob), rate limiting on `/api/uploads`, and a Playwright happy-path test.

See `NOTES.md` for what I would do differently with more time.
