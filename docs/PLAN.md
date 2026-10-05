# Smile Score — Build Plan & Status

> Saved from the planning session on 2026-10-05 so any future session can pick up where this left off.
> The plan below is the approved design. The **Status** section records what changed while building it.

## Status (as of 2026-10-05)

**Done and committed** (`24f6262`): the full plan below is implemented. `npm run lint`, `npm run typecheck`,
`npm test` (50 tests) and `npm run build` all pass. Verified end to end with curl and Playwright.

Deviations from the plan, all deliberate:

| Plan said | What was built | Why |
|---|---|---|
| Next.js 15 | **Next.js 16.3** | `create-next-app@latest` installed 16. Middleware is therefore `src/proxy.ts` (v16 rename), and `cookies()` is async. |
| `npx skills use …` installs into `.claude/skills/` | It only downloads to a temp dir and prints SKILL.md | Ran `search.py` from that temp dir; design system persisted to `design-system/smile-score/MASTER.md`. Nothing to gitignore. |
| Vercel Blob only | Vercel Blob **plus** `LocalDiskStorage` fallback (dev only, writes to `public/uploads/`) | Lets a reviewer clone and run without any cloud account. Production throws if `BLOB_READ_WRITE_TOKEN` is missing. |
| Analyzer creates tensors via `@tensorflow/tfjs` | Backend/ready via `@tensorflow/tfjs`, tensor via `faceapi.tf.tensor3d` | The two typings disagree on `Tensor3D`; same runtime instance either way. |
| `vitest.config.ts` | `vitest.config.mts` | Avoids an ESM/CJS warning from Vite. `@types/node` bumped to ^22 for vitest 5. |
| Order history by `createdAt` | `createdAt` desc, then SQLite `rowid` desc | Two uploads in the same millisecond made a test flaky. |
| Scripts use `dotenv/config` | `src/lib/loadEnv.ts` loads `.env.local` then `.env` | README tells people to create `.env.local`; plain dotenv only reads `.env`. |
| Playwright not included | Still not in the repo | Used from a scratch folder only for manual UI verification (axe: 0 violations at 375px and 1440px). |

Local quirks worth knowing:
- Another Next app (`~/Desktop/smiley`) holds port **3000** on this machine, so `npm run dev` here starts on **3001**.
- The Claude in Chrome extension could not open localhost pages; Playwright worked.

Open follow-ups (not started): deploy to Vercel (steps in README), client-side direct-to-Blob upload, swap face-api for `@vladmandic/human`, delete uploads, rate limiting, Playwright e2e in-repo. See `NOTES.md`.

---

## Context

Take-home assessment for a fullstack role: a web app where a user registers, uploads a photo, and gets a "smile score". The reviewers care most about **solution structure and testing**. The code should read like a solid lower-mid fullstack engineer wrote it: clear layering, small modules, no over-engineering, honest README.

Working directory `/Users/fairuzlokman/Desktop/fullstack` is empty (not a git repo). Node 22.21 is installed (required: face-api/tfjs does not support Node 23+).

### Decisions (confirmed with user)
| Concern | Choice | Why |
|---|---|---|
| Framework | Next.js 15, App Router, TypeScript, Tailwind | Preferred by assessment; one deployable on Vercel |
| Database | **Turso (libSQL/SQLite) + Drizzle ORM** | Local dev = a file, tests = in-memory, prod = Turso free tier via Vercel Marketplace. Same schema/queries everywhere, no DB server or binary downloads |
| Image storage | **Vercel Blob** (`@vercel/blob`) | Google Drive rejected: service accounts have 0 Drive quota since Apr 2025 and public-link serving is hacky. Blob is first-party, free 1GB on Hobby, returns a CDN URL to persist |
| Smile analysis | **Server-side** in a Node route handler using `@vladmandic/face-api` WASM build + `@tensorflow/tfjs` + `@tensorflow/tfjs-backend-wasm`, image decoded with `sharp` | Score is authoritative and testable. No native `tfjs-node`/`canvas`, so it deploys on Vercel |
| Auth | bcryptjs + JWT (`jose`) in httpOnly cookie | Small, explicit, easy to test. `bcryptjs` is pure JS (no native build on Vercel) |
| Validation | `zod` | Shared schemas for API + forms |
| Tests | **Vitest**: unit + route-handler integration against in-memory SQLite with real migrations; analyzer & storage mocked | Matches "unit + API integration" choice |
| UI | Tailwind v4 + semantic CSS tokens, `lucide-react` icons, `next/font/google`; direction generated with the **ui-ux-pro-max** skill (see "UI design system") | User asked for simple-but-functional UI following that skill's output |

