import { resolveServerBase } from "@/lib/server-base";

const RAW_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";
const FALLBACK_DIRECT = process.env.STRAPI_DIRECT_URL || "http://127.0.0.1:1337";
const API_BASE = RAW_API_BASE ? resolveServerBase(RAW_API_BASE, { fallback: FALLBACK_DIRECT }) : FALLBACK_DIRECT;
const BASES = Array.from(new Set([API_BASE, FALLBACK_DIRECT].filter((value): value is string => Boolean(value))));

let loggedBase = false;

export async function serverFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!loggedBase) {
    console.log(`[serverFetch] bases=${BASES.join(" -> ")}`);
    loggedBase = true;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  let lastError: Error | null = null;

  for (const base of BASES) {
    const needsDedup = /\/api(\/|$)/.test(base) && normalizedPath.startsWith("/api/");
    const dedupedPath = needsDedup ? normalizedPath.replace(/^\/api/, "") : normalizedPath;
    const url = `${base}${dedupedPath}`;

    try {
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
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw lastError ?? new Error("Request failed for all server fetch bases");
}
