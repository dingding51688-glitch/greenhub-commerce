"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWRInfinite from "swr/infinite";
import { useAuth } from "@/components/providers/AuthProvider";
import type { WithdrawalRequest } from "@/lib/types";
import { listWithdrawalRequests } from "@/lib/withdrawal-api";

const PAGE_SIZE = 10;
const GBP = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
const FEE = 0.03;

const FILTERS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending", match: new Set(["pending"]) },
  { id: "approved", label: "Approved", match: new Set(["approved"]) },
  { id: "paid", label: "Paid", match: new Set(["paid", "completed"]) },
  { id: "rejected", label: "Rejected", match: new Set(["rejected", "blocked"]) },
] as const;

const STATUS_DOT: Record<string, string> = {
  pending: "bg-amber-400",
  approved: "bg-blue-400",
  paid: "bg-emerald-400",
  completed: "bg-emerald-400",
  rejected: "bg-red-400",
  blocked: "bg-red-400",
};

function relativeTime(iso?: string) {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function WithdrawalHistoryPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [filterId, setFilterId] = useState<string>("all");

  const { data, error, size, setSize, isValidating, mutate } = useSWRInfinite(
    (i, prev) => {
      if (!token) return null;
      if (prev && prev.data.length === 0) return null;
      return ["withdrawals", i + 1];
    },
    async ([, page]) => listWithdrawalRequests({ page: page as number, pageSize: PAGE_SIZE }),
    { revalidateFirstPage: true }
  );

  const all = useMemo(() => (data ? data.flatMap((p) => p.data ?? []) : []), [data]);
  const loading = !!token && !data && !error;
  const hasMore = Boolean(data && data[data.length - 1]?.data?.length === PAGE_SIZE);

  const filtered = useMemo(() => {
    const f = FILTERS.find((x) => x.id === filterId);
    if (!f || f.id === "all") return all;
    return all.filter((r) => (f as any).match?.has(r.status));
  }, [all, filterId]);

  const totalPaid = all.filter((r) => r.status === "paid" || r.status === "completed").reduce((s, r) => s + (r.amount || 0), 0);

  if (!token) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="space-y-3 text-center">
          <p className="text-4xl">🔐</p>
          <p className="text-sm font-bold text-white">Sign in to view history</p>
          <Link href="/login" className="inline-flex min-h-[40px] items-center rounded-xl cta-gradient px-5 text-sm font-bold text-white">Log in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24 sm:space-y-6 sm:pb-20">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href="/wallet" className="text-white/30 hover:text-white/50">← Wallet</Link>
        <span className="text-white/15">/</span>
        <Link href="/wallet/withdraw" className="text-white/30 hover:text-white/50">Withdraw</Link>
        <span className="text-white/15">/</span>
        <span className="text-xs text-white/50">History</span>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Withdrawal History</h1>
          <p className="mt-0.5 text-xs text-white/40">{all.length} requests · {GBP.format(totalPaid)} paid out</p>
        </div>
        <button onClick={() => mutate()} className="text-[10px] text-white/30 hover:text-white/50">↻ Refresh</button>
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterId(f.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-medium transition ${
              filterId === f.id ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-white/5" />)}
        </div>
      ) : error && all.length === 0 ? (
        <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-center">
          <p className="text-sm text-red-200">Unable to load history</p>
          <button onClick={() => mutate()} className="mt-2 text-xs text-white/50 underline">Retry</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="space-y-3 text-center">
            <p className="text-3xl">📭</p>
            <p className="text-sm font-medium text-white">{filterId === "all" ? "No withdrawals yet" : "None in this filter"}</p>
            <p className="text-xs text-white/30">Submit a withdrawal to see it here</p>
            <Link href="/wallet/withdraw" className="inline-flex min-h-[36px] items-center rounded-xl cta-gradient px-4 text-xs font-bold text-white">
              New Withdrawal
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((r) => (
            <WithdrawalRow key={r.id} request={r} />
          ))}
          {hasMore && (
            <button
              onClick={() => setSize(size + 1)}
              disabled={isValidating}
              className="flex w-full items-center justify-center rounded-xl border border-white/8 py-3 text-xs text-white/40 hover:text-white/60 disabled:opacity-40"
            >
              {isValidating ? "Loading…" : "Load more"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function WithdrawalRow({ request: r }: { request: WithdrawalRequest }) {
  const [open, setOpen] = useState(false);
  const dot = STATUS_DOT[r.status] || "bg-white/30";
  const method = r.method === "uk_bank" ? "Bank" : r.method === "usdt_wallet" ? "USDT" : (r.method || "—");
  const fee = r.amount * FEE;
  const payout = r.amount - fee;

  return (
    <div className={`rounded-xl border transition ${open ? "border-white/15 bg-white/[0.03]" : "border-white/8 bg-white/[0.02]"}`}>
      {/* Row header — always visible */}
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-3 px-3 py-3 text-left">
        <div className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white">#{r.id}</span>
            <span className="rounded-full bg-white/5 px-1.5 py-0.5 text-[8px] capitalize text-white/40">
              {r.status}
            </span>
            <span className="text-[8px] text-white/20">{method}</span>
          </div>
          <p className="mt-0.5 text-[10px] text-white/30">
            {r.method === "uk_bank" ? (r.bankFullName || "Bank transfer") : (r.usdtNetwork || "USDT")}
            {r.method === "usdt_wallet" && r.usdtAddress ? ` · ${r.usdtAddress.slice(0, 8)}…${r.usdtAddress.slice(-4)}` : ""}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-bold text-white">{GBP.format(r.amount)}</p>
          <p className="text-[9px] text-white/25">{relativeTime(r.createdAt)}</p>
        </div>
        <span className={`text-white/15 transition ${open ? "rotate-90" : ""}`}>›</span>
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="space-y-2 border-t border-white/5 px-3 pb-3 pt-2">
          {/* Fee breakdown */}
          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5 space-y-1">
            <Row label="Amount" value={GBP.format(r.amount)} />
            <Row label="Fee (3%)" value={`-${GBP.format(fee)}`} cls="text-red-300" />
            <div className="border-t border-white/5 pt-1">
              <Row label="You receive" value={GBP.format(payout)} cls="font-bold text-emerald-300" />
            </div>
          </div>

          {/* Bank details */}
          {r.method === "uk_bank" && (
            <div className="space-y-1">
              {r.bankFullName && <Row label="Name" value={r.bankFullName} />}
              {r.bankSortCode && <Row label="Sort code" value={r.bankSortCode} mono />}
              {r.bankAccountNumber && <Row label="Account" value={r.bankAccountNumber} mono />}
            </div>
          )}

          {/* USDT details */}
          {r.method === "usdt_wallet" && (
            <div className="space-y-1">
              {r.usdtNetwork && <Row label="Network" value={r.usdtNetwork} />}
              {r.usdtAddress && <Row label="Address" value={r.usdtAddress} mono small />}
            </div>
          )}

          {/* TX hash */}
          {r.txHashOrBankRef && (
            <div className="rounded-lg border border-emerald-400/15 bg-emerald-400/[0.03] p-2">
              <Row label="Payment ref" value={r.txHashOrBankRef} mono small cls="text-emerald-300" />
            </div>
          )}

          {/* Timestamps */}
          <div className="space-y-0.5 pt-1">
            {r.createdAt && <Row label="Submitted" value={new Date(r.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })} small />}
            {r.reviewedAt && <Row label="Processed" value={new Date(r.reviewedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })} small />}
          </div>

          {/* Notes */}
          {r.reviewNotes && (
            <div className="rounded-lg bg-white/[0.03] px-2.5 py-1.5 text-[10px] text-white/40">
              📝 {r.reviewNotes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, cls, mono, small }: { label: string; value: string; cls?: string; mono?: boolean; small?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className={`text-white/40 ${small ? "text-[9px]" : "text-[10px]"}`}>{label}</span>
      <span className={`${cls || "text-white"} ${mono ? "font-mono" : ""} ${small ? "text-[9px]" : "text-[10px]"} text-right break-all`}>
        {value}
      </span>
    </div>
  );
}
