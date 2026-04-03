"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import Button from "@/components/ui/button";
import { StateMessage } from "@/components/StateMessage";
import { Skeleton } from "@/components/Skeleton";
import { useAuth } from "@/components/providers/AuthProvider";
import { useNotifications } from "@/components/providers/NotificationProvider";
import { swrFetcher } from "@/lib/api";
import type { WalletBalanceResponse } from "@/lib/types";
import { listMyOrders } from "@/lib/orders-api";
import { getReferralSummary, type ReferralSummary } from "@/lib/referral-api";

const currency = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
const fallbackWithdrawals = [
  { id: 1, amount: 120, status: "processing", createdAt: new Date().toISOString() },
];
const fallbackReferral: ReferralSummary = {
  code: "LOCKER25",
  link: "https://greenhub420.co.uk/join/LOCKER25",
  totalInvites: 0,
  activeLockers: 0,
  bonusEarned: 0,
  clicks: 0,
  clickPayoutTotal: 0,
  registrations: 0,
  topups: 0,
  conversionRate: 0,
  ctr: 0,
  impressions: 0,
  monthCommission: 0,
};

export default function DashboardPage() {
  const { token, profile } = useAuth();
  const router = useRouter();
  const { notifications, unreadCount, refreshNotifications } = useNotifications();

  const {
    data: balanceData,
    error: balanceError,
    isLoading: balanceLoading,
  } = useSWR<WalletBalanceResponse>(token ? "/api/wallet/balance" : null, swrFetcher, { refreshInterval: 60_000 });

  const {
    data: ordersData,
    error: ordersError,
    isLoading: ordersLoading,
  } = useSWR(token ? "dashboard-orders" : null, () => listMyOrders({ page: 1, pageSize: 2 }));

  const {
    data: referralData,
    error: referralError,
  } = useSWR(token ? "dashboard-referral" : null, getReferralSummary);

  const referralSummary = referralError ? fallbackReferral : referralData || fallbackReferral;
  const latestOrders = ordersData?.data || [];
  const withdrawalRows = useMemo(() => fallbackWithdrawals, []);
  const notificationPreview = notifications.slice(0, 3);
  const clickCommission = referralSummary.clickPayoutTotal ?? 0;
  const conversionPct = (referralSummary.conversionRate ?? 0) * 100;
  const ctrPct = (referralSummary.ctr ?? 0) * 100;
  const monthCommission = referralSummary.monthCommission ?? 0;

  const copyReferral = async () => {
    try {
      await navigator.clipboard.writeText(referralSummary.link);
    } catch (error) {
      console.warn("Unable to copy referral link", error);
    }
  };

  if (!token) {
    return (
      <StateMessage
        title="Please sign in"
        body="Sign in to see your wallet balance, locker orders, and concierge shortcuts."
        actionLabel="Go to login"
        onAction={() => router.push("/login")}
      />
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[40px] border border-white/10 bg-night-950/80 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Welcome back</p>
        <h1 className="text-3xl font-semibold text-white">{profile?.fullName || "Locker member"}</h1>
        <p className="mt-1 text-sm text-white/60">Locker network online — Belfast & Derry 24/7 · Concierge on duty until 21:00 GMT.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={() => router.push("/products")}>Go to products</Button>
          <Button variant="ghost" onClick={() => router.push("/support")}>Need support?</Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-night-950/70 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Wallet balance</p>
              <h2 className="text-4xl font-semibold text-white">
                {balanceLoading ? <Skeleton className="h-8 w-32" /> : currency.format(balanceData?.balance ?? 0)}
              </h2>
              <p className="text-sm text-white/60">Lifetime top-up {currency.format(balanceData?.lifetimeTopUp ?? 0)}</p>
            </div>
            <div className="flex flex-col gap-2">
              <Button size="sm" onClick={() => router.push("/checkout#topup")}>Top-up</Button>
              <Button size="sm" variant="secondary" onClick={() => router.push("/support")}>Withdraw</Button>
            </div>
          </div>
          {balanceError && <p className="mt-2 text-xs text-red-300">{balanceError.message}</p>}
          <div className="mt-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Recent withdrawals</p>
            {withdrawalRows.length === 0 ? (
              <p className="mt-2 text-sm text-white/60">No pending withdrawals.</p>
            ) : (
              <div className="mt-2 space-y-2">
                {withdrawalRows.map((row) => (
                  <div key={row.id} className="flex items-center justify-between text-sm text-white/70">
                    <span>{currency.format(row.amount)}</span>
                    <StatusPill status={row.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-night-950/70 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Orders</p>
            <Button size="sm" variant="ghost" onClick={() => router.push("/orders")}>
              View all
            </Button>
          </div>
          {ordersLoading ? (
            <div className="mt-3 space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : ordersError ? (
            <StateMessage variant="error" title="Unable to load orders" body={ordersError.message} actionLabel="Retry" />
          ) : latestOrders.length === 0 ? (
            <StateMessage variant="empty" title="No orders yet" body="Browse the menu to create your first locker drop." />
          ) : (
            <div className="mt-3 space-y-3">
              {latestOrders.map((order) => (
                <div key={order.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="flex items-center justify-between text-sm text-white/80">
                    <div>
                      <p className="font-semibold">{order.reference}</p>
                      <p className="text-xs text-white/50">{new Date(order.createdAt ?? Date.now()).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</p>
                    </div>
                    <StatusPill status={order.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-white/10 bg-night-950/70 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Notifications</p>
            <Button size="sm" variant="ghost" onClick={() => refreshNotifications()}>
              Refresh
            </Button>
          </div>
          {notificationPreview.length === 0 ? (
            <p className="mt-2 text-sm text-white/60">You’re all caught up.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {notificationPreview.map((notification) => (
                <div key={notification.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-sm font-semibold text-white">{notification.title}</p>
                  <p className="text-xs text-white/60">{notification.message}</p>
                </div>
              ))}
            </div>
          )}
          <p className="mt-3 text-xs text-white/50">Unread: {unreadCount}</p>
          <Button size="sm" className="mt-3" variant="ghost" onClick={() => router.push("/notifications")}>
            Go to inbox
          </Button>
        </div>

        <div className="rounded-3xl border border-white/10 bg-night-950/70 p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Referral</p>
          <h3 className="text-2xl font-semibold text-white">Code: {referralSummary.code}</h3>
          <p className="text-sm text-white/60">Clicks {referralSummary.clicks} · CTR {ctrPct.toFixed(1)}% · Invites {referralSummary.totalInvites}</p>
          <p className="text-sm text-white/60">Conversion {conversionPct.toFixed(1)}% · Reg {referralSummary.registrations} · Topups {referralSummary.topups}</p>
          <p className="text-sm text-white/60">Click rewards {currency.format(clickCommission)} · Month {currency.format(monthCommission)}</p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => router.push("/referral")}>Open referrals</Button>
            <Button size="sm" variant="secondary" onClick={copyReferral}>Copy link</Button>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-night-950/70 p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Need concierge?</p>
          <h3 className="text-2xl font-semibold text-white">Visit the support hub</h3>
          <p className="text-sm text-white/60">Locker issues, payment escalations, and ticket submissions live there.</p>
          <Button className="mt-3" onClick={() => router.push("/support")}>Open support</Button>
        </div>
      </div>
    </section>
  );
}

function StatusPill({ status }: { status: string }) {
  const palette: Record<string, string> = {
    paid: "bg-emerald-400/10 text-emerald-200 border-emerald-400/40",
    processing: "bg-blue-400/10 text-blue-200 border-blue-400/40",
    pending: "bg-yellow-400/10 text-yellow-200 border-yellow-400/40",
    locker_active: "bg-brand-500/10 text-brand-200 border-brand-500/40",
  };
  const key = status?.toLowerCase();
  const classes = palette[key] || "bg-white/5 text-white/70 border-white/20";
  return <span className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.3em] ${classes}`}>{status}</span>;
}
