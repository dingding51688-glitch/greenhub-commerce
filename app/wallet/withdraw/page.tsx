"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { useAuth } from "@/components/providers/AuthProvider";
import { StateMessage } from "@/components/StateMessage";
import type { WalletBalanceResponse, WithdrawalRequest } from "@/lib/types";
import { swrFetcher } from "@/lib/api";
import { createWithdrawalRequest } from "@/lib/withdrawal-api";

const MIN = 100;
const FEE = 0.03;
const GBP = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

type Method = "bank" | "crypto";

export default function WalletWithdrawPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [step, setStep] = useState(1);
  const [amountInput, setAmountInput] = useState("100");
  const [method, setMethod] = useState<Method>("bank");
  const [bank, setBank] = useState({ accountName: "", accountNumber: "", sortCode: "", reference: "" });
  const [crypto, setCrypto] = useState({ network: "TRC20", address: "" });
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WithdrawalRequest | null>(null);

  const { data: bal } = useSWR<WalletBalanceResponse>(token ? "/api/wallet/balance" : null, swrFetcher, { refreshInterval: 60_000 });
  const available = bal?.transferableBalance ?? 0;
  const amount = parseFloat(amountInput) || 0;
  const fee = amount * FEE;
  const receive = amount - fee;

  if (!token) {
    return <section className="px-4 py-10"><StateMessage title="Please sign in" body="Sign in to withdraw." actionLabel="Login" onAction={() => router.push("/login")} /></section>;
  }

  const handleBankField = (key: string, value: string) => {
    let v = value;
    if (key === "accountNumber") v = value.replace(/\D/g, "").slice(0, 8);
    if (key === "sortCode") {
      const d = value.replace(/\D/g, "").slice(0, 6);
      v = d.length > 4 ? `${d.slice(0, 2)}-${d.slice(2, 4)}-${d.slice(4)}` : d.length > 2 ? `${d.slice(0, 2)}-${d.slice(2)}` : d;
    }
    setBank((p) => ({ ...p, [key]: v }));
  };

  const validate = () => {
    if (step === 1) {
      if (amount < MIN) return `Minimum £${MIN}`;
      if (amount > available) return `Exceeds balance £${available.toFixed(2)}`;
    }
    if (step === 2 && method === "bank") {
      if (!bank.accountName.trim()) return "Enter account name";
      if (!/^\d{8}$/.test(bank.accountNumber)) return "Account number must be 8 digits";
      if (!/^\d{6}$/.test(bank.sortCode.replace(/-/g, ""))) return "Sort code must be 6 digits";
    }
    if (step === 2 && method === "crypto") {
      const addr = crypto.address.trim();
      if (crypto.network === "TRC20" && !/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(addr)) return "Invalid TRC20 address";
      if (crypto.network === "ERC20" && !/^0x[0-9a-fA-F]{40}$/.test(addr)) return "Invalid ERC20 address";
    }
    return null;
  };

  const next = () => { const e = validate(); if (e) { setError(e); return; } setError(null); setStep((s) => Math.min(3, s + 1)); };
  const back = () => { setError(null); setStep((s) => Math.max(1, s - 1)); };

  const submit = async () => {
    setSubmitting(true); setError(null);
    try {
      const details = method === "bank" ? bank : crypto;
      const res = await createWithdrawalRequest({ amount, currency: "GBP", payoutMethod: method, payoutDetails: details as any, note: note.trim() || undefined });
      setResult(res.request);
    } catch (err: any) { setError(err?.message || "Failed"); }
    finally { setSubmitting(false); }
  };

  if (result) {
    return (
      <div className="flex flex-col items-center gap-4 px-4 py-16 text-center">
        <span className="text-5xl">✅</span>
        <h1 className="text-xl font-bold text-white">Request Submitted</h1>
        <p className="text-sm text-white/50">Ref: {result.reference}</p>
        <p className="text-xs text-white/30">We&apos;ll process within 24 hours. You&apos;ll receive a notification.</p>
        <div className="mt-2 grid w-full max-w-xs gap-2">
          <div className="flex justify-between rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2 text-xs">
            <span className="text-white/40">Amount</span><span className="text-white">{GBP.format(result.amount)}</span>
          </div>
          <div className="flex justify-between rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2 text-xs">
            <span className="text-white/40">Fee (3%)</span><span className="text-red-300">-{GBP.format(result.amount * FEE)}</span>
          </div>
          <div className="flex justify-between rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2 text-xs">
            <span className="text-white/40">You receive</span><span className="font-bold text-emerald-300">{GBP.format(result.amount * (1 - FEE))}</span>
          </div>
        </div>
        <div className="mt-4 flex w-full max-w-xs flex-col gap-2">
          <Link href="/wallet/withdraw/history" className="flex min-h-[44px] items-center justify-center rounded-xl border border-white/10 text-sm text-white/60">View History</Link>
          <Link href="/wallet" className="flex min-h-[44px] items-center justify-center text-sm text-white/40 underline">Back to Wallet</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24 sm:space-y-6 sm:pb-20">
      {/* Header */}
      <div>
        <Link href="/wallet" className="text-[10px] uppercase tracking-wider text-white/30 hover:text-white/50">← Wallet</Link>
        <h1 className="mt-1 text-xl font-bold text-white sm:text-2xl">Withdraw</h1>
        <p className="mt-1 text-xs text-white/40">Min £{MIN} · 3% fee · 24h processing</p>
      </div>

      {/* Stepper */}
      <div className="flex gap-1">
        {["Amount", "Method", "Review"].map((label, i) => (
          <div key={label} className={`flex flex-1 items-center gap-1.5 rounded-lg px-2 py-1.5 ${i + 1 === step ? "bg-white/[0.06]" : ""}`}>
            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
              i + 1 < step ? "bg-emerald-400/20 text-emerald-300" : i + 1 === step ? "bg-white/15 text-white" : "bg-white/5 text-white/25"
            }`}>{i + 1 < step ? "✓" : i + 1}</span>
            <span className={`text-[10px] font-medium ${i + 1 === step ? "text-white" : "text-white/30"}`}>{label}</span>
          </div>
        ))}
      </div>

      <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        {/* Step 1: Amount */}
        {step === 1 && (
          <>
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase tracking-wider text-white/40">Withdraw Amount</label>
              <span className="text-[10px] text-white/30">Available: {GBP.format(available)}</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
              <span className="text-lg font-bold text-white/30">£</span>
              <input
                type="number" min={MIN} step="10" value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                className="w-full bg-transparent text-lg font-bold text-white outline-none placeholder:text-white/20"
              />
            </div>
            <div className="flex gap-2">
              {[100, 200, 500, 1000].map((v) => (
                <button key={v} onClick={() => setAmountInput(String(v))}
                  className={`flex-1 rounded-lg border py-2 text-xs font-semibold transition ${amount === v ? "border-amber-400/40 bg-amber-400/10 text-amber-300" : "border-white/10 text-white/40"}`}
                >£{v}</button>
              ))}
            </div>
            {amount >= MIN && (
              <div className="space-y-1 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-xs">
                <div className="flex justify-between"><span className="text-white/40">Amount</span><span className="text-white">{GBP.format(amount)}</span></div>
                <div className="flex justify-between"><span className="text-white/40">Fee (3%)</span><span className="text-red-300">-{GBP.format(fee)}</span></div>
                <div className="flex justify-between border-t border-white/5 pt-1"><span className="text-white/40">You receive</span><span className="font-bold text-emerald-300">{GBP.format(receive)}</span></div>
              </div>
            )}
          </>
        )}

        {/* Step 2: Method */}
        {step === 2 && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setMethod("bank")}
                className={`rounded-xl border px-3 py-3 text-left transition ${method === "bank" ? "border-amber-400/30 bg-amber-400/10" : "border-white/10 bg-white/[0.02]"}`}>
                <span className="text-lg">🏦</span>
                <p className="mt-1 text-xs font-bold text-white">UK Bank</p>
                <p className="text-[9px] text-white/30">Faster Payments</p>
              </button>
              <button onClick={() => setMethod("crypto")}
                className={`rounded-xl border px-3 py-3 text-left transition ${method === "crypto" ? "border-amber-400/30 bg-amber-400/10" : "border-white/10 bg-white/[0.02]"}`}>
                <span className="text-lg">₿</span>
                <p className="mt-1 text-xs font-bold text-white">USDT</p>
                <p className="text-[9px] text-white/30">TRC20 / ERC20</p>
              </button>
            </div>

            {method === "bank" ? (
              <div className="space-y-3">
                {[
                  { key: "accountName", label: "Account Name", ph: "John Smith" },
                  { key: "accountNumber", label: "Account Number", ph: "12345678" },
                  { key: "sortCode", label: "Sort Code", ph: "12-34-56" },
                  { key: "reference", label: "Reference (optional)", ph: "Payment ref" },
                ].map(({ key, label, ph }) => (
                  <div key={key}>
                    <label className="text-[10px] uppercase tracking-wider text-white/40">{label}</label>
                    <input value={(bank as any)[key]} onChange={(e) => handleBankField(key, e.target.value)} placeholder={ph}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/25" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-white/40">Network</label>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    {["TRC20", "ERC20"].map((n) => (
                      <button key={n} onClick={() => setCrypto((p) => ({ ...p, network: n }))}
                        className={`rounded-lg border py-2 text-xs font-semibold ${crypto.network === n ? "border-amber-400/30 bg-amber-400/10 text-white" : "border-white/10 text-white/40"}`}
                      >USDT {n}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-white/40">Wallet Address</label>
                  <input value={crypto.address} onChange={(e) => setCrypto((p) => ({ ...p, address: e.target.value }))}
                    placeholder={crypto.network === "TRC20" ? "T..." : "0x..."}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 font-mono text-sm text-white outline-none placeholder:text-white/20 focus:border-white/25" />
                </div>
              </div>
            )}
          </>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <>
            <p className="text-sm font-bold text-white">Confirm Withdrawal</p>
            <div className="space-y-1 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-xs">
              <div className="flex justify-between"><span className="text-white/40">Amount</span><span className="text-white">{GBP.format(amount)}</span></div>
              <div className="flex justify-between"><span className="text-white/40">Fee (3%)</span><span className="text-red-300">-{GBP.format(fee)}</span></div>
              <div className="flex justify-between border-t border-white/5 pt-1"><span className="text-white/40">You receive</span><span className="font-bold text-emerald-300">{GBP.format(receive)}</span></div>
            </div>
            <div className="space-y-1 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-xs">
              <p className="text-[10px] uppercase tracking-wider text-white/40">{method === "bank" ? "Bank Details" : "Crypto Wallet"}</p>
              {method === "bank" ? (
                <>
                  <div className="flex justify-between"><span className="text-white/40">Name</span><span className="text-white">{bank.accountName}</span></div>
                  <div className="flex justify-between"><span className="text-white/40">Account</span><span className="font-mono text-white">{bank.accountNumber}</span></div>
                  <div className="flex justify-between"><span className="text-white/40">Sort Code</span><span className="font-mono text-white">{bank.sortCode}</span></div>
                  {bank.reference && <div className="flex justify-between"><span className="text-white/40">Ref</span><span className="text-white">{bank.reference}</span></div>}
                </>
              ) : (
                <>
                  <div className="flex justify-between"><span className="text-white/40">Network</span><span className="text-white">{crypto.network}</span></div>
                  <div className="flex justify-between"><span className="text-white/40">Address</span><span className="font-mono text-white text-[10px] break-all">{crypto.address}</span></div>
                </>
              )}
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-white/40">Note (optional)</label>
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Message to team"
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/20" />
            </div>
          </>
        )}

        {/* Error */}
        {error && <div className="rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs text-red-200">{error}</div>}

        {/* Actions */}
        <div className="flex gap-2">
          {step > 1 && (
            <button onClick={back} className="flex-1 min-h-[44px] rounded-xl border border-white/10 text-sm text-white/50">Back</button>
          )}
          {step < 3 ? (
            <button onClick={next} className="flex-1 min-h-[44px] rounded-xl bg-amber-500/80 text-sm font-bold text-white transition hover:bg-amber-500">Continue</button>
          ) : (
            <button onClick={submit} disabled={submitting} className="flex-1 min-h-[44px] rounded-xl bg-amber-500/80 text-sm font-bold text-white transition hover:bg-amber-500 disabled:opacity-40">
              {submitting ? "Submitting…" : `Withdraw ${GBP.format(amount)}`}
            </button>
          )}
        </div>
      </div>

      {/* History link */}
      <Link href="/wallet/withdraw/history" className="block text-center text-xs text-white/30 underline">Withdrawal History</Link>
    </div>
  );
}
