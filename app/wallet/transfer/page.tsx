"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { useAuth } from "@/components/providers/AuthProvider";
import { StateMessage } from "@/components/StateMessage";
import { swrFetcher, apiMutate } from "@/lib/api";
import type { WalletBalanceResponse } from "@/lib/types";

const GBP = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

export default function WalletTransferPage() {
  const { token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [handle, setHandle] = useState(searchParams.get("to") || "");
  const [amountInput, setAmountInput] = useState("");
  const [memo, setMemo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ amount: number; to: string } | null>(null);

  const { data: bal } = useSWR<WalletBalanceResponse>(token ? "/api/wallet/balance" : null, swrFetcher);
  const transferable = bal?.transferableBalance ?? 0;
  const amount = parseFloat(amountInput) || 0;

  useEffect(() => {
    const to = searchParams.get("to");
    if (to && !handle) setHandle(to);
  }, [searchParams, handle]);

  if (!token) {
    return (
      <section className="px-4 py-10">
        <StateMessage variant="auth" title="Please sign in" body="Sign in to transfer funds between wallets." actionLabel="Sign In" onAction={() => router.push("/login")} />
      </section>
    );
  }

  const onSubmit = async () => {
    if (!handle.trim()) { setError("Enter recipient ID"); return; }
    if (amount < 20) { setError("Minimum £20"); return; }
    if (amount > transferable) { setError(`Exceeds transferable balance £${transferable.toFixed(2)}`); return; }
    setError(null);
    setSubmitting(true);
    try {
      await apiMutate("/api/account/transfers", "POST", {
        toHandle: handle.trim(),
        amount,
        memo: memo.trim() || undefined,
      });
      setSuccess({ amount, to: handle.trim() });
    } catch (err: any) {
      setError(err?.message || "Transfer failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 px-4 py-16 text-center">
        <span className="text-5xl">✅</span>
        <h1 className="text-xl font-bold text-white">Transfer Sent</h1>
        <p className="text-sm text-white/50">{GBP.format(success.amount)} → {success.to}</p>
        <div className="mt-4 flex w-full max-w-xs flex-col gap-2">
          <button onClick={() => router.push("/wallet")} className="min-h-[44px] rounded-xl cta-gradient text-sm font-bold text-white">Back to Wallet</button>
          <button onClick={() => { setSuccess(null); setHandle(""); setAmountInput(""); setMemo(""); }} className="min-h-[44px] rounded-xl border border-white/10 text-sm text-white/50">Another Transfer</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24 sm:space-y-6 sm:pb-20">
      {/* Header */}
      <div>
        <Link href="/wallet" className="text-[10px] uppercase tracking-wider text-white/30 hover:text-white/50">← Wallet</Link>
        <h1 className="mt-1 text-xl font-bold text-white sm:text-2xl">Transfer</h1>
      </div>

      {/* Balance info */}
      {bal && (
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <div>
            <p className="text-[9px] uppercase tracking-wider text-white/30">Transferable</p>
            <p className="text-lg font-bold text-white">{GBP.format(transferable)}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] uppercase tracking-wider text-white/30">Bonus (locked)</p>
            <p className="text-sm text-white/40">{GBP.format(bal.bonusBalance ?? 0)}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        {/* Recipient */}
        <div>
          <label className="text-[10px] uppercase tracking-wider text-white/40">Recipient User ID</label>
          <input
            type="text"
            placeholder="GH-XXXXXXXX"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-mono text-white outline-none placeholder:text-white/20 focus:border-white/25"
          />
        </div>

        {/* Amount */}
        <div>
          <label className="text-[10px] uppercase tracking-wider text-white/40">Amount (£)</label>
          <div className="mt-1 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
            <span className="text-lg font-bold text-white/30">£</span>
            <input
              type="number"
              step="1"
              min="1"
              placeholder="0"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className="w-full bg-transparent text-lg font-bold text-white outline-none placeholder:text-white/20"
            />
          </div>
        </div>

        {/* Quick amounts */}
        <div className="flex gap-2">
          {[20, 50, 100, 200].map((v) => (
            <button
              key={v}
              onClick={() => setAmountInput(String(v))}
              className={`flex-1 rounded-lg border py-2 text-xs font-semibold transition ${
                amount === v ? "border-blue-400/40 bg-blue-400/10 text-blue-300" : "border-white/10 text-white/40"
              }`}
            >
              £{v}
            </button>
          ))}
        </div>

        {/* Memo */}
        <div>
          <label className="text-[10px] uppercase tracking-wider text-white/40">Note (optional)</label>
          <input
            type="text"
            placeholder="e.g. splitting an order"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/25"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs text-red-200">{error}</div>
        )}

        {/* Submit */}
        <button
          onClick={onSubmit}
          disabled={submitting || !handle.trim() || amount < 1}
          className="flex w-full min-h-[48px] items-center justify-center rounded-xl bg-blue-500/80 text-sm font-bold text-white transition hover:bg-blue-500 disabled:opacity-40"
        >
          {submitting ? "Transferring…" : amount > 0 ? `Transfer £${amount.toFixed(0)} →` : "Transfer"}
        </button>
      </div>

      {/* Info */}
      <div className="rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3 text-[11px] text-white/30">
        <p>• Transfers are instant and free</p>
        <p>• Bonus balance cannot be transferred</p>
        <p>• Minimum transfer: £20</p>
      </div>
    </div>
  );
}
