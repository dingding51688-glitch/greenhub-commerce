import { resolveServerBase } from "@/lib/server-base";

const RAW_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";
const FALLBACK_DIRECT = process.env.STRAPI_DIRECT_URL || "https://cms.greenhub420.co.uk";
const API_BASE = RAW_API_BASE ? resolveServerBase(RAW_API_BASE, { fallback: FALLBACK_DIRECT }) : FALLBACK_DIRECT;

export async function serverFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${API_BASE}${normalizedPath}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers || {})
    },
    cache: "no-store"
  });

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}
