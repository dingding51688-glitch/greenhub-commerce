"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button, Input, Textarea } from "@/components/ui";
import { StateMessage } from "@/components/StateMessage";

import type { WalletBalanceResponse, WithdrawalRequest } from "@/lib/types";
import { swrFetcher } from "@/lib/api";
import { createWithdrawalRequest } from "@/lib/withdrawal-api";


const MIN_WITHDRAWAL = 100;
const FEE_PERCENT = 0.03; // 3% handling fee

const payoutConfigs = {
  bank: {
    label: "Bank transfer (GBP)",
    description: "Payout to a UK Faster Payments account.",
    fields: [
      { key: "accountName", label: "Account name", placeholder: "John Smith", required: true },
      { key: "accountNumber", label: "Account number", placeholder: "12345678", required: true, maxLength: 8, inputMode: "numeric" as const },
      { key: "sortCode", label: "Sort code", placeholder: "00-00-00", required: true, maxLength: 8, inputMode: "numeric" as const },
      { key: "reference", label: "Reference", placeholder: "Payment reference", required: false }
    ]
  },
  crypto: {
    label: "USDT transfer",
    description: "Send to your USDT wallet (TRC20 / ERC20).",
    fields: [
      { key: "network", label: "Network", placeholder: "", required: true, type: "select" as const, options: ["TRC20", "ERC20"] },
      { key: "address", label: "Wallet address", placeholder: "T... or 0x...", required: true }
    ]
  },
} as const;

type MethodId = keyof typeof payoutConfigs;

