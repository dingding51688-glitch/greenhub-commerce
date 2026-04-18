"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import useSWRInfinite from "swr/infinite";
import { useAuth } from "@/components/providers/AuthProvider";
import useSWR from "swr";
import type { OrderRecord } from "@/lib/types";
import { listMyOrders } from "@/lib/orders-api";

const GBP = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
const CMS = "https://cms.greenhub420.co.uk";
const PAGE_SIZE = 10;

const FILTERS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active", statuses: new Set(["pending", "paid", "processing", "awaiting_confirmations"]) },
  { id: "fulfilled", label: "Delivered", statuses: new Set(["dispatched", "delivered", "completed"]) },
  { id: "canceled", label: "Canceled", statuses: new Set(["canceled", "rejected", "refunded"]) },
] as const;

const STATUS_CFG: Record<string, { color: string; label: string; icon: string; step: number }> = {
  pending:    { color: "text-amber-300",   label: "Pending",    icon: "⏳", step: 0 },
  paid:       { color: "text-blue-300",    label: "Paid",       icon: "💳", step: 1 },
  processing: { color: "text-blue-300",    label: "Processing", icon: "⚙️", step: 1 },
  dispatched: { color: "text-purple-300",  label: "Dispatched", icon: "🚚", step: 2 },
  delivered:  { color: "text-emerald-300", label: "Delivered",  icon: "✅", step: 3 },
  completed:  { color: "text-emerald-300", label: "Completed",  icon: "✅", step: 3 },
  canceled:   { color: "text-red-300",     label: "Cancelled",  icon: "❌", step: -1 },
  rejected:   { color: "text-red-300",     label: "Rejected",   icon: "❌", step: -1 },
  refunded:   { color: "text-red-300",     label: "Refunded",   icon: "🔄", step: -1 },
};
const DEFAULT_CFG = { color: "text-white/40", label: "Unknown", icon: "❓", step: 0 };

function relativeDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function itemImg(path?: string | null) {
  if (!path) return null;
  return path.startsWith("http") ? path : `${CMS}${path}`;
}

/* ── Mini progress bar ── */
const STEP_LABELS = ["Placed", "Processing", "Shipped", "Delivered"];
function MiniProgress({ step }: { step: number }) {
  if (step < 0) return null;
  const pct = Math.min(step / 3, 1) * 100;
  return (
    <div>
      <div className="relative h-[3px] w-full rounded-full bg-white/8 overflow-hidden">
        <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between mt-1">
        {STEP_LABELS.map((l, i) => (
          <span key={l} className={`text-[8px] ${i <= step ? "text-emerald-400/70" : "text-white/15"}`}>{l}</span>
        ))}
      </div>
    </div>
  );
}

/* ── Product thumbnail stack ── */
function ItemThumbs({ items }: { items: any[] }) {
  const visible = items.slice(0, 3);
  const extra = items.length - 3;
  if (!visible.length) return null;
  return (
    <div className="flex -space-x-2">
      {visible.map((item, i) => {
        const src = itemImg(item.image);
        return src ? (
          <img key={i} src={src} alt="" className="h-9 w-9 rounded-lg border-2 border-[#0a0b0e] object-cover bg-white/5" />
        ) : (
          <div key={i} className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-[#0a0b0e] bg-white/5 text-[10px] text-white/30">📦</div>
        );
      })}
      {extra > 0 && (
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-[#0a0b0e] bg-white/10 text-[10px] font-bold text-white/50">
          +{extra}
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  const { token } = useAuth();
  const [filterId, setFilterId] = useState<string>("all");

  // Fetch reviewed order IDs
  const { data: reviewData } = useSWR(
    token ? "my-reviews" : null,
    () => fetch("/api/strapi/reviews/mine", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => new Set((d?.data || []).map((r: any) => r.orderId).filter(Boolean)))
      .catch(() => new Set()),
  );
  const reviewedOrderIds: Set<number> = reviewData || new Set();

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
          <Link href="/login" className="inline-flex min-h-[44px] items-center rounded-xl cta-gradient px-5 text-sm font-bold text-white">Log in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Orders</h1>
          <p className="mt-0.5 text-xs text-white/40">{orders.length} orders · {GBP.format(totalSpend)} spent</p>
        </div>
        <button onClick={() => mutate()} className="text-[10px] text-white/30 hover:text-white/50 active:text-white/70">↻ Refresh</button>
      </div>

      {/* Filter pills */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterId(f.id)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-[11px] font-medium transition-all ${
              filterId === f.id
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "text-white/40 hover:text-white/60 border border-transparent"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loadingInitial ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : error && orders.length === 0 ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-6 text-center">
          <p className="text-sm text-red-200">Failed to load orders</p>
          <button onClick={() => mutate()} className="mt-2 text-xs text-white/50 underline">Retry</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="space-y-3 text-center">
            <p className="text-4xl">📦</p>
            <p className="text-sm font-medium text-white">No orders yet</p>
            <p className="text-xs text-white/30">Your orders will appear here</p>
            <Link href="/products" className="inline-flex min-h-[44px] items-center rounded-xl cta-gradient px-5 text-xs font-bold text-white">Browse products</Link>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((order) => (
            <OrderCard key={order.reference} order={order} reviewedOrderIds={reviewedOrderIds} />
          ))}
          {hasMore && (
            <button
              onClick={() => setSize(size + 1)}
              disabled={isValidating}
              className="flex w-full min-h-[44px] items-center justify-center rounded-2xl border border-white/8 text-xs text-white/40 hover:text-white/60 disabled:opacity-40"
            >
              {isValidating ? "Loading…" : "Load more"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function OrderCard({ order, reviewedOrderIds }: { order: OrderRecord; reviewedOrderIds: Set<number> }) {
  const cfg = STATUS_CFG[order.status] || DEFAULT_CFG;
  const items = order.items || [];
  const firstItem = items[0];
  const extraCount = Math.max(0, items.length - 1);
  const showReview = (order.status === "completed" || order.status === "delivered") && !reviewedOrderIds.has(order.id);

  return (
    <Link
      href={`/orders/${order.reference}`}
      className="block rounded-2xl border border-white/8 bg-white/[0.02] p-3.5 transition active:bg-white/[0.06] hover:bg-white/[0.04]"
    >
      {/* Row 1: Reference + Status + Amount */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-white">{order.reference}</span>
            <span className={`text-[10px] font-semibold ${cfg.color}`}>
              {cfg.icon} {cfg.label}
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[15px] font-bold text-white">{GBP.format(order.totalAmount)}</span>
          <p className="text-[10px] text-white/25">{relativeDate(order.createdAt)}</p>
        </div>
      </div>

      {/* Row 2: Progress bar */}
      <div className="mt-2.5">
        <MiniProgress step={cfg.step} />
      </div>

      {/* Row 3: Thumbnails + item summary + review badge */}
      <div className="mt-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <ItemThumbs items={items} />
          <p className="text-[11px] text-white/40">
            {firstItem?.title || "Order"}{extraCount > 0 ? ` +${extraCount}` : ""}
          </p>
        </div>
        {showReview ? (
          <span className="shrink-0 inline-flex items-center gap-0.5 rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
            ⭐ Review
          </span>
        ) : (order.status === "completed" || order.status === "delivered") && reviewedOrderIds.has(order.id) ? (
          <span className="shrink-0 inline-flex items-center gap-0.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
            ✅ Reviewed
          </span>
        ) : null}
      </div>
    </Link>
  );
}
