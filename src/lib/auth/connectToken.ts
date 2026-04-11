/**
 * Shared constants for the Google connect-token flow.
 *
 * The connect token is issued by `POST /api/users/google/connect-token` to an
 * already-authenticated device user and stored both on the user document and
 * in an httpOnly cookie on the requesting browser. The NextAuth `jwt` callback
 * only merges a Google sign-in into an existing device user when the cookie
 * token matches the stored connectToken exactly — this prevents a concurrent
 * attacker from hijacking a pending link flow.
 */
export const CONNECT_TOKEN_COOKIE = "hosej_connect_token";
export const CONNECT_TOKEN_TTL_SECONDS = 5 * 60;
