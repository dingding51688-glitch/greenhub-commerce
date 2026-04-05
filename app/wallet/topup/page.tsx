"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button, Input, Textarea } from "@/components/ui";
import { StateMessage } from "@/components/StateMessage";
import { TransferIdNotice } from "@/components/wallet/TransferIdNotice";
import { createTopupIntent, pollTopupStatus } from "@/lib/wallet-api";
import type { TopupIntentMeta, TopupRecord } from "@/lib/types";
import { deriveTransferId } from "@/lib/wallet-utils";

const MIN_TRANSFER_GBP = 20;
const doneStatuses = new Set(["confirmed", "failed", "expired", "refunded"]);

export default function WalletTopupPage() {
  const router = useRouter();
  const { token, profile } = useAuth();
  const transferId = deriveTransferId(profile);
  const [amountInput, setAmountInput] = useState("100");
  const [chain, setChain] = useState<"TRC20" | "ERC20">("TRC20");
  const [intent, setIntent] = useState<TopupIntentMeta | null>(null);
  const [status, setStatus] = useState<TopupRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amount = parseFloat(amountInput) || 0;
  const amountInvalid = amount < MIN_TRANSFER_GBP;

  const handleStart = async () => {
    if (!token) {
      router.push("/login");
      return;
    }
    if (amountInvalid) {
      setError(`Minimum top-up is £${MIN_TRANSFER_GBP}`);
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      setStatus(null);
      const response = await createTopupIntent({ amount, chain });
      setIntent(response.topup);
      const latest = await pollTopupStatus(response.topup.id).catch(() => null);
      if (latest) {
        setStatus({ ...latest, id: response.topup.id });
      }
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
        if (!doneStatuses.has(latest.status)) {
          timer = setTimeout(poll, 7000);
        }
      } catch (err) {
        if (!cancelled) {
          timer = setTimeout(poll, 12000);
        }
      }
    };

    poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
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
      priceCurrency: status?.fiatCurrency ?? "GBP"
    };
  }, [intent, status, chain]);

  const paymentStatusLabel = status?.status ?? null;

  if (!token) {
    return (
      <section className="space-y-6 px-4 py-10">
        <StateMessage
          title="Sign in required"
          body="Log in to create a NowPayments invoice."
          actionLabel="Go to login"
          onAction={() => router.push("/login")}
        />
      </section>
    );
  }

  return (
    <section className="space-y-8 px-4 py-10">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Wallet</p>
        <h1 className="text-3xl font-semibold text-white">Top up via NowPayments</h1>
        <p className="text-sm text-white/70">Enter an amount (minimum £20) and we’ll generate a NowPayments link and QR code. Once the invoice shows as confirmed your balance updates automatically.</p>
      </header>

      <TransferIdNotice transferId={transferId} />

      <div className="rounded-3xl border border-white/10 bg-night-950/60 p-4 text-sm text-white/70">
        <p className="font-semibold text-white">Need a refresher?</p>
        <p className="mt-1">The payment guide covers every step of creating and paying a NowPayments invoice.</p>
        <Button asChild variant="ghost" size="sm" className="mt-3">
          <Link href="/guide/payment">Read payment guide</Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-6 rounded-3xl border border-white/10 bg-card p-6">
          <section className="space-y-3">
            <p className="text-lg font-semibold text-white">1. Enter amount</p>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <Input
                type="number"
                step="1"
                min={MIN_TRANSFER_GBP}
                placeholder="Amount (£)"
                value={amountInput}
                onChange={(event) => setAmountInput(event.target.value)}
              />
              <span className="text-sm text-white/60">GBP</span>
            </div>
            <div className="text-xs text-white/60">
              {amountInvalid ? (
                <p className="text-amber-300">Minimum top-up is £{MIN_TRANSFER_GBP}.</p>
              ) : (
                <p>Minimum transfer is £{MIN_TRANSFER_GBP}. Use the Transfer ID above in every reference.</p>
              )}
            </div>
          </section>

          <section className="space-y-3">
            <p className="text-lg font-semibold text-white">2. Confirm NowPayments details</p>
            <p className="text-sm text-white/70">We’ll generate a NowPayments invoice and QR code. Pay it with your preferred wallet and the status will update in real time.</p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/70">
              <label className="flex items-center gap-2">
                <input type="radio" checked={chain === "TRC20"} onChange={() => setChain("TRC20")} />
                USDT TRC20
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" checked={chain === "ERC20"} onChange={() => setChain("ERC20")} />
                USDT ERC20
              </label>
            </div>
          </section>

          <section className="space-y-3">
            <p className="text-lg font-semibold text-white">3. Generate payment link</p>
            {error && <p className="text-sm text-amber-400">{error}</p>}
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleStart} disabled={submitting || amountInvalid}>
                {submitting ? "Generating…" : "Create NowPayments invoice"}
              </Button>
              <Link href="/wallet" className="rounded-full border border-white/20 px-5 py-2 text-sm text-white/70">
                Back to wallet
              </Link>
            </div>
          </section>

          <NowPaymentsPanel
            intent={intent}
            status={status}
            countdown={countdown}
            payment={paymentDetails}
            paymentStatus={paymentStatusLabel}
          />
        </div>

        <aside className="space-y-5 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/80">
          <h2 className="text-lg font-semibold text-white">Need help?</h2>
          <p className="text-sm text-white/70">Share your invoice code or screenshot with support if you need manual review.</p>
          <Textarea
            readOnly
            value={`Amount: £${amount.toFixed(2)}\nFlow: NowPayments (USDT ${chain})`}
          />
          <Link href="/notifications" className="block rounded-2xl border border-white/15 px-4 py-2 text-center text-sm text-white/70 hover:border-white/40">
            Check notifications
          </Link>
        </aside>
      </div>
    </section>
  );
}

