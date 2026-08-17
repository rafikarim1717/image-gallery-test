"use client";

import { TOKEN_COOKIE, TOKEN_MAX_AGE_SECONDS } from "./constants";

// Non-httpOnly on purpose (see README): Server Components need to read it
// for SSR (next/headers), and client components need to read it too, to
// call the backend directly from the browser (click counter, filters).
// Advanced auth hardening (CSRF, XSS mitigation) is explicitly out of scope.
export function setClientToken(token: string) {
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${TOKEN_MAX_AGE_SECONDS}; samesite=lax`;
}

export function clearClientToken() {
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0; samesite=lax`;
}

export function getClientToken(): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${TOKEN_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// UI-only convenience (B5: hide edit/delete unless the viewer owns the
// image) — decodes the JWT payload locally instead of a network round trip.
// Never trust this for authorization: the backend independently re-checks
// ownership on every mutation and 403s regardless of what the UI shows.
export function getCurrentUserId(): string | null {
  const token = getClientToken();
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json).sub ?? null;
  } catch {
    return null;
  }
}
