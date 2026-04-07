import { NextRequest, NextResponse } from "next/server";
import { resolveServerBase } from "@/lib/server-base";

const STRAPI_ACCOUNT_PATH = "/api/account/withdrawals";
const STRAPI_PROXY_PREFIX = "/api/strapi";

function resolveUpstream(path: string) {
  const direct = process.env.STRAPI_DIRECT_URL?.trim();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (direct) {
    const normalizedDirect = direct.replace(/\/$/, "");
    const target = normalizedDirect.endsWith("/api")
      ? normalizedDirect.slice(0, -4)
      : normalizedDirect;
    return {
      url: `${target}${normalizedPath}`,
      isDirect: true
    };
  }

  const proxyPath = `${STRAPI_PROXY_PREFIX}${normalizedPath}`;
  return {
    url: resolveServerBase(proxyPath, { fallback: proxyPath }),
    isDirect: false
  };
}

function buildHeaders(request: NextRequest, options?: { forceHost?: string }) {
  const headers = new Headers();
  for (const key of ["authorization", "cookie", "accept", "accept-language", "user-agent"]) {
    const value = request.headers.get(key);
    if (value) headers.set(key, value);
  }
  if (options?.forceHost) {
    headers.set("host", new URL(options.forceHost).host);
  }
  return headers;
}

function mapPayload(payload: any) {
  const amount = Number(payload?.amount);
  if (!amount || Number.isNaN(amount)) {
    throw new Error("A valid amount is required");
  }
  const currency = "USDT";
  const method = payload?.payoutMethod === "crypto" ? "usdt_wallet" : payload?.payoutMethod === "bank" ? "uk_bank" : payload?.method;
  const body: Record<string, unknown> = {
    amount,
    currency,
    method,
    note: payload?.note?.trim() || undefined,
  };
  const details = payload?.payoutDetails || {};
  if (method === "uk_bank") {
    body.bankFullName = details.accountName;
    body.bankAccountNumber = details.accountNumber;
    body.bankSortCode = details.sortCode;
  } else if (method === "usdt_wallet") {
    body.usdtNetwork = (details.network || "TRC20").toUpperCase();
    body.usdtAddress = details.address;
  }
  return body;
}

async function handlePost(request: NextRequest) {
  const upstream = resolveUpstream(STRAPI_ACCOUNT_PATH);
  let body: Record<string, unknown>;
  try {
    const incoming = await request.json();
    body = mapPayload(incoming);
  } catch (error: any) {
    return NextResponse.json({ error: { message: error?.message || "Invalid payload" } }, { status: 400 });
  }

  const target = new URL(upstream.url);
  const headers = buildHeaders(request, { forceHost: upstream.isDirect ? upstream.url : undefined });
  headers.set("Content-Type", "application/json");

  const response = await fetch(target, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    redirect: "manual",
  });
  const payload = await response.json().catch(() => ({}));
  if (response.ok) {
    const request = payload?.data ?? payload?.request ?? payload;
    return NextResponse.json({ success: true, request }, { status: 200 });
  }
  return NextResponse.json(payload, { status: response.status });
}

async function handleGet(request: NextRequest) {
  const upstream = resolveUpstream(STRAPI_ACCOUNT_PATH);
  const target = new URL(upstream.url);
  target.search = request.nextUrl.search;
  const headers = buildHeaders(request, { forceHost: upstream.isDirect ? upstream.url : undefined });
  const response = await fetch(target, { method: "GET", headers, redirect: "manual" });
  const payload = await response.json().catch(() => ({}));
  if (response.ok) {
    const request = payload?.data ?? payload?.request ?? payload;
    return NextResponse.json({ success: true, request }, { status: 200 });
  }
  return NextResponse.json(payload, { status: response.status });
}

export async function POST(request: NextRequest) {
  return handlePost(request);
}

export async function GET(request: NextRequest) {
  return handleGet(request);
}
