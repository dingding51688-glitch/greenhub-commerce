"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/components/providers/AuthProvider";
import { StateMessage } from "@/components/StateMessage";
import { Skeleton } from "@/components/Skeleton";
import Button from "@/components/ui/button";
import { swrFetcher } from "@/lib/api";
import type { ProductsResponse } from "@/lib/types";
import { createOrder } from "@/lib/orders-api";
import { getStoredReferralCode } from "@/lib/referral-tracking";

const currency = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

const formSchema = z.object({
  dropoffPostcode: z.string().min(4, "Enter your postcode"),
  paymentOption: z.enum(["wallet", "nowpayments", "locker"])
});

type CheckoutFormValues = z.infer<typeof formSchema>;

export default function CheckoutPage() {
  const { token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = searchParams.get("product");
  const presetWeight = searchParams.get("weight");
  const presetQty = Math.max(1, Number(searchParams.get("qty") || "1"));
  const [quantity, setQuantity] = useState(presetQty);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: productData, error: productError } = useSWR<ProductsResponse>(
    slug ? `/api/products?filters[slug][$eq]=${slug}&populate[weightOptions]=*` : null,
    swrFetcher
  );
  const product = productData?.data?.[0];

  const weightOptions = useMemo(() => product?.weightOptions || [], [product]);
  const [selectedWeight, setSelectedWeight] = useState<string | null>(presetWeight || null);

  useEffect(() => {
    if (!selectedWeight && weightOptions.length > 0) {
      setSelectedWeight(weightOptions[0].label);
    }
  }, [weightOptions, selectedWeight]);

  const selectedOption = useMemo(
    () => weightOptions.find((option) => option.label === selectedWeight) || weightOptions[0],
    [weightOptions, selectedWeight]
  );

  const unitPrice = selectedOption?.price ?? product?.priceFrom ?? 0;
  const cartTotal = unitPrice * quantity;

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dropoffPostcode: "",
      paymentOption: "wallet"
    }
  });

  const onSubmit = async (values: CheckoutFormValues) => {
    if (!product || !selectedOption) {
      setAlert({ type: "error", message: "Missing product selection. Return to product page." });
      return;
    }
    setSubmitting(true);
    setAlert(null);
    try {
      const referralCode = getStoredReferralCode();
      const payload = {
        items: [
          {
            productId: product.id,
            quantity,
            unitPrice,
            weight: selectedOption.label
          }
        ],
        dropoffPostcode: values.dropoffPostcode,
        paymentOption: values.paymentOption,
        referralCode: referralCode || undefined
      };
      const response = await createOrder(payload);
      setAlert({ type: "success", message: `Order ${response.order.reference} created.` });
      router.push(`/orders/${response.order.reference}`);
    } catch (error: any) {
      setAlert({ type: "error", message: error?.message || "Unable to create order" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <StateMessage
        title="Please sign in"
        body="Log in to share your postcode and place orders."
        actionLabel="Go to login"
        onAction={() => router.push("/login")}
      />
    );
  }

  if (!slug) {
    return (
      <StateMessage
        variant="empty"
        title="No product selected"
        body="Start from the product detail page to pick a weight before checkout."
        actionLabel="Browse menu"
        onAction={() => router.push("/products")}
      />
    );
  }

  const loadingProduct = !product && !productError;

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
        <div className="space-y-4 rounded-[40px] border border-white/10 bg-night-950/70 p-6">
          <header className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Postcode drop</p>
            <h1 className="text-2xl font-semibold text-white">We pick the nearest locker</h1>
            <p className="text-sm text-white/70">Share the postcode closest to you. Concierge assigns the locker and texts you once it’s stocked.</p>
          </header>

          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField label="Postcode" error={form.formState.errors.dropoffPostcode?.message}>
              <input
                type="text"
                className={inputClass}
                placeholder="BT1 1AA"
                {...form.register("dropoffPostcode")}
              />
            </FormField>

            <FormField label="Payment" error={form.formState.errors.paymentOption?.message}>
              <div className="space-y-3">
                {[
                  { value: "wallet", label: "Wallet balance" },
                  { value: "nowpayments", label: "NowPayments (USDT)" },
                  { value: "locker", label: "Locker COD" }
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-center gap-3 rounded-3xl border px-4 py-3 ${
                      form.watch("paymentOption") === option.value
                        ? "border-white text-white"
                        : "border-white/10 text-white/70"
                    }`}
                  >
                    <input type="radio" value={option.value} {...form.register("paymentOption")} />
                    {option.label}
                  </label>
                ))}
              </div>
            </FormField>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Submitting…" : "Place order"}
            </Button>
          </form>
        </div>

        <aside className="space-y-4">
          <div className="rounded-[32px] border border-white/10 bg-night-950/60 p-5">
            <h3 className="text-lg font-semibold text-white">Order summary</h3>
            {loadingProduct ? (
              <div className="mt-4 space-y-2">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-6 w-32" />
              </div>
            ) : product ? (
              <div className="mt-4 space-y-3 text-sm text-white/70">
                <p className="text-white">{product.title}</p>
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>Weight</span>
                  <select
                    className="rounded-2xl border border-white/15 bg-transparent px-3 py-1 text-white"
                    value={selectedWeight ?? ""}
                    onChange={(event) => setSelectedWeight(event.target.value)}
                  >
                    {weightOptions.map((option) => (
                      <option key={option.id} value={option.label} className="bg-night-900 text-white">
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>Quantity</span>
                  <input
                    type="number"
                    min={1}
                    className="w-20 rounded-2xl border border-white/15 bg-transparent px-2 py-1 text-center text-white"
                    value={quantity}
                    onChange={(event) => setQuantity(Math.max(1, Number(event.target.value)))}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>Unit price</span>
                  <span className="text-white">{currency.format(unitPrice)}</span>
                </div>
                <div className="flex items-center justify-between text-base font-semibold text-white">
                  <span>Total</span>
                  <span>{currency.format(cartTotal)}</span>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-red-300">Unable to load product. Return to the menu.</p>
            )}
          </div>
          <div className="rounded-[32px] border border-white/10 bg-night-950/60 p-5 text-sm text-white/70">
            <p className="font-semibold text-white">Need help?</p>
            <p className="mt-1">Visit the support hub for locker swaps, payment escalations, or concierge chat links. First-time customer? Read the onboarding guide.</p>
            <div className="mt-3 space-y-2">
              <Button asChild variant="ghost" className="w-full">
                <a href="/support">Open support hub</a>
              </Button>
              <Button asChild variant="secondary" className="w-full">
                <a href="/guide/locker">Locker onboarding guide</a>
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs uppercase tracking-[0.3em] text-white/40">
      {label}
      <div className="mt-1 space-y-1">
        {children}
        {error && <p className="text-xs text-red-300">{error}</p>}
      </div>
    </label>
  );
}

const inputClass = "w-full rounded-2xl border border-white/15 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/40";