export default function WalletWithdrawPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [step, setStep] = useState(1);
  const [amountInput, setAmountInput] = useState("100");
  const [method, setMethod] = useState<MethodId>("bank");
  const [bankDetails, setBankDetails] = useState({ accountName: "", accountNumber: "", sortCode: "", reference: "" });
  const [cryptoDetails, setCryptoDetails] = useState({ network: "TRC20", address: "" });
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WithdrawalRequest | null>(null);

  const { data: balanceData, error: balanceError } = useSWR<WalletBalanceResponse>(
    token ? "/api/wallet/balance" : null,
    swrFetcher,
    { refreshInterval: 60_000 }
  );

  const available = balanceData?.balance ?? 0;
  const amount = parseFloat(amountInput) || 0;
  const fee = Math.max(0, amount * FEE_PERCENT);
  const receiveAmount = Math.max(0, amount - fee);
  const amountValid = amount >= MIN_WITHDRAWAL && amount <= available;

  const detailsState = useMemo(() => {
    switch (method) {
      case "bank":
        return bankDetails;
      case "crypto":
      default:
        return cryptoDetails;
    }
  }, [method, bankDetails, cryptoDetails]);
  const detailsRecord = detailsState as Record<string, string>;

  const handleFieldChange = (key: string, value: string) => {
    if (method === "bank") {
      let sanitized = value;
      if (key === "accountNumber") {
        sanitized = value.replace(/[^0-9]/g, "").slice(0, 8);
      } else if (key === "sortCode") {
        // Allow digits and dashes only, auto-format as XX-XX-XX
        const digits = value.replace(/[^0-9]/g, "").slice(0, 6);
        if (digits.length > 4) sanitized = `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
        else if (digits.length > 2) sanitized = `${digits.slice(0, 2)}-${digits.slice(2)}`;
        else sanitized = digits;
      }
      setBankDetails((prev) => ({ ...prev, [key]: sanitized }));
    } else {
      setCryptoDetails((prev) => ({ ...prev, [key]: value }));
    }
  };

  const handleNext = () => {
    if (step === 1 && !amountValid) {
      setError(`Minimum transfer is £${MIN_WITHDRAWAL} (available £${available.toFixed(2)})`);
      return;
    }
    if (step === 2) {
      const config = payoutConfigs[method];
      const missing = config.fields.filter((field) => field.required && !detailsRecord[field.key]?.toString().trim());
      if (missing.length) {
        setError(`Fill ${missing.map((f) => f.label).join(", ")}`);
        return;
      }
      if (method === "bank") {
        const acNum = detailsRecord.accountNumber?.replace(/\s/g, "") || "";
        if (!/^\d{8}$/.test(acNum)) {
          setError("Account number must be exactly 8 digits");
          return;
        }
        const sc = detailsRecord.sortCode?.replace(/[-\s]/g, "") || "";
        if (!/^\d{6}$/.test(sc)) {
          setError("Sort code must be exactly 6 digits (e.g. 12-34-56)");
          return;
        }
      }
      if (method === "crypto") {
        const network = detailsRecord.network || "";
        const addr = detailsRecord.address?.trim() || "";
        if (network === "TRC20") {
          if (!/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(addr)) {
            setError("Invalid TRC20 address. It should start with T and be 34 characters long");
            return;
          }
        } else if (network === "ERC20") {
          if (!/^0x[0-9a-fA-F]{40}$/.test(addr)) {
            setError("Invalid ERC20 address. It should start with 0x and be 42 characters long");
            return;
          }
        }
      }
    }
    setError(null);
    setStep((prev) => Math.min(3, prev + 1));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async () => {
    if (!token) {
      router.push("/login");
      return;
    }
    if (!amountValid) {
      setError(`Amount must be at least £${MIN_WITHDRAWAL} and not exceed £${available.toFixed(2)}`);
      return;
    }
    const config = payoutConfigs[method];
    const missing = config.fields.filter((field) => field.required && !detailsRecord[field.key]?.toString().trim());
    if (missing.length) {
      setError(`Fill ${missing.map((f) => f.label).join(", ")}`);
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      const response = await createWithdrawalRequest({
        amount,
        currency: "GBP",
        payoutMethod: method,
        payoutDetails: detailsRecord,
        note: note.trim() || undefined
      });
      setResult(response.request);
    } catch (err) {
      setError((err as Error).message || "Failed to create withdrawal request");
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <section className="space-y-6 px-4 py-10">
        <StateMessage
          title="Sign in required"
          body="Log in to submit a withdrawal request."
          actionLabel="Go to login"
          onAction={() => router.push("/login")}
        />
      </section>
    );
  }

  return (
    <section className="space-y-6 px-4 py-8">
      <header className="space-y-2">
        <Link href="/wallet" className="text-xs text-white/40 hover:text-white/60">← Back to wallet</Link>
        <h1 className="text-2xl font-semibold text-white sm:text-3xl">Withdraw funds</h1>
        <p className="text-sm leading-relaxed text-white/70">
          Request a payout to your bank, crypto wallet, or another member handle. Our team will verify within 12 hours.
        </p>
      </header>

      {balanceError && (
        <StateMessage variant="error" title="Unable to load balance" body={balanceError.message} />
      )}

      <Stepper current={step} />

      {result ? (
        <SuccessCard request={result} />
      ) : (
        <div className="space-y-6 rounded-3xl border border-white/10 bg-card p-4 sm:rounded-[32px] sm:p-6">
          {step === 1 && (
            <AmountStep
              amount={amountInput}
              onAmountChange={setAmountInput}
              available={available}
              fee={fee}
              receiveAmount={receiveAmount}
            />
          )}
          {step === 2 && (
            <MethodStep
              method={method}
              setMethod={(next) => {
                setMethod(next);
                setError(null);
              }}
              details={detailsRecord}
              onDetailChange={handleFieldChange}
            />
          )}
          {step === 3 && (
            <ReviewStep
              amount={amount}
              fee={fee}
              receiveAmount={receiveAmount}
              method={method}
              details={detailsRecord}
              note={note}
              onNoteChange={setNote}
            />
          )}

          {error && <p className="text-sm text-amber-300">{error}</p>}

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            {step < 3 && (
              <Button onClick={handleNext} className="w-full min-h-[48px] text-base sm:w-auto">Continue</Button>
            )}
            {step === 3 && (
              <Button onClick={handleSubmit} disabled={submitting} className="w-full min-h-[48px] text-base sm:w-auto">
                {submitting ? "Submitting…" : "Submit request"}
              </Button>
            )}
            {step > 1 && (
              <Button variant="secondary" onClick={handleBack} disabled={submitting} className="w-full min-h-[48px] text-base sm:w-auto">
                Back
              </Button>
            )}
            <Link href="/wallet/withdraw/history" className="text-center text-sm text-white/70 underline sm:ml-auto">
              View history
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}

function Stepper({ current }: { current: number }) {
  const steps = ["Amount", "Payout", "Review"];
  return (
    <div className="flex items-center justify-between gap-1 text-xs uppercase tracking-[0.25em] text-white/50 sm:justify-start sm:gap-3 sm:tracking-[0.35em]">
      {steps.map((label, index) => {
        const idx = index + 1;
        const active = idx === current;
        const done = idx < current;
        return (
          <div key={label} className="flex items-center gap-1.5 sm:gap-2">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs sm:h-8 sm:w-8 ${
                done ? "border-emerald-400 text-emerald-200" : active ? "border-white text-white" : "border-white/30"
              }`}
            >
              {idx}
            </span>
            <span className={`text-[11px] sm:text-xs ${active ? "text-white" : "text-white/60"}`}>{label}</span>
            {idx < steps.length && <div className="hidden h-px w-6 bg-white/15 sm:block sm:w-10" />}
          </div>
        );
      })}
    </div>
  );
}

function AmountStep({
  amount,
  onAmountChange,
  available,
  fee,
  receiveAmount
}: {
  amount: string;
  onAmountChange: (value: string) => void;
  available: number;
  fee: number;
  receiveAmount: number;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between">
        <p className="text-lg font-semibold text-white">1. Choose amount</p>
        <span className="text-sm text-white/60">Available £{available.toFixed(2)}</span>
      </div>
      <Input
        type="number"
        min={MIN_WITHDRAWAL}
        step="5"
        value={amount}
        onChange={(event) => onAmountChange(event.target.value)}
        placeholder="20"
      />
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
        <p>Withdrawal fee: {Math.round(FEE_PERCENT * 100)}%. Minimum withdrawal: £{MIN_WITHDRAWAL}.</p>
        <p className="mt-1 text-xs text-white/50">Fee: £{fee.toFixed(2)} · You receive: £{receiveAmount.toFixed(2)} · Arrives within 24 hours</p>
      </div>
    </section>
  );
}

