"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCart, type CartItem } from "@/components/providers/CartProvider";
import { StateMessage } from "@/components/StateMessage";
import Button from "@/components/ui/button";
import { createOrder } from "@/lib/orders-api";
import { getStoredReferralCode } from "@/lib/referral-tracking";

const currency = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

/* ── Form schema ── */

const formSchema = z.object({
  paymentOption: z.enum(["wallet", "nowpayments"]),
});
type CheckoutFormValues = z.infer<typeof formSchema>;

/* ── Page ── */

export default function CheckoutPage() {
  const { token } = useAuth();
  const router = useRouter();
  const { items, subtotal, totalItems, clearCart } = useCart();
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { paymentOption: "wallet" },
  });

  /* ── Guards ── */

  if (!token) {
    return (
      <StateMessage
        title="Please sign in"
        body="Log in to complete your order."
        actionLabel="Go to login"
        onAction={() => router.push("/login")}
      />
    );
  }

  if (items.length === 0) {
    return (
      <StateMessage
        variant="empty"
        title="Nothing to check out"
        body="Your cart is empty. Add some products first."
        actionLabel="Browse products"
        onAction={() => router.push("/products")}
      />
    );
  }

  /* ── Submit ── */

  const onSubmit = async (values: CheckoutFormValues) => {
    setSubmitting(true);
    setAlert(null);
    try {
      const referralCode = getStoredReferralCode();
      const payload = {
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          weight: item.weight,
        })),
        paymentOption: values.paymentOption,
        referralCode: referralCode || undefined,
      };
      const response = await createOrder(payload);
      clearCart();
      setAlert({ type: "success", message: `Order ${response.order.reference} created!` });
      router.push(`/orders/${response.order.reference}`);
    } catch (error: any) {
      setAlert({ type: "error", message: error?.message || "Unable to create order" });
    } finally {
      setSubmitting(false);
    }
  };

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
        {/* ── Left: payment form ── */}
        <div className="space-y-4 rounded-[40px] border border-white/10 bg-night-950/70 p-6">
          <header className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Checkout</p>
            <h1 className="text-2xl font-semibold text-white">Choose payment method</h1>
            <p className="text-sm text-white/70">
              Select how you&apos;d like to pay. Wallet balance is instant;
              crypto payments are confirmed after 1 network confirmation.
            </p>
          </header>

          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-3">
              {[
                { value: "wallet" as const, label: "Wallet balance", desc: "Instant — deducted from your topped-up balance" },
                { value: "nowpayments" as const, label: "Crypto (USDT)", desc: "Via NowPayments — confirmation in ~2 min" },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer flex-col gap-1 rounded-3xl border px-5 py-4 transition ${
                    form.watch("paymentOption") === option.value
                      ? "border-emerald-400/60 bg-emerald-400/5 text-white"
                      : "border-white/10 text-white/70 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      value={option.value}
                      {...form.register("paymentOption")}
                      className="accent-emerald-400"
                    />
                    <span className="font-semibold">{option.label}</span>
                  </div>
                  <p className="ml-6 text-xs text-white/50">{option.desc}</p>
                </label>
              ))}
            </div>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Placing order…" : `Pay ${currency.format(subtotal)}`}
            </Button>
          </form>
        </div>

        {/* ── Right: order summary ── */}
        <aside className="space-y-4">
          <div className="rounded-[32px] border border-white/10 bg-night-950/60 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase tracking-[0.3em] text-white/50">
                Order summary
              </h3>
              <Link href="/cart" className="text-xs text-white/40 hover:text-white/60">
                Edit cart
              </Link>
            </div>

            <ul className="space-y-3">
              {items.map((item) => (
                <CartLineItem key={`${item.productId}::${item.weight}`} item={item} />
              ))}
            </ul>

            <div className="border-t border-white/10 pt-3 space-y-2">
              <div className="flex justify-between text-sm text-white/70">
                <span>Subtotal ({totalItems} {totalItems === 1 ? "item" : "items"})</span>
                <span className="text-white">{currency.format(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-white/70">
                <span>Shipping</span>
                <span className="text-emerald-300">Free</span>
              </div>
              <div className="flex justify-between text-base font-semibold text-white pt-1">
                <span>Total</span>
                <span>{currency.format(subtotal)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-night-950/60 p-5 text-sm text-white/60">
            <p className="font-semibold text-white/80">Need help?</p>
            <p className="mt-1">
              Visit <Link href="/support" className="underline">support</Link> for
              payment issues or order questions.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}

/* ── Cart line item ── */

function CartLineItem({ item }: { item: CartItem }) {
  return (
    <li className="flex gap-3">
      <div className="shrink-0">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.title}
            width={48}
            height={48}
            className="rounded-xl object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-lg">📦</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">{item.title}</p>
        <p className="text-xs text-white/40">{item.weight} × {item.quantity}</p>
      </div>
      <p className="shrink-0 text-sm font-semibold text-white">
        {currency.format(item.unitPrice * item.quantity)}
      </p>
    </li>
  );
}
