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


const TX_TYPE_ICONS: Record<string, string> = {
  withdrawal: "💳",
  transfer_out: "↗️",
  transfer_in: "↙️",
  bonus: "🎁",
  topup: "💰",
  commission: "🤝",
  purchase: "🛒",
  referral_click_bonus: "🔗",
};

const WD_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: "⏳ Pending", color: "text-amber-300" },
  approved: { label: "✅ Approved", color: "text-emerald-300" },
  paid: { label: "💸 Paid", color: "text-brand-200" },
  rejected: { label: "❌ Rejected", color: "text-red-300" },
};

function TxRow({ tx, link, onNavigate }: { tx: WalletTransaction; link?: string | null; onNavigate?: (href: string) => void }) {
  const isWithdrawal = tx.type === "withdrawal" && tx.reference?.startsWith("withdrawal-");
  const isOrderLink = !!link;
  const [expanded, setExpanded] = useState(false);
  const [wdDetail, setWdDetail] = useState<WithdrawalDetail | null>(null);
  const [wdLoading, setWdLoading] = useState(false);

  const withdrawalId = isWithdrawal ? tx.reference.replace("withdrawal-", "") : null;

  const handleClick = useCallback(async () => {
    if (isOrderLink && link && onNavigate) {
      onNavigate(link);
      return;
    }
    if (expanded) { setExpanded(false); return; }
    setExpanded(true);
    if (isWithdrawal && withdrawalId && !wdDetail) {
      setWdLoading(true);
      try {
        const res = await apiFetch<{ success: boolean; data: WithdrawalDetail }>(`/api/account/withdrawals/${withdrawalId}`);
        if (res?.data) setWdDetail(res.data);
      } catch { /* ignore */ }
      setWdLoading(false);
    }
  }, [isOrderLink, link, onNavigate, expanded, isWithdrawal, withdrawalId, wdDetail]);

  const icon = TX_TYPE_ICONS[tx.type] || "📄";

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-white/5 focus-visible:bg-white/10 focus-visible:outline-none cursor-pointer"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">{icon}</span>
            <p className="text-sm font-semibold capitalize text-white truncate">{tx.type.replace(/_/g, " ")}</p>
            {!isOrderLink && (
              <span className="text-[10px] text-white/30">{expanded ? "▼" : "▶"}</span>
            )}
          </div>
          <p className={`text-[11px] truncate ${isOrderLink ? "text-brand-200" : "text-white/40"}`}>{tx.reference}</p>
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

      {expanded && !isOrderLink && (
        <div className="border-t border-white/5 bg-white/[0.02] px-4 py-3">
          {isWithdrawal && wdLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : isWithdrawal && wdDetail ? (
            <WithdrawalDetailPanel detail={wdDetail} />
          ) : !isWithdrawal ? (
            <GenericTxDetail tx={tx} />
          ) : (
            <p className="text-xs text-white/40">Unable to load details</p>
          )}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, valueClass, mono }: { label: string; value: string; valueClass?: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-white/50 shrink-0">{label}</span>
      <span className={`text-right ${valueClass || "text-white"} ${mono ? "font-mono text-xs" : ""} break-all`}>{value}</span>
    </div>
  );
}

function GenericTxDetail({ tx }: { tx: WalletTransaction }) {
  const order = tx.relatedOrder;
  return (
    <div className="space-y-2 text-sm">
      {tx.description && <InfoRow label="Description" value={tx.description} />}

      {tx.balanceBefore != null && tx.balanceAfter != null && (
        <>
          <InfoRow label="Balance before" value={GBP.format(tx.balanceBefore)} valueClass="text-white/70" />
          <InfoRow label="Balance after" value={GBP.format(tx.balanceAfter)} valueClass="font-semibold text-white" />
        </>
      )}

      {(tx.type === "transfer_out" || tx.type === "transfer_in") && tx.description && (
        <InfoRow
          label={tx.type === "transfer_out" ? "Recipient" : "From"}
          value={tx.description.replace(/^Transfer (to|from) /, "")}
          valueClass="text-brand-200"
        />
      )}

      {order && (
        <div className="mt-2 border-t border-white/5 pt-2 space-y-1.5">
          <InfoRow label="Order" value={order.reference} valueClass="text-brand-200 font-semibold" />
          <InfoRow label="Order status" value={order.status} />
          {order.items && order.items.length > 0 && (
            <div className="space-y-0.5">
              {order.items.map((item, i) => (
                <p key={i} className="text-xs text-white/60">
                  • {item.title || item.name} {item.weight ? `(${item.weight})` : ""} × {item.quantity || 1}
                  {item.lineTotal ? ` — ${GBP.format(item.lineTotal)}` : ""}
                </p>
              ))}
            </div>
          )}
          {order.trackingNumber && <InfoRow label="Tracking" value={`${order.carrier || "Yodel"}: ${order.trackingNumber}`} />}
          {order.lockerAddress && <InfoRow label="Locker" value={order.lockerAddress} />}
          {order.deliveredAt && <InfoRow label="Delivered" value={TIMESTAMP.format(new Date(order.deliveredAt))} />}
        </div>
      )}

      <InfoRow label="Reference" value={tx.reference} mono />

      <div className="mt-1 border-t border-white/5 pt-2">
        {tx.createdAt && (
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-white/40">Date</span>
            <span className="text-[11px] text-white/50">{TIMESTAMP.format(new Date(tx.createdAt))}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function WithdrawalDetailPanel({ detail }: { detail: WithdrawalDetail }) {
  return (
    <div className="space-y-2 text-sm">
      <InfoRow
        label="Status"
        value={WD_STATUS[detail.status]?.label ?? detail.status}
        valueClass={WD_STATUS[detail.status]?.color ?? "text-white/60"}
      />

      <InfoRow label="Original amount" value={GBP.format(detail.amount)} />
      <InfoRow label="Fee (3%)" value={`-${GBP.format(detail.amount * 0.03)}`} valueClass="text-red-300" />
      <InfoRow label="You receive" value={GBP.format(detail.amount * 0.97)} valueClass="font-semibold text-emerald-300" />

      <InfoRow
        label="Method"
        value={detail.method === "uk_bank" ? "UK Bank Transfer" : detail.method === "usdt_wallet" ? "USDT Transfer" : detail.method}
      />

      {detail.bankFullName && <InfoRow label="Account name" value={detail.bankFullName} />}
      {detail.bankAccountNumber && <InfoRow label="Account number" value={detail.bankAccountNumber} mono />}
      {detail.bankSortCode && <InfoRow label="Sort code" value={detail.bankSortCode} mono />}
      {detail.bankReference && <InfoRow label="Reference" value={detail.bankReference} />}

      {detail.usdtNetwork && <InfoRow label="Network" value={detail.usdtNetwork} />}
      {detail.usdtAddress && <InfoRow label="Wallet address" value={detail.usdtAddress} mono />}

      {detail.txHashOrBankRef && <InfoRow label="Payment ref" value={detail.txHashOrBankRef} valueClass="text-brand-200" mono />}

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

      {detail.customerNote && (
        <div className="mt-1 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          💬 {detail.customerNote}
        </div>
      )}
    </div>
  );
}
