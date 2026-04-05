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

/* ── 表单 schema ── */

const formSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  postcode: z.string().min(4, "请输入邮编"),
  paymentOption: z.enum(["wallet", "nowpayments"]),
});
type CheckoutFormValues = z.infer<typeof formSchema>;

/* ── 客户资料类型 ── */

type CustomerProfileResponse = {
  data?: {
    id: number;
    attributes: {
      email?: string;
      preferredLocker?: string | null;
    };
  };
};

/* ── 页面 ── */

export default function CheckoutPage() {
  const { token, userEmail } = useAuth();
  const router = useRouter();
  const { items, subtotal, totalItems, clearCart } = useCart();
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /* ── 钱包余额 ── */
  const { data: walletData } = useSWR<WalletBalanceResponse>(
    token ? "/api/wallet/balance" : null,
    swrFetcher,
    { refreshInterval: 60_000 }
  );
  const walletBalance = walletData?.balance ?? 0;

  /* ── 客户资料（预填 email / postcode） ── */
  const { data: profileData } = useSWR<CustomerProfileResponse>(
    token ? "/api/account/profile" : null,
    swrFetcher
  );

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      postcode: "",
      paymentOption: "wallet",
    },
  });

  /* 用客户资料预填表单 */
  useEffect(() => {
    const attrs = profileData?.data?.attributes;
    const profileEmail = attrs?.email || userEmail || "";
    const profilePostcode = attrs?.preferredLocker || "";
    const current = form.getValues();
    if (!current.email && profileEmail) {
      form.setValue("email", profileEmail);
    }
    if (!current.postcode && profilePostcode) {
      form.setValue("postcode", profilePostcode);
    }
  }, [profileData, userEmail, form]);

  const selectedPayment = form.watch("paymentOption");
  const isWallet = selectedPayment === "wallet";
  const insufficientBalance = isWallet && subtotal > walletBalance;

  /* ── 守卫 ── */

  if (!token) {
    return (
      <StateMessage
        title="请先登录"
        body="登录后即可完成下单。"
        actionLabel="去登录"
        onAction={() => router.push("/login")}
      />
    );
  }

  if (items.length === 0) {
    return (
      <StateMessage
        variant="empty"
        title="购物车是空的"
        body="先去挑选一些商品吧。"
        actionLabel="浏览商品"
        onAction={() => router.push("/products")}
      />
    );
  }

  /* ── 提交 ── */

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
        contactEmail: values.email,
        deliveryPostcode: values.postcode,
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
        {/* ── 左侧：联络 + 付款 ── */}
        <div className="space-y-6">
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>

            {/* 联络信息 */}
            <div className="space-y-4 rounded-[40px] border border-white/10 bg-night-950/70 p-6">
              <header className="space-y-1">
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">Contact info</p>
                <h2 className="text-xl font-semibold text-white">收货信息</h2>
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

            {/* 付款方式 */}
            <div className="space-y-4 rounded-[40px] border border-white/10 bg-night-950/70 p-6">
              <header className="space-y-1">
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">Payment</p>
                <h2 className="text-xl font-semibold text-white">付款方式</h2>
              </header>

              <div className="space-y-3">
                {[
                  {
                    value: "wallet" as const,
                    label: `Wallet (${currency.format(walletBalance)})`,
                    desc: walletBalance > 0
                      ? "即时扣款，从已充值余额中扣除"
                      : "暂无余额，请先充值",
                  },
                  {
                    value: "nowpayments" as const,
                    label: "Crypto (USDT)",
                    desc: "通过 NowPayments 支付，约 2 分钟确认",
                  },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer flex-col gap-1 rounded-3xl border px-5 py-4 transition ${
                      selectedPayment === option.value
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

              {insufficientBalance && (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                  <p className="font-semibold">余额不足</p>
                  <p className="mt-1 text-xs text-amber-200/70">
                    需要 {currency.format(subtotal)}，当前余额 {currency.format(walletBalance)}，
                    差额 {currency.format(subtotal - walletBalance)}。
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-2"
                    onClick={() => router.push("/wallet/topup")}
                    type="button"
                  >
                    去充值
                  </Button>
                </div>
              )}
            </div>

            <Button type="submit" disabled={submitting || insufficientBalance} className="w-full text-base py-4">
              {submitting ? "正在下单…" : `支付 ${currency.format(subtotal)}`}
            </Button>
          </form>
        </div>

        {/* ── 右侧：订单摘要 ── */}
        <aside className="space-y-4">
          <div className="rounded-[32px] border border-white/10 bg-night-950/60 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase tracking-[0.3em] text-white/50">订单摘要</h3>
              <Link href="/cart" className="text-xs text-white/40 hover:text-white/60">
                修改购物车
              </Link>
            </div>

            <ul className="space-y-3">
              {items.map((item) => (
                <CartLineItem key={`${item.productId}::${item.weight}`} item={item} />
              ))}
            </ul>

            <div className="border-t border-white/10 pt-3 space-y-2">
              <div className="flex justify-between text-sm text-white/70">
                <span>小计 ({totalItems} 件)</span>
                <span className="text-white">{currency.format(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-white/70">
                <span>运费</span>
                <span className="text-emerald-300">免费</span>
              </div>
              <div className="flex justify-between text-base font-semibold text-white pt-1">
                <span>合计</span>
                <span>{currency.format(subtotal)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-night-950/60 p-5 text-sm text-white/60">
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

/* ── 表单字段 ── */

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

const inputClass =
  "w-full rounded-2xl border border-white/15 bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none";

/* ── 购物车行项目 ── */

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
