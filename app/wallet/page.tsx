"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { StateMessage } from "@/components/StateMessage";
import { Skeleton } from "@/components/Skeleton";
import { Button } from "@/components/ui";
import { swrFetcher, apiFetch } from "@/lib/api";
import type { WalletBalanceResponse, WalletTransaction, WalletTransactionsResponse } from "@/lib/types";

type WithdrawalDetail = {
  id: number;
  amount: number;
  currency: string;
  method: string;
  status: string;
  bankFullName?: string;
  bankAccountNumber?: string;
  bankSortCode?: string;
  bankReference?: string;
  customerNote?: string;
  usdtNetwork?: string;
  usdtAddress?: string;
  txHashOrBankRef?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  createdAt?: string;
  updatedAt?: string;
};

type CustomerProfileResponse = {
  data?: {
    attributes?: {
      transferHandle?: string;
    };
  };
};

const GBP = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
const TIMESTAMP = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });

/** Format a documentId into GH-XXXXXXXX (uppercase alphanumeric, last 8 chars, zero-padded). */
function formatUserId(raw?: string | null): string | null {
  if (!raw) return null;
  const clean = raw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (!clean) return null;
  return `GH-${clean.slice(-8).padStart(8, "0")}`;
}

export default function WalletPage() {
  const router = useRouter();
  const { token, profile } = useAuth();
  const [copyToast, setCopyToast] = useState(false);

  const {
    data: balanceData,
    error: balanceError,
    isLoading: balanceLoading,
    mutate: refreshBalance,
  } = useSWR<WalletBalanceResponse>(token ? "/api/wallet/balance" : null, swrFetcher, {
    refreshInterval: 60_000,
  });

  const { data: customerProfile } = useSWR<CustomerProfileResponse>(token ? "/api/account/profile" : null, swrFetcher);

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

  const resolveTxLink = (tx: WalletTransaction) => {
    if (!tx.reference) return null;
    if (tx.reference.startsWith("ORD-")) return `/orders/${tx.reference}`;
    return null;
  };

  if (!token) {
    return (
      <section className="px-4 py-10">
        <StateMessage
          title="Please sign in"
          body="Sign in to view your wallet balance."
          actionLabel="Go to login"
          onAction={() => router.push("/login")}
        />
      </section>
    );
  }

  return (
    <section className="space-y-6 px-4 py-8">
      {/* ── Balance card + action buttons ── */}
      {balanceLoading ? (
        <Skeleton className="h-56 w-full rounded-3xl" />
      ) : balanceError ? (
        <StateMessage
          variant="error"
          title="Unable to load balance"
          body={balanceError.message}
          actionLabel="Retry"
          onAction={() => refreshBalance()}
        />
      ) : balanceData ? (
        <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-night-900 via-night-950 to-night-900 p-6 shadow-2xl shadow-brand-600/10">
          {/* subtle glow */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-500/10 blur-3xl" />

          <p className="relative text-xs font-medium uppercase tracking-[0.3em] text-white/70">Available balance</p>
          <p className="relative mt-3 text-[2.5rem] font-extrabold leading-none text-white drop-shadow-sm">{GBP.format(balanceData.transferableBalance ?? 0)}</p>
          <p className="relative mt-3 text-sm text-white/60">
            🎁 Bonus: <span className="font-semibold text-emerald-300">{GBP.format(balanceData.bonusBalance ?? 0)}</span>
            <span className="ml-1 text-white/40">(can shop, cannot transfer/withdraw)</span>
          </p>

          {/* User ID copyable badge */}
          <UserIdBadge
            profile={profile}
            transferHandle={customerProfile?.data?.attributes?.transferHandle}
            copyToast={copyToast}
            setCopyToast={setCopyToast}
          />

          {/* Three action buttons — stack on mobile, min-h for easy tapping */}
          <div className="relative mt-5 flex flex-col gap-2.5 sm:flex-row sm:gap-3">
            <Button asChild className="flex-1 min-h-[48px] text-base font-semibold">
              <Link href="/wallet/topup">Top up</Link>
            </Button>
            <Button asChild className="flex-1 min-h-[48px] border-2 border-emerald-400/60 bg-emerald-500/15 text-base font-semibold text-emerald-100 hover:bg-emerald-500/25">
              <Link href="/wallet/transfer">Transfer</Link>
            </Button>
            <Button asChild className="flex-1 min-h-[48px] border-2 border-amber-400/60 bg-amber-500/15 text-base font-semibold text-amber-100 hover:bg-amber-500/25">
              <Link href="/wallet/withdraw">Withdraw</Link>
            </Button>
          </div>
        </div>
      ) : null}

      {/* ── Recent transactions ── */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Recent activity</h2>
          <button
            onClick={() => refreshTx()}
            className="rounded-full border border-white/20 px-3 py-1.5 text-xs text-white/60 hover:border-white/40"
          >
            Refresh
          </button>
        </div>
        {txLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-2xl" />
            ))}
          </div>
        ) : txError ? (
          <StateMessage
            variant="error"
            title="Unable to load transactions"
            body={txError.message}
            actionLabel="Retry"
            onAction={() => refreshTx()}
          />
        ) : transactions.length === 0 ? (
          <StateMessage variant="empty" title="No transactions yet" body="Transactions will appear here once you top up or place an order." />
        ) : (
          <div className="divide-y divide-white/5 overflow-hidden rounded-3xl border border-white/10 bg-card">
            {transactions.map((tx) => (
              <TxRow key={tx.id} tx={tx} link={resolveTxLink(tx)} onNavigate={(href) => router.push(href)} />
            ))}
          </div>
        )}
      </section>

      {/* ── Footer links ── */}
      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/wallet/withdraw/history" className="text-white/60 underline">Withdrawal history</Link>
        <Link href="/account" className="text-white/40 hover:text-white/60">← Back to account</Link>
      </div>
    </section>
  );
}

