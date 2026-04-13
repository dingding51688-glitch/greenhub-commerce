import { NextRequest, NextResponse } from "next/server";
import { userAgent } from "next/server";

// Only allow UK (GB) and Ireland (IE)
const ALLOWED_COUNTRIES = new Set(["GB", "IE"]);

function isMobile(request: NextRequest): boolean {
  const { device } = userAgent(request);
  return device.type === "mobile" || device.type === "tablet";
}

export function middleware(request: NextRequest) {
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

  // Block 1: Non-UK/IE visitors (all devices)
  if (country && !ALLOWED_COUNTRIES.has(country)) {
    return NextResponse.rewrite(new URL("/blocked", request.url));
  }

  // Block 2: Desktop users (even in UK/IE) — mobile only
  if (!isMobile(request)) {
    return NextResponse.rewrite(new URL("/blocked", request.url));
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
