import { resolveServerBase } from "@/lib/server-base";

const RAW_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";
const FALLBACK_DIRECT = process.env.STRAPI_DIRECT_URL || "http://127.0.0.1:1337";
const API_BASE = RAW_API_BASE ? resolveServerBase(RAW_API_BASE, { fallback: FALLBACK_DIRECT }) : FALLBACK_DIRECT;

let loggedBase = false;

export async function serverFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!loggedBase) {
    console.log(`[serverFetch] base=${API_BASE}`);
    loggedBase = true;
  }
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const needsDedup = /\/api(\/|$)/.test(API_BASE) && normalizedPath.startsWith("/api/");
  const dedupedPath = needsDedup ? normalizedPath.replace(/^\/api/, "") : normalizedPath;
  const url = `${API_BASE}${dedupedPath}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers || {})
    },
    cache: "no-store"
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Request failed: ${res.status} ${url} ${errorText}`);
  }

  return res.json() as Promise<T>;
}
