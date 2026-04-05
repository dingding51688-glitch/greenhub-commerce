import { NextRequest, NextResponse } from "next/server";

const STRAPI_DIRECT_URL_VALUE = process.env.STRAPI_DIRECT_URL;

if (!STRAPI_DIRECT_URL_VALUE) {
  throw new Error("STRAPI_DIRECT_URL is not configured");
}

const STRAPI_DIRECT_URL = STRAPI_DIRECT_URL_VALUE as string;

function buildHeaders(request: NextRequest) {
  const headers = new Headers();
  for (const key of ["authorization", "cookie", "accept", "accept-language", "user-agent"]) {
    const value = request.headers.get(key);
    if (value) headers.set(key, value);
  }
  headers.set("host", new URL(STRAPI_DIRECT_URL).host);
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
  let body: Record<string, unknown>;
  try {
    const incoming = await request.json();
    body = mapPayload(incoming);
  } catch (error: any) {
    return NextResponse.json({ error: { message: error?.message || "Invalid payload" } }, { status: 400 });
  }

  const target = new URL("/api/account/withdrawals", STRAPI_DIRECT_URL);
  const headers = buildHeaders(request);
  headers.set("Content-Type", "application/json");

  const upstream = await fetch(target, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    redirect: "manual",
  });
  const payload = await upstream.json().catch(() => ({}));
  if (upstream.ok) {
    const request = payload?.data ?? payload?.request ?? payload;
    return NextResponse.json({ success: true, request }, { status: 200 });
  }
  return NextResponse.json(payload, { status: upstream.status });
}

async function handleGet(request: NextRequest) {
  const target = new URL("/api/account/withdrawals", STRAPI_DIRECT_URL);
  target.search = request.nextUrl.search;
  const headers = buildHeaders(request);
  const upstream = await fetch(target, { method: "GET", headers, redirect: "manual" });
  const payload = await upstream.json().catch(() => ({}));
  if (upstream.ok) {
    const request = payload?.data ?? payload?.request ?? payload;
    return NextResponse.json({ success: true, request }, { status: 200 });
  }
  return NextResponse.json(payload, { status: upstream.status });
}

export async function POST(request: NextRequest) {
  return handlePost(request);
}

export async function GET(request: NextRequest) {
  return handleGet(request);
}
