"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import useSWR from "swr";
import { StateMessage } from "@/components/StateMessage";
import { swrFetcher } from "@/lib/api";
import type { WalletBalanceResponse, WalletTransactionsResponse } from "@/lib/types";

const currency = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
const dateFmt = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });

export default function AccountPage() {
  const { token } = useAuth();
  const router = useRouter();

  const {
    data: balanceData,
    error: balanceError,
    isLoading: balanceLoading,
    mutate: refreshBalance,
  } = useSWR<WalletBalanceResponse>(token ? "/api/wallet/balance" : null, swrFetcher, {
    refreshInterval: 60_000,
  });

  const {
    data: txData,
    error: txError,
    isLoading: txLoading,
    mutate: refreshTransactions,
  } = useSWR<WalletTransactionsResponse>(
    token ? "/api/wallet/transactions?page=1&pageSize=10" : null,
    swrFetcher,
    { refreshInterval: 90_000 }
  );

  const transactionsSection = useMemo(() => {
    if (txLoading) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-16 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      );
    }

    if (txError) {
      return (
        <StateMessage
          variant="error"
          title="Unable to load transactions"
          body={txError.message}
          actionLabel="Retry"
          onAction={() => refreshTransactions()}
        />
      );
    }

    const rows = txData?.data || [];
    if (rows.length === 0) {
      return (
        <StateMessage
          variant="empty"
          title="No wallet activity yet"
          body="Place an order or top up to see history."
        />
      );
    }

    return (
      <div className="divide-y divide-white/5 overflow-hidden rounded-3xl border border-white/10 bg-card">
        {rows.map((tx) => (
          <div key={tx.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold capitalize">{tx.type.replace(/_/g, " ")}</p>
              <p className="text-xs text-white/50">{tx.reference}</p>
            </div>
            <div className="text-sm text-white/60">
              {tx.createdAt ? dateFmt.format(new Date(tx.createdAt)) : "—"}
            </div>
            <div className="text-right">
              <p className={tx.amount >= 0 ? "text-emerald-300" : "text-red-300"}>
                {tx.amount >= 0 ? "+" : ""}
                {currency.format(tx.amount)}
              </p>
              <p className="text-xs text-white/50">
                Balance {tx.balanceAfter !== undefined ? currency.format(tx.balanceAfter) : "—"}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  }, [txData, txError, txLoading, refreshTransactions]);

  if (!token) {
    return (
      <StateMessage
        title="Please sign in"
        body="Log in to see your wallet balance and recent activity."
        actionLabel="Go to login"
        onAction={() => router.push("/login")}
      />
    );
  }

  return (
    <section className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-2">
        {balanceLoading ? (
          <div className="h-40 animate-pulse rounded-3xl bg-white/5" />
        ) : balanceError ? (
          <StateMessage
            variant="error"
            title="Unable to load balance"
            body={balanceError.message}
            actionLabel="Retry"
            onAction={() => refreshBalance()}
          />
        ) : (
          <div className="rounded-3xl border border-white/10 bg-card p-6 shadow-2xl shadow-brand-600/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-white/60">Available</p>
                <p className="mt-2 text-4xl font-semibold">
                  {balanceData ? currency.format(balanceData.balance) : "—"}
                </p>
                <p className="mt-2 text-sm text-white/60">
                  Lifetime top-up {balanceData ? currency.format(balanceData.lifetimeTopUp) : "—"} · Bonus {" "}
                  {balanceData ? currency.format(balanceData.bonusAwarded) : "—"}
                </p>
              </div>
              <button
                onClick={() => refreshBalance()}
                className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/80 transition hover:border-white/50"
              >
                Refresh
              </button>
            </div>
          </div>
        )}
        <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-white/80">
          <p className="text-lg font-semibold">Top up your wallet</p>
          <p className="mt-1 text-sm text-white/60">
            Real recharge flow will live here. For now, use the dashboard or NowPayments to add funds.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              disabled
              placeholder="Amount (£)"
              className="flex-1 rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-white/80 placeholder:text-white/40"
            />
            <button className="rounded-2xl bg-white/10 px-6 py-3 text-sm font-semibold text-white/60" disabled>
              Coming soon
            </button>
          </div>
        </div>
      </div>
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent activity</h2>
          <button
            onClick={() => refreshTransactions()}
            className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/70 hover:border-white/40"
          >
            Refresh
          </button>
        </div>
        {transactionsSection}
      </div>
    </section>
  );
}
