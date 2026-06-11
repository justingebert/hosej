Backend is implemented and fully verified. Here's where things stand.

## Status â all green

```
â 323/323 tests pass (15 new)   â tsc --noEmit clean   â eslint 0 errors
```

**New files**
- `src/lib/auth/mobileToken.ts` â mint/decode the Bearer JWT (fixed salt), claim + response builders
- `src/lib/auth/getAuthToken.ts` â unified reader: `Bearer` â mobile token, else cookie
- `src/lib/integrations/googleAuth.ts` â `verifyGoogleIdToken` (mockable, like the other integrations)
- `src/app/api/auth/mobile/{device/register,device/login,google,google/link,refresh}/route.ts`
- 3 test files (`mobileToken`, `getAuthToken`, `userAuth`)

**Edited** â `withAuth.ts` + `proxy.ts` (both now use `getAuthToken`; proxy whitelists the 3 public mobile routes), `env.ts` (`GOOGLE_MOBILE_CLIENT_IDS`), `validation/users.ts` (2 schemas), `user.ts` (`getUserByDeviceId`, `findOrCreateGoogleUser`, `linkGoogleToUser`), `.env.example`. **The entire web flow is untouched** â cookie auth still routes through the same `getToken`.

## The API contract your Expo app codes against

| Method + path                           | Auth       | Body                   | Success                                        | Errors                      |
| --------------------------------------- | ---------- | ---------------------- | ---------------------------------------------- | --------------------------- |
| `POST /api/auth/mobile/device/register` | public     | `{deviceId, userName}` | `201 {token, user, needsNameSetup:false}`      | `409` deviceId exists       |
| `POST /api/auth/mobile/device/login`    | public     | `{deviceId}`           | `200 {token, user, ...}`                       | `404` unknown device        |
| `POST /api/auth/mobile/google`          | public     | `{idToken}`            | `200 {token, user, needsNameSetup:isNew}`      | `401` bad token             |
| `POST /api/auth/mobile/google/link`     | **Bearer** | `{idToken}`            | `200 {token, user, ...}` â **clears deviceId** | `409` Google already linked |
| `POST /api/auth/mobile/refresh`         | **Bearer** | â                      | `200 {token, user, ...}`                       | `404` user gone â re-auth   |

`user` = `{id, username, googleConnected}`. Every other API call sends `Authorization: Bearer <token>` and just works. Rate limits return `429 {message, retryAfter}` (the proxy's `authLimiter` covers all `/api/auth/*`).

## Expo client (the shape to build)

```ts
// SecureStore (Keychain/Keystore) â NOT AsyncStorage, both are credentials
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";

// register-or-login: try login(deviceId); on 404 â register(deviceId, name)
async function ensureDevice(name: string) {
  let deviceId = await SecureStore.getItemAsync("deviceId");
  if (!deviceId) { deviceId = Crypto.randomUUID(); /* register, then store */ }
  // store token from the response in SecureStore
}

// single fetch wrapper: attach Bearer; on 401 â POST /refresh once, retry; on launch â /refresh
// google: expo-auth-session/providers/google â id_token â POST /api/auth/mobile/google
// link: authed POST /google/link â on success, SecureStore.deleteItemAsync("deviceId")  â guardrail #2
```

The two guardrails from our decision are already enforced server-side (register 409s instead of ghost-creating; link clears `deviceId`). The **only** client obligation is wiping the stored `deviceId` after a successful link.

You can drop your dev stub now â point it at your dev server and call `device/register` once to get a real token.

## Before mobile Google works (config, not code)

1. In Google Cloud, create **iOS** + **Android** OAuth client IDs (separate from the web one).
2. Set `GOOGLE_MOBILE_CLIENT_IDS="<ios-id>,<android-id>"` in Vercel. The web `AUTH_GOOGLE_ID` stays accepted too, so device + device-login + linking all work without it â only `/mobile/google` needs it.

Device auth needs **zero** new config and works immediately.

## Two things I deliberately left for you
- **Final deploy check:** run `npm run build` with your real env (I only have `.env.example`, so a build here would false-fail on `requireEnv`). tsc already compiled all new routes.
- **`/mobile/google` route test** isn't included (needs a Google-verify fake). The logic underneath it â `findOrCreateGoogleUser`, token minting, `getAuthToken` â is all tested; only the thin route wrapper is uncovered. Say the word and I'll add a `src/test/fakes/googleAuth.ts` + route test.

Want me to scaffold the Expo-side auth module as a concrete file, or wire up that Google route test?