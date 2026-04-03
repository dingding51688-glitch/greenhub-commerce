import { NextResponse } from "next/server";
import { createPayment, getPaymentStatus } from "@/lib/nowpayments";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.amount || !body?.orderId || !body?.payCurrency) {
    return NextResponse.json({ error: "amount, orderId, payCurrency required" }, { status: 400 });
  }
  try {
    const payment = await createPayment({
      amount: Number(body.amount),
      orderId: body.orderId,
      payCurrency: body.payCurrency,
      priceCurrency: body.priceCurrency
    });
    return NextResponse.json(payment);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Unable to create NowPayments invoice" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const paymentId = searchParams.get("paymentId");
  if (!paymentId) {
    return NextResponse.json({ error: "paymentId required" }, { status: 400 });
  }
  try {
    const status = await getPaymentStatus(paymentId);
    return NextResponse.json(status);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Unable to fetch payment status" }, { status: 500 });
  }
}
