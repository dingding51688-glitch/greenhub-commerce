"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import useSWR from "swr";
import { StateMessage } from "@/components/StateMessage";
import { swrFetcher } from "@/lib/api";
import type { OrdersResponse, OrderRecord } from "@/lib/types";

const currency = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
const dateFmt = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });

const STATUS_FILTERS = [
  { label: "All", value: "all" },
  { label: "Processing", value: "paid" },
  { label: "Dispatched", value: "dispatched" },
  { label: "Delivered", value: "delivered" },
  { label: "Rejected", value: "rejected" },
];

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { token } = useAuth();
  const router = useRouter();

  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR<OrdersResponse>(token ? `/api/orders/mine?page=1&pageSize=20` : null, swrFetcher, {
    refreshInterval: 90_000,
  });

  const filtered = useMemo(() => {
    const rows = data?.data || [];
    if (statusFilter === "all") return rows;
    return rows.filter((order) => order.status === statusFilter);
  }, [data, statusFilter]);

  if (!token) {
    return (
      <StateMessage
        title="Please sign in"
        body="Login to review your past orders."
        actionLabel="Go to login"
        onAction={() => router.push("/login")}
      />
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setStatusFilter(filter.value)}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              statusFilter === filter.value
                ? "border-brand-500 bg-brand-500/20 text-white"
                : "border-white/10 bg-transparent text-white/70 hover:border-white/30"
            }`}
          >
            {filter.label}
          </button>
        ))}
        <button
          onClick={() => mutate()}
          className="ml-auto rounded-full border border-white/15 px-4 py-2 text-sm text-white/70 hover:border-white/40"
        >
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-3xl bg-white/5" />
          ))}
        </div>
      ) : error ? (
        <StateMessage
          variant="error"
          title="Unable to load orders"
          body={error.message}
          actionLabel="Retry"
          onAction={() => mutate()}
        />
      ) : filtered.length === 0 ? (
        <StateMessage
          variant="empty"
          title={statusFilter === "all" ? "No orders yet" : "No orders match this filter"}
          body="Checkout from the store to see orders here."
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => (
            <article key={order.id} className="rounded-3xl border border-white/10 bg-card p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/60">#{order.reference}</p>
                  <h3 className="text-xl font-semibold">
                    {currency.format(order.totalAmount)}
                    <span className="ml-2 text-sm text-white/50">{order.currency}</span>
                  </h3>
                </div>
                <div className="text-right text-sm text-white/60">
                  {order.createdAt ? dateFmt.format(new Date(order.createdAt)) : "—"}
                  <p className="text-xs capitalize text-white/40">{order.status}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {(order.items || []).map((item) => (
                  <div key={`${order.id}-${item.productId}-${item.weight}`} className="rounded-2xl border border-white/5 bg-white/5 px-3 py-2 text-sm">
                    <p className="font-medium text-white/90">{item.title}</p>
                    <p className="text-xs text-white/60">
                      Qty {item.quantity}
                      {item.weight ? ` · ${item.weight}` : ""}
                    </p>
                    <p className="text-xs text-white/70">{currency.format(item.lineTotal)}</p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
