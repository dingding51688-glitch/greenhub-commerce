"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import useSWR from "swr";
import { useAuth } from "@/components/providers/AuthProvider";
import { StateMessage } from "@/components/StateMessage";
import Button from "@/components/ui/button";
import { swrFetcher, apiMutate } from "@/lib/api";
import type { WalletBalanceResponse } from "@/lib/types";

const GBP = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
const inputCls = "w-full rounded-2xl border border-white/15 bg-transparent px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none";

const transferSchema = z.object({
  handle: z.string().min(3, "Enter recipient handle"),
  amount: z.preprocess((v) => Number(v), z.number().min(1, "Min £1")),
  memo: z.string().optional().or(z.literal("")),
});
type TransferFormValues = z.infer<typeof transferSchema>;

export default function WalletTransferPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const { data: balanceData } = useSWR<WalletBalanceResponse>(
    token ? "/api/wallet/balance" : null,
    swrFetcher
  );

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema) as Resolver<TransferFormValues>,
    defaultValues: { handle: "", amount: 0, memo: "" },
  });

  if (!token) {
    return (
      <section className="px-4 py-10">
        <StateMessage
          title="请先登录"
          body="登录后即可转账。"
          actionLabel="去登录"
          onAction={() => router.push("/login")}
        />
      </section>
    );
  }

  const onSubmit = async (values: TransferFormValues) => {
    setResult(null);
    try {
      await apiMutate("/api/account/transfers", "POST", {
        recipientHandle: values.handle,
        amount: values.amount,
        memo: values.memo || undefined,
      });
      setResult({ type: "success", message: `已转账 ${GBP.format(values.amount)} 给 ${values.handle}` });
    } catch (err: any) {
      setResult({ type: "error", message: err?.message || "转账失败" });
    }
  };

  if (result?.type === "success") {
    return (
      <section className="mx-auto max-w-md space-y-6 px-4 py-10 text-center">
        <p className="text-4xl">✅</p>
        <h1 className="text-2xl font-semibold text-white">转账成功</h1>
        <p className="text-sm text-white/60">{result.message}</p>
        <div className="flex flex-col gap-3">
          <Button onClick={() => router.push("/wallet")}>返回钱包</Button>
          <Button variant="secondary" onClick={() => { setResult(null); form.reset(); }}>继续转账</Button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-md space-y-6 px-4 py-10">
      <header>
        <Link href="/wallet" className="text-xs text-white/40 hover:text-white/60">← 返回钱包</Link>
        <h1 className="mt-2 text-2xl font-semibold text-white">转账</h1>
        {balanceData && (
          <p className="mt-1 text-sm text-white/50">可用余额：{GBP.format(balanceData.balance)}</p>
        )}
      </header>

      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <div>
          <label className="block text-xs uppercase tracking-[0.3em] text-white/50 mb-1">收款人 Handle</label>
          <input
            type="text"
            placeholder="GH-XXXXXXXX"
            {...form.register("handle")}
            className={inputCls}
          />
          {form.formState.errors.handle && (
            <p className="mt-1 text-xs text-red-300">{form.formState.errors.handle.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs uppercase tracking-[0.3em] text-white/50 mb-1">金额 (£)</label>
          <input
            type="number"
            step="0.01"
            min="1"
            placeholder="0.00"
            {...form.register("amount")}
            className={inputCls}
          />
          {form.formState.errors.amount && (
            <p className="mt-1 text-xs text-red-300">{form.formState.errors.amount.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs uppercase tracking-[0.3em] text-white/50 mb-1">备注（可选）</label>
          <input
            type="text"
            placeholder="例如：分摊订单"
            {...form.register("memo")}
            className={inputCls}
          />
        </div>

        {result?.type === "error" && (
          <div className="rounded-2xl border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm text-red-100">
            {result.message}
          </div>
        )}

        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="w-full py-3 text-base"
        >
          {form.formState.isSubmitting ? "转账中…" : "确认转账"}
        </Button>
      </form>
    </section>
  );
}
