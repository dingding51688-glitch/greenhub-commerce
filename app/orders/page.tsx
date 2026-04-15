"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useSWRInfinite from "swr/infinite";
import { useAuth } from "@/components/providers/AuthProvider";
import type { OrderRecord } from "@/lib/types";
import { listMyOrders } from "@/lib/orders-api";

const GBP = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
const PAGE_SIZE = 10;

const FILTERS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active", statuses: new Set(["pending", "paid", "processing", "awaiting_confirmations"]) },
  { id: "fulfilled", label: "Delivered", statuses: new Set(["dispatched", "delivered", "completed"]) },
  { id: "canceled", label: "Canceled", statuses: new Set(["canceled", "rejected", "refunded"]) },
] as const;

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string; icon: string }> = {
  pending:   { bg: "bg-amber-400/10 border-amber-400/20", text: "text-amber-300", label: "Pending", icon: "⏳" },
  paid:      { bg: "bg-blue-400/10 border-blue-400/20", text: "text-blue-300", label: "Paid", icon: "💳" },
  processing:{ bg: "bg-blue-400/10 border-blue-400/20", text: "text-blue-300", label: "Processing", icon: "⚙️" },
  dispatched:{ bg: "bg-purple-400/10 border-purple-400/20", text: "text-purple-300", label: "Dispatched", icon: "🚚" },
  delivered: { bg: "bg-emerald-400/10 border-emerald-400/20", text: "text-emerald-300", label: "Delivered", icon: "✅" },
  completed: { bg: "bg-emerald-400/10 border-emerald-400/20", text: "text-emerald-300", label: "Completed", icon: "✅" },
  canceled:  { bg: "bg-red-400/10 border-red-400/20", text: "text-red-300", label: "Cancelled", icon: "❌" },
  rejected:  { bg: "bg-red-400/10 border-red-400/20", text: "text-red-300", label: "Rejected", icon: "❌" },
  refunded:  { bg: "bg-red-400/10 border-red-400/20", text: "text-red-300", label: "Refunded", icon: "🔄" },
};
const DEFAULT_BADGE = { bg: "bg-white/5 border-white/10", text: "text-white/40", label: "Unknown", icon: "❓" };

function relativeDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function OrdersPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [filterId, setFilterId] = useState<string>("all");

  const { data, error, size, setSize, isValidating, mutate } = useSWRInfinite(
    (i, prev) => {
      if (!token) return null;
      if (prev && prev.data.length === 0) return null;
      return ["orders", i + 1];
    },
    async ([, page]) => listMyOrders({ page: page as number, pageSize: PAGE_SIZE }),
    { revalidateFirstPage: true }
  );

  const loadingInitial = !!token && !data && !error;
  const orders = useMemo(() => (data ? data.flatMap((p) => p.data ?? []) : []), [data]);
  const hasMore = Boolean(data && data[data.length - 1]?.data?.length === PAGE_SIZE);

  const filtered = useMemo(() => {
    const f = FILTERS.find((x) => x.id === filterId);
    if (!f || f.id === "all") return orders;
    return orders.filter((o) => (f as any).statuses?.has(o.status));
  }, [orders, filterId]);

  const totalSpend = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);

  if (!token) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="space-y-4 text-center">
          <p className="text-4xl">🔐</p>
          <p className="text-lg font-bold text-white">Sign in to view orders</p>
          <Link href="/login" className="inline-flex min-h-[40px] items-center rounded-xl cta-gradient px-5 text-sm font-bold text-white">Log in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24 sm:space-y-6 sm:pb-20">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">Orders</h1>
          <p className="mt-0.5 text-xs text-white/40">{orders.length} orders · {GBP.format(totalSpend)} spent</p>
        </div>
        <button onClick={() => mutate()} className="text-[10px] text-white/30 hover:text-white/50">↻ Refresh</button>
      </div>

      {/* Filter pills */}
      <div className="flex gap-1.5 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterId(f.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-medium transition ${
              filterId === f.id
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loadingInitial ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-white/5" />)}
        </div>
      ) : error && orders.length === 0 ? (
        <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-center">
          <p className="text-sm text-red-200">Failed to load orders</p>
          <button onClick={() => mutate()} className="mt-2 text-xs text-white/50 underline">Retry</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="space-y-3 text-center">
            <p className="text-3xl">📦</p>
            <p className="text-sm font-medium text-white">No orders yet</p>
            <p className="text-xs text-white/30">Your orders will appear here</p>
            <Link href="/products" className="inline-flex min-h-[36px] items-center rounded-xl cta-gradient px-4 text-xs font-bold text-white">Browse products</Link>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((order) => (
            <OrderRow key={order.reference} order={order} />
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

function OrderRow({ order }: { order: OrderRecord }) {
  const badge = STATUS_BADGE[order.status] || DEFAULT_BADGE;
  const items = order.items || [];
  const firstItem = items[0];
  const extraCount = Math.max(0, items.length - 1);

  return (
    <Link
      href={`/orders/${order.reference}`}
      className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-3 transition hover:bg-white/[0.04] active:bg-white/[0.06]"
    >
      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-white">{order.reference}</span>
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badge.bg} ${badge.text}`}>
            <span>{badge.icon}</span>
            <span>{badge.label}</span>
          </span>
          {(order.status === "completed" || order.status === "delivered") && (
            <span className="inline-flex items-center gap-0.5 rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
              ⭐ Review
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-[10px] text-white/30">
          {firstItem ? firstItem.title : "Order"}{extraCount > 0 ? ` +${extraCount} more` : ""}
          {order.dropoffPostcode ? ` · ${order.dropoffPostcode}` : ""}
        </p>
      </div>

      {/* Amount + date */}
      <div className="shrink-0 text-right">
        <p className="text-sm font-bold text-white">{GBP.format(order.totalAmount)}</p>
        <p className="text-[9px] text-white/25">{relativeDate(order.createdAt)}</p>
      </div>

      <span className="text-white/15">›</span>
    </Link>
  );
}
