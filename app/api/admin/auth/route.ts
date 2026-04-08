import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const ADMIN_USER = process.env.ADMIN_USER || "greenhub420";
const ADMIN_PASS = process.env.ADMIN_PASS || "Dd91239123!!";

export async function POST(request: NextRequest) {
  const { username, password } = await request.json().catch(() => ({ username: "", password: "" }));

  if (username !== ADMIN_USER || password !== ADMIN_PASS) {
    return NextResponse.json({ success: false, error: "用户名或密码错误" }, { status: 401 });
  }

  const token = crypto.createHmac("sha256", ADMIN_PASS).update("admin-dashboard-session").digest("hex");
  return NextResponse.json({ success: true, token });
}
