"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import Button from "@/components/ui/button";
import { StateMessage } from "@/components/StateMessage";
import { useAuth } from "@/components/providers/AuthProvider";
import { useNotifications } from "@/components/providers/NotificationProvider";
import {
  getCommissionHubSnapshot,
  ReferralApiError,
  type CommissionHubSnapshot,
  type CommissionHubTask,
  type CommissionTransaction
} from "@/lib/referral-api";
import { consumeClickError, getLastTrackedClickTime } from "@/lib/referral-tracking";

const currency = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

export default function CommissionHubPage() {
  const { token } = useAuth();
  const router = useRouter();
  const { notifications } = useNotifications();
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [lastClickTime, setLastClickTime] = useState<number | null>(null);
  const [clickWarning, setClickWarning] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<CommissionHubSnapshot>(
    token ? "commission-hub" : null,
    getCommissionHubSnapshot
  );

  useEffect(() => {
    const ts = getLastTrackedClickTime();
    if (ts) setLastClickTime(ts);
    const hasError = consumeClickError();
    if (hasError) setClickWarning(true);
  }, []);

  if (!token) {
    return (
      <StateMessage
        title="Please sign in"
        body="Log in to start sharing your referral link and earning rewards."
        actionLabel="Login"
        onAction={() => router.push("/login")}
      />
    );
  }

  const notFound = error instanceof ReferralApiError && error.status === 404;
  const fatalError = error && !notFound;
  const summary = data?.summary;
  const tasks = data?.tasks ?? [];
  const conversions = data?.conversions ?? [];
  const history = data?.history ?? [];
  const hasSnapshot = Boolean(summary) || conversions.length > 0 || history.length > 0;
  const showEmpty = !isLoading && (!hasSnapshot || notFound);

  if (fatalError) {
    return (
      <StateMessage
        variant="error"
        title="Unable to load commission hub"
        body={error?.message || "Please refresh and try again."}
        actionLabel="Retry"
        onAction={() => mutate()}
      />
    );
  }

  if (isLoading && !hasSnapshot) {
    return <StateMessage title="Loading commission hub" body="Fetching your referral data…" />;
  }

  if (showEmpty) {
    return (
      <section className="space-y-6">
        <StateMessage
          variant="empty"
          title="No referrals yet"
          body="Share your referral link to start tracking clicks, conversions, and earnings."
        />
        <HowItWorksCard />
      </section>
    );
  }

  const commissionAlert = notifications.find(
    (notification) => notification.type === "commission_award" && !notification.read
  );

  const clicks = summary?.clicks ?? 0;
  const ctr = summary?.ctr ?? 0;
  const registrations = summary?.registrations ?? 0;
  const topups = summary?.topups ?? 0;
  const conversionRate = summary?.conversionRate ?? 0;
  const lifetimeCommission = summary?.bonusEarned ?? 0;
  const clickCommission = summary?.clickPayoutTotal ?? 0;
  const orderCommission = Math.max(0, lifetimeCommission - clickCommission);
  const summaryLink = summary?.link ?? "";
  const referralCode = summary?.code ?? "—";
  const shareText = encodeURIComponent("Join GreenHub and get great deals. Use my invite link!");
  const shareUrl = summaryLink ? encodeURIComponent(summaryLink) : "";
  const telegramShare = summaryLink ? `https://t.me/share/url?url=${shareUrl}&text=${shareText}` : null;
  const whatsappShare = summaryLink ? `https://api.whatsapp.com/send?text=${shareText}%20${shareUrl}` : null;

  const statCards = [
      {
        label: "Clicks",
        value: clicks.toString(),
        sub: ctr ? `CTR ${(ctr * 100).toFixed(1)}%` : undefined
      },
      {
        label: "Registrations / Topups",
        value: `${registrations} / ${topups}`,
        sub: conversionRate ? `Conversion ${(conversionRate * 100).toFixed(1)}%` : undefined
      },
      {
        label: "Lifetime commission",
        value: currency.format(lifetimeCommission),
        sub: `£${clickCommission.toFixed(2)} clicks · £${orderCommission.toFixed(2)} orders`
      }
  ];

  const handleCopy = async () => {
    if (!summaryLink) return;
    try {
      await navigator.clipboard.writeText(summaryLink);
      setCopyToast("Link copied");
      setTimeout(() => setCopyToast(null), 2500);
    } catch {
      setCopyToast("Copy failed");
      setTimeout(() => setCopyToast(null), 2500);
    }
  };

  return (
    <section className="space-y-8">
      <header className="rounded-3xl border border-white/10 bg-night-950/80 p-4 sm:rounded-[40px] sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Commission Hub</p>
            <h1 className="text-2xl font-semibold text-white sm:text-3xl">Share products, earn referral rewards</h1>
            <p className="text-sm text-white/60">Invite friends and earn commission every time they order.</p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/5 p-4 text-sm text-white/80 sm:rounded-3xl">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Invite link</p>
            <p className="mt-1 break-all font-mono text-sm text-white">{summaryLink || "Link pending"}</p>
            <p className="mt-2 text-xs text-white/60">Referral code: {referralCode || "—"}</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Button size="sm" onClick={handleCopy} disabled={!summaryLink} className="min-h-[44px] w-full sm:w-auto">
                Copy link
              </Button>
              {telegramShare ? (
                <Button asChild variant="secondary" size="sm" className="min-h-[44px] w-full sm:w-auto">
                  <a href={telegramShare} target="_blank" rel="noreferrer">
                    Share Telegram
                  </a>
                </Button>
              ) : null}
              {whatsappShare ? (
                <Button asChild variant="secondary" size="sm" className="min-h-[44px] w-full sm:w-auto">
                  <a href={whatsappShare} target="_blank" rel="noreferrer">
                    Share WhatsApp
                  </a>
                </Button>
              ) : null}
            </div>
            {copyToast && <p className="mt-2 text-xs text-emerald-200">{copyToast}</p>}
          </div>
        </div>
      </header>

      {commissionAlert && (
        <div className="rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-100">
          <p className="font-semibold">{commissionAlert.title}</p>
          <p className="text-white/80">{commissionAlert.message}</p>
        </div>
      )}

      {clickWarning && (
        <div className="rounded-3xl border border-yellow-400/40 bg-yellow-400/10 p-3 text-sm text-yellow-100">
          We couldn’t record the latest click. Please refresh and try again.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-white/10 bg-card p-4 sm:rounded-3xl">
            <p className="text-[11px] uppercase tracking-[0.25em] text-white/50 sm:text-xs sm:tracking-[0.3em]">{card.label}</p>
            <p className="mt-1.5 text-2xl font-semibold text-white sm:mt-2 sm:text-3xl">{card.value}</p>
            {card.sub && <p className="text-sm text-white/60">{card.sub}</p>}
          </div>
        ))}
      </div>
      <p className="text-sm text-white/60">Every unique click pays £0.30. Every friend&apos;s order earns you 10% commission — referral earnings never expire.</p>
      {lastClickTime && (
        <p className="text-xs text-white/50">
          Last click recorded {new Date(lastClickTime).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
        </p>
      )}

      <TasksPanel tasks={tasks} />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-night-950/70 p-4 sm:rounded-[40px] sm:p-6">
          <div className="mb-3 flex items-center justify-between sm:mb-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Conversions</p>
          </div>
          <HistoryTable
            rows={conversions.map((conversion) => ({
              id: String(
                conversion.id ?? `${conversion.handle ?? 'conversion'}-${conversion.createdAt ?? Date.now()}`
              ),
              primary: conversion.handle || "—",
              secondary: conversion.status || "pending",
              status: conversion.status || "pending",
              timestamp: conversion.createdAt,
              amount: conversion.orderValue ?? conversion.commission ?? null,
              copyValue: conversion.handle || undefined
            }))}
          />
        </div>
        <div className="rounded-3xl border border-white/10 bg-night-950/70 p-4 sm:rounded-[40px] sm:p-6">
          <div className="mb-3 flex items-center justify-between sm:mb-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Commission history</p>
            <Button size="sm" variant="ghost" onClick={() => router.push("/dashboard")}>
              Dashboard
            </Button>
          </div>
          <CommissionTable rows={history} />
        </div>
      </div>

      <HowItWorksCard />
    </section>
  );
}

