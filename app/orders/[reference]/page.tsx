"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { StateMessage } from "@/components/StateMessage";
import Button from "@/components/ui/button";
import { findOrderSummary, getOrderTracking } from "@/lib/orders-api";
import type { OrderRecord } from "@/lib/types";

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
      findOrderSummary(params.reference).catch(() => null)
    ])
      .then(([trackingResponse, orderSummary]) => {
        const trackingOrder = trackingResponse.order ?? null;
        const merged = orderSummary
          ? { ...orderSummary, status: trackingOrder?.status ?? orderSummary.status }
          : trackingOrder;
        setOrder(merged);
      })
      .catch((err) => setError(err?.message || "Unable to load order"))
      .finally(() => setLoading(false));
  }, [params.reference, token]);

  if (!token) {
    return (
      <StateMessage
        title="Sign in to view orders"
        body="Login first, then revisit this link."
        actionLabel="Login"
        onAction={() => router.push("/login")}
      />
    );
  }

  if (loading) {
    return <StateMessage variant="info" title="Fetching order" body="Hold tight while we fetch locker details." />;
  }

  if (error || !order) {
    return (
      <StateMessage
        variant="error"
        title="Order not found"
        body={error || "We can't locate this reference. Double-check the link or contact support."}
        actionLabel="Back to account"
        onAction={() => router.push("/account")}
      />
    );
  }

  const items = order.items ?? [];
  const lockerAddressDisplay = order.lockerNotes || order.lockerAddress;

  return (
    <section className="space-y-6">
      <div className="rounded-[40px] border border-white/10 bg-night-950/80 p-6 shadow-card">
        <p className="text-xs uppercase tracking-[0.35em] text-white/40">Order reference</p>
        <h1 className="text-3xl font-semibold text-white">{order.reference}</h1>
        <p className="mt-2 text-sm text-white/60">
          Status: <span className="text-white">{order.status}</span> · Total {currency.format(order.totalAmount)}
        </p>
      </div>

      <div className="rounded-[32px] border border-white/10 bg-night-950/60 p-5">
        <p className="text-xs uppercase tracking-[0.3em] text-white/40">Items</p>
        {items.length === 0 ? (
          <p className="mt-3 text-sm text-white/60">No line items available for this order.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {items.map((item) => (
            <li key={`${item.productId}-${item.weight}`} className="rounded-2xl border border-white/10 px-4 py-3">
              <div className="flex items-center justify-between text-sm text-white/80">
                <span>{item.title || `Product ${item.productId}`}</span>
                <span>x{item.quantity}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-white/50">
                <span>{item.weight || "Locker-ready"}</span>
                <span>{currency.format(item.unitPrice)}</span>
              </div>
            </li>
            ))}
          </ul>
        )}
      </div>

      {(order.contactEmail || order.dropoffPostcode) && (
        <div className="rounded-[32px] border border-white/10 bg-night-950/60 p-5 text-sm text-white/70">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">Delivery info</p>
          <div className="mt-3 space-y-2">
            {order.contactEmail && (
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">Email</p>
                <p className="text-base text-white">{order.contactEmail}</p>
              </div>
            )}
            {order.dropoffPostcode && (
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">Postcode</p>
                <p className="text-base text-white">{order.dropoffPostcode}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="rounded-[32px] border border-white/10 bg-night-950/60 p-5 text-sm text-white/70">
        <p className="text-xs uppercase tracking-[0.3em] text-white/40">Locker details</p>
        <div className="mt-3 space-y-2">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">Address</p>
            <p className="text-base text-white">
              {lockerAddressDisplay || "Pending"}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">Yodel tracking number</p>
            <p className="font-mono text-lg text-white">
              {order.trackingNumber || "Pending"}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">Access code</p>
            <p className="font-mono text-lg text-white">
              {order.lockerAccessCode || "Pending"}
            </p>
          </div>
          {order.lockerEta && (
            <p className="text-white/60">ETA: {order.lockerEta}</p>
          )}
        </div>
      </div>

      <div className="rounded-[32px] border border-white/10 bg-night-950/60 p-5 text-sm text-white/70">
        <p className="font-semibold text-white">Need to change locker or payment?</p>
        <p className="mt-1">Contact support if you need to change the locker or payment method.</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button asChild className="w-full sm:w-auto">
            <a href="/support">Contact support</a>
          </Button>
          <Button asChild variant="ghost" className="w-full sm:w-auto">
            <a href="/orders">View all orders</a>
          </Button>
        </div>
      </div>
    </section>
  );
}

const currency = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
