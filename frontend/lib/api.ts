import type { ApiErrorBody } from "./types";

// Browser calls (client components) must hit the host-facing URL.
const PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
// Server-side calls (Server Components, Route Handlers) run inside the
// frontend container, so they reach the backend over the Docker network by
// service name — localhost there would mean the frontend container itself.
const INTERNAL_API_URL = process.env.INTERNAL_API_URL || PUBLIC_API_URL;

function getApiBaseUrl() {
  return typeof window === "undefined" ? INTERNAL_API_URL : PUBLIC_API_URL;
}

export class ApiError extends Error {
  status: number;
  body: ApiErrorBody | null;

  constructor(status: number, body: ApiErrorBody | null) {
    const message = body ? (Array.isArray(body.message) ? body.message.join(", ") : body.message) : `Request failed (${status})`;
    super(message);
    this.status = status;
    this.body = body;
  }
}

interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  token?: string | null;
  body?: BodyInit | Record<string, unknown> | null;
}

// Thin wrapper around fetch: resolves the right base URL for
// server-vs-client, attaches the bearer token, JSON-encodes plain object
// bodies (FormData is passed through untouched for uploads), and throws
// ApiError with the backend's message on non-2xx responses.
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { token, headers, body, ...rest } = options;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const isPlainBody = body != null && !isFormData && typeof body === "object";

  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    ...rest,
    body: isPlainBody ? JSON.stringify(body) : (body as BodyInit | null | undefined),
    headers: {
      ...(isPlainBody ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    let errorBody: ApiErrorBody | null = null;
    try {
      errorBody = await res.json();
    } catch {
      // backend didn't return JSON, fall back to a generic message
    }
    throw new ApiError(res.status, errorBody);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}