function TasksPanel({ tasks }: { tasks: CommissionHubTask[] }) {
  if (!tasks.length) return null;
  return (
    <div className="rounded-3xl border border-white/10 bg-night-950/70 p-4 sm:rounded-[40px] sm:p-6">
      <p className="mb-3 text-xs uppercase tracking-[0.3em] text-white/50 sm:mb-4">Tasks</p>
      <div className="space-y-3">
        {tasks.map((task) => (
          <article key={task.id} className="rounded-3xl border border-white/10 bg-[#0b0b0b] p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-white">{task.title}</p>
                {task.description && <p className="text-sm text-white/60">{task.description}</p>}
              </div>
              {task.rewardLabel && (
                <span className="rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white/70">
                  {task.rewardLabel}
                </span>
              )}
            </div>
            {typeof task.progress === "number" && (
              <div className="mt-3 h-2 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-emerald-400"
                  style={{ width: `${Math.min(100, Math.max(0, task.progress * 100))}%` }}
                />
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

function CommissionTable({ rows }: { rows: CommissionTransaction[] }) {
  if (!rows.length) {
    return <StateMessage variant="empty" title="No commissions yet" body="Share your referral link to start earning commission." />;
  }
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <table className="w-full min-w-[400px] text-left text-sm text-white/80">
        <thead className="text-[11px] uppercase tracking-wider text-white/50 sm:text-xs">
          <tr>
            <th className="py-2">Amount</th>
            <th>Type</th>
            <th>Friend</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-white/10">
              <td className="py-2 pr-2">{currency.format(row.amount ?? 0)}</td>
              <td className="pr-2">{row.type || "Commission"}</td>
              <td className="max-w-[120px] truncate pr-2">{row.sourceInvitee || "—"}</td>
              <td className="whitespace-nowrap">
                {row.createdAt
                  ? new Date(row.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HistoryTable({
  rows
}: {
  rows: { id: string; primary: string; secondary?: string | null; status?: string | null; timestamp?: string | null; amount?: number | null; copyValue?: string }[];
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  if (!rows.length) {
    return <StateMessage variant="empty" title="No conversions yet" body="Share your link to see activity here." />;
  }
  const handleCopy = async (id: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  };
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <article
          key={row.id}
          className="flex flex-col gap-2 rounded-3xl border border-white/10 bg-[#0b0b0b] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-2">
            <p className="font-mono font-semibold text-white">{row.primary}</p>
            {row.copyValue && (
              <button
                onClick={() => handleCopy(row.id, row.copyValue!)}
                className="shrink-0 rounded-lg border border-white/10 px-2 py-1 text-xs text-white/50 transition hover:border-white/20 hover:text-white/70"
              >
                {copiedId === row.id ? "✓" : "Copy"}
              </button>
            )}
          </div>
          <div className="flex flex-col items-start gap-2 text-sm text-white/60 sm:flex-row sm:items-center sm:gap-4">
            <StatusPill status={row.status} />
            {row.amount != null && <span>{currency.format(row.amount)}</span>}
            <span>
              {row.timestamp
                ? new Date(row.timestamp).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })
                : "—"}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}

function StatusPill({ status }: { status?: string | null }) {
  if (!status) {
    return <span className="rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white/60">Pending</span>;
  }
  const palette: Record<string, string> = {
    paid: "bg-emerald-400/10 text-emerald-200 border-emerald-400/40",
    active: "bg-brand-500/10 text-brand-200 border-brand-500/40",
    completed: "bg-emerald-400/10 text-emerald-200 border-emerald-400/40",
    pending: "bg-yellow-400/10 text-yellow-200 border-yellow-400/40",
    processing: "bg-blue-400/10 text-blue-200 border-blue-400/40"
  };
  const key = status.toLowerCase();
  const classes = palette[key] || "bg-white/5 text-white/70 border-white/20";
  return <span className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.3em] ${classes}`}>{formatStatus(status)}</span>;
}

function formatStatus(label: string) {
  return label
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function HowItWorksCard() {
  return (
    <div className="rounded-3xl border border-white/10 bg-night-950/60 p-4 sm:rounded-[40px] sm:p-6">
      <h2 className="text-xl font-semibold text-white sm:text-2xl">How referrals work</h2>
      <ol className="mt-3 list-decimal space-y-2 pl-6 text-sm leading-relaxed text-white/70">
        <li>Share your invite link with trusted friends.</li>
        <li>They sign up and browse our products.</li>
        <li>When they place an order, 10% of their spend is credited to your wallet as referral earnings.</li>
      </ol>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:gap-3">
        <Button asChild className="w-full min-h-[48px] sm:w-auto">
          <a href="/contact">Contact support</a>
        </Button>
        <Button variant="ghost" asChild className="w-full min-h-[48px] sm:w-auto">
          <Link href="/referral/poster">Poster generator</Link>
        </Button>
      </div>
    </div>
  );
}
