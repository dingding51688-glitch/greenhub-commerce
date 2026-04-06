import { NextRequest, NextResponse } from "next/server";

const STRAPI_DIRECT_URL = process.env.STRAPI_DIRECT_URL || "";

function ensureStrapiUrl(reference: string) {
  const upstream = new URL(STRAPI_DIRECT_URL || process.env.NEXT_PUBLIC_AUTH_BASE_URL || "http://localhost:1338");
  const basePath = upstream.pathname.replace(/\/$/, "");
  const apiBase = basePath.endsWith("/api") ? basePath : `${basePath}/api`;
  upstream.pathname = `${apiBase}/orders/${encodeURIComponent(reference)}/tracking`.replace(/\/+/g, "/");
  return upstream.toString();
}

export async function GET(req: NextRequest, { params }: { params: { reference: string } }) {
  const reference = params?.reference;
  if (!reference) {
    return NextResponse.json({ error: "Order reference is required" }, { status: 400 });
  }

  const upstreamUrl = ensureStrapiUrl(reference);

  const headers = new Headers();
  const authHeader = req.headers.get("authorization");
  if (authHeader) headers.set("authorization", authHeader);
  const cookieHeader = req.headers.get("cookie");
  if (cookieHeader) headers.set("cookie", cookieHeader);

  const upstreamResponse = await fetch(upstreamUrl, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  const responseBody = await upstreamResponse.text();
  const responseHeaders = new Headers();
  const contentType = upstreamResponse.headers.get("content-type");
  if (contentType) {
    responseHeaders.set("content-type", contentType);
  }

  return new NextResponse(responseBody, {
    status: upstreamResponse.status,
    headers: responseHeaders,
  });
}