function UserIdBadge({
  profile,
  transferHandle,
  copyToast,
  setCopyToast,
}: {
  profile: { documentId?: string; customer?: { documentId?: string } } | null;
  transferHandle?: string;
  copyToast: boolean;
  setCopyToast: (v: boolean) => void;
}) {
  const rawId = profile?.customer?.documentId || profile?.documentId;
  const userId = transferHandle || formatUserId(rawId);
  if (!userId) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(userId);
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="relative mt-4 flex min-h-[44px] w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-left transition hover:border-white/20 active:bg-white/10"
    >
      <div>
        <p className="text-[11px] uppercase tracking-[0.25em] text-white/50">User ID</p>
        <p className="font-mono text-sm font-semibold text-white">{userId}</p>
      </div>
      <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition ${
        copyToast
          ? "border border-emerald-400/50 bg-emerald-400/10 text-emerald-200"
          : "border border-white/20 text-white/60"
      }`}>
        {copyToast ? "Copied!" : "Copy"}
      </span>
    </button>
  );
}

function TxRow({ tx, link, onNavigate }: { tx: WalletTransaction; link?: string | null; onNavigate?: (href: string) => void }) {
  const isWithdrawal = tx.type === "withdrawal" && tx.reference?.startsWith("withdrawal-");
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState<WithdrawalDetail | null>(null);
  const [loading, setLoading] = useState(false);

  const withdrawalId = isWithdrawal ? tx.reference.replace("withdrawal-", "") : null;

  const handleClick = useCallback(async () => {
    if (link && onNavigate) {
      onNavigate(link);
      return;
    }
    if (isWithdrawal && withdrawalId) {
      if (expanded) {
        setExpanded(false);
        return;
      }
      setExpanded(true);
      if (!detail) {
        setLoading(true);
        try {
          const res = await apiFetch<{ success: boolean; data: WithdrawalDetail }>(`/api/account/withdrawals/${withdrawalId}`);
          if (res?.data) setDetail(res.data);
        } catch { /* ignore */ }
        setLoading(false);
      }
    }
  }, [link, onNavigate, isWithdrawal, withdrawalId, expanded, detail]);

  const isClickable = !!link || isWithdrawal;

  const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    pending: { label: "⏳ Pending", color: "text-amber-300" },
    approved: { label: "✅ Approved", color: "text-emerald-300" },
    paid: { label: "💸 Paid", color: "text-brand-200" },
    rejected: { label: "❌ Rejected", color: "text-red-300" },
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left ${
          isClickable ? "transition hover:bg-white/5 focus-visible:bg-white/10 focus-visible:outline-none cursor-pointer" : ""
        }`}
        aria-label={isClickable ? `View details for ${tx.reference}` : undefined}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold capitalize text-white truncate">{tx.type.replace(/_/g, " ")}</p>
            {isWithdrawal && (
              <span className="text-[10px] text-white/30">{expanded ? "▼" : "▶"}</span>
            )}
          </div>
          <p className={`text-[11px] truncate ${isClickable ? "text-brand-200" : "text-white/40"}`}>{tx.reference}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className={`text-sm font-semibold ${tx.amount >= 0 ? "text-emerald-300" : "text-red-300"}`}>
            {tx.amount >= 0 ? "+" : ""}{GBP.format(tx.amount)}
          </p>
          <p className="text-[11px] text-white/40">
            {tx.createdAt ? TIMESTAMP.format(new Date(tx.createdAt)) : ""}
          </p>
        </div>
      </button>

      {/* Withdrawal detail panel */}
      {expanded && isWithdrawal && (
        <div className="border-t border-white/5 bg-white/[0.02] px-4 py-3">
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : detail ? (
            <div className="space-y-2 text-sm">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-white/50">Status</span>
                <span className={STATUS_LABELS[detail.status]?.color ?? "text-white/60"}>
                  {STATUS_LABELS[detail.status]?.label ?? detail.status}
                </span>
              </div>

              {/* Amounts */}
              <div className="flex items-center justify-between">
                <span className="text-white/50">Original amount</span>
                <span className="text-white">{GBP.format(detail.amount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/50">Fee (3%)</span>
                <span className="text-red-300">-{GBP.format(detail.amount * 0.03)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/50">You receive</span>
                <span className="font-semibold text-emerald-300">{GBP.format(detail.amount * 0.97)}</span>
              </div>

              {/* Method */}
              <div className="flex items-center justify-between">
                <span className="text-white/50">Method</span>
                <span className="text-white">
                  {detail.method === "uk_bank" ? "UK Bank Transfer" : detail.method === "usdt_wallet" ? "USDT Transfer" : detail.method}
                </span>
              </div>

              {/* Bank details */}
              {detail.bankFullName && (
                <div className="flex items-center justify-between">
                  <span className="text-white/50">Account name</span>
                  <span className="text-white">{detail.bankFullName}</span>
                </div>
              )}
              {detail.bankAccountNumber && (
                <div className="flex items-center justify-between">
                  <span className="text-white/50">Account number</span>
                  <span className="font-mono text-white">{detail.bankAccountNumber}</span>
                </div>
              )}
              {detail.bankSortCode && (
                <div className="flex items-center justify-between">
                  <span className="text-white/50">Sort code</span>
                  <span className="font-mono text-white">{detail.bankSortCode}</span>
                </div>
              )}
              {detail.bankReference && (
                <div className="flex items-center justify-between">
                  <span className="text-white/50">Reference</span>
                  <span className="text-white">{detail.bankReference}</span>
                </div>
              )}

              {/* USDT details */}
              {detail.usdtNetwork && (
                <div className="flex items-center justify-between">
                  <span className="text-white/50">Network</span>
                  <span className="text-white">{detail.usdtNetwork}</span>
                </div>
              )}
              {detail.usdtAddress && (
                <div className="flex items-center justify-between">
                  <span className="text-white/50">Wallet address</span>
                  <span className="font-mono text-xs text-white break-all">{detail.usdtAddress}</span>
                </div>
              )}

              {/* Payment reference (from admin) */}
              {detail.txHashOrBankRef && (
                <div className="flex items-center justify-between">
                  <span className="text-white/50">Payment ref</span>
                  <span className="font-mono text-xs text-brand-200">{detail.txHashOrBankRef}</span>
                </div>
              )}

              {/* Timestamps */}
              <div className="mt-2 border-t border-white/5 pt-2 space-y-1">
                {detail.createdAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-white/40">Submitted</span>
                    <span className="text-[11px] text-white/50">{TIMESTAMP.format(new Date(detail.createdAt))}</span>
                  </div>
                )}
                {detail.reviewedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-white/40">Processed</span>
                    <span className="text-[11px] text-white/50">{TIMESTAMP.format(new Date(detail.reviewedAt))}</span>
                  </div>
                )}
              </div>

              {/* Note */}
              {detail.customerNote && (
                <div className="mt-1 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                  💬 {detail.customerNote}
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-white/40">Unable to load details</p>
          )}
        </div>
      )}
    </div>
  );
}
