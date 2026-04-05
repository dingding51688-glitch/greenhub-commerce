"use client";

import { type ReactNode, useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/components/providers/AuthProvider";
import { StateMessage } from "@/components/StateMessage";
import { Skeleton } from "@/components/Skeleton";
import { Button } from "@/components/ui";
import { TransferIdNotice } from "@/components/wallet/TransferIdNotice";
import { swrFetcher, apiMutate } from "@/lib/api";
import type { WalletBalanceResponse, WalletTransaction, WalletTransactionsResponse } from "@/lib/types";
import { deriveTransferId } from "@/lib/wallet-utils";

const GBP = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
const TIMESTAMP = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });
const inputCls = "w-full rounded-2xl border border-white/15 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/40";

/* ── schemas ── */

const transferSchema = z.object({
  handle: z.string().min(3, "Enter recipient handle"),
  amount: z.preprocess((v) => Number(v), z.number().min(1, "Min £1")),
  memo: z.string().optional().or(z.literal("")),
});
type TransferFormValues = z.infer<typeof transferSchema>;

const withdrawSchema = z.object({
  amount: z.preprocess((v) => Number(v), z.number().min(20, "Min £20")),
  method: z.enum(["bank", "crypto"]),
  bankAccountName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankSortCode: z.string().optional(),
  cryptoAddress: z.string().optional(),
  cryptoNetwork: z.string().optional(),
  note: z.string().optional().or(z.literal("")),
});
type WithdrawFormValues = z.infer<typeof withdrawSchema>;

/* ── page ── */

export default function WalletPage() {
  const router = useRouter();
  const { token, profile } = useAuth();
  const [modal, setModal] = useState<"transfer" | "withdraw" | null>(null);

  const {
    data: balanceData,
    error: balanceError,
    isLoading: balanceLoading,
    mutate: refreshBalance,
  } = useSWR<WalletBalanceResponse>(token ? "/api/wallet/balance" : null, swrFetcher, {
    refreshInterval: 60_000,
  });

  const {
    data: txData,
    error: txError,
    isLoading: txLoading,
    mutate: refreshTx,
  } = useSWR<WalletTransactionsResponse>(
    token ? "/api/wallet/transactions?page=1&pageSize=20" : null,
    swrFetcher,
    { refreshInterval: 90_000 }
  );

  const transactions = txData?.data ?? [];

  if (!token) {
    return (
      <section className="space-y-6 px-4 py-10">
        <StateMessage
          title="Please sign in"
          body="Log in to see your wallet balance."
          actionLabel="Go to login"
          onAction={() => router.push("/login")}
        />
      </section>
    );
  }

  return (
    <section className="space-y-8 px-4 py-10">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Wallet</p>
          <h1 className="text-3xl font-semibold text-white">Balance & history</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm"><Link href="/wallet/topup">Top up</Link></Button>
          <Button size="sm" variant="secondary" onClick={() => setModal("transfer")}>Transfer</Button>
          <Button size="sm" variant="secondary" onClick={() => setModal("withdraw")}>Withdraw</Button>
        </div>
      </header>

      <TransferIdNotice transferId={deriveTransferId(profile)} />

      {/* Balance card */}
      {balanceLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : balanceError ? (
        <StateMessage variant="error" title="Unable to load balance" body={balanceError.message} actionLabel="Retry" onAction={() => refreshBalance()} />
      ) : balanceData ? (
        <div className="rounded-3xl border border-white/10 bg-card p-6 shadow-2xl shadow-brand-600/10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-white/60">Available balance</p>
              <p className="mt-2 text-4xl font-semibold">{GBP.format(balanceData.balance)}</p>
              <p className="mt-2 text-sm text-white/60">
                Lifetime top-up {GBP.format(balanceData.lifetimeTopUp)} · Bonus {GBP.format(balanceData.bonusAwarded)}
              </p>
            </div>
            <Link
              href="/wallet/topup"
              className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white/80 hover:border-white/50"
            >
              Start a top-up
            </Link>
          </div>
        </div>
      ) : null}

      {/* Modals */}
      {modal === "transfer" && (
        <TransferModal onClose={() => setModal(null)} onSuccess={() => { refreshBalance(); refreshTx(); }} />
      )}
      {modal === "withdraw" && (
        <WithdrawModal onClose={() => setModal(null)} onSuccess={() => { refreshBalance(); refreshTx(); }} />
      )}

      {/* Payment guide */}
      <div className="rounded-3xl border border-white/10 bg-night-950/60 p-4 text-sm text-white/70">
        <p className="font-semibold text-white">New to payments?</p>
        <p className="mt-1">Read the payment guide for top-ups, NowPayments, and manual bank/USDT instructions.</p>
        <Button asChild variant="ghost" size="sm" className="mt-3">
          <Link href="/guide/payment">Open payment guide</Link>
        </Button>
      </div>

      {/* Recent activity */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Recent activity</h2>
          <button onClick={() => refreshTx()} className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/70 hover:border-white/50">
            Refresh
          </button>
        </div>
        {txLoading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
        ) : txError ? (
          <StateMessage variant="error" title="Unable to load transactions" body={txError.message} actionLabel="Retry" onAction={() => refreshTx()} />
        ) : transactions.length === 0 ? (
          <StateMessage variant="empty" title="No activity yet" body="Top up or place an order to see history." />
        ) : (
          <TransactionList rows={transactions} />
        )}
      </section>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/wallet/withdraw/history" className="text-white/70 underline">Withdrawal history</Link>
        <Link href="/account" className="text-white/40 hover:text-white/60">← Back to account</Link>
      </div>
    </section>
  );
}

