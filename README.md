# Hosej

Social hub mobile-first PWA to organize groups, answer daily questions, run photo rallies, build a jukebox, chat, and keep score.

## Features

- **Groups** — invite friends
- **Daily Questions** — one question a day, create, vote, rate, see results, 
- **Photo Rallies** — task-based photo contests with a submission → voting → results lifecycle
- **Jukebox** — submit songs (with Spotify search) and rate each other's picks
- **Chats** — per-feature chat threads attached to questions, rallies, and jukeboxes
- **Dashboard** — activity feed showing what's new since your last visit
- **Leaderboard & Stats** — per-group points, participation stats, history

## Technical Features

HoseJ is a Next.js 16 App Router application. The UI is built with client components and communicates with backend logic exposed through API routes. Data is persisted in MongoDB using Mongoose. The app is designed as a PWA and supports push notifications via Firebase Cloud Messaging. Media uploads are stored on AWS S3. Optional Google OAuth is available using NextAuth.

- Installable (PWA) via Serwist service worker
- Push Notifications (Firebase Cloud Messaging)
- Device auth (no login needed) and optional Google OAuth via NextAuth
- Photo uploading (AWS S3)
- Admin panel: Global feature control

---

## Stack

- **Language:** TypeScript
- **Framework:** Next.js 16 (App Router), React 19
- **Styling:** Tailwind CSS, shadcn/ui (Radix primitives)
- **Animations:** View Transitions API, framer-motion
- **Data fetching:** SWR
- **Auth:** NextAuth (credentials + Google), JWT sessions
- **Database:** MongoDB with Mongoose
- **Notifications:** Firebase Admin SDK + FCM
- **Storage:** AWS S3 (presigned uploads)
- **Rate Limiting:** Upstash Redis
- **PWA:** Serwist service worker
- **Charts:** recharts
- **Testing:** Vitest + @testing-library/react + jsdom
- **Deployment:** Vercel

---

## Quick Start

```bash
npm install

cp .env.example .env.local
# Edit .env.local with your actual values

# Run development server
npm run dev
```


---

## Architecture
```
Pages (src/app/)           → Client components, SWR for data fetching
API Routes (src/app/api/)  → Thin handlers, auth checks, call services
Services (src/lib/services/) → Business logic, DB access, typed errors
Models (src/db/models/)    → Mongoose schemas
```