function MethodStep({
  method,
  setMethod,
  details,
  onDetailChange
}: {
  method: MethodId;
  setMethod: (value: MethodId) => void;
  details: Record<string, string>;
  onDetailChange: (key: string, value: string) => void;
}) {
  return (
    <section className="space-y-4">
      <p className="text-lg font-semibold text-white">2. Select payout method</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {(Object.keys(payoutConfigs) as MethodId[]).map((id) => (
          <button
            key={id}
            className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
              method === id ? "border-white bg-white/10" : "border-white/10 text-white/70 hover:border-white/30"
            }`}
            onClick={() => setMethod(id)}
          >
            <p className="font-semibold text-white">{payoutConfigs[id].label}</p>
            <p className="mt-1 text-xs text-white/60">{payoutConfigs[id].description}</p>
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {payoutConfigs[method].fields.map((field) => {
          const f = field as any;
          return (
            <label key={field.key} className="text-sm text-white">
              <span className="font-medium">
                {field.label}
                {field.required && <span className="text-amber-300"> *</span>}
              </span>
              {f.type === "select" && f.options ? (
                <select
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-white/30"
                  value={details[field.key]?.toString() || f.options[0]}
                  onChange={(event) => onDetailChange(field.key, event.target.value)}
                >
                  {f.options.map((opt: string) => (
                    <option key={opt} value={opt} className="bg-neutral-900 text-white">{opt}</option>
                  ))}
                </select>
              ) : (
                <Input
                  className="mt-1"
                  value={details[field.key]?.toString() || ""}
                  placeholder={field.placeholder}
                  maxLength={f.maxLength}
                  inputMode={f.inputMode}
                  onChange={(event) => onDetailChange(field.key, event.target.value)}
                />
              )}
            </label>
          );
        })}
      </div>
    </section>
  );
}

function ReviewStep({
  amount,
  fee,
  receiveAmount,
  method,
  details,
  note,
  onNoteChange
}: {
  amount: number;
  fee: number;
  receiveAmount: number;
  method: MethodId;
  details: Record<string, string>;
  note: string;
  onNoteChange: (value: string) => void;
}) {
  const entries = Object.entries(details).filter(([, value]) => value);
  return (
    <section className="space-y-4">
      <p className="text-lg font-semibold text-white">3. Review & confirm</p>
      <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
        <p className="text-base font-semibold text-white">£{amount.toFixed(2)} → {payoutConfigs[method].label}</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-white/60">
          <li>Fee (3%): £{fee.toFixed(2)}</li>
          <li>You receive: £{receiveAmount.toFixed(2)}</li>
          <li>Arrives within 24 hours</li>
        </ul>
      </div>
      {entries.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white">
          <p className="font-semibold">Payout details</p>
          <dl className="mt-2 grid gap-2 text-xs text-white/70 sm:grid-cols-2">
            {entries.map(([key, value]) => (
              <div key={key}>
                <dt className="uppercase tracking-[0.35em] text-white/40">{key}</dt>
                <dd className="text-white">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
      <label className="text-sm text-white">
        <span className="font-medium">Note to the team (optional)</span>
        <Textarea className="mt-1" value={note} onChange={(event) => onNoteChange(event.target.value)} placeholder="Any notes for the team" />
      </label>
    </section>
  );
}

function SuccessCard({ request }: { request: WithdrawalRequest }) {
  return (
    <div className="space-y-4 rounded-[32px] border border-emerald-500/30 bg-emerald-500/5 p-6 text-white">
      <p className="text-sm uppercase tracking-[0.3em] text-emerald-200">Request submitted</p>
      <h2 className="text-3xl font-semibold">Reference {request.reference}</h2>
      <p className="text-sm text-white/70">
        Our team will process your payout within 24 hours. You&apos;ll receive an email once the transfer is complete.
      </p>
      <dl className="grid gap-2 text-sm text-white/80 sm:grid-cols-2">
        <div>
          <dt className="uppercase text-xs tracking-[0.35em] text-white/40">Amount</dt>
          <dd>£{request.amount.toFixed(2)}</dd>
        </div>
        <div>
          <dt className="uppercase text-xs tracking-[0.35em] text-white/40">Method</dt>
          <dd>{request.payoutMethod}</dd>
        </div>
      </dl>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/wallet/withdraw/history" className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-white/20 px-5 text-sm font-semibold text-white hover:border-white/50">
          View history
        </Link>
        <Link href="/wallet" className="inline-flex min-h-[48px] items-center justify-center text-sm text-white/80 underline">
          Back to wallet
        </Link>
      </div>
    </div>
  );
}