Known caveat to document: face-api repo was archived Feb 2025 (superseded by `@vladmandic/human`). Fine for this scope; mention in README "next steps".

## Architecture

```
Browser ──(multipart POST /api/uploads)──▶ Route handler (Node runtime)
                                             1. auth (JWT cookie)
                                             2. validate file (type, ≤4MB)
                                             3. SmileAnalyzer.analyze(buffer)  ← face-api (WASM) + sharp
                                             4. ImageStorage.upload(buffer)    ← Vercel Blob → public URL
                                             5. db.insert(uploads)             ← Drizzle → Turso
                                             6. 201 { score, label, imageUrl }
```

Analyze **before** storing so bad images (no face) never hit Blob or the DB.

## Project structure

```
fullstack/
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx, globals.css
│  │  ├─ page.tsx                       # redirects → /dashboard or /login
│  │  ├─ (auth)/login/page.tsx
│  │  ├─ (auth)/register/page.tsx
│  │  ├─ dashboard/page.tsx             # server component: upload form + history
│  │  └─ api/
│  │     ├─ auth/register/route.ts      # POST
│  │     ├─ auth/login/route.ts         # POST
│  │     ├─ auth/logout/route.ts        # POST
│  │     └─ uploads/route.ts            # POST (upload+score), GET (my history)
│  ├─ components/
│  │  ├─ ui/                            # tiny primitives, all token-based (no raw hex)
│  │  │  ├─ Button.tsx                  # variants: primary (blue CTA), secondary, ghost; loading state
│  │  │  ├─ Input.tsx + Field.tsx       # label + input + helper/error wired with aria-describedby
│  │  │  └─ Card.tsx
│  │  ├─ AuthForm.tsx                   # shared register/login form (client; zod on blur, error summary)
│  │  ├─ UploadForm.tsx                 # file picker (+ drop zone), preview, submit (client)
│  │  ├─ ScoreCard.tsx                  # score number + label + progress bar (server-renderable)
│  │  ├─ UploadHistory.tsx              # grid of past uploads, empty state
│  │  └─ AppHeader.tsx                  # logo/wordmark, user email, logout button
│  ├─ db/
│  │  ├─ schema.ts                      # users, uploads tables (Drizzle sqlite-core)
│  │  ├─ index.ts                       # getDb(): cached libsql client + drizzle instance
│  │  └─ migrate.ts                     # runMigrations(db) using drizzle-orm/libsql/migrator (used by tests + CLI)
│  ├─ lib/
│  │  ├─ env.ts                         # zod-validated process.env
│  │  ├─ http.ts                        # ApiError + jsonError() helper
│  │  ├─ auth/
│  │  │  ├─ password.ts                 # hashPassword / verifyPassword (bcryptjs)
│  │  │  ├─ session.ts                  # signSession / verifySession (jose), cookie name & options
│  │  │  └─ currentUser.ts              # getUserFromRequest(req) + getUserFromCookies() for RSC
│  │  ├─ smile/
│  │  │  ├─ types.ts                    # SmileAnalyzer interface, SmileResult, NoFaceError
│  │  │  ├─ score.ts                    # PURE: expressions → { score 0-100, label }
│  │  │  ├─ faceApiAnalyzer.ts          # model/backend singleton, sharp → tensor → detect
│  │  │  └─ index.ts                    # getAnalyzer() (swappable for tests)
│  │  ├─ storage/
│  │  │  ├─ types.ts                    # ImageStorage interface
│  │  │  ├─ vercelBlob.ts
│  │  │  └─ index.ts                    # getStorage()
│  │  ├─ repositories/
│  │  │  ├─ users.ts                    # findByEmail, create
│  │  │  └─ uploads.ts                  # create, listByUser
│  │  └─ validation/
│  │     ├─ auth.ts                     # registerSchema, loginSchema (zod)
│  │     └─ upload.ts                   # ALLOWED_TYPES, MAX_BYTES, validateImageFile()
│  └─ middleware.ts                     # /dashboard requires cookie; /login,/register redirect if authed
├─ design-system/smile-score/MASTER.md  # persisted by ui-ux-pro-max (committed as design reference)
├─ .claude/skills/ui-ux-pro-max/        # installed by `npx skills use …` (gitignored; tooling, not deliverable)
├─ drizzle/                             # generated SQL migrations (committed)
├─ drizzle.config.ts
├─ weights/                             # face-api weights copied from node_modules/@vladmandic/face-api/model
│  ├─ tiny_face_detector_model-*        #   (~190KB)
│  └─ face_expression_model-*           #   (~330KB)
├─ scripts/
│  ├─ analyze.ts                        # CLI: `tsx scripts/analyze.ts photo.jpg` → prints score (manual smoke test)
│  └─ migrate.ts                        # CLI: apply migrations to TURSO_DATABASE_URL
├─ tests/
│  ├─ setup.ts                          # env defaults: TURSO_DATABASE_URL=:memory:, JWT_SECRET=test...
│  ├─ unit/
│  │  ├─ score.test.ts
│  │  ├─ password.test.ts
│  │  ├─ session.test.ts
│  │  └─ upload-validation.test.ts
│  └─ integration/
│     ├─ helpers/db.ts                  # fresh in-memory db + runMigrations, truncate between tests
│     ├─ helpers/request.ts             # build Request with JSON/multipart body + cookie header
│     ├─ auth.routes.test.ts
│     └─ uploads.route.test.ts          # analyzer + storage mocked via vi.mock
├─ .env.example, .nvmrc (22), next.config.ts, vitest.config.ts, README.md, NOTES.md
```

