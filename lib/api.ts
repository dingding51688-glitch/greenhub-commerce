import { getStoredToken } from "@/lib/auth-store";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const API_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN;
const DEV_CUSTOMER_ID = process.env.NEXT_PUBLIC_DEV_CUSTOMER_ID;

const withDevCustomerId = (path: string) => {
  if (!DEV_CUSTOMER_ID) return path;
  try {
    const url = new URL(path, "https://placeholder.local");
    if (!url.searchParams.has("customerId")) {
      url.searchParams.set("customerId", DEV_CUSTOMER_ID);
    }
    return url.pathname + url.search;
  } catch {
    return path;
  }
};

const PUBLIC_ENDPOINT_PREFIXES = ["/api/products", "/api/collections"];

/**
 * Next.js internal API route prefixes — requests to these paths should go
 * directly to the Next.js server (same origin), NOT through the Strapi
 * proxy.  Adding NEXT_PUBLIC_API_BASE_URL (/api/strapi) would produce
 * double-prefixed URLs like /api/strapi/api/account/transfer → 405.
 */
const NEXTJS_ROUTE_PREFIXES = [
  "/api/account/",
  "/api/auth/",
  "/api/wallet/",
  "/api/payments/",
  "/api/referral/",
];

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured");
  }

  const finalPath = withDevCustomerId(path.startsWith("/") ? path : `/${path}`);
  const headers = new Headers(init?.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  const runtimeToken = getStoredToken();
  const authToken = runtimeToken || API_TOKEN;
  const shouldSkipAuth = PUBLIC_ENDPOINT_PREFIXES.some((prefix) => finalPath.startsWith(prefix));
  if (!shouldSkipAuth && authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  // If the path targets a Next.js internal API route, call it directly
  // without the Strapi proxy base URL prefix.
  const isNextRoute = NEXTJS_ROUTE_PREFIXES.some((prefix) => finalPath.startsWith(prefix));

  let url: string;
  if (isNextRoute) {
    url = finalPath;
  } else {
    const normalizedBase = normalizeBase(BASE_URL);
    const needsDedup = /\/api\/?$/.test(normalizedBase) && finalPath.startsWith("/api/");
    const dedupedPath = needsDedup ? finalPath.replace(/^\/api/, "") : finalPath;
    url = `${normalizedBase}${dedupedPath}`;
  }

  const response = await fetch(url, {
    ...init,
    headers,
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error?.message || response.statusText || "Request failed";
    const error = new Error(message) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return payload as T;
}

function normalizeBase(value?: string) {
  if (!value) return "";
  let base = value.trim();
  if (!base) return base;
  base = base.replace(/\/$/, "");
  // Collapse accidental double "/api/api" segments (e.g. when env already includes /api)
  while (base.includes("/api/api")) {
    base = base.replace("/api/api", "/api");
  }
  return base;
}

export const swrFetcher = <T>(path: string) => apiFetch<T>(path);
export async function apiMutate<T>(path: string, method: 'POST' | 'PUT', body?: unknown) {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  const init: RequestInit = {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  };
  return apiFetch<T>(path, init);
}
