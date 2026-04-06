"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { StateMessage } from "@/components/StateMessage";
import { Skeleton } from "@/components/Skeleton";
import { Button } from "@/components/ui";
import { swrFetcher } from "@/lib/api";
import type { WalletBalanceResponse, WalletTransaction, WalletTransactionsResponse } from "@/lib/types";

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
          title="请先登录"
          body="登录后查看钱包余额。"
          actionLabel="去登录"
          onAction={() => router.push("/login")}
        />
      </section>
    );
  }

  return (
    <section className="space-y-6 px-4 py-8">
      {/* ── 主卡片：余额 + 操作按钮 ── */}
      {balanceLoading ? (
        <Skeleton className="h-56 w-full rounded-3xl" />
      ) : balanceError ? (
        <StateMessage
          variant="error"
          title="无法加载余额"
          body={balanceError.message}
          actionLabel="重试"
          onAction={() => refreshBalance()}
        />
      ) : balanceData ? (
        <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-night-900 via-night-950 to-night-900 p-6 shadow-2xl shadow-brand-600/10">
          {/* subtle glow */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-500/10 blur-3xl" />

          <p className="relative text-xs font-medium uppercase tracking-[0.3em] text-white/70">Available balance</p>
          <p className="relative mt-3 text-[2.5rem] font-extrabold leading-none text-white drop-shadow-sm">{GBP.format(balanceData.balance)}</p>
          <p className="relative mt-3 text-sm text-white/60">
            Lifetime top-up <span className="font-semibold text-white/80">{GBP.format(balanceData.lifetimeTopUp)}</span>{" "}
            · Bonus <span className="font-semibold text-white/80">{GBP.format(balanceData.bonusAwarded)}</span>
          </p>

          {/* User ID 可复制标签 */}
          <UserIdBadge
            profile={profile}
            transferHandle={customerProfile?.data?.attributes?.transferHandle}
            copyToast={copyToast}
            setCopyToast={setCopyToast}
          />

          {/* 三个操作按钮 — 手机端堆叠，min-h 便于点击 */}
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

      {/* ── 近期交易 ── */}
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
            title="无法加载交易记录"
            body={txError.message}
            actionLabel="重试"
            onAction={() => refreshTx()}
          />
        ) : transactions.length === 0 ? (
          <StateMessage variant="empty" title="暂无记录" body="充值或下单后，交易记录会出现在这里。" />
        ) : (
          <div className="divide-y divide-white/5 overflow-hidden rounded-3xl border border-white/10 bg-card">
            {transactions.map((tx) => (
              <TxRow key={tx.id} tx={tx} link={resolveTxLink(tx)} onNavigate={(href) => router.push(href)} />
            ))}
          </div>
        )}
      </section>

      {/* ── 底部链接 ── */}
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
  const Wrapper = link ? "button" : "div";
  const handleClick = () => {
    if (link && onNavigate) onNavigate(link);
  };

  return (
    <Wrapper
      type={link ? "button" : undefined}
      onClick={link ? handleClick : undefined}
      className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left ${
        link ? "transition hover:bg-white/5 focus-visible:bg-white/10 focus-visible:outline-none" : ""
      }`}
      aria-label={link ? `View details for ${tx.reference}` : undefined}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold capitalize text-white truncate">{tx.type.replace(/_/g, " ")}</p>
        <p className={`text-[11px] truncate ${link ? "text-brand-200" : "text-white/40"}`}>{tx.reference}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className={`text-sm font-semibold ${tx.amount >= 0 ? "text-emerald-300" : "text-red-300"}`}>
          {tx.amount >= 0 ? "+" : ""}{GBP.format(tx.amount)}
        </p>
        <p className="text-[11px] text-white/40">
          {tx.createdAt ? TIMESTAMP.format(new Date(tx.createdAt)) : ""}
        </p>
      </div>
    </Wrapper>
  );
}
