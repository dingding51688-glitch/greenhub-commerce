import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_TOKEN_KEY } from "@/lib/auth-store";

const AUTH_BASE = process.env.NEXT_PUBLIC_AUTH_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;

function ensureBase() {
  if (!AUTH_BASE) {
    throw new Error("NEXT_PUBLIC_AUTH_BASE_URL missing");
  }
}

function getToken() {
  return cookies().get(AUTH_TOKEN_KEY)?.value;
}

async function fetchCustomer(token: string) {
  const response = await fetch(`${AUTH_BASE}/api/customers/me`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 0 }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message || "Unable to load profile");
  }
  return payload;
}

function extractMetadata(payload: any) {
  const attributes = payload?.data?.attributes ?? payload?.attributes ?? payload ?? {};
  return attributes.metadata ?? {};
}

export async function GET() {
  ensureBase();
  const token = getToken();
  if (!token) {
    return NextResponse.json({ favorites: [] }, { status: 200 });
  }
  try {
    const payload = await fetchCustomer(token);
    const metadata = extractMetadata(payload);
    return NextResponse.json({ favorites: metadata.favorites ?? [] }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ favorites: [] }, { status: 200 });
  }
}

export async function POST(request: Request) {
  ensureBase();
  const token = getToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const favorite = body?.favorite;
  if (!favorite?.productId) {
    return NextResponse.json({ error: "favorite payload required" }, { status: 400 });
  }
  const payload = await fetchCustomer(token);
  const metadata = extractMetadata(payload);
  const favorites = Array.isArray(metadata.favorites) ? metadata.favorites : [];
  const filtered = favorites.filter((item: any) => item?.productId !== favorite.productId);
  const updated = [{ ...favorite, addedAt: new Date().toISOString() }, ...filtered];
  const nextMetadata = { ...metadata, favorites: updated };
  const response = await fetch(`${AUTH_BASE}/api/customers/me`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ metadata: nextMetadata })
  });
  const updatePayload = await response.json().catch(() => ({}));
  if (!response.ok) {
    return NextResponse.json(updatePayload, { status: response.status });
  }
  return NextResponse.json({ favorites: updated }, { status: 200 });
}

export async function DELETE(request: Request) {
  ensureBase();
  const token = getToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const productId = body?.productId;
  if (!productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }
  const payload = await fetchCustomer(token);
  const metadata = extractMetadata(payload);
  const favorites = Array.isArray(metadata.favorites) ? metadata.favorites : [];
  const updated = favorites.filter((item: any) => item?.productId !== productId);
  const nextMetadata = { ...metadata, favorites: updated };
  const response = await fetch(`${AUTH_BASE}/api/customers/me`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ metadata: nextMetadata })
  });
  const updatePayload = await response.json().catch(() => ({}));
  if (!response.ok) {
    return NextResponse.json(updatePayload, { status: response.status });
  }
  return NextResponse.json({ favorites: updated }, { status: 200 });
}
