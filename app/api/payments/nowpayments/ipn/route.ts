import crypto from "node:crypto";
import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
const API_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN;
const IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET;

async function updateTopup(orderId: string, status: string, payload: any) {
  if (!API_BASE || !API_TOKEN) return;
  const url = `${API_BASE.replace(/\/$/, "")}/api/wallet/topups/${orderId}`;
  await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_TOKEN}`
    },
    body: JSON.stringify({ status, paymentId: payload?.payment_id, txHash: payload?.payment_id })
  }).catch((error) => console.error("Failed to update topup", error));
}

export async function POST(request: Request) {
  if (!IPN_SECRET) {
    console.warn("NOWPAYMENTS_IPN_SECRET missing");
  }
  const rawBody = await request.text();
  const signature = request.headers.get("x-nowpayments-sig") || "";
  if (IPN_SECRET) {
    const expected = crypto.createHmac("sha512", IPN_SECRET).update(rawBody).digest("hex");
    if (expected !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }
  const payload = JSON.parse(rawBody || "{}");
  const paymentStatus = String(payload.payment_status || payload.status || "").toLowerCase();
  const orderId = payload.order_id || payload.orderId;
  if (orderId) {
    if (["finished", "confirmed", "completed"].includes(paymentStatus)) {
      await updateTopup(orderId, "confirmed", payload);
    } else if (["failed", "expired", "partially_paid", "refunded"].includes(paymentStatus)) {
      await updateTopup(orderId, paymentStatus, payload);
    }
  }
  return NextResponse.json({ success: true });
}
