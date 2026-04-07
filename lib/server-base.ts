const ABSOLUTE_URL_REGEX = /^https?:\/\//i;
const STRAPI_PROXY_PREFIX = "/api/strapi";

function resolveInternalOrigin() {
  const candidates = [
    process.env.NEXT_INTERNAL_BASE_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_VERCEL_URL && `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`,
    process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`
  ];
  for (const candidate of candidates) {
    if (candidate && candidate.trim()) {
      return candidate.trim();
    }
  }
  return "http://localhost:3000";
}

function resolveStrapiDirect(path: string) {
  const direct = process.env.STRAPI_DIRECT_URL?.trim();
  if (!direct) return null;
  const normalizedDirect = direct.replace(/\/$/, "");
  const baseOrigin = normalizedDirect.endsWith("/api")
    ? normalizedDirect.slice(0, -4)
    : normalizedDirect;
  const suffix = path.startsWith(STRAPI_PROXY_PREFIX)
    ? path.slice(STRAPI_PROXY_PREFIX.length)
    : path;
  const normalizedSuffix = suffix.startsWith("/") ? suffix : `/${suffix}`;
  return `${baseOrigin}${normalizedSuffix}`.replace(/\/$/, "");
}

export function resolveServerBase(value?: string | null, options?: { fallback?: string }) {
  const raw = value?.trim();
  if (!raw) {
    return (options?.fallback || "").replace(/\/$/, "");
  }

  if (ABSOLUTE_URL_REGEX.test(raw)) {
    return raw.replace(/\/$/, "");
  }

  const origin = resolveInternalOrigin().replace(/\/$/, "");
  const normalizedPath = raw.startsWith("/") ? raw : `/${raw}`;
  return `${origin}${normalizedPath}`.replace(/\/$/, "");
}
