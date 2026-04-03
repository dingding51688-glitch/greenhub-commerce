import { NextResponse } from "next/server";

const mockDevices = [
  { id: 1, device: "iPhone 15 Pro", location: "Belfast, UK", lastActive: new Date().toISOString(), current: true },
  { id: 2, device: "MacBook Air", location: "Derry, UK", lastActive: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), current: false },
  { id: 3, device: "Chrome on Windows", location: "London, UK", lastActive: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), current: false }
];

export async function GET() {
  return NextResponse.json({ devices: mockDevices }, { status: 200 });
}

export async function DELETE(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { id } = body || {};
  if (!id) {
    return NextResponse.json({ error: "Device id required" }, { status: 400 });
  }
  return NextResponse.json({ ok: true, id }, { status: 200 });
}
