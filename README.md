# Smile Score

A small full-stack Next.js app: **register → upload a photo → get a smile score from 0 to 100.**

**Demo path:** register → dashboard → choose or drag in a photo → see the score card → the photo is added to your history.
A photo with no face gets a clear "no face found" message (HTTP 422) and is not saved.

## Run locally

Requires **Node 22** (TensorFlow.js does not support Node 23+). An `.nvmrc` is included.

```bash
npm install
# create .env.local (see below)
npm run db:migrate      # creates local.db with the schema
npm run dev             # http://localhost:3000
```

`.env.local`:

```bash
JWT_SECRET=...                 # required, 32+ chars: openssl rand -base64 48
# Optional. Defaults shown / behaviour when unset:
# TURSO_DATABASE_URL=file:local.db
# TURSO_AUTH_TOKEN=            # only for a hosted Turso database
# BLOB_STORE_ID=               # unset in dev → uploads saved to public/uploads/
```

```bash
npm test                          # unit + integration tests
npm run lint && npm run typecheck
npm run analyze <path-to-your-image>   # run the real face model on one photo
```

## Architecture

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript, Tailwind v4 |
| Database | SQLite / Turso (libSQL) via Drizzle ORM |
| Image storage | Vercel Blob (local disk fallback in development) |
| Smile analysis | `@vladmandic/face-api` on the TensorFlow.js WASM backend, images decoded with `sharp` |
| Auth | bcryptjs password hashes + JWT (`jose`) in an httpOnly cookie |
| Validation / tests | zod / Vitest |

### Upload flow

```
Browser ──(multipart POST /api/uploads)──▶ Route handler (Node runtime)
                                             1. auth: verify the JWT session cookie
                                             2. validate the file (jpeg/png/webp, ≤ 4 MB)
                                             3. analyze the image   ← face-api (WASM) + sharp
                                             4. store the image     ← Vercel Blob → public URL
                                             5. insert a row        ← Drizzle → SQLite/Turso
                                             6. 201 { upload: { score, label, imageUrl, … } }
```

The image is analyzed **before** it is stored, so a photo without a face never reaches storage or the database.

**Scoring** (`src/lib/smile/score.ts`, pure functions, unit tested): face-api returns seven expression
probabilities. Score = `happy` × 100, rounded. With several faces, the largest one is scored.
Labels: 0–20 *Not smiling*, 21–50 *Hint of a smile*, 51–80 *Smiling*, 81–100 *Big smile*.

### How Next.js is used

- **Server Components** load data directly: `src/app/dashboard/page.tsx` reads the session and the user's uploads on the server, then passes them as props.
- **Client Components** only where there is interaction: `AuthForm`, `UploadForm`, `Dashboard`, `LogoutButton`.
- **Route Handlers** are the API: `src/app/api/auth/{register,login,logout}` and `src/app/api/uploads` (`POST` upload + score, `GET` history). The upload route sets `runtime = "nodejs"` because it needs `sharp`, `fs` and WASM.
- **`src/proxy.ts`** (Next 16's new name for middleware) does fast redirects: `/dashboard` needs a session, `/login` and `/register` must not have one. Pages and routes still check the session themselves.
- **Route group** `src/app/(auth)` shares one centered layout between login and register without changing the URL.
- **`next.config.ts`** keeps face-api/TensorFlow/sharp out of the bundle (`serverExternalPackages`) and ships the model weights and `.wasm` files with the upload function (`outputFileTracingIncludes`).

### Folder layout

```
src/
  app/            pages, layouts and API route handlers
  components/     UI (ui/ holds Button, Field, Card, Alert)
  db/             Drizzle schema, client, migration runner
  lib/
    auth/         password hashing, JWT session, register/login logic
    smile/        SmileAnalyzer interface, scoring, face-api implementation
    storage/      ImageStorage interface, Vercel Blob + local disk
    repositories/ the only place database queries live
    validation/   zod schemas shared by the API and the forms
  proxy.ts        auth redirects
drizzle/          generated SQL migrations
weights/          face-api model weights (~520 KB)
tests/            unit/ and integration/ (Vitest)
```

### Key decisions

| Decision | Why |
|---|---|
| Turso (libSQL) + Drizzle | Same code for a local file, an in-memory test DB and a hosted DB. No database server to run. |
| Vercel Blob | First-party on Vercel, returns a CDN URL. Hidden behind an `ImageStorage` interface. |
| Analysis on the server (WASM) | The score can't be tampered with and can be tested. WASM needs no native build, so it deploys on Vercel. |
| JWT in an httpOnly cookie | Small and explicit; JavaScript in the page can't read the token. |
| Route Handlers, not Server Actions | Upload and auth are a clear HTTP contract that can be called with curl and tested directly. |

### Testing

- **Unit:** scoring, password hashing, JWT sessions, validation schemas.
- **Integration:** route handlers are called as plain functions with real `Request` objects against an in-memory SQLite DB with the real migrations. The face analyzer and storage are mocked, so tests need no network and run in about a second.

## Assumptions

- "Smile score" = the model's probability of the *happy* expression. It is a confidence, not a measure of smile width.
- One score per photo; with several faces the largest face is used.
- Uploads are capped at 4 MB because Vercel functions reject request bodies over 4.5 MB.
- Email + password only (8+ characters), no email verification or password reset.
- Light theme only.

## Deploy to Vercel

1. Import the repo in Vercel and set Node.js to **22.x**.
2. **Storage → Blob:** create a public store and connect it (injects `BLOB_STORE_ID`).
3. **Marketplace → Turso:** create a database and connect it (injects `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`).
4. Add `JWT_SECRET`, then run `npm run db:migrate` once with the Turso variables set.
5. Deploy (or redeploy so the new variables are picked up).