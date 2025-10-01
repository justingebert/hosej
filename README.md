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
- App Router (Next.js 14), Client Components UI
- Tailwind CSS + shadcn/ui components

---

## Stack

- Language: TypeScript
- Runtime: Node.js
- Framework: Next.js 14 (App Router)
- Package Manager: npm (package-lock.json)
- Styling: Tailwind CSS, shadcn/ui, Radix UI
- State/Data fetching: SWR
- Auth: NextAuth (Google provider + credentials), next-auth/jwt in middleware
- Database: MongoDB with Mongoose
- Notifications: Firebase Admin SDK + FCM
- Storage: AWS S3
- PWA: Serwist + @ducanh2912/next-pwa
- Charts/Visuals: recharts, framer-motion
- Deployment: Vercel


## Environment Variables

Create a .env.local file in the project root with the following variables. Values below are inferred from the codebase; set them to your actual secrets. Variables prefixed with NEXT_PUBLIC_ are exposed to the client.

Database:
- MONGODB_URI

NextAuth / Auth:
- NEXTAUTH_SECRET
- AUTH_GOOGLE_ID
- AUTH_GOOGLE_SECRET

Firebase (client & SW):
- NEXT_PUBLIC_FIREBASE_API_KEY
- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
- NEXT_PUBLIC_FIREBASE_PROJECT_ID
- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
- NEXT_PUBLIC_FIREBASE_APP_ID
- NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
- NEXT_PUBLIC_FIREBASE_FCM_VAPID_KEY

Firebase (server/admin):
- FIREBASE_SERVICE_ACCOUNT  // JSON stringified service account object

AWS S3:
- AWS_REGION
- AWS_BUCKET_NAME

Spotify API:
- SPOTIFY_CLIENT_ID
- SPOTIFY_CLIENT_SECRET

Misc:
- ENV  // set to "dev" to disable notifications and certain PWA behaviors in development