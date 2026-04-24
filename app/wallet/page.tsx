"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { StateMessage } from "@/components/StateMessage";
import { Skeleton } from "@/components/Skeleton";
import { swrFetcher, apiFetch } from "@/lib/api";
import type { WalletBalanceResponse, WalletTransaction, WalletTransactionsResponse } from "@/lib/types";

type WithdrawalDetail = {
  id: number; amount: number; currency: string; method: string; status: string;
  bankFullName?: string; bankAccountNumber?: string; bankSortCode?: string; bankReference?: string;
  customerNote?: string; usdtNetwork?: string; usdtAddress?: string; txHashOrBankRef?: string;
  reviewedAt?: string; reviewedBy?: string; createdAt?: string; updatedAt?: string;
};

const GBP = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
const TS = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });

function formatUserId(raw?: string | null): string | null {
  if (!raw) return null;
  const clean = raw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return clean ? `GH-${clean.slice(-8).padStart(8, "0")}` : null;
}

type TxFilter = "all" | "topup" | "orders" | "earnings" | "transfers";

const TX_FILTERS: { id: TxFilter; label: string; types: string[] }[] = [
  { id: "all", label: "All", types: [] },
  { id: "topup", label: "💰 Top Up", types: ["topup"] },
  { id: "orders", label: "🛒 Orders", types: ["purchase"] },
  { id: "earnings", label: "🤝 Earnings", types: ["commission", "referral_click_bonus", "bonus"] },
  { id: "transfers", label: "💳 Transfers", types: ["transfer_in", "transfer_out", "withdrawal", "withdrawal_reversal"] },
];

