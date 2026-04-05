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
import { StateMessage } from "@/components/StateMessage";
import Button from "@/components/ui/button";
import { swrFetcher } from "@/lib/api";
import { createOrder } from "@/lib/orders-api";
import { getStoredReferralCode } from "@/lib/referral-tracking";
import type { WalletBalanceResponse } from "@/lib/types";

const currency = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

/* ── schema (wallet-only, no paymentOption field) ── */

const formSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  postcode: z.string().min(4, "请输入邮编"),
});
type CheckoutFormValues = z.infer<typeof formSchema>;

/* ── types ── */

type CustomerProfileResponse = {
  data?: {
    id: number;
    attributes: {
      email?: string;
      preferredLocker?: string | null;
    };
  };
};

/* ── page ── */

export default function CheckoutPage() {
  const { token, userEmail } = useAuth();
  const router = useRouter();
  const { items, subtotal, totalItems, clearCart } = useCart();
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: walletData } = useSWR<WalletBalanceResponse>(
    token ? "/api/wallet/balance" : null,
    swrFetcher,
    { refreshInterval: 60_000 }
  );
  const walletBalance = walletData?.balance ?? 0;
  const insufficientBalance = subtotal > walletBalance;

  const { data: profileData } = useSWR<CustomerProfileResponse>(
    token ? "/api/account/profile" : null,
    swrFetcher
  );

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", postcode: "" },
  });

  useEffect(() => {
    const attrs = profileData?.data?.attributes;
    const profileEmail = attrs?.email || userEmail || "";
    const profilePostcode = attrs?.preferredLocker || "";
    const current = form.getValues();
    if (!current.email && profileEmail) form.setValue("email", profileEmail);
    if (!current.postcode && profilePostcode) form.setValue("postcode", profilePostcode);
  }, [profileData, userEmail, form]);

  /* ── guards ── */

  if (!token) {
    return (
      <section className="px-4 py-10">
        <StateMessage
          title="请先登录"
          body="登录后即可完成下单。"
          actionLabel="去登录"
          onAction={() => router.push("/login")}
        />
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="px-4 py-10">
        <StateMessage
          variant="empty"
          title="购物车是空的"
          body="先去挑选一些商品吧。"
          actionLabel="浏览商品"
          onAction={() => router.push("/products")}
        />
      </section>
    );
  }

  /* ── submit (always wallet) ── */

  const onSubmit = async (values: CheckoutFormValues) => {
    if (insufficientBalance) return;
    setSubmitting(true);
    setAlert(null);
    try {
      const referralCode = getStoredReferralCode();
      const response = await createOrder({
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          weight: item.weight,
        })),
        contactEmail: values.email,
        deliveryPostcode: values.postcode,
        paymentOption: "wallet",
        referralCode: referralCode || undefined,
      });
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
    <section className="space-y-5 px-4 py-8">
      {alert && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            alert.type === "success"
              ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
              : "border-red-400/40 bg-red-400/10 text-red-100"
          }`}
        >
          {alert.message}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[2fr,1fr]">
        {/* ── Left: Contact + Payment ── */}
        <div className="space-y-5">
          <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>

            {/* 联络信息 */}
            <div className="space-y-4 rounded-3xl border border-white/10 bg-night-950/70 p-4 sm:p-6">
              <header className="space-y-1">
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">Contact</p>
                <h2 className="text-lg font-semibold text-white sm:text-xl">收货信息</h2>
              </header>
              <FormField label="Email" error={form.formState.errors.email?.message}>
                <input
                  type="email"
                  className={inputClass}
                  placeholder="you@example.com"
                  {...form.register("email")}
                />
              </FormField>
              <FormField label="Postcode" error={form.formState.errors.postcode?.message}>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="SW1A 1AA"
                  {...form.register("postcode")}
                />
              </FormField>
            </div>

            {/* Wallet 付款卡片 */}
            <div className="space-y-4 rounded-3xl border border-white/10 bg-night-950/70 p-4 sm:p-6">
              <header className="space-y-1">
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">Payment</p>
                <h2 className="text-lg font-semibold text-white sm:text-xl">钱包付款</h2>
              </header>

              <div className="rounded-2xl border border-emerald-400/40 bg-emerald-400/5 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">Wallet balance</p>
                    <p className="mt-0.5 text-2xl font-bold text-white">{currency.format(walletBalance)}</p>
                  </div>
                  <span className="rounded-full border border-emerald-400/50 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                    Wallet
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-white/60">
                  订单金额将从钱包余额中即时扣除，无需额外操作。
                </p>
              </div>

              {/* 余额不足提示 */}
              {insufficientBalance && (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
                  <p className="font-semibold text-amber-200">余额不足</p>
                  <p className="mt-1 leading-relaxed text-amber-200/70">
                    需要 {currency.format(subtotal)}，当前余额 {currency.format(walletBalance)}，
                    差额 {currency.format(subtotal - walletBalance)}。
                  </p>
                  <Button
                    variant="secondary"
                    type="button"
                    className="mt-3 w-full min-h-[48px] text-base sm:w-auto"
                    onClick={() => router.push("/wallet/topup")}
                  >
                    去充值
                  </Button>
                </div>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={submitting || insufficientBalance}
              className="w-full min-h-[52px] text-base font-semibold"
            >
              {submitting
                ? "正在下单…"
                : insufficientBalance
                  ? "余额不足，请先充值"
                  : `支付 ${currency.format(subtotal)}`}
            </Button>

            {insufficientBalance && (
              <p className="text-center text-xs text-white/40">
                余额不足时无法提交订单。请先
                <Link href="/wallet/topup" className="text-emerald-300 underline"> 充值</Link>。
              </p>
            )}
          </form>
        </div>

        {/* ── Right: Order summary ── */}
        <aside className="space-y-4">
          <div className="space-y-4 rounded-3xl border border-white/10 bg-night-950/60 p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase tracking-[0.3em] text-white/50">订单摘要</h3>
              <Link href="/cart" className="text-xs text-white/40 hover:text-white/60">修改购物车</Link>
            </div>
            <ul className="space-y-3">
              {items.map((item) => (
                <CartLineItem key={`${item.productId}::${item.weight}`} item={item} />
              ))}
            </ul>
            <div className="space-y-2 border-t border-white/10 pt-3">
              <div className="flex justify-between text-sm text-white/70">
                <span>小计 ({totalItems} 件)</span>
                <span className="text-white">{currency.format(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-white/70">
                <span>运费</span>
                <span className="text-emerald-300">免费</span>
              </div>
              <div className="flex justify-between pt-1 text-base font-semibold text-white">
                <span>合计</span>
                <span>{currency.format(subtotal)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-night-950/60 p-4 text-sm leading-relaxed text-white/60 sm:p-5">
            <p className="font-semibold text-white/80">需要帮助？</p>
            <p className="mt-1">
              访问 <Link href="/support" className="underline">支持中心</Link> 解决付款或订单问题。
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}

/* ── FormField ── */

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium uppercase tracking-[0.3em] text-white/50">
      {label}
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1 text-xs text-red-300">{error}</p>}
    </label>
  );
}

const inputClass =
  "w-full rounded-2xl border border-white/15 bg-transparent px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none";

/* ── CartLineItem ── */

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
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-white">{item.title}</p>
        <p className="text-xs text-white/40">{item.weight} × {item.quantity}</p>
      </div>
      <p className="shrink-0 text-sm font-semibold text-white">
        {currency.format(item.unitPrice * item.quantity)}
      </p>
    </li>
  );
}
