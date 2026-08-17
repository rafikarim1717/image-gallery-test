import { cookies } from "next/headers";
import { TOKEN_COOKIE } from "./constants";

// For Server Components / route handlers only — reads the cookie Next.js
// itself set, no verification here. The backend is what actually validates
// the JWT on every request; this is just "is there a session at all".
export async function getServerToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(TOKEN_COOKIE)?.value ?? null;
}
