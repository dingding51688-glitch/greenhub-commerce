"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { findOrderSummary, getOrderTracking } from "@/lib/orders-api";
import type { OrderRecord } from "@/lib/types";

const GBP = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
const DATE_FMT = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });

const STATUS_STEP: Record<string, number> = {
  pending: 0, paid: 1, processing: 1, awaiting_confirmations: 1,
  dispatched: 2, delivered: 3, completed: 3,
  canceled: -1, rejected: -1, refunded: -1,
};
const STEPS = ["Placed", "Processing", "Dispatched", "Delivered"];

function CopyBtn({ value }: { value: string }) {
  const [ok, setOk] = useState(false);
  const copy = useCallback(async () => {
    try { await navigator.clipboard.writeText(value); setOk(true); setTimeout(() => setOk(false), 1500); } catch {}
  }, [value]);
  return (
    <button onClick={copy} className="ml-1.5 text-[9px] text-white/30 hover:text-white/50">{ok ? "✓" : "📋"}</button>
  );
}

export default function OrderDetailPage({ params }: { params: { reference: string } }) {
  const { token } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      getOrderTracking(params.reference),
      findOrderSummary(params.reference).catch(() => null),
    ])
      .then(([tracking, summary]) => {
        const t = tracking.order ?? null;
        // Merge tracking events into the order object
        const merged = summary
          ? { ...summary, status: t?.status ?? summary.status, ...( t ? { trackingEvents: t.trackingEvents, trackingState: t.trackingState, trackingLastChecked: t.trackingLastChecked, dispatchedAt: t.dispatchedAt || summary.dispatchedAt, deliveredAt: t.deliveredAt || summary.deliveredAt } : {}) }
          : t;
        setOrder(merged);
      })
      .catch((err) => setError(err?.message || "Unable to load order"))
      .finally(() => setLoading(false));
  }, [params.reference, token]);

  if (!token) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="space-y-3 text-center">
          <p className="text-4xl">🔐</p>
          <p className="text-sm font-bold text-white">Sign in to view this order</p>
          <Link href="/login" className="inline-flex min-h-[40px] items-center rounded-xl cta-gradient px-5 text-sm font-bold text-white">Log in</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-3 pb-24">
        <div className="h-24 animate-pulse rounded-2xl bg-white/5" />
        <div className="h-16 animate-pulse rounded-2xl bg-white/5" />
        <div className="h-40 animate-pulse rounded-2xl bg-white/5" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="space-y-3 text-center">
          <p className="text-4xl">❌</p>
          <p className="text-sm font-bold text-white">Order not found</p>
          <p className="text-xs text-white/40">{error || "Check the reference or contact support"}</p>
          <Link href="/orders" className="inline-flex min-h-[36px] items-center rounded-xl border border-white/15 px-4 text-xs font-medium text-white">Back to orders</Link>
        </div>
      </div>
    );
  }

  const items = order.items ?? [];
  const step = STATUS_STEP[order.status] ?? 0;
  const isCanceled = step === -1;
  const lockerDisplay = order.lockerNotes || order.lockerAddress;

  return (
    <div className="space-y-4 pb-24 sm:space-y-6 sm:pb-20">
      {/* Back + Reference */}
      <div className="flex items-center gap-2">
        <Link href="/orders" className="text-white/30 hover:text-white/50">← Orders</Link>
        <span className="text-white/15">/</span>
        <span className="text-xs font-mono text-white/50">{order.reference}</span>
      </div>

      {/* Status header */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-900/15 to-transparent p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/40">Order Total</p>
            <p className="text-2xl font-bold text-white">{GBP.format(order.totalAmount)}</p>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${
            isCanceled ? "bg-red-400/10 text-red-300" : step >= 3 ? "bg-emerald-400/10 text-emerald-300" : "bg-amber-400/10 text-amber-300"
          }`}>
            {order.status.replace(/_/g, " ")}
          </span>
        </div>
        {order.createdAt && (
          <p className="mt-1 text-[10px] text-white/25">{DATE_FMT.format(new Date(order.createdAt))}</p>
        )}
      </div>

      {/* Progress stepper */}
      {!isCanceled && (
        <div className="flex items-center gap-1 px-1">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-1 flex-col items-center gap-1">
              <div className={`h-1.5 w-full rounded-full ${i <= step ? "bg-emerald-400" : "bg-white/8"}`} />
              <span className={`text-[8px] ${i <= step ? "text-emerald-300" : "text-white/20"}`}>{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Items */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <p className="text-[10px] uppercase tracking-wider text-white/40 mb-2">Items · {items.length}</p>
        {items.length === 0 ? (
          <p className="text-xs text-white/30">No items data</p>
        ) : (
          <div className="space-y-1.5">
            {items.map((item, i) => (
              <div key={`${item.productId}-${item.weight}-${i}`}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5">
                <div>
                  <p className="text-xs font-semibold text-white">{item.title || `Product #${item.productId}`}</p>
                  <p className="text-[9px] text-white/30">
                    {item.weight || "—"} × {item.quantity}
                    {item.unitPrice ? ` · ${GBP.format(item.unitPrice)} each` : ""}
                  </p>
                </div>
                <p className="text-sm font-bold text-white">{GBP.format(item.lineTotal)}</p>
              </div>
            ))}
            {/* Subtotal + Delivery + Total */}
            <div className="border-t border-white/5 pt-2 mt-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/40">Subtotal</span>
                <span className="text-xs text-white/60">{GBP.format(items.reduce((s, it) => s + (it.lineTotal || (it.unitPrice || 0) * (it.quantity || 1)), 0))}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/40">🚚 Delivery</span>
                <span className="text-xs text-white/60">{GBP.format(order.deliveryFee ?? 5)}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-white/5">
                <span className="text-[10px] text-white/40 font-semibold">Order Total</span>
                <span className="text-sm font-bold text-emerald-300">{GBP.format(order.totalAmount)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delivery info */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <p className="text-[10px] uppercase tracking-wider text-white/40 mb-3">Delivery</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoField label="Postcode" value={order.dropoffPostcode || "Pending"} />
          <InfoField label="Payment" value={order.paymentOption || "Wallet"} />
          {order.contactEmail && <InfoField label="Email" value={order.contactEmail} />}
          {order.deliveryMethod && (
            <InfoField label="Method" value={
              order.deliveryMethod === "inpost_locker" ? "🔐 InPost Locker" :
              order.deliveryMethod === "oohpod_locker" ? "🔐 OOHPod Locker" :
              order.deliveryMethod === "yodel_store" ? "🏪 Yodel Collection Point" :
              order.deliveryMethod
            } />
          )}
          {(order.deliveryFee ?? 0) > 0 && <InfoField label="Delivery Fee" value={`£${(order.deliveryFee ?? 0).toFixed(2)}`} />}
        </div>
        {/* Pickup location */}
        {order.pickupLocationName && (
          <div className="mt-3 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.03] p-3">
            <p className="text-[9px] uppercase tracking-wider text-emerald-300/50 mb-1">Pickup Location</p>
            <p className="text-sm font-bold text-white">{order.pickupLocationName}</p>
            {order.pickupLocationAddress && (
              <p className="text-[10px] text-white/40 mt-0.5">{order.pickupLocationAddress}</p>
            )}
          </div>
        )}
      </div>

      {/* Tracking & Shipping */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <p className="text-[10px] uppercase tracking-wider text-white/40 mb-3">🚚 Tracking & Shipping</p>
        <div className="space-y-3">
          {/* Tracking number + carrier */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[9px] uppercase tracking-wider text-white/30">Tracking Number</p>
              <div className="flex items-center">
                <p className="font-mono text-sm font-bold text-white">{order.trackingNumber || "—"}</p>
                {order.trackingNumber && <CopyBtn value={order.trackingNumber} />}
              </div>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wider text-white/30">Carrier</p>
              <p className="text-sm text-white">{order.carrier || "—"}</p>
            </div>
          </div>

          {/* Carrier tracking link */}
          {order.trackingNumber && (() => {
            const c = (order.carrier || "").toLowerCase();
            const tn = order.trackingNumber;
            let url = `https://www.yodel.co.uk/track/${tn}`;
            let label = "Track on Yodel";
            if (c.includes("inpost")) { url = `https://inpost.co.uk/track-and-trace?number=${tn}`; label = "Track on InPost"; }
            else if (c.includes("royal") || c.includes("rm")) { url = `https://www.royalmail.com/track-your-item#/tracking-results/${tn}`; label = "Track on Royal Mail"; }
            else if (c.includes("dpd")) { url = `https://www.dpd.co.uk/tracking/quicktrack?search=${tn}`; label = "Track on DPD"; }
            else if (c.includes("evri") || c.includes("hermes")) { url = `https://www.evri.com/track-a-parcel/${tn}`; label = "Track on Evri"; }
            return (
              <a href={url} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 text-xs text-emerald-300 hover:bg-emerald-400/10 transition">
                🔗 {label} →
              </a>
            );
          })()}

          {/* Locker info if present */}
          {(order.lockerAddress || order.lockerAccessCode) && (
            <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300">📦 Locker Pickup</p>
              {order.lockerAddress && (
                <div className="flex items-center">
                  <p className="text-sm text-white">{order.lockerAddress}</p>
                  <CopyBtn value={order.lockerAddress} />
                </div>
              )}
              {order.lockerAccessCode && (
                <div>
                  <p className="text-[9px] text-white/30">Access Code</p>
                  <div className="flex items-center">
                    <p className="font-mono text-lg font-bold text-amber-300">{order.lockerAccessCode}</p>
                    <CopyBtn value={order.lockerAccessCode} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tracking Timeline */}
      {order.trackingEvents && Array.isArray(order.trackingEvents) && order.trackingEvents.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <p className="text-[10px] uppercase tracking-wider text-white/40 mb-4">📍 Tracking Timeline</p>
          <div className="relative pl-6">
            {/* Vertical line */}
            <div className="absolute left-[9px] top-1 bottom-1 w-px bg-white/10" />
            {order.trackingEvents.map((evt, i) => {
              const isFirst = i === 0;
              const isDelivered = ["ZA", "ZL", "LF"].includes(evt.code);
              const dotColor = isFirst
                ? isDelivered ? "bg-emerald-400" : "bg-amber-400"
                : "bg-white/20";
              const textColor = isFirst ? "text-white" : "text-white/50";

              return (
                <div key={`${evt.code}-${evt.occurred_at}`} className="relative pb-5 last:pb-0">
                  {/* Dot */}
                  <div className={`absolute -left-6 top-0.5 h-[14px] w-[14px] rounded-full border-2 border-[#0a0b0e] ${dotColor}`} />
                  <div>
                    <p className={`text-xs font-semibold ${textColor}`}>{evt.text || evt.description}</p>
                    <p className="text-[10px] text-white/25 mt-0.5">
                      {new Date(evt.occurred_at).toLocaleString("en-GB", {
                        day: "numeric", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit"
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Review prompt — only for completed orders */}
      {(order.status === "completed" || order.status === "delivered") && items.length > 0 && (
        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4">
          <p className="text-sm font-bold text-amber-200 mb-2">⭐ How was your order?</p>
          <p className="text-xs text-white/50 mb-3">Help other customers by leaving a review on the products you purchased.</p>
          <div className="flex flex-wrap gap-2">
            {items.map((item: any, i: number) => {
              const slug = item.slug || item.productSlug || (item.title || item.name || item.productName || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
              return (
                <Link key={i} href={slug ? `/products/${slug}#reviews` : "/products"}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400/10 border border-amber-400/20 px-3 py-1.5 text-xs font-medium text-amber-200 hover:bg-amber-400/20 transition">
                  ⭐ Review {item.title || item.name || item.productName || 'Product'}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Link href="/support"
          className="flex flex-1 min-h-[44px] items-center justify-center rounded-xl cta-gradient text-sm font-bold text-white">
          Need Help?
        </Link>
        <Link href="/orders"
          className="flex flex-1 min-h-[44px] items-center justify-center rounded-xl border border-white/15 text-sm font-medium text-white">
          All Orders
        </Link>
      </div>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-wider text-white/30">{label}</p>
      <p className="text-sm text-white">{value}</p>
    </div>
  );
}
