"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button, Input } from "@/components/ui";
import { swrFetcher } from "@/lib/api";
import { StateMessage } from "@/components/StateMessage";
import { createTopupIntent, pollTopupStatus } from "@/lib/wallet-api";
import type { TopupIntentMeta, TopupRecord } from "@/lib/types";

const MIN_TRANSFER_GBP = 20;
const doneStatuses = new Set(["confirmed", "failed", "expired", "refunded"]);

export default function WalletTopupPage() {
  const router = useRouter();
  const { token, profile } = useAuth();
  const [amountInput, setAmountInput] = useState("100");
  const [chain, setChain] = useState<"TRC20" | "ERC20">("TRC20");
  const [intent, setIntent] = useState<TopupIntentMeta | null>(null);
  const [status, setStatus] = useState<TopupRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amount = parseFloat(amountInput) || 0;
  const amountInvalid = amount < MIN_TRANSFER_GBP;

  // Build deep link for Telegram bot — use transferHandle (the real GH-xxx shown to user)
  const { data: cpData } = useSWR(token ? "/api/account/profile" : null, swrFetcher);
  const transferHandle = (cpData as any)?.data?.attributes?.transferHandle;
  const rawId = profile?.customer?.documentId || profile?.documentId;
  const ghId = transferHandle || (rawId ? `GH-${rawId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(-8).padStart(8, "0")}` : "");
  const botDeepLink = `https://t.me/greenhubTopup_bot?start=topup_${Math.round(amount)}_${ghId}`;

  const handleStart = async () => {
    if (!token) { router.push("/login"); return; }
    if (amountInvalid) { setError(`Minimum top-up is £${MIN_TRANSFER_GBP}`); return; }
    try {
      setSubmitting(true); setError(null); setStatus(null);
      const response = await createTopupIntent({ amount, chain });
      setIntent(response.topup);
      const latest = await pollTopupStatus(response.topup.id).catch(() => null);
      if (latest) setStatus({ ...latest, id: response.topup.id });
    } catch (err) {
      setError((err as Error).message || "Failed to create invoice");
    } finally { setSubmitting(false); }
  };

  useEffect(() => {
    if (!intent) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const poll = async () => {
      try {
        const latest = await pollTopupStatus(intent.id);
        if (cancelled) return;
        setStatus({ ...latest, id: intent.id });
        if (!doneStatuses.has(latest.status)) timer = setTimeout(poll, 7000);
      } catch { if (!cancelled) timer = setTimeout(poll, 12000); }
    };
    poll();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [intent]);

  const countdown = useCountdown(status?.expiresAt);
  const paymentDetails = useMemo(() => {
    if (!intent) return null;
    return {
      invoiceUrl: intent.invoiceUrl || status?.invoiceUrl,
      qrCode: status?.qrCode ?? null,
      payAddress: status?.payAddress ?? null,
      payAmount: status?.amountCrypto ?? intent.amount,
      payCurrency: status?.cryptoCurrency ?? status?.network ?? chain,
      priceAmount: status?.amountFiat ?? intent.amount,
      priceCurrency: status?.fiatCurrency ?? "GBP",
    };
  }, [intent, status, chain]);

  if (!token) {
    return (
      <section className="px-4 py-10">
        <StateMessage title="Please sign in" body="Sign in to top up your wallet." actionLabel="Go to login" onAction={() => router.push("/login")} />
      </section>
    );
  }

  return (
    <div className="space-y-4 pb-24 sm:space-y-6 sm:pb-20">
      {/* Header */}
      <div>
        <Link href="/wallet" className="text-[10px] uppercase tracking-wider text-white/30 hover:text-white/50">← Wallet</Link>
        <h1 className="mt-1 text-xl font-bold text-white sm:text-2xl">Top Up</h1>
        <p className="mt-1 text-xs text-white/40">Choose your preferred method to add funds</p>
      </div>

      {/* ── Method Tabs ── */}
      <div className="grid grid-cols-2 gap-2">
        {/* Crypto - active */}
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-center">
          <span className="text-2xl">₿</span>
          <p className="mt-1 text-xs font-bold text-emerald-300">Crypto (USDT)</p>
          <p className="text-[9px] text-emerald-300/60">Instant · Auto-confirm</p>
        </div>
        {/* Bank - links to Telegram */}
        <a
          href={botDeepLink}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-2xl border border-blue-400/20 bg-blue-400/5 px-4 py-3 text-center transition hover:bg-blue-400/10"
        >
          <span className="text-2xl">🏦</span>
          <p className="mt-1 text-xs font-bold text-blue-300">Bank Transfer</p>
          <p className="text-[9px] text-blue-300/60">Open Telegram Bot →</p>
        </a>
      </div>

      {/* ── Bank Transfer Notice ── */}
      <a
        href={botDeepLink}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 rounded-2xl border border-blue-400/15 bg-blue-400/5 px-4 py-3 transition hover:bg-blue-400/10"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-400/15 text-xl">🤖</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-blue-200">Bank transfer top-up?</p>
          <p className="text-[11px] text-blue-300/60">Open our Telegram bot — it will guide you step by step</p>
        </div>
        <span className="shrink-0 text-white/30">→</span>
      </a>

      {/* ── Crypto Top Up Form ── */}
      <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <p className="text-sm font-bold text-white">Crypto Top Up</p>

        {/* Amount */}
        <div>
          <label className="text-[10px] uppercase tracking-wider text-white/40">Amount (GBP)</label>
          <div className="mt-1 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
            <span className="text-lg font-bold text-white/30">£</span>
            <input
              type="number"
              step="1"
              min={MIN_TRANSFER_GBP}
              placeholder={`Min ${MIN_TRANSFER_GBP}`}
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className="w-full bg-transparent text-lg font-bold text-white outline-none placeholder:text-white/20"
            />
          </div>
          {amountInvalid && <p className="mt-1 text-[11px] text-amber-300">Minimum £{MIN_TRANSFER_GBP}</p>}
        </div>

        {/* Quick amounts */}
        <div className="flex gap-2">
          {[50, 100, 200, 500].map((v) => (
            <button
              key={v}
              onClick={() => setAmountInput(String(v))}
              className={`flex-1 rounded-lg border py-2 text-xs font-semibold transition ${
                amount === v ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300" : "border-white/10 text-white/40 hover:text-white/60"
              }`}
            >
              £{v}
            </button>
          ))}
        </div>

        {/* Network */}
        <div>
          <label className="text-[10px] uppercase tracking-wider text-white/40">Network</label>
          <div className="mt-1 grid grid-cols-2 gap-2">
            {(["TRC20", "ERC20"] as const).map((net) => (
              <button
                key={net}
                onClick={() => setChain(net)}
                className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                  chain === net
                    ? "border-emerald-400/40 bg-emerald-400/10 text-white"
                    : "border-white/10 text-white/40 hover:text-white/60"
                }`}
              >
                USDT {net}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        {error && <p className="text-xs text-red-300">{error}</p>}
        <button
          onClick={handleStart}
          disabled={submitting || amountInvalid}
          className="flex w-full min-h-[48px] items-center justify-center rounded-xl cta-gradient text-sm font-bold uppercase tracking-wider text-white disabled:opacity-50"
        >
          {submitting ? "Generating…" : `Generate Invoice · £${amount.toFixed(0)}`}
        </button>
      </div>

      {/* ── Invoice Panel ── */}
      {intent && paymentDetails && (
        <InvoicePanel intent={intent} status={status} countdown={countdown} payment={paymentDetails} />
      )}

      {/* ── How it works ── */}
      <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3">
        <p className="text-xs font-bold text-white/60">How crypto top-up works</p>
        <div className="mt-2 space-y-2">
          {[
            { step: "1", icon: "💷", text: "Enter amount in GBP" },
            { step: "2", icon: "📱", text: "Generate NowPayments invoice" },
            { step: "3", icon: "💸", text: "Pay with USDT — scan QR or copy address" },
            { step: "4", icon: "✅", text: "Balance credits automatically once confirmed" },
          ].map(({ step, icon, text }) => (
            <div key={step} className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-xs font-bold text-white/40">{step}</span>
              <span className="text-xs text-white/50">{icon} {text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Invoice Panel ── */

function InvoicePanel({
  intent, status, countdown, payment,
}: {
  intent: TopupIntentMeta;
  status: TopupRecord | null;
  countdown: string | null;
  payment: {
    invoiceUrl?: string | null; qrCode?: string | null; payAddress?: string | null;
    payAmount: number; payCurrency?: string | null; priceAmount: number; priceCurrency: string;
  };
}) {
  const [copied, setCopied] = useState<string | null>(null);
  const paymentStatus = status?.status ?? "pending";
  const success = ["finished", "confirmed", "completed"].includes(paymentStatus);
  const qrSrc = payment.qrCode || (payment.payAddress ? `https://chart.googleapis.com/chart?chs=240x240&cht=qr&chl=${encodeURIComponent(payment.payAddress)}` : null);

  const copy = async (val: string, label: string) => {
    try { await navigator.clipboard.writeText(val); setCopied(label); setTimeout(() => setCopied(null), 2000); } catch {}
  };

  return (
    <div className="space-y-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[9px] uppercase tracking-wider text-emerald-300/50">Invoice</p>
          <p className="font-mono text-sm font-bold text-white">{intent.orderCode}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
          success ? "bg-emerald-400/20 text-emerald-300" : "bg-amber-400/20 text-amber-300"
        }`}>
          {paymentStatus.replace(/_/g, " ")}
        </span>
      </div>

      {/* Amount info */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
          <p className="text-[9px] text-white/30">Amount</p>
          <p className="text-sm font-bold text-white">£{payment.priceAmount.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
          <p className="text-[9px] text-white/30">Pay</p>
          <p className="text-sm font-bold text-white">{payment.payAmount} {payment.payCurrency?.toUpperCase()}</p>
        </div>
      </div>

      {/* QR Code */}
      {qrSrc && (
        <div className="flex justify-center rounded-xl border border-white/10 bg-white p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrSrc} alt="QR" className="h-40 w-40" />
        </div>
      )}

      {/* Address */}
      {payment.payAddress && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[9px] uppercase tracking-wider text-white/30">Pay address</p>
          <p className="mt-1 break-all font-mono text-[11px] text-white">{payment.payAddress}</p>
          <div className="mt-2 flex gap-2">
            <button onClick={() => copy(payment.payAddress!, "addr")} className={`rounded-lg border border-white/10 px-3 py-1.5 text-[10px] font-semibold ${copied === "addr" ? "text-emerald-300" : "text-white/50"}`}>
              {copied === "addr" ? "Copied!" : "Copy address"}
            </button>
            <button onClick={() => copy(String(payment.payAmount), "amt")} className={`rounded-lg border border-white/10 px-3 py-1.5 text-[10px] font-semibold ${copied === "amt" ? "text-emerald-300" : "text-white/50"}`}>
              {copied === "amt" ? "Copied!" : "Copy amount"}
            </button>
          </div>
        </div>
      )}

      {/* Open payment page */}
      {(payment.invoiceUrl || intent.invoiceUrl) && (
        <a
          href={payment.invoiceUrl || intent.invoiceUrl || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-[44px] items-center justify-center rounded-xl border border-white/15 text-sm font-semibold text-white hover:bg-white/[0.05]"
        >
          Open payment page →
        </a>
      )}

      {countdown && <p className="text-center text-[11px] text-white/40">Expires in {countdown}</p>}
      {success && <p className="text-center text-xs font-semibold text-emerald-300">✅ Payment confirmed — balance updating</p>}
    </div>
  );
}

/* ── Countdown hook ── */

function useCountdown(target?: string | null) {
  const [value, setValue] = useState<string | null>(null);
  useEffect(() => {
    if (!target) { setValue(null); return; }
    const update = () => {
      const diff = Math.max(0, new Date(target).getTime() - Date.now());
      if (diff <= 0) { setValue("0s"); return; }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setValue(`${m}m ${s.toString().padStart(2, "0")}s`);
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [target]);
  return value;
}
