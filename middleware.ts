import { NextRequest, NextResponse } from "next/server";
import { userAgent } from "next/server";

// Only allow UK (GB) and Ireland (IE)
const ALLOWED_COUNTRIES = new Set(["GB", "IE"]);

// Block traffic analysis & scraper bots
const BLOCKED_BOTS = /similarweb|semrush|ahrefs|moz\.com|majestic|serpstat|spyfu|alexa|builtwith|wappalyzer|whatcms|netcraft|censys|shodan|zoomeye|archive\.org|wayback/i;

// Allow search engine crawlers through (SEO)
const SEARCH_ENGINES = /googlebot|bingbot|google-site-verification|google\.com\/bot|yandex|baiduspider|duckduckbot|slurp/i;

function isMobile(request: NextRequest): boolean {
  const { device } = userAgent(request);
  return device.type === "mobile" || device.type === "tablet";
}

export async function middleware(request: NextRequest) {
  const country = request.geo?.country || request.headers.get("x-vercel-ip-country") || "";

  // Allow API routes, static files, and Next.js internals through
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/blocked"
  ) {
    return NextResponse.next();
  }

  const ua = request.headers.get("user-agent") || "";

  // Allow search engine crawlers (Google, Bing, etc.) — needed for SEO
  if (SEARCH_ENGINES.test(ua)) {
    return NextResponse.next();
  }

  // Block traffic analysis & scraper bots
  if (BLOCKED_BOTS.test(ua)) {
    return new NextResponse(null, { status: 404 });
  }

  // Block 1: Non-UK/IE visitors (all devices)
  if (country && !ALLOWED_COUNTRIES.has(country)) {
    return new NextResponse(null, { status: 404 });
  }

  // Block 2: Desktop users — check if desktop is allowed via Strapi setting
  if (!isMobile(request)) {
    try {
      const strapiUrl = process.env.STRAPI_DIRECT_URL || "https://cms.greenhub420.co.uk";
      const res = await fetch(`${strapiUrl}/api/site-setting/public`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!data?.allowDesktop) {
        return new NextResponse(null, { status: 404 });
      }
    } catch {
      // If Strapi is down, block desktop by default
      return new NextResponse(null, { status: 404 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
