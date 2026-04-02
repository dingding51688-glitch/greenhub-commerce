"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import useSWR from "swr";
import { StateMessage } from "@/components/StateMessage";
import { Skeleton } from "@/components/Skeleton";
import { apiMutate, swrFetcher } from "@/lib/api";
import type { WalletBalanceResponse, CheckoutResponse } from "@/lib/types";

type CartItem = {
  productId: number;
  title: string;
  quantity: number;
  unitPrice: number;
  weight?: string;
};

type Alert = { type: "success" | "error"; message: string } | null;

const currency = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

export default function CheckoutPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([
    { productId: 101, title: "Bloom Vapor OG", quantity: 1, unitPrice: 35, weight: "3.5g" },
    { productId: 202, title: "Northern Lights", quantity: 1, unitPrice: 25, weight: "2g" },
  ]);
  const [lockerCode, setLockerCode] = useState("");
  const [pickupWindow, setPickupWindow] = useState("");
  const [paymentMode, setPaymentMode] = useState<"wallet" | "topup">("wallet");
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<Alert>(null);
  const [lockerReady, setLockerReady] = useState(false);

  const { data: balanceData } = useSWR<WalletBalanceResponse>(
    token ? "/api/wallet/balance" : null,
    swrFetcher,
    { refreshInterval: 60_000 }
  );

  useEffect(() => {
    const timer = setTimeout(() => setLockerReady(true), 600);
    return () => clearTimeout(timer);
  }, []);

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    [cart]
  );

  const walletShortfall = paymentMode === "wallet" && balanceData ? balanceData.balance < total : false;

  const updateItem = (index: number, partial: Partial<CartItem>) => {
    setCart((prev) => prev.map((item, idx) => (idx === index ? { ...item, ...partial } : item)));
  };

  const removeItem = (index: number) => {
    setCart((prev) => prev.filter((_, idx) => idx !== index));
  };

  const addItem = () => {
    setCart((prev) => [
      ...prev,
      { productId: Date.now(), title: "New Item", quantity: 1, unitPrice: 20 },
    ]);
  };

  const handleSubmit = async () => {
    setAlert(null);
    if (cart.length === 0) {
      setAlert({ type: "error", message: "Add at least one product before checking out." });
      return;
    }
    if (cart.some((item) => item.quantity <= 0 || item.unitPrice <= 0)) {
      setAlert({ type: "error", message: "Quantity and price must be positive values." });
      return;
    }
    if (paymentMode === "wallet" && walletShortfall) {
      setAlert({ type: "error", message: "Insufficient wallet balance. Switch to Top-up or reduce the cart." });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          weight: item.weight,
        })),
      };
      const response = await apiMutate<CheckoutResponse>("/api/orders/checkout", "POST", payload);
      setAlert({
        type: "success",
        message: `Order ${response.order.reference} placed successfully (${response.order.status}).`,
      });
    } catch (err: any) {
      setAlert({ type: "error", message: err.message || "Checkout failed" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleInvoice = () => {
    setAlert({ type: "success", message: "NowPayments hook placeholder – wire to invoice API when ready." });
    setTimeout(() => setAlert(null), 3_000);
  };

  if (!token) {
    return (
      <StateMessage
        title="Please sign in"
        body="Login to place orders and manage locker drop-offs."
        actionLabel="Go to login"
        onAction={() => router.push("/login")}
      />
    );
  }

  return (
    <section className="space-y-6">
      {alert && (
        <div
          className={`rounded-3xl border px-4 py-3 text-sm ${
            alert.type === "success"
              ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
              : "border-red-400/40 bg-red-400/10 text-red-100"
          }`}
        >
          {alert.message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-4">
          <header className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Cart</h2>
            <button onClick={addItem} className="text-sm text-brand-200 hover:text-brand-50">
              + Add demo item
            </button>
          </header>
          {cart.length === 0 ? (
            <StateMessage variant="empty" title="Cart is empty" body="Add items to continue." />
          ) : (
            <div className="space-y-3">
              {cart.map((item, index) => (
                <div key={item.productId} className="rounded-3xl border border-white/10 bg-card p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <input
                      className="flex-1 rounded-2xl border border-white/10 bg-transparent px-3 py-2 text-sm"
                      value={item.title}
                      onChange={(event) => updateItem(index, { title: event.target.value })}
                    />
                    <button
                      className="text-xs text-red-300"
                      onClick={() => removeItem(index)}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <label className="text-xs uppercase tracking-[0.2em] text-white/40">
                      Product ID
                      <input
                        type="number"
                        className="mt-1 w-full rounded-2xl border border-white/10 bg-transparent px-3 py-2 text-sm"
                        value={item.productId}
                        onChange={(event) => updateItem(index, { productId: Number(event.target.value) })}
                      />
                    </label>
                    <label className="text-xs uppercase tracking-[0.2em] text-white/40">
                      Quantity
                      <input
                        type="number"
                        min={1}
                        className="mt-1 w-full rounded-2xl border border-white/10 bg-transparent px-3 py-2 text-sm"
                        value={item.quantity}
                        onChange={(event) => updateItem(index, { quantity: Number(event.target.value) })}
                      />
                    </label>
                    <label className="text-xs uppercase tracking-[0.2em] text-white/40">
                      Unit price (£)
                      <input
                        type="number"
                        min={1}
                        className="mt-1 w-full rounded-2xl border border-white/10 bg-transparent px-3 py-2 text-sm"
                        value={item.unitPrice}
                        onChange={(event) => updateItem(index, { unitPrice: Number(event.target.value) })}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}

          {lockerReady ? (
          <div className="rounded-3xl border border-white/10 bg-card p-4">
            <h3 className="text-lg font-semibold">Locker details</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-xs uppercase tracking-[0.2em] text-white/40">
                Postcode
                <input
                  placeholder="BT1 1AA"
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-transparent px-3 py-2 text-sm"
                  value={lockerCode}
                  onChange={(event) => setLockerCode(event.target.value)}
                />
              </label>
              <label className="text-xs uppercase tracking-[0.2em] text-white/40">
                Notes for courier
                <input
                  placeholder="Locker preference, door code, etc."
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-transparent px-3 py-2 text-sm"
                  value={pickupWindow}
                  onChange={(event) => setPickupWindow(event.target.value)}
                />
              </label>
            </div>
            <p className="mt-3 text-xs text-white/50">
              We only collect a postcode and notes—dispatch will match you with the nearest locker manually.
            </p>
          </div>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-card p-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="mt-2 h-10 w-full" />
              <Skeleton className="mt-2 h-10 w-full" />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-card p-5">
            <p className="text-sm text-white/60">Wallet balance</p>
            {balanceData ? (
              <p className="text-3xl font-semibold">{currency.format(balanceData.balance)}</p>
            ) : (
              <div className="mt-2 h-8 w-32 animate-pulse rounded-full bg-white/5" />
            )}
            <div className="mt-4 space-y-2">
              {["wallet", "topup"].map((mode) => (
                <label
                  key={mode}
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-3 py-2 text-sm ${
                    paymentMode === mode ? "border-brand-500 bg-brand-500/10" : "border-white/10"
                  }`}
                >
                  <input
                    type="radio"
                    checked={paymentMode === mode}
                    onChange={() => setPaymentMode(mode as "wallet" | "topup")}
                  />
                  {mode === "wallet" ? "Pay with wallet" : "Top up via USDT"}
                </label>
              ))}
            </div>
            {walletShortfall && (
              <p className="mt-2 text-xs text-red-300">
                Wallet balance is lower than the cart total. Switch to Top-up or add funds first.
              </p>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-card p-5">
            <div className="flex items-center justify-between text-sm text-white/60">
              <span>Cart total</span>
              <span className="text-xl font-semibold text-white">{currency.format(total)}</span>
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting || cart.length === 0}
              className="mt-4 w-full rounded-2xl bg-brand-600 py-3 text-center text-sm font-semibold text-white disabled:opacity-50"
            >
              {submitting ? "Placing order..." : "Place order"}
            </button>
            <button
              onClick={handleInvoice}
              className="mt-2 w-full rounded-2xl border border-white/10 py-2 text-sm text-white hover:border-white/40"
            >
              Request NowPayments invoice
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