/* ── Transaction list ── */

function TransactionList({ rows }: { rows: WalletTransaction[] }) {
  return (
    <div className="divide-y divide-white/5 overflow-hidden rounded-3xl border border-white/10 bg-card">
      {rows.map((tx) => (
        <div key={tx.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold capitalize text-white">{tx.type.replace(/_/g, " ")}</p>
            <p className="text-xs text-white/50">{tx.reference}</p>
          </div>
          <div className="text-sm text-white/60">
            {tx.createdAt ? TIMESTAMP.format(new Date(tx.createdAt)) : "—"}
          </div>
          <div className="text-right">
            <p className={tx.amount >= 0 ? "text-emerald-300" : "text-red-300"}>
              {tx.amount >= 0 ? "+" : ""}{GBP.format(tx.amount)}
            </p>
            <p className="text-xs text-white/50">
              Balance {tx.balanceAfter !== undefined ? GBP.format(tx.balanceAfter) : "—"}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Transfer modal ── */

function TransferModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const form = useForm<TransferFormValues>({ resolver: zodResolver(transferSchema) as Resolver<TransferFormValues>, defaultValues: { handle: "", amount: 0, memo: "" } });

  const onSubmit = async (values: TransferFormValues) => {
    setStatus(null);
    try {
      await apiMutate("/api/account/transfer", "POST", {
        recipientHandle: values.handle,
        amount: values.amount,
        memo: values.memo || undefined,
      });
      setStatus({ type: "success", message: `Transferred ${GBP.format(values.amount)} to ${values.handle}` });
      onSuccess();
    } catch (err: any) {
      setStatus({ type: "error", message: err?.message || "Transfer failed" });
    }
  };

  return (
    <div className="rounded-3xl border border-white/15 bg-night-950/90 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Transfer balance</h3>
        <button onClick={onClose} className="text-sm text-white/60 underline">Close</button>
      </div>
      <form className="mt-4 space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
        <Field label="Recipient handle" error={form.formState.errors.handle?.message}>
          <input type="text" placeholder="GH-XXXXXXXX" {...form.register("handle")} className={inputCls} />
        </Field>
        <Field label="Amount (£)" error={form.formState.errors.amount?.message}>
          <input type="number" step="0.01" min="1" {...form.register("amount")} className={inputCls} />
        </Field>
        <Field label="Memo (optional)">
          <input type="text" placeholder="e.g. Split order" {...form.register("memo")} className={inputCls} />
        </Field>
        {status && <AlertBanner status={status} />}
        <div className="flex gap-3">
          <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Sending…" : "Send transfer"}</Button>
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}

/* ── Withdraw modal ── */

function WithdrawModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const form = useForm<WithdrawFormValues>({
    resolver: zodResolver(withdrawSchema) as Resolver<WithdrawFormValues>,
    defaultValues: { amount: 20, method: "bank", bankAccountName: "", bankAccountNumber: "", bankSortCode: "", cryptoAddress: "", cryptoNetwork: "TRC20", note: "" },
  });
  const method = form.watch("method");

  const onSubmit = async (values: WithdrawFormValues) => {
    setStatus(null);
    const payoutDetails: Record<string, unknown> = {};
    if (values.method === "bank") {
      payoutDetails.accountName = values.bankAccountName;
      payoutDetails.accountNumber = values.bankAccountNumber;
      payoutDetails.sortCode = values.bankSortCode;
    } else {
      payoutDetails.address = values.cryptoAddress;
      payoutDetails.network = values.cryptoNetwork;
    }
    try {
      const { createWithdrawalRequest } = await import("@/lib/withdrawal-api");
      const result = await createWithdrawalRequest({
        amount: values.amount,
        payoutMethod: values.method,
        payoutDetails,
        note: values.note,
      });
      if (result.success) {
        setStatus({ type: "success", message: `Withdrawal request submitted (${GBP.format(values.amount)})` });
        onSuccess();
      } else {
        throw new Error("Withdrawal failed");
      }
    } catch (err: any) {
      setStatus({ type: "error", message: err?.message || "Withdrawal failed" });
    }
  };

  return (
    <div className="rounded-3xl border border-white/15 bg-night-950/90 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Request withdrawal</h3>
        <button onClick={onClose} className="text-sm text-white/60 underline">Close</button>
      </div>
      <form className="mt-4 space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
        <Field label="Amount (£)" error={form.formState.errors.amount?.message}>
          <input type="number" step="0.01" min="20" {...form.register("amount")} className={inputCls} />
        </Field>
        <Field label="Method">
          <select {...form.register("method")} className={inputCls}>
            <option value="bank">UK bank transfer</option>
            <option value="crypto">USDT (TRC20 / ERC20)</option>
          </select>
        </Field>
        {method === "bank" && (
          <div className="space-y-3">
            <Field label="Account name"><input type="text" {...form.register("bankAccountName")} className={inputCls} /></Field>
            <Field label="Account number"><input type="text" {...form.register("bankAccountNumber")} className={inputCls} /></Field>
            <Field label="Sort code"><input type="text" placeholder="00-00-00" {...form.register("bankSortCode")} className={inputCls} /></Field>
          </div>
        )}
        {method === "crypto" && (
          <div className="space-y-3">
            <Field label="Wallet address"><input type="text" placeholder="T..." {...form.register("cryptoAddress")} className={inputCls} /></Field>
            <Field label="Network">
              <select {...form.register("cryptoNetwork")} className={inputCls}>
                <option value="TRC20">TRC20</option>
                <option value="ERC20">ERC20</option>
              </select>
            </Field>
          </div>
        )}
        <Field label="Note (optional)"><input type="text" {...form.register("note")} className={inputCls} /></Field>
        {status && <AlertBanner status={status} />}
        <div className="flex gap-3">
          <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Submitting…" : "Submit withdrawal"}</Button>
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}

/* ── Shared ── */

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block text-xs uppercase tracking-[0.3em] text-white/50">
      {label}
      <div className="mt-1">{children}</div>
      {error && <p className="mt-1 text-xs text-red-300">{error}</p>}
    </label>
  );
}

function AlertBanner({ status }: { status: { type: "success" | "error"; message: string } }) {
  return (
    <div className={`rounded-2xl border px-3 py-2 text-sm ${status.type === "success" ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100" : "border-red-400/40 bg-red-400/10 text-red-100"}`}>
      {status.message}
    </div>
  );
}
