"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button, Input, Textarea } from "@/components/ui";
import { StateMessage } from "@/components/StateMessage";
import { createTopupIntent, pollTopupStatus } from "@/lib/wallet-api";
import type { TopupIntentMeta, TopupRecord } from "@/lib/types";

const MIN_TRANSFER_GBP = 20;
const doneStatuses = new Set(["confirmed", "failed", "expired", "refunded"]);

export default function WalletTopupPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [amountInput, setAmountInput] = useState("100");
  const [chain, setChain] = useState<"TRC20" | "ERC20">("TRC20");
  const [intent, setIntent] = useState<TopupIntentMeta | null>(null);
  const [status, setStatus] = useState<TopupRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amount = parseFloat(amountInput) || 0;
  const amountInvalid = amount < MIN_TRANSFER_GBP;

  const handleStart = async () => {
    if (!token) { router.push("/login"); return; }
    if (amountInvalid) { setError(`Minimum top-up is £${MIN_TRANSFER_GBP}`); return; }
    try {
      setSubmitting(true);
      setError(null);
      setStatus(null);
      const response = await createTopupIntent({ amount, chain });
      setIntent(response.topup);
      const latest = await pollTopupStatus(response.topup.id).catch(() => null);
      if (latest) setStatus({ ...latest, id: response.topup.id });
    } catch (err) {
      setError((err as Error).message || "Failed to create NowPayments link");
    } finally {
      setSubmitting(false);
    }
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
      } catch {
        if (!cancelled) timer = setTimeout(poll, 12000);
      }
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
        <StateMessage
          title="请先登录"
          body="登录后即可创建 NowPayments 充值单。"
          actionLabel="去登录"
          onAction={() => router.push("/login")}
        />
      </section>
    );
  }

  return (
    <section className="space-y-6 px-4 py-8">
      {/* ── Hero ── */}
      <header className="space-y-2">
        <Link href="/wallet" className="text-xs text-white/40 hover:text-white/60">← Back to wallet</Link>
        <h1 className="text-2xl font-semibold text-white sm:text-3xl">Top up via NowPayments</h1>
        <p className="text-sm leading-relaxed text-white/70">
          Enter an amount (minimum £{MIN_TRANSFER_GBP}), choose your network, and we&apos;ll generate a NowPayments invoice with QR code. Once confirmed, your balance updates automatically.
        </p>
      </header>

      {/* ── How it works ── */}
      <div className="rounded-2xl border border-white/10 bg-night-950/60 p-4 text-sm leading-relaxed text-white/70 sm:rounded-3xl sm:p-5">
        <p className="font-semibold text-white">How it works</p>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5">
          <li>Enter an amount in GBP below.</li>
          <li>Click &ldquo;Generate invoice&rdquo; to create a NowPayments link.</li>
          <li>Pay using your crypto wallet — scan the QR or copy the address.</li>
          <li>Status updates in real time; balance credits once confirmed.</li>
        </ol>
        <Button asChild variant="ghost" size="sm" className="mt-3 min-h-[44px] w-full sm:w-auto">
          <Link href="/guide/payment">Read full payment guide</Link>
        </Button>
      </div>

      {/* ── Form + Side panel ── */}
      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        {/* Main form card */}
        <div className="space-y-6 rounded-3xl border border-white/10 bg-card p-4 sm:p-6">
          {/* Step 1: Amount */}
          <section className="space-y-3">
            <p className="text-base font-semibold text-white sm:text-lg">1. Enter amount</p>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4">
              <Input
                type="number"
                step="1"
                min={MIN_TRANSFER_GBP}
                placeholder={`Min £${MIN_TRANSFER_GBP}`}
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                className="min-h-[44px] text-base"
              />
              <span className="shrink-0 text-sm font-medium text-white/60">GBP</span>
            </div>
            {amountInvalid ? (
              <p className="text-sm text-amber-300">Minimum top-up is £{MIN_TRANSFER_GBP}.</p>
            ) : (
              <p className="text-xs text-white/50">You&apos;ll pay the equivalent in USDT via NowPayments.</p>
            )}
          </section>

          {/* Step 2: Network */}
          <section className="space-y-3">
            <p className="text-base font-semibold text-white sm:text-lg">2. Choose network</p>
            <div className="flex gap-3">
              {(["TRC20", "ERC20"] as const).map((net) => (
                <button
                  key={net}
                  onClick={() => setChain(net)}
                  className={`flex-1 rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                    chain === net
                      ? "border-white bg-white/10 text-white"
                      : "border-white/10 text-white/60 hover:border-white/30"
                  }`}
                >
                  USDT {net}
                </button>
              ))}
            </div>
          </section>

          {/* Step 3: Generate */}
          <section className="space-y-3">
            <p className="text-base font-semibold text-white sm:text-lg">3. Generate invoice</p>
            {error && <p className="text-sm text-amber-400">{error}</p>}
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
              <Button
                onClick={handleStart}
                disabled={submitting || amountInvalid}
                className="w-full min-h-[48px] text-base sm:w-auto"
              >
                {submitting ? "Generating…" : "Create NowPayments invoice"}
              </Button>
              <Button asChild variant="secondary" className="w-full min-h-[48px] text-base sm:w-auto">
                <Link href="/wallet">Back to wallet</Link>
              </Button>
            </div>
          </section>

          {/* Invoice panel */}
          <NowPaymentsPanel
            intent={intent}
            status={status}
            countdown={countdown}
            payment={paymentDetails}
            paymentStatus={status?.status ?? null}
          />
        </div>

        {/* Side panel — hidden on small screens until invoice created */}
        <aside className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/80 sm:p-5">
          <h2 className="text-base font-semibold text-white sm:text-lg">Need help?</h2>
          <p className="text-sm leading-relaxed text-white/70">Share your invoice code or screenshot with support if you need manual review.</p>
          <Textarea
            readOnly
            value={`Amount: £${amount.toFixed(2)}\nFlow: NowPayments (USDT ${chain})`}
            className="min-h-[80px] text-sm"
          />
          <Link href="/notifications" className="inline-flex min-h-[44px] w-full items-center justify-center rounded-2xl border border-white/15 text-sm text-white/70 hover:border-white/40">
            Check notifications
          </Link>
        </aside>
      </div>
    </section>
  );
}

