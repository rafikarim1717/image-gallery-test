import { NextRequest, NextResponse } from "next/server";
import { TOKEN_COOKIE } from "./lib/constants";

// C3.3: the gallery (and everything that hangs off it) is reachable only
// after login. Direct access without a session redirects to /login.
// Next.js 16 renamed "Middleware" to "Proxy" (same mechanism, new name) —
// this is only an optimistic check (cookie presence); the backend still
// verifies the JWT on every request.
export function proxy(request: NextRequest) {
  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/gallery/:path*", "/images/:path*", "/upload/:path*"],
};
