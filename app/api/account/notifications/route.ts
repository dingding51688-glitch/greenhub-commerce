import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_TOKEN_KEY } from "@/lib/auth-store";
import { resolveServerBase } from "@/lib/server-base";

const DIRECT_STRAPI_BASE = process.env.STRAPI_DIRECT_URL?.trim().replace(/\/$/, "");
const RAW_AUTH_BASE = process.env.NEXT_PUBLIC_AUTH_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";
const AUTH_BASE = DIRECT_STRAPI_BASE || (RAW_AUTH_BASE ? resolveServerBase(RAW_AUTH_BASE) : "");

function ensureBase() {
  if (!AUTH_BASE) {
    throw new Error("NEXT_PUBLIC_AUTH_BASE_URL missing");
  }
}

function getToken() {
  return cookies().get(AUTH_TOKEN_KEY)?.value;
}

export async function GET() {
  ensureBase();
  const token = getToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const response = await fetch(`${AUTH_BASE}/api/notifications`, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    cache: "no-store"
  });
  const payload = await response.json().catch(() => ({}));
  return NextResponse.json(payload, { status: response.status });
}

export async function PUT(request: Request) {
  ensureBase();
  const token = getToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const action = body?.action === "markAll" ? "mark-all-read" : "mark-read";
  const payloadToSend =
    action === "mark-all-read"
      ? {}
      : {
          notificationIds: Array.isArray(body?.notificationIds) ? body.notificationIds : []
        };
  const response = await fetch(`${AUTH_BASE}/api/notifications/${action}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payloadToSend)
  });
  const payload = await response.json().catch(() => ({}));
  return NextResponse.json(payload, { status: response.status });
}