function NowPaymentsPanel({ intent, status, countdown, payment, paymentStatus }: { intent: TopupIntentMeta | null; status: TopupRecord | null; countdown: string | null; payment: { invoiceUrl?: string | null; qrCode?: string | null; payAddress?: string | null; payAmount: number; payCurrency?: string | null; priceAmount: number; priceCurrency: string } | null; paymentStatus: string | null }) {
  if (!intent || !payment) {
    return (
      <div className="rounded-2xl border border-white/15 bg-white/5 p-4 text-sm text-white/70">
        <p>Click “Create NowPayments invoice” to generate a payment link.</p>
      </div>
    );
  }

  const normalizedStatus = paymentStatus ? paymentStatus.replace(/_/g, " ") : status?.status?.replace(/_/g, " ") || "pending";
  const success = paymentStatus ? ["finished", "confirmed", "completed"].includes(paymentStatus) : status?.status === "confirmed";
  const qrSrc = payment.qrCode || (payment.payAddress ? `https://chart.googleapis.com/chart?chs=240x240&cht=qr&chl=${encodeURIComponent(payment.payAddress)}` : null);
  const topupStatusText = paymentStatus
    ? paymentStatus.replace(/_/g, " ")
    : status?.status
      ? status.status.replace(/_/g, " ")
      : "pending";
  const invoiceAmount = typeof status?.amountFiat === "number" ? status.amountFiat : payment.priceAmount;

  const copyValue = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch (error) {
      console.warn("Clipboard unavailable", error);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm text-white">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/70">Invoice</p>
          <p className="text-lg font-semibold">{intent.orderCode}</p>
        </div>
        <Link
          href={payment.invoiceUrl || intent.invoiceUrl || "#"}
          target="_blank"
          className="rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white hover:border-white/60"
        >
          Open payment page
        </Link>
      </div>
      <dl className="grid gap-2 text-xs text-white/80 sm:grid-cols-3">
        <div>
          <dt className="uppercase tracking-[0.3em] text-white/40">Status</dt>
          <dd className="text-sm font-semibold capitalize text-white">{normalizedStatus}</dd>
        </div>
        <div>
          <dt className="uppercase tracking-[0.3em] text-white/40">Fiat amount</dt>
          <dd className="text-sm font-semibold text-white">
            {payment.priceCurrency} {payment.priceAmount.toFixed(2)}
          </dd>
        </div>
        <div>
          <dt className="uppercase tracking-[0.3em] text-white/40">Crypto amount</dt>
          <dd className="text-sm font-semibold text-white">
            {payment.payAmount} {payment.payCurrency?.toUpperCase()}
          </dd>
        </div>
      </dl>
      <div className="grid gap-4 sm:grid-cols-[2fr,1fr]">
        <div className="space-y-2 rounded-2xl border border-white/15 bg-white/5 p-3 text-xs text-white/80">
          <p className="text-[11px] uppercase tracking-[0.3em] text-white/40">Pay address</p>
          <p className="font-mono text-sm text-white break-all">{payment.payAddress || "—"}</p>
          <div className="flex gap-3 text-[11px]">
            <button
              className="text-emerald-300 underline disabled:text-white/30"
              onClick={() => payment.payAddress && copyValue(payment.payAddress)}
              disabled={!payment.payAddress}
            >
              Copy address
            </button>
            <button className="text-emerald-300 underline" onClick={() => copyValue(String(payment.payAmount))}>Copy amount</button>
          </div>
        </div>
        {qrSrc && (
          <div className="flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrSrc} alt="Payment QR" className="h-32 w-32" />
          </div>
        )}
      </div>
      {status && (
        <dl className="grid gap-2 text-xs text-white/80 sm:grid-cols-3">
          <div>
          <dt className="uppercase tracking-[0.3em] text-white/40">Top-up status</dt>
          <dd className="text-sm font-semibold capitalize text-white">{topupStatusText}</dd>
        </div>
        <div>
          <dt className="uppercase tracking-[0.3em] text-white/40">Network</dt>
          <dd className="text-sm font-semibold text-white">{status.network || payment.payCurrency}</dd>
        </div>
        <div>
          <dt className="uppercase tracking-[0.3em] text-white/40">Invoice amount</dt>
          <dd className="text-sm font-semibold text-white">£{invoiceAmount.toFixed(2)}</dd>
        </div>
      </dl>
    )}
      {countdown && <p className="text-xs text-white/60">Invoice expires in {countdown}</p>}
      {success && (
        <p className="text-xs text-emerald-200">Payment confirmed. Balance will update shortly.</p>
      )}
    </div>
  );
}

function useCountdown(target?: string | null) {
  const [value, setValue] = useState<string | null>(null);
  useEffect(() => {
    if (!target) {
      setValue(null);
      return;
    }
    const update = () => {
      const diff = Math.max(0, new Date(target).getTime() - Date.now());
      if (diff <= 0) {
        setValue("0s");
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setValue(`${minutes}m ${seconds.toString().padStart(2, "0")}s`);
      }
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [target]);
  return value;
}
