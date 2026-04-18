"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { findOrderSummary, getOrderTracking } from "@/lib/orders-api";
import { ReviewModal } from "@/components/ReviewModal";
import type { OrderRecord } from "@/lib/types";

const GBP = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
const CMS = "https://cms.greenhub420.co.uk";
function itemImg(path?: string | null) {
  if (!path) return null;
  return path.startsWith("http") ? path : `${CMS}${path}`;
}

const STATUS_STEP: Record<string, number> = {
  pending: 0, paid: 1, processing: 1, awaiting_confirmations: 1,
  dispatched: 2, delivered: 3, completed: 3,
  canceled: -1, rejected: -1, refunded: -1,
};
const STEPS = ["Placed", "Processing", "Shipped", "Delivered"];

function CopyBtn({ value }: { value: string }) {
  const [ok, setOk] = useState(false);
  const copy = useCallback(async () => {
    try { await navigator.clipboard.writeText(value); setOk(true); setTimeout(() => setOk(false), 1500); } catch {}
  }, [value]);
  return <button onClick={copy} className="ml-1 text-[9px] text-white/30 active:text-white/60">{ok ? "✓" : "📋"}</button>;
}

export default function OrderDetailPage({ params }: { params: { reference: string } }) {
  const { token } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [reviewItem, setReviewItem] = useState<{ productId: number; title: string } | null>(null);
  const [reviewedIds, setReviewedIds] = useState<Set<number>>(new Set());
  const [reviewedPairs, setReviewedPairs] = useState<Array<{productId: number; orderId: number | null}>>([]);
  const [showTimeline, setShowTimeline] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch("/api/strapi/reviews/mine", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d?.data)) setReviewedPairs(d.data); })
      .catch(() => {});
  }, [token]);

  const isReviewed = (productId: number) =>
    order ? reviewedPairs.some(r => r.productId === productId && r.orderId === order.id) : false;

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      getOrderTracking(params.reference),
      findOrderSummary(params.reference).catch(() => null),
    ])
      .then(([tracking, summary]) => {
        const t = tracking.order ?? null;
        const merged = summary
          ? { ...summary, status: t?.status ?? summary.status, ...(t ? { trackingEvents: t.trackingEvents, trackingState: t.trackingState, trackingLastChecked: t.trackingLastChecked, dispatchedAt: t.dispatchedAt || summary.dispatchedAt, deliveredAt: t.deliveredAt || summary.deliveredAt } : {}) }
          : t;
        setOrder(merged);
      })
      .catch((err) => setError(err?.message || "Unable to load order"))
      .finally(() => setLoading(false));
  }, [params.reference, token]);

  if (!token) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="space-y-3 text-center">
        <p className="text-4xl">🔐</p>
        <p className="text-sm font-bold text-white">Sign in to view this order</p>
        <Link href="/login" className="inline-flex min-h-[44px] items-center rounded-xl cta-gradient px-5 text-sm font-bold text-white">Log in</Link>
      </div>
    </div>
  );

  if (loading) return (
    <div className="space-y-2 pb-24">
      <div className="h-20 animate-pulse rounded-2xl bg-white/5" />
      <div className="h-12 animate-pulse rounded-2xl bg-white/5" />
      <div className="h-32 animate-pulse rounded-2xl bg-white/5" />
    </div>
  );

  if (error || !order) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="space-y-3 text-center">
        <p className="text-4xl">❌</p>
        <p className="text-sm font-bold text-white">Order not found</p>
        <Link href="/orders" className="inline-flex min-h-[36px] items-center rounded-xl border border-white/15 px-4 text-xs font-medium text-white">Back to orders</Link>
      </div>
    </div>
  );

  const items = order.items ?? [];
  const step = STATUS_STEP[order.status] ?? 0;
  const isCanceled = step === -1;
  const showReview = order.status === "completed" || order.status === "delivered";
  const events = order.trackingEvents && Array.isArray(order.trackingEvents) ? order.trackingEvents : [];
  const subtotal = items.reduce((s, it) => s + (it.lineTotal || (it.unitPrice || 0) * (it.quantity || 1)), 0);
  const deliveryFee = order.deliveryFee ?? 5;

  // Carrier link
  const carrierLink = order.trackingNumber ? (() => {
    const c = (order.carrier || "").toLowerCase();
    const tn = order.trackingNumber!;
    if (c.includes("inpost")) return { url: `https://inpost.co.uk/track-and-trace?number=${tn}`, label: "InPost" };
    if (c.includes("royal") || c.includes("rm")) return { url: `https://www.royalmail.com/track-your-item#/tracking-results/${tn}`, label: "Royal Mail" };
    if (c.includes("dpd")) return { url: `https://www.dpd.co.uk/tracking/quicktrack?search=${tn}`, label: "DPD" };
    if (c.includes("evri") || c.includes("hermes")) return { url: `https://www.evri.com/track-a-parcel/${tn}`, label: "Evri" };
    return { url: `https://www.yodel.co.uk/track/${tn}`, label: "Yodel" };
  })() : null;

  return (
    <div className="pb-24 space-y-3">
      {/* Header: back + ref + status + total */}
      <div className="flex items-center gap-1.5 text-[11px]">
        <Link href="/orders" className="text-white/30 active:text-white/50">← Orders</Link>
        <span className="text-white/10">/</span>
        <span className="font-mono text-white/40">{order.reference}</span>
      </div>

      <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-3.5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xl font-bold text-white">{GBP.format(order.totalAmount)}</p>
            <p className="text-[10px] text-white/25 mt-0.5">
              {order.createdAt && new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              {order.dropoffPostcode ? ` · ${order.dropoffPostcode}` : ""}
            </p>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${
            isCanceled ? "bg-red-400/10 text-red-300" : step >= 3 ? "bg-emerald-400/10 text-emerald-300" : "bg-amber-400/10 text-amber-300"
          }`}>
            {order.status.replace(/_/g, " ")}
          </span>
        </div>

        {/* Progress bar */}
        {!isCanceled && (
          <div className="mt-3">
            <div className="relative h-[3px] w-full rounded-full bg-white/8 overflow-hidden">
              <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all" style={{ width: `${Math.min(step / 3, 1) * 100}%` }} />
            </div>
            <div className="flex justify-between mt-1">
              {STEPS.map((l, i) => (
                <span key={l} className={`text-[8px] ${i <= step ? "text-emerald-400/70" : "text-white/15"}`}>{l}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tracking quick info */}
      {order.trackingNumber && (
        <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[9px] uppercase text-white/30">Tracking · {order.carrier || "Carrier"}</p>
              <div className="flex items-center mt-0.5">
                <p className="font-mono text-[11px] font-bold text-white truncate">{order.trackingNumber}</p>
                <CopyBtn value={order.trackingNumber} />
              </div>
            </div>
            {carrierLink && (
              <a href={carrierLink.url} target="_blank" rel="noreferrer"
                className="shrink-0 rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-2.5 py-1.5 text-[10px] font-semibold text-emerald-300 active:bg-emerald-400/10">
                Track →
              </a>
            )}
          </div>

          {/* Locker info */}
          {order.lockerAccessCode && (
            <div className="mt-2 rounded-lg border border-amber-400/15 bg-amber-400/5 px-2.5 py-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[8px] uppercase text-amber-300/60">Access Code</p>
                  <div className="flex items-center">
                    <p className="font-mono text-lg font-bold text-amber-300">{order.lockerAccessCode}</p>
                    <CopyBtn value={order.lockerAccessCode} />
                  </div>
                </div>
                {order.pickupLocationName && (
                  <p className="text-[10px] text-white/40 text-right max-w-[50%]">{order.pickupLocationName}</p>
                )}
              </div>
            </div>
          )}

          {/* Timeline toggle */}
          {events.length > 0 && (
            <button
              onClick={() => setShowTimeline(!showTimeline)}
              className="mt-2 flex w-full items-center justify-between rounded-lg bg-white/[0.03] px-2.5 py-1.5 text-[10px] text-white/40 active:bg-white/[0.06]"
            >
              <span>📍 {events.length} tracking events</span>
              <span>{showTimeline ? "▲" : "▼"}</span>
            </button>
          )}

          {/* Timeline (collapsible) */}
          {showTimeline && events.length > 0 && (
            <div className="relative pl-5 mt-3">
              <div className="absolute left-[7px] top-1 bottom-1 w-px bg-white/8" />
              {events.map((evt, i) => {
                const isFirst = i === 0;
                const isKey = ["ZA", "ZL", "LF"].includes(evt.code);
                const dotColor = isFirst ? (isKey ? "bg-emerald-400" : "bg-amber-400") : "bg-white/15";
                return (
                  <div key={`${evt.code}-${evt.occurred_at}-${i}`} className="relative pb-3.5 last:pb-0">
                    <div className={`absolute -left-5 top-0.5 h-3 w-3 rounded-full border-2 border-[#0a0b0e] ${dotColor}`} />
                    <p className={`text-[11px] font-medium ${isFirst ? "text-white" : "text-white/40"}`}>{evt.text || evt.description}</p>
                    <p className="text-[9px] text-white/20">
                      {new Date(evt.occurred_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Items — compact */}
      <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-3">
        <p className="text-[9px] uppercase tracking-wider text-white/30 mb-2">Items · {items.length}</p>
        <div className="space-y-1">
          {items.map((item, i) => {
            const slug = item.slug || item.productSlug || (item.title || item.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
            return (
              <div key={`${item.productId}-${item.weight}-${i}`} className="flex items-center gap-2.5 py-1.5">
                {itemImg(item.image) ? (
                  <Link href={slug ? `/products/${slug}` : "#"} className="shrink-0">
                    <img src={itemImg(item.image)!} alt="" className="h-10 w-10 rounded-lg object-cover bg-white/5" />
                  </Link>
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center text-sm">📦</div>
                )}
                <div className="min-w-0 flex-1">
                  {slug ? (
                    <Link href={`/products/${slug}`} className="block truncate text-[12px] font-semibold text-white hover:text-emerald-300">{item.title || "Product"}</Link>
                  ) : (
                    <p className="truncate text-[12px] font-semibold text-white">{item.title || "Product"}</p>
                  )}
                  <p className="text-[9px] text-white/25">{item.weight} × {item.quantity} · {GBP.format(item.unitPrice || 0)} ea</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[13px] font-bold text-white">{GBP.format(item.lineTotal)}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Review Section */}
        {showReview && (
          <div className="mt-3 space-y-2">
            {order.items?.filter((item: any) => item.productId).map((item: any) => {
              const reviewed = isReviewed(item.productId) || reviewedIds.has(item.productId);
              return (
                <div key={item.productId} className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-lg">{reviewed ? "✅" : "⭐"}</span>
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-white truncate">{item.title || "Product"}</p>
                      <p className="text-[10px] text-white/30">{reviewed ? "Thanks for your review!" : "How was this product?"}</p>
                    </div>
                  </div>
                  {reviewed ? (
                    <span className="shrink-0 rounded-full bg-emerald-500/15 border border-emerald-500/20 px-3 py-1.5 text-[11px] font-bold text-emerald-300">
                      Reviewed
                    </span>
                  ) : (
                    <button
                      onClick={(e) => { e.preventDefault(); setReviewItem({ productId: item.productId, title: item.title || "Product" }); }}
                      className="shrink-0 rounded-full bg-amber-500/15 border border-amber-500/20 px-4 py-1.5 text-[11px] font-bold text-amber-200 active:bg-amber-500/25 min-h-[36px]">
                      ⭐ Leave Review
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Totals */}
        <div className="border-t border-white/5 pt-2 mt-2 space-y-0.5">
          <div className="flex justify-between text-[10px]">
            <span className="text-white/30">Subtotal</span>
            <span className="text-white/50">{GBP.format(subtotal)}</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-white/30">📦 Delivery</span>
            <span className="text-white/50">{GBP.format(deliveryFee)}</span>
          </div>
          <div className="flex justify-between text-[11px] pt-1 border-t border-white/5">
            <span className="font-bold text-white/50">Total</span>
            <span className="font-bold text-emerald-300">{GBP.format(order.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Link href="/support"
          className="flex flex-1 min-h-[44px] items-center justify-center rounded-xl cta-gradient text-sm font-bold text-white">
          Need Help?
        </Link>
        <Link href="/orders"
          className="flex flex-1 min-h-[44px] items-center justify-center rounded-xl border border-white/10 text-sm font-medium text-white/70">
          All Orders
        </Link>
      </div>

      {/* Review Modal */}
      {reviewItem && (
        <ReviewModal
          productId={reviewItem.productId}
          productName={reviewItem.title}
          orderId={order?.id}
          onClose={() => setReviewItem(null)}
          onSuccess={() => {
            setReviewedIds((prev) => new Set(prev).add(reviewItem.productId));
            setReviewedPairs((prev) => [...prev, { productId: reviewItem.productId, orderId: order?.id || null }]);
            setReviewItem(null);
          }}
        />
      )}
    </div>
  );
}
