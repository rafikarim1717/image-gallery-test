// Shared by both server-only and client-only code, so this file must not
// import next/headers or touch `document`.
export const TOKEN_COOKIE = "token";
export const TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days