## Key implementation details

### Database (`src/db`)
- `schema.ts`:
  - `users`: `id` text PK (crypto.randomUUID), `email` text unique not null (stored lowercase), `passwordHash` text, `createdAt` integer (timestamp_ms).
  - `uploads`: `id` text PK, `userId` text FK → users.id (cascade), `imageUrl` text, `blobPathname` text, `score` integer, `label` text, `expressions` text (JSON string), `createdAt` integer. Index on `userId`.
- `index.ts`: `createClient({ url: env.TURSO_DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN })` from `@libsql/client`, wrapped with `drizzle()`. Cached on `globalThis` to survive Next dev HMR. Exposes `getDb()` and a `type Db`.
- Repositories take `db` as an optional parameter defaulting to `getDb()` — keeps route handlers thin and lets tests pass an in-memory db if needed (simple DI, no framework).
- Local dev: `TURSO_DATABASE_URL=file:local.db` (gitignored). Tests: `:memory:`. Prod: `libsql://…turso.io` + token (injected by Vercel Marketplace integration).
- Scripts: `db:generate` (drizzle-kit generate), `db:migrate` (tsx scripts/migrate.ts), `db:studio`.

### Smile scoring (`lib/smile/score.ts`) — pure, fully unit tested
- face-api returns 7 expression probabilities (neutral, happy, sad, angry, fearful, disgusted, surprised).
- `score = Math.round(happy * 100)`, clamped 0–100.
- Label buckets: 0–20 "Not smiling", 21–50 "Hint of a smile", 51–80 "Smiling", 81–100 "Big smile".
- If multiple faces: pick the detection with the largest box area (helper `pickPrimaryFace`).
- Zero faces → throw `NoFaceError` → route returns 422.

### Analyzer (`lib/smile/faceApiAnalyzer.ts`)
- `import * as faceapi from '@vladmandic/face-api/dist/face-api.node-wasm.js'`; `import * as tf from '@tensorflow/tfjs'`; `import { setWasmPaths } from '@tensorflow/tfjs-backend-wasm'`.
- Module-level `initPromise` singleton: `setWasmPaths('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@<ver>/dist/')`, `tf.setBackend('wasm')` with fallback to `'cpu'` on failure, `tf.ready()`, then `nets.tinyFaceDetector.loadFromDisk(WEIGHTS_DIR)` + `nets.faceExpressionNet.loadFromDisk(WEIGHTS_DIR)` where `WEIGHTS_DIR = path.join(process.cwd(), 'weights')`.
- Decode: `sharp(buf).rotate().resize({ width: 640, withoutEnlargement: true }).removeAlpha().raw().toBuffer({ resolveWithObject: true })` → `tf.tensor3d(data, [h, w, 3], 'int32')`.
- `faceapi.detectAllFaces(tensor, new TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.4 })).withFaceExpressions()`; always `tensor.dispose()` in `finally`.
- Return `{ score, label, expressions, faceCount }` via `score.ts`.

