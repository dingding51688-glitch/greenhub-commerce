"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import useSWR from "swr";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCart, type CartItem } from "@/components/providers/CartProvider";
import { swrFetcher } from "@/lib/api";
import { createOrder } from "@/lib/orders-api";
import { getStoredReferralCode } from "@/lib/referral-tracking";
import { isNorthernIreland, NI_DELIVERY_FEE, type DeliveryLocation } from "@/lib/delivery-api";
import LocationPicker from "@/components/checkout/LocationPicker";
import type { WalletBalanceResponse } from "@/lib/types";

const GBP = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  postcode: z.string().min(4, "Enter your postcode"),
});
type Form = z.infer<typeof schema>;

const inputCls = "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/25";

type ProfileRes = { data?: { id: number; attributes: { email?: string; preferredLocker?: string | null } } };

export default function CheckoutPage() {
  const { token, userEmail } = useAuth();
  const router = useRouter();
  const { items, subtotal, totalItems, clearCart } = useCart();
  const [alert, setAlert] = useState<{ ok: boolean; msg: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{ reference: string; total: number } | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<DeliveryLocation | null>(null);

  const { data: walletData } = useSWR<WalletBalanceResponse>(
    token ? "/api/wallet/balance" : null, swrFetcher, { refreshInterval: 60_000 }
  );
  const balance = walletData?.balance ?? 0;
  const bonus = walletData?.bonusBalance ?? 0;
  const available = walletData?.transferableBalance ?? 0;

  const { data: profileData } = useSWR<ProfileRes>(token ? "/api/account/profile" : null, swrFetcher);

  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", postcode: "" },
  });

  const watchedPostcode = form.watch("postcode");
  const isNI = isNorthernIreland(watchedPostcode || "");
  const deliveryFee = isNI ? NI_DELIVERY_FEE : 0;
  const grandTotal = subtotal + deliveryFee;
  const shortfall = grandTotal > balance;

  const bonusUsed = Math.min(bonus, grandTotal);
  const availableUsed = Math.min(available, Math.max(0, grandTotal - bonusUsed));

  useEffect(() => {
    const a = profileData?.data?.attributes;
    const e = a?.email || userEmail || "";
    const p = a?.preferredLocker || "";
    const c = form.getValues();
    if (!c.email && e) form.setValue("email", e);
    if (!c.postcode && p) form.setValue("postcode", p);
  }, [profileData, userEmail, form]);

  // Clear selected location when postcode changes significantly
  useEffect(() => {
    setSelectedLocation(null);
  }, [isNI]);

  // Success screen
  if (orderSuccess) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="w-full max-w-sm space-y-5 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-400/10">
            <span className="text-4xl">✅</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Order Placed!</h2>
            <p className="mt-1 text-sm text-white/50">Your order has been confirmed</p>
          </div>
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Order</span>
              <span className="font-mono font-bold text-white">{orderSuccess.reference}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Total</span>
              <span className="font-bold text-emerald-300">{GBP.format(orderSuccess.total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Payment</span>
              <span className="text-white">Wallet ✓</span>
            </div>
          </div>
          <p className="text-xs text-white/30">We&apos;ll notify you when your order is dispatched</p>
          <div className="flex gap-2">
            <Link
              href={`/orders/${orderSuccess.reference}`}
              className="flex flex-1 min-h-[44px] items-center justify-center rounded-xl cta-gradient text-sm font-bold text-white"
            >
              View Order
            </Link>
            <Link
              href="/products"
              className="flex flex-1 min-h-[44px] items-center justify-center rounded-xl border border-white/15 text-sm font-medium text-white"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Guards
  if (!token) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="space-y-3 text-center">
          <p className="text-4xl">🔐</p>
          <p className="text-sm font-bold text-white">Sign in to checkout</p>
          <Link href="/login" className="inline-flex min-h-[40px] items-center rounded-xl cta-gradient px-5 text-sm font-bold text-white">Log in</Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="space-y-3 text-center">
          <p className="text-4xl">🛒</p>
          <p className="text-sm font-bold text-white">Cart is empty</p>
          <Link href="/products" className="inline-flex min-h-[40px] items-center rounded-xl cta-gradient px-5 text-sm font-bold text-white">Browse Products</Link>
        </div>
      </div>
    );
  }

  const onSubmit = async (v: Form) => {
    if (shortfall) return;
    if (!selectedLocation) {
      setAlert({ ok: false, msg: "Please select a pickup location" });
      return;
    }
    setSubmitting(true);
    setAlert(null);
    try {
      const pc = v.postcode.trim().toUpperCase();
      const ref = getStoredReferralCode();
      const res = await createOrder({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice, weight: i.weight })),
        contactEmail: v.email,
        deliveryPostcode: pc,
        dropoffPostcode: pc,
        paymentOption: "wallet",
        referralCode: ref || undefined,
        deliveryMethod: selectedLocation.type,
        pickupLocationName: selectedLocation.name,
        pickupLocationAddress: `${selectedLocation.address}, ${selectedLocation.postcode}`,
        pickupLocationId: selectedLocation.id,
      });
      clearCart();
      setOrderSuccess({ reference: res.order.reference, total: grandTotal });
    } catch (e: any) {
      setAlert({ ok: false, msg: e?.message || "Unable to place order" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-24 sm:space-y-6 sm:pb-20">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href="/cart" className="text-white/30 hover:text-white/50">← Cart</Link>
        <span className="text-white/15">/</span>
        <span className="text-xs text-white/50">Checkout</span>
      </div>

      {alert && (
        <div className={`rounded-xl border px-3 py-2 text-xs ${alert.ok ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-red-400/30 bg-red-400/10 text-red-200"}`}>
          {alert.msg}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr,320px]">
        {/* Left: form */}
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          {/* Delivery */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-[10px] uppercase tracking-wider text-white/40 mb-3">📍 Delivery</p>
            <div className="space-y-3">
              <Field label="Email" error={form.formState.errors.email?.message}>
                <input type="email" {...form.register("email")} className={inputCls} placeholder="you@example.com" />
              </Field>
              <Field label="Postcode" error={form.formState.errors.postcode?.message}>
                <input type="text" {...form.register("postcode")} className={inputCls} placeholder="BT1 1AA" />
              </Field>
              <LocationPicker
                postcode={watchedPostcode || ""}
                onSelect={setSelectedLocation}
                selected={selectedLocation}
              />
            </div>
          </div>

          {/* Wallet payment */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-[10px] uppercase tracking-wider text-white/40 mb-3">💳 Payment</p>

            {/* Balance card */}
            <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.03] p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] text-white/30">Wallet Balance</p>
                  <p className="text-xl font-bold text-white">{GBP.format(balance)}</p>
                </div>
                <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[9px] font-bold text-emerald-300">Wallet</span>
              </div>
              <div className="mt-2 flex gap-3 text-[10px]">
                <span className="text-white/40">💰 {GBP.format(available)}</span>
                <span className="text-emerald-300/60">🎁 {GBP.format(bonus)}</span>
              </div>
            </div>

            {/* Breakdown */}
            {!shortfall && grandTotal > 0 && (
              <div className="mt-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 space-y-1">
                <p className="text-[8px] uppercase tracking-wider text-white/25">Breakdown</p>
                {bonusUsed > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-emerald-300">🎁 Bonus</span>
                    <span className="text-emerald-300">−{GBP.format(bonusUsed)}</span>
                  </div>
                )}
                {availableUsed > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-white/50">💰 Balance</span>
                    <span className="text-white/70">−{GBP.format(availableUsed)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Insufficient */}
            {shortfall && (
              <div className="mt-3 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3">
                <p className="text-xs font-bold text-amber-200">Insufficient balance</p>
                <p className="mt-0.5 text-[10px] text-amber-200/60">
                  Need {GBP.format(grandTotal)}, have {GBP.format(balance)} — short {GBP.format(grandTotal - balance)}
                </p>
                <button
                  type="button"
                  onClick={() => router.push("/wallet/topup")}
                  className="mt-2 flex w-full min-h-[36px] items-center justify-center rounded-lg border border-amber-400/30 text-xs font-bold text-amber-200"
                >
                  Top Up Wallet
                </button>
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || shortfall}
            className="flex w-full min-h-[52px] items-center justify-center rounded-xl cta-gradient text-base font-bold text-white disabled:opacity-40"
          >
            {submitting ? "Placing order…" : shortfall ? "Top up first" : `Pay ${GBP.format(grandTotal)}`}
          </button>
        </form>

        {/* Right: summary */}
        <div className="space-y-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] uppercase tracking-wider text-white/40">Items · {totalItems}</p>
              <Link href="/cart" className="text-[9px] text-white/25 hover:text-white/40">Edit</Link>
            </div>

            <div className="space-y-2">
              {items.map((item) => (
                <LineItem key={`${item.productId}::${item.weight}`} item={item} />
              ))}
            </div>

            <div className="mt-3 space-y-1.5 border-t border-white/5 pt-3">
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Subtotal</span>
                <span className="text-white">{GBP.format(subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Delivery</span>
                {deliveryFee > 0 ? (
                  <span className="text-amber-200">{GBP.format(deliveryFee)}</span>
                ) : (
                  <span className="text-emerald-300">Free</span>
                )}
              </div>
              {deliveryFee > 0 && (
                <p className="text-[9px] text-white/20">🚢 Northern Ireland surcharge</p>
              )}
              <div className="flex justify-between border-t border-white/5 pt-2">
                <span className="text-sm font-bold text-white">Total</span>
                <span className="text-lg font-bold text-white">{GBP.format(grandTotal)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-xs font-bold text-white mb-1">Need help?</p>
            <p className="text-[10px] text-white/30">
              Visit <Link href="/support" className="text-emerald-400 underline">support</Link> for payment or order questions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wider text-white/40">{label}</span>
      <div className="mt-1">{children}</div>
      {error && <p className="mt-1 text-[10px] text-red-300">{error}</p>}
    </label>
  );
}

function LineItem({ item }: { item: CartItem }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="shrink-0">
        {item.image ? (
          <Image src={item.image} alt={item.title} width={40} height={40} className="rounded-lg object-cover" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-sm">📦</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-white">{item.title}</p>
        <p className="text-[9px] text-white/25">{item.weight} × {item.quantity}</p>
      </div>
      <p className="shrink-0 text-xs font-bold text-white">{GBP.format(item.unitPrice * item.quantity)}</p>
    </div>
  );
}
