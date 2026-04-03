const API_KEY = process.env.NOWPAYMENTS_API_KEY;
const BASE_URL = process.env.NOWPAYMENTS_BASE_URL || "https://api.nowpayments.io/v1";
const PRICE_CURRENCY = process.env.NOWPAYMENTS_PRICE_CURRENCY || "GBP";
const IPN_URL = process.env.NOWPAYMENTS_IPN_URL || `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/api/payments/nowpayments/ipn`;

if (!API_KEY) {
  console.warn("NOWPAYMENTS_API_KEY is not set. Payment creation will fail.");
}

async function nowFetch(path: string, init?: RequestInit) {
  if (!BASE_URL) throw new Error("NOWPAYMENTS_BASE_URL missing");
  const url = `${BASE_URL.replace(/\/$/, "")}${path}`;
  const headers = new Headers(init?.headers);
  headers.set("x-api-key", API_KEY ?? "");
  headers.set("Content-Type", "application/json");
  const response = await fetch(url, { ...init, headers, cache: "no-store" });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.message || payload?.error || response.statusText;
    throw new Error(message || "NOWPayments request failed");
  }
  return payload;
}

export type NowPaymentsCreatePayload = {
  amount: number;
  orderId: string | number;
  payCurrency: string;
  priceCurrency?: string;
};

export type NowPaymentsCreateResponse = {
  payment_id: number;
  payment_status: string;
  pay_address: string;
  pay_amount: string;
  pay_currency: string;
  price_amount: string;
  price_currency: string;
  invoice_url: string;
  order_id: string;
  qr_code?: string;
  updated_at?: string;
};

export async function createPayment({ amount, orderId, payCurrency, priceCurrency = PRICE_CURRENCY }: NowPaymentsCreatePayload) {
  if (!API_KEY) throw new Error("NOWPayments API key missing");
  const body = {
    price_amount: amount,
    price_currency: priceCurrency,
    pay_currency: payCurrency,
    order_id: String(orderId),
    ipn_callback_url: IPN_URL
  };
  return nowFetch("/payment", { method: "POST", body: JSON.stringify(body) }) as Promise<NowPaymentsCreateResponse>;
}

export async function getPaymentStatus(paymentId: string | number) {
  if (!API_KEY) throw new Error("NOWPayments API key missing");
  return nowFetch(`/payment/${paymentId}`, { method: "GET" });
}