### Upload route (`app/api/uploads/route.ts`)
- `export const runtime = 'nodejs'; export const maxDuration = 60;`
- POST: `getUserFromRequest` → 401; `req.formData().get('image')` → `validateImageFile` (jpeg/png/webp, ≤ 4MB — Vercel body limit is 4.5MB) → 400; analyze → 422 on `NoFaceError`; `storage.upload(buffer, { contentType, userId })` → Blob URL; `uploadsRepo.create(...)`; 201.
- GET: list current user's uploads newest first (limit 20).
- Errors funnel through `jsonError(e)` in `lib/http.ts` (ApiError → status, else 500 with logged cause).

### Auth
- Register: zod (email, password ≥ 8) → 409 if email exists (also catch unique-constraint error for races) → `hashPassword` → insert → set cookie → 201.
- Login: verify → set cookie → 200. Same generic 401 message for unknown email / wrong password.
- Session: `jose` HS256, 7-day exp, payload `{ sub: userId, email }`; cookie `session`, httpOnly, sameSite=lax, secure in prod.
- `currentUser.ts` exposes **two** readers: `getUserFromRequest(req: Request)` (parses `cookie` header; used by routes → testable without Next request context) and `getUserFromCookies()` (uses `next/headers`; used by RSC pages).
- `middleware.ts` only checks token validity with `jose` (edge-safe), no DB.

### UI design system (from the ui-ux-pro-max skill)

Followed the skill's workflow: Step 1 stack = Next.js (from package.json); Step 2 `--design-system` run twice ("smile score photo upload playful friendly consumer web app" and a "minimal clean utility" variant); Step 3/4 supplemented with `--domain ux` (forms, loading, empty states, drag alternatives) and `--stack nextjs` / `--stack html-tailwind`. Synthesis below; results are recommendations, not overrides.

**Direction**: Minimalism (clean, spacious, high contrast, per "simple but functional") with the warm *playful orange + trust blue* palette the smile query returned. The suggested "Scroll-Triggered Storytelling" landing pattern and GSAP motion are **skipped**: there is no marketing page, only auth + dashboard. Motion stays at CSS transitions 150–300ms.

**Tokens** (defined once in `globals.css` as CSS variables, exposed to Tailwind v4 via `@theme`; components never use raw hex):

| Token | Value | Use |
|---|---|---|
| `--color-primary` | `#F97316` | brand marks, score bar fill, highlights (always with dark text `#0F172A`) |
| `--color-accent` / on | `#2563EB` / `#FFFFFF` | **primary buttons/CTA** (white on orange fails 4.5:1, white on this blue passes) |
| `--color-background` | `#FFF7ED` | page |
| `--color-card` / fg | `#FFFFFF` / `#9A3412` | cards, headings |
| `--color-foreground` | `#1F2937` | body text (slate-800 for readability) |
| `--color-muted` / fg | `#F1F0F0` / `#475569` | subtle surfaces, helper text |
| `--color-border` | `#FED7AA` | borders |
| `--color-destructive` / on | `#DC2626` / `#FFFFFF` | errors |
| `--color-ring` | `#2563EB` | focus rings |
| spacing | Tailwind default 4px scale, standard density | |
| radius | `rounded-xl` cards, `rounded-lg` inputs/buttons | |

**Typography**: `next/font/google` (no render-blocking `@import`): Varela Round for headings, Nunito Sans for body (400/500/600/700). Base 16px, line-height 1.5, type scale 14/16/18/24/32, headings 600–700.

**Icons**: `lucide-react` SVGs only, no emoji. Decorative icons beside text get `aria-hidden`; icon-only buttons get `aria-label`.

