# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HoseJ = mobile-first PWA social hub for friend groups. Features: daily questions w/ voting, photo rallies, Spotify jukebox, chats, leaderboards, stats. Device-based auth default + optional Google OAuth.

## Commands

```bash
npm run dev              # Start dev server (localhost:3000)
npm run build            # Production build
npm run lint             # ESLint check
npm run lint:fix         # ESLint auto-fix
npm run format           # Prettier format all files
npm run format:check     # Prettier check
npm test                 # Run tests (vitest)
npm run test:watch       # Tests in watch mode
npm run test:coverage    # Tests with coverage report
npx tsc --noEmit         # Type check without emitting
```

## Architecture

**Next.js 16 App Router** — frontend pages = client components; app logic lives in API routes.

### Layer Structure

```
Pages (src/app/)           → Client components, use SWR for data fetching
API Routes (src/app/api/)  → Request handling, auth checks, call services
Services (src/lib/services/) → Business logic
Models (src/db/models/)    → Mongoose schemas, MongoDB
```

### Key Directories

- `src/components/common/` — shared components across features
- `src/components/ui/` — shadcn/ui components (don't edit manually, use `npx shadcn-ui@latest add`)
- `src/components/wrappers/` — context providers (session, theme, SWR error handling, FCM tokens)
- `src/lib/api/` — API utils: `withErrorHandling()` wrapper, `withAuthAndErrors()`, custom error classes (`ValidationError`, `AuthError`, `ForbiddenError`, `NotFoundError`, `ConflictError`)
- `src/lib/auth/` — NextAuth config (`nextAuthOptions.ts`, `callbacks.ts`)
- `src/hooks/` — custom React hooks
- `src/types/models/` — TS interfaces for Mongoose models + DTOs

### Important Patterns

**API route error handling:** All API routes use `withErrorHandling()` or `withAuthAndErrors()` wrappers. Throw typed errors (`ValidationError`, `NotFoundError`, etc.) → auto-map to HTTP status codes.

**Service layer:** Business logic in `src/lib/services/` (e.g. `user/`, `group/`, `question/`, `rally/`, `jukebox/`, `chat/`, `activity/`). Services call `dbConnect()` internally, throw typed errors, only layer touching Mongoose models. Route handlers stay thin — parse request, call service, return `NextResponse.json()`. New features: create service funcs first, wire into routes.

**Database connection:** `src/db/dbConnect.ts` caches Mongoose connection across serverless invocations. Services call `dbConnect()` internally — routes don't.

**Auth proxy:** `src/proxy.ts` protects all routes except auth endpoints, `/`, terms, privacy, cron. API routes get 401; pages redirect to `/`.

**Group authorization:** `isUserInGroup()` + `isUserAdmin()` live in `src/lib/services/group/group.ts`, re-exported from `src/lib/services/group/index.ts`. Accept optional pre-loaded group doc to skip redundant DB calls.

**Image uploads:** Client gets presigned POST URL from `/api/uploadimage`, uploads direct to S3, associates URL with entity via API.

**Push notifications:** Firebase Admin SDK sends multicast messages. FCM tokens stored per-user. Service worker source `src/sw.ts`, built by Serwist → `public/firebase-messaging-sw.js`.

**Daily cron:** `vercel.json` triggers `/api/cron` at 04:00 UTC daily — activates questions, jukeboxes, sends push notifications.

**Data fetching:** Client components use SWR w/ fetcher from `src/lib/fetcher.ts`.

## Tech Stack

- **Framework:** Next.js 16 (App Router), TypeScript, React 19
- **Styling:** Tailwind CSS + shadcn/ui (Radix primitives)
- **Animations:** View Transitions API (experimental), framer-motion (tab indicator)
- **Data fetching:** SWR
- **Auth:** NextAuth (Google OAuth + device credentials)
- **Database:** MongoDB + Mongoose
- **Notifications:** Firebase Cloud Messaging
- **Storage:** AWS S3 (presigned uploads)
- **PWA:** Serwist service worker
- **Deployment:** Vercel (free tier)

## Styling & Layout Patterns

### Global layout (`src/app/layout.tsx`)
Root layout wraps content in `<div className="p-6 h-[100dvh]">`. Global `p-6` padding already applied — page components MUST NOT add own outer padding/margin. Start page content directly, no wrapping padded container.

Scrollbars hidden globally via CSS (`scrollbar-width: none` + `::-webkit-scrollbar { display: none }`) for native mobile feel.

### Full-height layout
- Root layout: `h-[100dvh]` on wrapper div
- Pages needing full-height flex: `<div className="flex flex-col h-[100dvh]">`
- Group tabs layout (`src/app/groups/[groupId]/(pages)/layout.tsx`): wraps children in `<div className="flex-grow pb-20">` for fixed bottom nav (`pb-20`)

### Header component (`src/components/ui/custom/Header.tsx`)
- Use `<Header title="..." />` for all page titles — renders `mb-4` spacing below
- Supports `leftComponent`, `rightComponent`, `href` (auto-renders `<BackLink>` when `href` provided)
- Pass `title={null}` for skeleton while loading

### Bottom navigation
- Fixed footer in group tabs layout; pages inside must use `pb-20` (already applied by layout's flex child wrapper)

### Confirmations
Use `<ResponsiveConfirm>` from `src/components/common/ResponsiveConfirm.tsx` for any destructive or confirmation prompt — renders a bottom drawer on mobile and an AlertDialog on ≥640px. Do NOT use raw `<AlertDialog>` for confirm flows.

### View Transitions (experimental)
Enabled via `experimental.viewTransition: true` in `next.config.mjs`. Uses React's `<ViewTransition>` component.

- **Root layout** wraps children in `<ViewTransition name="page">` — default cross-fade + drill-in/out animations for page-level navigations
- **Tabs layout** wraps children in `<ViewTransition name="tab-content">` — directional horizontal slides based on tab order
- **Navigation direction** controlled via `transitionTypes` prop on `<Link>`:
  - `["slide-forward"]` / `["slide-back"]` — horizontal tab slides
  - `["drill-forward"]` — forward navigation (e.g. groups → dashboard, dashboard → question)
  - `["drill-back"]` — back navigation (used by `BackLink` auto)
- Animation CSS in `src/app/globals.css` under "View Transition animations" section
- Prefer `<Link>` w/ `transitionTypes` over `router.push()` for animated navigations
- `loading.tsx` skeletons participate in transitions auto via Suspense

## Code Style

- Path alias: `@/*` maps to `./src/*`
- Prettier: double quotes, semicolons, 4-space indent, 100 char width
- ESLint: no `console.log` (warn/error only), no explicit `any`, consistent type imports, unused vars prefixed w/ `_`
- Pre-commit hooks (Husky + lint-staged) run Prettier + ESLint on staged files

## Testing

- Framework: Vitest + @testing-library/react + jsdom
- Test files: `src/**/*.{test,spec}.{ts,tsx}`

### Real MongoDB via mongodb-memory-server

Service tests run against a real in-memory MongoDB instance, not mocked Mongoose models.

- `src/test/globalSetup.ts` boots a `MongoMemoryServer` once per test run and sets `process.env.MONGODB_URI` before any test file loads. It also populates required env vars (NEXTAUTH_SECRET, FIREBASE_SERVICE_ACCOUNT stub, AWS/Spotify/Cron secrets).
- `src/test/db.ts` exports `setupTestDb` (calls `dbConnect()`), `teardownTestDb` (drops DB + disconnects), `clearCollections` (wipes all collections between tests).
- `src/test/setup.ts` (per-file setup) mocks `next/link`, `next/image`, `next/navigation`, `web-haptics/react`, `ResizeObserver`, and globally mocks `firebase-admin` so `sendNotification.ts` can be imported transitively without crashing on the stub service account.
- `src/env.ts` `optionalEnv()` is silent under `NODE_ENV=test` to avoid Upstash warnings in logs.

Typical service test shape:

```ts
import { setupTestDb, teardownTestDb, clearCollections } from "@/test/db";
import { makeUser, makeGroup } from "@/test/factories";

beforeAll(setupTestDb);
afterAll(teardownTestDb);
beforeEach(clearCollections);
```

### Factories

`src/test/factories/index.ts` exports `makeUser`, `makeGroup`, `makeQuestion`, `makeRally`, `makeJukebox`, `makeChat`. Each accepts a typed `Overrides` object and persists via the real model. Add new override fields to the corresponding `*Overrides` type when a test needs them.

### Fakes for external integrations

Third-party side-effects live behind thin `src/lib/integrations/*` modules and are stubbed per-test via `vi.mock`:

- `src/test/fakes/push.ts` — `sendNotification` records calls
- `src/test/fakes/spotify.ts` — Spotify search
- `src/test/fakes/storage.ts` — S3 signed URL generation

Pattern: `vi.mock("@/lib/integrations/push", () => import("@/test/fakes/push"));` at the top of the test file; assert via the exported `getXCalls()` / reset with `resetXFake()`.

### When to mock vs. use real DB

- **Service / data-layer tests** → use `setupTestDb` + factories. Drives the real Mongoose validation path and surfaces schema issues.
- **Pure functions** → no DB needed; call directly. If the function takes a user doc as input, a factory + `.toObject()` still reads cleaner than hand-rolled `IUser` literals.
- **External APIs / notifications / storage** → mock via `@/lib/integrations/*` fakes.
- **React components** → jsdom + testing-library; mock network calls at the fetcher boundary.

### Known footguns

- Top-level module side-effects (Firebase init, Spotify token cache) must be neutralized in setup or reset via exported helpers (e.g. `_resetTokenCache()`).
- `vi.restoreAllMocks()` runs in `afterEach`; global `vi.mock(...)` declarations at module scope (like `firebase-admin` in setup.ts) survive across tests.
- No MongoDB transactions (requires a replica set) — noted with TODO comments in service code.