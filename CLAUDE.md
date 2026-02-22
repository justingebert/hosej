# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HoseJ is a mobile-first PWA social hub for friend groups. Features include daily questions with voting, photo rallies, a Spotify-integrated jukebox, chats, leaderboards, and statistics. It uses device-based auth by default with optional Google OAuth.

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

CI runs on PRs: `npm run lint` → `npx tsc --noEmit` → `npm test` → `npm build`

## Architecture

**Next.js 14 App Router** — all frontend pages are client components; all application logic lives in API routes.

### Layer Structure

```
Pages (src/app/)           → Client components, use SWR for data fetching
API Routes (src/app/api/)  → Request handling, auth checks, call services
Services (src/lib/services/) → Business logic
Models (src/db/models/)    → Mongoose schemas, MongoDB
```

### Key Directories

- `src/components/features/` — Feature-specific components (question, rally, jukebox)
- `src/components/ui/` — shadcn/ui components (do not edit manually, use `npx shadcn-ui@latest add`)
- `src/components/wrappers/` — Context providers (session, theme, SWR error handling, FCM tokens)
- `src/lib/api/` — API utilities: `withErrorHandling()` wrapper, `withAuthAndErrors()`, custom error classes (`ValidationError`, `AuthError`, `ForbiddenError`, `NotFoundError`, `ConflictError`)
- `src/hooks/` — Custom React hooks
- `src/types/models/` — TypeScript interfaces for Mongoose models and DTOs

### Important Patterns

**API route error handling:** All API routes should use `withErrorHandling()` or `withAuthAndErrors()` wrappers. Throw typed errors (`ValidationError`, `NotFoundError`, etc.) and they auto-map to HTTP status codes.

**Service layer:** Business logic lives in `src/lib/services/` (e.g. `user.ts`, `group/group.ts`). Services call `dbConnect()` internally, throw typed errors, and are the only layer that touches Mongoose models. Route handlers should be thin — parse request, call service, return `NextResponse.json()`. When adding new features, follow this pattern: create service functions first, then wire them into routes.

**Database connection:** `src/db/dbConnect.ts` caches the Mongoose connection across serverless invocations. Services call `dbConnect()` internally — routes don't need to.

**Auth middleware:** `src/middleware.ts` protects all routes except auth endpoints, `/`, terms, privacy, and cron. API routes get 401; pages redirect to `/`.

**Group authorization:** `isUserInGroup()` and `isUserAdmin()` live in `src/lib/services/group/group.ts` and are re-exported from `src/lib/admin.ts` for backwards compatibility. They accept an optional pre-loaded group document to avoid redundant DB calls.

**Image uploads:** Client gets a presigned POST URL from `/api/uploadimage`, uploads directly to S3, then associates the URL with the entity via API.

**Push notifications:** Firebase Admin SDK sends multicast messages. FCM tokens stored per-user. Service worker source is `src/sw.ts`, built by Serwist to `public/firebase-messaging-sw.js`.

**Daily cron:** `vercel.json` triggers `/api/cron` at 04:00 UTC daily — activates questions, jukeboxes, and sends push notifications.

**Data fetching:** Client components use SWR with the fetcher from `src/lib/fetcher.ts`.

## Tech Stack

- **Framework:** Next.js 14 (App Router), TypeScript, React 18
- **Styling:** Tailwind CSS + shadcn/ui (Radix primitives)
- **Data fetching:** SWR
- **Auth:** NextAuth (Google OAuth + device credentials)
- **Database:** MongoDB + Mongoose
- **Notifications:** Firebase Cloud Messaging
- **Storage:** AWS S3 (presigned uploads)
- **PWA:** Serwist service worker
- **Deployment:** Vercel

## Code Style

- Path alias: `@/*` maps to `./src/*`
- Prettier: double quotes, semicolons, 4-space indent, 100 char width
- ESLint: no `console.log` (warn/error only), no explicit `any`, consistent type imports, unused vars prefixed with `_`
- Pre-commit hooks (Husky + lint-staged) run Prettier and ESLint on staged files

## Testing

- Framework: Vitest + @testing-library/react + jsdom
- Test files: `src/**/*.{test,spec}.{ts,tsx}`
- Setup file (`src/test/setup.ts`) mocks `next/link`, `next/image`, `next/navigation`, `use-haptic`, and `ResizeObserver`
- Test coverage is still being built out