**Screens** (mobile-first, breakpoints 375/768/1024/1440, container `max-w-5xl`, `min-h-dvh`):
- `/login`, `/register`: centered card, wordmark, one form. Fields: visible `<label htmlFor>`, `type="email"`, `autocomplete="email"` / `"new-password"` / `"current-password"`, password show/hide toggle, inputs `h-11` (≥44px). Validate with the shared zod schema **on blur**; errors below the field via `aria-describedby`, `role="alert"` on the server error summary, focus moved to the first invalid field after a failed submit. Submit button shows spinner + disabled + `aria-busy` while pending; error message states cause + fix ("Email already registered — try logging in").
- `/dashboard`: header (wordmark, email, logout) → upload card → latest `ScoreCard` → history grid. Upload card: native `<input type="file" accept="image/jpeg,image/png,image/webp">` styled as a button **plus** a drop zone; clicking the zone opens the picker so drag is never the only path. Helper text: "JPG, PNG or WebP, up to 4 MB". Client-side pre-check of type/size mirrors `validation/upload.ts`. Preview reserves aspect ratio (no CLS) with meaningful `alt`. Pending state: "Analyzing your smile…" with `aria-busy`. 422 "no face" and 4xx/5xx errors render inline with a retry path.
- `ScoreCard`: large tabular-numeral score, label text (never color alone), progress bar `role="progressbar"` with `aria-valuenow`, bar fill in primary orange. History: `next/image` thumbnails with fixed aspect, date, score chip; empty state "No uploads yet — add your first photo" pointing at the upload card.
- Global: skip-to-content link, sequential headings (one `h1` per page), `cursor-pointer` on clickables, `focus-visible:ring-2 ring-ring ring-offset-2` everywhere, `motion-reduce:transition-none`, `touch-action: manipulation` on buttons, no horizontal scroll.

**Next.js guidance applied**: pages stay Server Components; only `AuthForm`, `UploadForm`, and the logout button are `'use client'` leaves. The skill recommends Server Actions for mutations; this project deliberately keeps **route handlers** so the upload/auth API is an explicit, curl-able, integration-tested HTTP contract (trade-off noted in README).

**Pre-delivery checklist** (run before calling the UI done): no emoji icons · cursor-pointer on clickables · hover/focus transitions 150–300ms · text contrast ≥ 4.5:1 in light mode · visible keyboard focus · `prefers-reduced-motion` respected · verified at 375 / 768 / 1024 / 1440 · labels not placeholder-only · errors inline + announced · buttons disabled with feedback during async.

### next.config.ts
- `serverExternalPackages: ['@vladmandic/face-api', '@tensorflow/tfjs', '@tensorflow/tfjs-backend-wasm', 'sharp', '@libsql/client']`
- `outputFileTracingIncludes: { '/api/uploads': ['./weights/**'] }` so weights ship with the function.
- `images.remotePatterns` for `*.public.blob.vercel-storage.com`.

### Environment (`.env.example`)
```
TURSO_DATABASE_URL=file:local.db   # prod: libsql://<db>.turso.io
TURSO_AUTH_TOKEN=                  # empty for local file
JWT_SECRET=                        # ≥32 chars
BLOB_READ_WRITE_TOKEN=             # from Vercel Blob store
```

## Tests (Vitest)
- **Unit**: `score.ts` (bucket boundaries, clamping, primary-face selection, no-face error); `password.ts` (hash≠plain, verify ok/fail); `session.ts` (round-trip, tampered token rejected, expired rejected); `upload.ts` (type/size rules).
- **Integration**: `tests/setup.ts` sets `TURSO_DATABASE_URL=:memory:`; `helpers/db.ts` runs `runMigrations(getDb())` in `beforeAll` and deletes rows in `beforeEach`. Call exported `POST`/`GET` handlers directly with constructed `Request` objects.
  - auth: register ok → cookie set + user row exists; duplicate → 409; bad body → 400; login ok / wrong password → 401; logout clears cookie.
  - uploads: `vi.mock('@/lib/smile', () => ({ getAnalyzer: () => fakeAnalyzer }))` and same for storage. Cases: 401 unauthenticated; 400 wrong type / too large; 422 when analyzer throws `NoFaceError` (and asserts storage **not** called); 201 happy path persists upload row with score; GET returns only own uploads, newest first.