/* ── NowPayments Panel ── */

function NowPaymentsPanel({
  intent,
  status,
  countdown,
  payment,
  paymentStatus,
}: {
  intent: TopupIntentMeta | null;
  status: TopupRecord | null;
  countdown: string | null;
  payment: {
    invoiceUrl?: string | null;
    qrCode?: string | null;
    payAddress?: string | null;
    payAmount: number;
    payCurrency?: string | null;
    priceAmount: number;
    priceCurrency: string;
  } | null;
  paymentStatus: string | null;
}) {
  if (!intent || !payment) {
    return (
      <div className="rounded-2xl border border-white/15 bg-white/5 p-4 text-sm text-white/60">
        Click &ldquo;Create NowPayments invoice&rdquo; above to generate a payment link.
      </div>
    );
  }

  const normalizedStatus = paymentStatus?.replace(/_/g, " ") || status?.status?.replace(/_/g, " ") || "pending";
  const success = paymentStatus ? ["finished", "confirmed", "completed"].includes(paymentStatus) : status?.status === "confirmed";
  const qrSrc = payment.qrCode || (payment.payAddress ? `https://chart.googleapis.com/chart?chs=240x240&cht=qr&chl=${encodeURIComponent(payment.payAddress)}` : null);
  const invoiceAmount = typeof status?.amountFiat === "number" ? status.amountFiat : payment.priceAmount;

  const copyValue = async (value: string) => {
    try { await navigator.clipboard.writeText(value); } catch { /* noop */ }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm text-white sm:rounded-3xl">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-white/60">Invoice</p>
          <p className="text-lg font-semibold">{intent.orderCode}</p>
        </div>
        <Link
          href={payment.invoiceUrl || intent.invoiceUrl || "#"}
          target="_blank"
          className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/30 px-5 text-sm font-semibold text-white hover:border-white/60"
        >
          Open payment page
        </Link>
      </div>

      {/* Status grid */}
      <dl className="grid grid-cols-2 gap-2 text-xs text-white/80 sm:grid-cols-3">
        <div>
          <dt className="text-[11px] uppercase tracking-wider text-white/40">Status</dt>
          <dd className="text-sm font-semibold capitalize text-white">{normalizedStatus}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-wider text-white/40">Fiat</dt>
          <dd className="text-sm font-semibold text-white">{payment.priceCurrency} {payment.priceAmount.toFixed(2)}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-wider text-white/40">Crypto</dt>
          <dd className="text-sm font-semibold text-white">{payment.payAmount} {payment.payCurrency?.toUpperCase()}</dd>
        </div>
      </dl>

      {/* Address + QR */}
      <div className="grid gap-3 sm:grid-cols-[2fr,1fr]">
        <div className="space-y-2 rounded-2xl border border-white/15 bg-white/5 p-3 text-xs text-white/80">
          <p className="text-[11px] uppercase tracking-wider text-white/40">Pay address</p>
          <p className="break-all font-mono text-sm text-white">{payment.payAddress || "—"}</p>
          <div className="flex gap-3 text-[11px]">
            <button
              className="text-emerald-300 underline disabled:text-white/30"
              onClick={() => payment.payAddress && copyValue(payment.payAddress)}
              disabled={!payment.payAddress}
            >
              Copy address
            </button>
            <button className="text-emerald-300 underline" onClick={() => copyValue(String(payment.payAmount))}>
              Copy amount
            </button>
          </div>
        </div>
        {qrSrc && (
          <div className="flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrSrc} alt="Payment QR" className="h-28 w-28 sm:h-32 sm:w-32" />
          </div>
        )}
      </div>

      {/* Extra status */}
      {status && (
        <dl className="grid grid-cols-2 gap-2 text-xs text-white/80 sm:grid-cols-3">
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-white/40">Top-up status</dt>
            <dd className="text-sm font-semibold capitalize text-white">{(status.status || "pending").replace(/_/g, " ")}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-white/40">Network</dt>
            <dd className="text-sm font-semibold text-white">{status.network || payment.payCurrency}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-white/40">Invoice</dt>
            <dd className="text-sm font-semibold text-white">£{invoiceAmount.toFixed(2)}</dd>
          </div>
        </dl>
      )}

      {countdown && <p className="text-xs text-white/60">Invoice expires in {countdown}</p>}
      {success && <p className="text-xs text-emerald-200">✅ Payment confirmed. Balance will update shortly.</p>}
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
