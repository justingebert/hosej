# hosej

Social Hub app for me and my friends — a mobile-first PWA to organize groups, daily questions, photo rallies, music jukeboxes, and more.

## Features

- Groups
- Daily Questions with voting + results
- Photo Rallies (tasks for taking a photo) with voting + results
- Jukebox (with Spotify integration) — submit and rate songs
- Chats
- History
- Statistics
- Leaderboard

## Technical Features

HoseJ is a Next.js 14 App Router application. The UI is built with client components and communicates with backend logic exposed through API routes. Data is persisted in MongoDB using Mongoose. The app is designed as a PWA and supports push notifications via Firebase Cloud Messaging. Media uploads are stored on AWS S3. Optional Google OAuth is available using NextAuth.

- Installable (PWA) via Serwist service worker
- Push Notifications (Firebase Cloud Messaging)
- Device auth (no login needed) and optional Google OAuth via NextAuth
- Photo uploading (AWS S3)
- Admin panel: Global feature control

---

## Stack

- Language: TypeScript
- Runtime: Node.js
- Framework: Next.js 14 (App Router)
- Package Manager: npm (package-lock.json)
- Styling: Tailwind CSS, shadcn/ui, 
- State/Data fetching: SWR
- Auth: NextAuth (Google provider + credentials), next-auth/jwt in middleware
- Database: MongoDB with Mongoose
- Notifications: Firebase Admin SDK + FCM
- Storage: AWS S3
- PWA: Serwist + @ducanh2912/next-pwa
- Charts/Visuals: recharts, framer-motion
- Deployment: Vercel

---

## Quick Start

```bash
# Clone the repository
git clone <repo-url> && cd hosej

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your actual values

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## Project Structure

```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # API route handlers
│   ├── groups/            # Group-related pages
│   └── ...
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── features/          # Feature-specific components
│   └── wrappers/          # Context providers and wrappers
├── db/
│   ├── models/            # Mongoose schemas
│   └── dbConnect.ts       # Database connection utility
├── lib/
│   ├── api/               # API utilities (auth, error handling)
│   ├── services/          # Business logic layer
│   └── ...
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript type definitions
│   └── models/            # Model interfaces and DTOs
└── middleware.ts          # Auth middleware
```
