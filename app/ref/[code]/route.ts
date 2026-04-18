import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { code?: string } }
) {
  const code = params.code?.trim();
  if (!code) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  const url = new URL("/", request.url);
  url.searchParams.set("ref", code);
  return NextResponse.redirect(url, 307);
}
