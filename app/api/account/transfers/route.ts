import { NextRequest, NextResponse } from "next/server";

const STRAPI_DIRECT_URL = process.env.STRAPI_DIRECT_URL || process.env.NEXT_PUBLIC_AUTH_BASE_URL || "http://localhost:1338";

function buildStrapiUrl(req: NextRequest) {
  const upstream = new URL(STRAPI_DIRECT_URL!);
  const basePath = upstream.pathname.replace(/\/$/, "");
  const apiBase = basePath.endsWith("/api") ? basePath : `${basePath}/api`;
  const search = req.nextUrl.search || "";
  upstream.pathname = `${apiBase}/account/transfers`.replace(/\/+/g, "/");
  upstream.search = search;
  return upstream.toString();
}

async function proxyRequest(req: NextRequest, method: "GET" | "POST") {
  const upstreamUrl = buildStrapiUrl(req);
  const headers = new Headers();

  for (const [key, value] of req.headers.entries()) {
    if (key === "host" || key === "content-length") continue;
    headers.set(key, value);
  }

  const fetchInit: RequestInit = {
    method,
    headers,
    cache: "no-store",
  };

  if (method === "POST") {
    const bodyText = await req.text();
    fetchInit.body = bodyText;
  }

  const upstreamResponse = await fetch(upstreamUrl, fetchInit);
  const contentType = upstreamResponse.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    const jsonBody = await upstreamResponse.json().catch(() => null);
    return NextResponse.json(jsonBody ?? {}, { status: upstreamResponse.status });
  }

  const buffer = await upstreamResponse.arrayBuffer();
  return new NextResponse(buffer, {
    status: upstreamResponse.status,
    headers: contentType ? { "content-type": contentType } : undefined,
  });
}

export async function POST(req: NextRequest) {
  return proxyRequest(req, "POST");
}

export async function GET(req: NextRequest) {
  return proxyRequest(req, "GET");
}