export default function WalletPage() {
  const router = useRouter();
  const { token, profile } = useAuth();
  const [copyToast, setCopyToast] = useState(false);
  const [txFilter, setTxFilter] = useState<TxFilter>("all");

  const { data: bal, error: balErr, isLoading: balLoad, mutate: refreshBal } =
    useSWR<WalletBalanceResponse>(token ? "/api/wallet/balance" : null, swrFetcher, { refreshInterval: 60_000 });
  const { data: cpData } = useSWR(token ? "/api/account/profile" : null, swrFetcher);
  const txFilterTypes = TX_FILTERS.find(f => f.id === txFilter)?.types || [];
  const txApiUrl = token
    ? `/api/wallet/transactions?page=1&pageSize=30${txFilterTypes.length ? `&types=${txFilterTypes.join(",")}` : ""}`
    : null;
  const { data: txData, error: txErr, isLoading: txLoad, mutate: refreshTx } =
    useSWR<WalletTransactionsResponse>(txApiUrl, swrFetcher, { refreshInterval: 90_000 });

  const transactions = txData?.data ?? [];
  const transferHandle = (cpData as any)?.data?.attributes?.transferHandle;
  const rawId = profile?.customer?.documentId || profile?.documentId;
  const userId = transferHandle || formatUserId(rawId);

  if (!token) {
    return (
      <section className="px-4 py-10">
        <StateMessage title="Please sign in" body="Sign in to view your wallet." actionLabel="Go to login" onAction={() => router.push("/login")} />
      </section>
    );
  }

  const handleCopyId = async () => {
    if (!userId) return;
    try { await navigator.clipboard.writeText(userId); setCopyToast(true); setTimeout(() => setCopyToast(false), 2000); } catch {}
  };

  return (
    <div className="space-y-4 pb-24 sm:space-y-6 sm:pb-20">
      {/* ── Balance Card ── */}
      {balLoad ? (
        <Skeleton className="h-52 rounded-2xl" />
      ) : balErr ? (
        <StateMessage variant="error" title="Unable to load balance" body={balErr.message} actionLabel="Retry" onAction={() => refreshBal()} />
      ) : bal ? (
        <div className="relative isolate overflow-hidden rounded-2xl border border-emerald-400/15 px-4 py-4 sm:rounded-3xl sm:px-5 sm:py-5">
          {/* Sci-fi background layers */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a1a12] via-[#0d0d0d] to-[#0a0d1a]" aria-hidden="true" />
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "30px 30px" }} aria-hidden="true" />
          <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-emerald-400/10 blur-3xl animate-pulse" aria-hidden="true" />
          <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-cyan-400/8 blur-2xl" aria-hidden="true" />

          <div className="relative z-10">
            {/* Status badge */}
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-2.5 py-0.5 mb-3">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              <span className="text-[9px] font-medium text-emerald-400">Wallet Active</span>
            </div>

            <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-white/30">Available Balance</p>
            <p className="mt-0.5 text-[28px] font-extrabold bg-gradient-to-r from-white via-emerald-200 to-emerald-400 bg-clip-text text-transparent leading-tight">{GBP.format(bal.transferableBalance ?? 0)}</p>
            <p className="mt-1 text-[10px] text-white/30">🎁 Bonus: <span className="text-emerald-400/70">{GBP.format(bal.bonusBalance ?? 0)}</span></p>

            {/* User ID - terminal style */}
            {userId && (
              <button onClick={handleCopyId} className="mt-2.5 flex w-full items-center justify-between rounded-lg border border-emerald-400/10 bg-emerald-400/[0.03] px-2.5 py-2 transition hover:border-emerald-400/20">
                <div>
                  <p className="text-[8px] uppercase tracking-widest text-white/20">Wallet ID</p>
                  <p className="font-mono text-xs font-semibold text-emerald-400/80"><span className="text-emerald-400/30">$ </span>{userId}</p>
                </div>
                <span className={`rounded-md px-2 py-0.5 text-[9px] font-semibold ${copyToast ? "bg-emerald-400/15 text-emerald-400" : "bg-white/5 text-white/30"}`}>
                  {copyToast ? "✓ Copied" : "Copy"}
                </span>
              </button>
            )}

            {/* Lottery hint */}
            <a href="https://t.me/greenhub420" target="_blank" rel="noopener noreferrer"
              className="mt-2.5 flex items-center gap-2 rounded-lg border border-amber-400/10 bg-amber-400/[0.03] px-2.5 py-2 transition hover:border-amber-400/20">
              <span className="text-sm">🎰</span>
              <span className="text-[10px] text-amber-300/70">Bind your Wallet ID on Telegram → get £5 bonus + daily £100 lottery!</span>
              <span className="ml-auto text-[10px] text-amber-400 font-semibold shrink-0">Join →</span>
            </a>

            {/* Action buttons */}
            <div className="mt-3 grid grid-cols-3 gap-1.5">
              {[
                { href: "/wallet/topup", icon: "💰", label: "Top Up", glow: "bg-emerald-400/8", border: "border-emerald-400/15", text: "text-emerald-400" },
                { href: "/wallet/transfer", icon: "↗️", label: "Transfer", glow: "bg-blue-400/8", border: "border-blue-400/15", text: "text-blue-400" },
                { href: "/wallet/withdraw", icon: "💳", label: "Withdraw", glow: "bg-amber-400/8", border: "border-amber-400/15", text: "text-amber-400" },
              ].map((a) => (
                <Link key={a.href} href={a.href} className={`relative isolate overflow-hidden flex min-h-[40px] flex-col items-center justify-center rounded-lg border ${a.border} bg-white/[0.02] py-2 transition active:scale-[0.95]`}>
                  <div className={`absolute -top-3 -right-3 h-10 w-10 ${a.glow} rounded-full blur-xl`} aria-hidden="true" />
                  <span className="relative text-base">{a.icon}</span>
                  <span className={`relative text-[9px] font-semibold ${a.text}`}>{a.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Recent Activity ── */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">Recent Activity</h2>
            <p className="text-[9px] text-white/25 mt-0.5">Transaction history</p>
          </div>
          <button onClick={() => refreshTx()} className="rounded-lg bg-white/[0.04] border border-white/8 px-2.5 py-1 text-[10px] text-white/40 hover:text-white/60 hover:border-white/15 transition">Refresh</button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory mb-2">
          {TX_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setTxFilter(f.id)}
              className={`shrink-0 snap-start rounded-full px-3 py-1.5 text-[11px] font-medium transition whitespace-nowrap ${
                txFilter === f.id
                  ? "bg-gradient-to-r from-emerald-400/15 to-cyan-400/10 text-emerald-300 border border-emerald-400/25"
                  : "bg-white/[0.03] text-white/35 border border-white/6 hover:border-white/12"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {txLoad ? (
          <div className="space-y-1.5">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
          </div>
        ) : txErr ? (
          <StateMessage variant="error" title="Unable to load transactions" body={txErr.message} actionLabel="Retry" onAction={() => refreshTx()} />
        ) : transactions.length === 0 ? (
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-8 text-center">
            <p className="text-2xl">📭</p>
            <p className="mt-2 text-sm text-white/40">{txFilter === "all" ? "No transactions yet" : "No transactions in this category"}</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5 overflow-hidden rounded-2xl border border-white/8 bg-white/[0.01]">
            {transactions.map((tx) => (
              <TxRow key={tx.id} tx={tx} onNavigate={(href) => router.push(href)} />
            ))}
          </div>
        )}
      </div>

      {/* ── Footer Links ── */}
      <div className="flex gap-3 text-xs">
        <Link href="/wallet/withdraw/history" className="rounded-lg border border-white/6 bg-white/[0.02] px-3 py-1.5 text-white/40 hover:text-white/60 hover:border-white/12 transition">Withdrawal history</Link>
        <Link href="/account" className="rounded-lg border border-white/6 bg-white/[0.02] px-3 py-1.5 text-white/30 hover:text-white/50 hover:border-white/12 transition">← Account</Link>
      </div>
    </div>
  );
}

/* ─── Transaction Row ─── */

const TX_ICONS: Record<string, string> = {
  withdrawal: "💳", transfer_out: "↗️", transfer_in: "↙️", bonus: "🎁",
  topup: "💰", commission: "🤝", purchase: "🛒", referral_click_bonus: "🔗",
  withdrawal_reversal: "↩️",
};

const WD_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: "⏳ Pending", color: "text-amber-300" },
  approved: { label: "✅ Approved", color: "text-emerald-300" },
  paid: { label: "💸 Paid", color: "text-brand-200" },
  rejected: { label: "❌ Rejected", color: "text-red-300" },
};

function TxRow({ tx, onNavigate }: { tx: WalletTransaction; onNavigate: (href: string) => void }) {
  const isWithdrawal = tx.type === "withdrawal" && tx.reference?.startsWith("withdrawal-");
  const isOrder = tx.reference?.startsWith("ORD-");
  const [expanded, setExpanded] = useState(false);
  const [wdDetail, setWdDetail] = useState<WithdrawalDetail | null>(null);
  const [wdLoading, setWdLoading] = useState(false);

  const handleClick = useCallback(async () => {
    if (isOrder) { onNavigate(`/orders/${tx.reference}`); return; }
    if (expanded) { setExpanded(false); return; }
    setExpanded(true);
    if (isWithdrawal && !wdDetail) {
      const wdId = tx.reference.replace("withdrawal-", "");
      setWdLoading(true);
      try {
        const res = await apiFetch<{ success: boolean; data: WithdrawalDetail }>(`/api/account/withdrawals/${wdId}`);
        if (res?.data) setWdDetail(res.data);
      } catch {}
      setWdLoading(false);
    }
  }, [isOrder, expanded, isWithdrawal, wdDetail, tx.reference, onNavigate]);

  return (
    <div>
      <button onClick={handleClick} className="flex w-full items-center gap-3 px-3 py-3 text-left transition hover:bg-white/[0.03] active:bg-white/[0.05]">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm ${
          tx.amount >= 0 ? "bg-emerald-400/10" : "bg-red-400/8"
        }`}>
          {TX_ICONS[tx.type] || "📄"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium capitalize text-white truncate">{tx.type.replace(/_/g, " ")}</p>
          <p className="text-[10px] text-white/30 truncate">{tx.description || tx.reference}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className={`text-sm font-bold ${tx.amount >= 0 ? "text-emerald-300" : "text-red-300"}`}>
            {tx.amount >= 0 ? "+" : ""}{GBP.format(tx.amount)}
          </p>
          <p className="text-[9px] text-white/25">
            {tx.createdAt ? TS.format(new Date(tx.createdAt)) : ""}
          </p>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-white/5 bg-white/[0.02] px-3 py-3">
          {isWithdrawal && wdLoading ? (
            <Skeleton className="h-20 rounded-lg" />
          ) : isWithdrawal && wdDetail ? (
            <WdPanel d={wdDetail} />
          ) : (
            <TxDetail tx={tx} />
          )}
        </div>
      )}
    </div>
  );
}

function Row({ l, v, c, mono }: { l: string; v: string; c?: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="text-white/40">{l}</span>
      <span className={`text-right break-all ${c || "text-white/70"} ${mono ? "font-mono text-[11px]" : ""}`}>{v}</span>
    </div>
  );
}

function TxDetail({ tx }: { tx: WalletTransaction }) {
  const order = tx.relatedOrder;
  return (
    <div className="space-y-1.5">
      {tx.description && <Row l="Description" v={tx.description} />}
      {tx.balanceBefore != null && <Row l="Before" v={GBP.format(tx.balanceBefore)} />}
      {tx.balanceAfter != null && <Row l="After" v={GBP.format(tx.balanceAfter)} c="text-white font-semibold" />}
      {order && (
        <>
          <Row l="Order" v={order.reference} c="text-emerald-300" />
          <Row l="Status" v={order.status} />
          {order.items?.map((item: any, i: number) => (
            <p key={i} className="text-[11px] text-white/50">• {item.title || item.name} {item.weight ? `(${item.weight})` : ""} × {item.quantity || 1}</p>
          ))}
        </>
      )}
      <Row l="Ref" v={tx.reference} mono />
    </div>
  );
}

function WdPanel({ d }: { d: WithdrawalDetail }) {
  return (
    <div className="space-y-1.5">
      <Row l="Status" v={WD_STATUS[d.status]?.label ?? d.status} c={WD_STATUS[d.status]?.color} />
      <Row l="Amount" v={GBP.format(d.amount)} />
      <Row l="Fee (3%)" v={`-${GBP.format(d.amount * 0.03)}`} c="text-red-300" />
      <Row l="You receive" v={GBP.format(d.amount * 0.97)} c="text-emerald-300 font-semibold" />
      <Row l="Method" v={d.method === "uk_bank" ? "UK Bank" : d.method === "usdt_wallet" ? "USDT" : d.method} />
      {d.bankFullName && <Row l="Name" v={d.bankFullName} />}
      {d.bankAccountNumber && <Row l="Account" v={d.bankAccountNumber} mono />}
      {d.bankSortCode && <Row l="Sort code" v={d.bankSortCode} mono />}
      {d.usdtAddress && <Row l="Address" v={d.usdtAddress} mono />}
      {d.txHashOrBankRef && <Row l="Payment ref" v={d.txHashOrBankRef} c="text-emerald-300" mono />}
      {d.customerNote && <p className="rounded-lg bg-amber-500/10 px-2 py-1.5 text-[11px] text-amber-200">💬 {d.customerNote}</p>}
    </div>
  );
}