- Scripts: `npm test`, `npm run test:watch`, `npm run lint`, `npm run build`.

## Deliverables / docs
- `README.md`: features, architecture diagram (the flow above), folder layout, UI/design notes (tokens, link to `design-system/smile-score/MASTER.md`, why route handlers over Server Actions), how to run locally (`cp .env.example .env.local`, `npm run db:migrate`, `npm run dev`), Vercel setup (Blob store + Turso Marketplace integration, Node 22.x, run `db:migrate` against prod URL once), how to test, **assumptions** (single-face primary pick, happy probability = smile, 4MB limit, no email verification), **next steps**.
- `NOTES.md`: "what I'd do differently with more time" — client-side direct-to-Blob upload (`handleUpload`) to bypass 4.5MB limit; move inference to a dedicated worker/queue or switch to `@vladmandic/human` (face-api archived); rate limiting; Playwright e2e; refresh tokens / Auth.js; image moderation; delete uploads (also delete Blob); observability.

## Implementation order
0. Install the UI skill into the project as requested and persist the design system:
   ```bash
   npx skills use "https://github.com/nextlevelbuilder/ui-ux-pro-max-skill" --skill "ui-ux-pro-max"
   python3 .claude/skills/ui-ux-pro-max/scripts/search.py \
     "smile score photo upload playful friendly consumer web app" \
     --design-system --persist -p "Smile Score" --variance 4 --motion 3 --density 5 --output-dir "$PWD"
   ```
   Read the generated `design-system/smile-score/MASTER.md` and reconcile with the tokens above (the plan's contrast fix for buttons wins). Add `.claude/` to `.gitignore`. If `npx skills` installs somewhere other than `.claude/skills/`, use the path it prints.
1. `npx create-next-app@latest . --ts --tailwind --app --src-dir --eslint` (alias `@/*`), `.nvmrc`, install deps (`drizzle-orm @libsql/client zod jose bcryptjs @vercel/blob sharp @vladmandic/face-api @tensorflow/tfjs @tensorflow/tfjs-backend-wasm lucide-react`; dev: `drizzle-kit vitest tsx @types/bcryptjs`).
2. `lib/env.ts`, `db/schema.ts`, `db/index.ts`, `drizzle.config.ts`, generate first migration, `db/migrate.ts`, repositories.
3. Auth lib + routes + unit/integration tests.
4. `lib/smile/score.ts` + unit tests; then `faceApiAnalyzer.ts`, copy weights to `/weights`, `scripts/analyze.ts` smoke test against a real photo.
5. Storage + uploads route + integration tests.
6. UI: tokens in `globals.css` + `@theme`, fonts in `layout.tsx`, `components/ui/*` primitives, then `AuthForm`, `UploadForm`, `ScoreCard`, `UploadHistory`, pages, middleware. Walk the pre-delivery checklist.
7. `next.config.ts` externals/tracing, `npm run build`, README/NOTES, `.env.example`, `git init` + first commit.

## Verification
1. `npm run lint && npm test` — all unit/integration green (no network, no cloud DB needed).
2. `npx tsx scripts/analyze.ts <local photo>` — prints score; run with a smiling and a neutral photo, plus a landscape with no face (expect NoFaceError). Confirms WASM/CPU backend + weights load outside Next.
3. `npm run dev` with `file:local.db` and a real `BLOB_READ_WRITE_TOKEN` (user supplies): register → login → upload → see score + image from Blob URL → history persists after refresh. Also `curl -F image=@photo.jpg localhost:3000/api/uploads` → 401 without cookie.
4. `npm run build` passes (checks externals/tracing config). Final deploy to Vercel is done by the user; README includes the steps.
5. UI check in Chrome (Claude in Chrome tools) at 375px and 1440px: tab through login/register/upload with keyboard only (focus rings visible, labels read), submit invalid forms (inline errors + focus moved), upload with no file selected (button disabled), check no horizontal scroll, toggle `prefers-reduced-motion` in DevTools and confirm transitions are off. Lighthouse accessibility ≥ 95 on `/login` and `/dashboard`.
