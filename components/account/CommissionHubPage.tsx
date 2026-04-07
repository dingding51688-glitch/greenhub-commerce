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
  type CommissionTransaction,
  type ClickTrendDay,
  type LeaderboardEntry,
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
        body="Connect your Bloom account to start sharing referral codes."
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
  const clickTrend = data?.clickTrend ?? [];
  const leaderboard = data?.leaderboard ?? [];
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
          body="Share your link to start tracking clicks, conversions, and payouts."
        />
        <HowItWorksCard />
      </section>
    );
  }

  const commissionAlert = notifications.find(
    (notification) => notification.type === "commission_award" && !notification.read
  );

  const clicks = summary?.clicks ?? 0;
  const validClicks = summary?.validClicks ?? 0;
  const registrations = summary?.registrations ?? 0;
  const topups = summary?.topups ?? 0;
  const lifetimeCommission = summary?.bonusEarned ?? 0;
  const clickCommission = summary?.clickPayoutTotal ?? 0;
  const orderCommission = Math.max(0, lifetimeCommission - clickCommission);
  const availableBalance = summary?.availableBalance ?? 0;
  const commissionRate = summary?.commissionRate ?? 0.1;
  const summaryLink = summary?.link ?? "";
  const referralCode = summary?.code ?? "—";
  const inviteLink = summaryLink ? summaryLink.replace("/ref/", "/invite?ref=") : "";
  const shareText = encodeURIComponent("Join GreenHub and get great deals. Use my invite link!");
  const shareUrl = summaryLink ? encodeURIComponent(summaryLink) : "";
  const telegramShare = summaryLink ? `https://t.me/share/url?url=${shareUrl}&text=${shareText}` : null;
  const whatsappShare = summaryLink ? `https://api.whatsapp.com/send?text=${shareText}%20${shareUrl}` : null;

  const statCards = [
    { label: "Clicks", value: `${validClicks}`, sub: clicks > validClicks ? `${clicks} total · ${validClicks} valid` : undefined },
    { label: "Registrations", value: `${registrations}`, sub: topups ? `${topups} converted` : undefined },
    { label: "Commission rate", value: `${(commissionRate * 100).toFixed(0)}%`, sub: "Per order" },
    { label: "Lifetime earned", value: currency.format(lifetimeCommission), sub: `£${clickCommission.toFixed(2)} clicks · £${orderCommission.toFixed(2)} orders` },
    { label: "Available balance", value: currency.format(availableBalance), sub: undefined },
  ];

  const handleCopy = async (value: string, label?: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyToast(label || "Copied");
      setTimeout(() => setCopyToast(null), 2500);
    } catch {
      setCopyToast("Copy failed");
      setTimeout(() => setCopyToast(null), 2500);
    }
  };

  return (
    <section className="space-y-8">
      {/* Header + link */}
      <header className="rounded-3xl border border-white/10 bg-night-950/80 p-4 sm:rounded-[40px] sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Commission Hub</p>
            <h1 className="text-2xl font-semibold text-white sm:text-3xl">Share &amp; earn cash rewards</h1>
            <p className="text-sm text-white/60">£0.30 per click · {(commissionRate * 100).toFixed(0)}% of every order</p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/5 p-4 text-sm text-white/80 sm:rounded-3xl">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Invite link</p>
            <p className="mt-1 break-all font-mono text-sm text-white">{summaryLink || "Link pending"}</p>
            <p className="mt-2 text-xs text-white/60">Code: <span className="font-mono">{referralCode}</span></p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Button size="sm" onClick={() => handleCopy(summaryLink, "Link copied")} disabled={!summaryLink} className="min-h-[44px] w-full sm:w-auto">
                Copy link
              </Button>
              <Button size="sm" variant="secondary" onClick={() => handleCopy(inviteLink, "Invite page copied")} disabled={!inviteLink} className="min-h-[44px] w-full sm:w-auto">
                Copy invite page
              </Button>
              {telegramShare && (
                <Button asChild variant="secondary" size="sm" className="min-h-[44px] w-full sm:w-auto">
                  <a href={telegramShare} target="_blank" rel="noreferrer">Telegram</a>
                </Button>
              )}
              {whatsappShare && (
                <Button asChild variant="secondary" size="sm" className="min-h-[44px] w-full sm:w-auto">
                  <a href={whatsappShare} target="_blank" rel="noreferrer">WhatsApp</a>
                </Button>
              )}
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
          We couldn&apos;t record the latest click. Please refresh and try again.
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-white/10 bg-card p-4 sm:rounded-3xl">
            <p className="text-[11px] uppercase tracking-[0.25em] text-white/50 sm:text-xs">{card.label}</p>
            <p className="mt-1.5 text-2xl font-semibold text-white">{card.value}</p>
            {card.sub && <p className="text-sm text-white/60">{card.sub}</p>}
          </div>
        ))}
      </div>

      {/* Click trend chart */}
      {clickTrend.length > 0 && <ClickTrendChart data={clickTrend} />}

      {/* Tasks */}
      <TasksPanel tasks={tasks} />

      {/* Leaderboard */}
      {leaderboard.length > 0 && <LeaderboardPanel entries={leaderboard} currentCode={referralCode} />}

      {/* Conversions + History */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-night-950/70 p-4 sm:rounded-[40px] sm:p-6">
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-white/50">Conversions</p>
          <HistoryTable
            rows={conversions.map((c) => ({
              id: String(c.id ?? `${c.email ?? "conv"}-${c.createdAt ?? Date.now()}`),
              primary: c.email || "Unknown contact",
              secondary: c.locker || "—",
              status: c.status || "pending",
              timestamp: c.createdAt,
              amount: c.totalCommissionEarned ?? c.commission ?? null,
            }))}
          />
        </div>
        <div className="rounded-3xl border border-white/10 bg-night-950/70 p-4 sm:rounded-[40px] sm:p-6">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Commission history</p>
            <Button size="sm" variant="ghost" onClick={() => router.push("/dashboard")}>Dashboard</Button>
          </div>
          <CommissionTable rows={history} />
        </div>
      </div>

      <HowItWorksCard />
    </section>
  );
}

/* ─── Click Trend Chart (simple bar chart) ─── */
function ClickTrendChart({ data }: { data: ClickTrendDay[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const total = data.reduce((s, d) => s + d.count, 0);
  return (
    <div className="rounded-3xl border border-white/10 bg-night-950/70 p-4 sm:rounded-[40px] sm:p-6">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Clicks — Last 7 days</p>
        <p className="text-sm font-semibold text-white">{total} total</p>
      </div>
      <div className="flex items-end gap-2" style={{ height: 120 }}>
        {data.map((d) => (
          <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-t-md bg-emerald-400/70 transition-all"
              style={{ height: `${Math.max(4, (d.count / max) * 100)}px` }}
            />
            <span className="text-[10px] text-white/40">{d.day.slice(5)}</span>
            <span className="text-[10px] font-semibold text-white/70">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Leaderboard ─── */
function LeaderboardPanel({ entries, currentCode }: { entries: LeaderboardEntry[]; currentCode?: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-night-950/70 p-4 sm:rounded-[40px] sm:p-6">
      <p className="mb-3 text-xs uppercase tracking-[0.3em] text-white/50">Referral Leaderboard</p>
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <table className="w-full min-w-[500px] text-left text-sm text-white/80">
          <thead className="text-[11px] uppercase tracking-wider text-white/50">
            <tr>
              <th className="py-2">#</th>
              <th>User</th>
              <th>Clicks</th>
              <th>Valid</th>
              <th>Signups</th>
              <th>Commission</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.customerId} className="border-t border-white/10">
                <td className="py-2 pr-2 font-semibold text-white">{e.rank}</td>
                <td className="max-w-[160px] truncate pr-2">
                  {e.transferHandle || e.email?.replace(/@.*/, "@…") || `#${e.customerId}`}
                </td>
                <td className="pr-2">{e.clicks}</td>
                <td className="pr-2">{e.validClicks}</td>
                <td className="pr-2">{e.registrations}</td>
                <td className="font-semibold text-emerald-300">{currency.format(e.commission)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Tasks ─── */
function TasksPanel({ tasks }: { tasks: CommissionHubTask[] }) {
  if (!tasks.length) return null;
  return (
    <div className="rounded-3xl border border-white/10 bg-night-950/70 p-4 sm:rounded-[40px] sm:p-6">
      <p className="mb-3 text-xs uppercase tracking-[0.3em] text-white/50">Tasks</p>
      <div className="space-y-3">
        {tasks.map((task) => {
          const progress = typeof task.progress === "number" && typeof task.goal === "number"
            ? Math.min(1, task.progress / Math.max(1, task.goal))
            : typeof task.progress === "number" ? task.progress : 0;
          const done = progress >= 1;
          return (
            <article key={task.id} className="rounded-3xl border border-white/10 bg-[#0b0b0b] p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className={`font-semibold ${done ? "text-emerald-300" : "text-white"}`}>
                    {done ? "✅ " : ""}{task.title}
                  </p>
                  {task.description && <p className="text-sm text-white/60">{task.description}</p>}
                </div>
                {task.rewardLabel && (
                  <span className="rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white/70">
                    {task.rewardLabel}
                  </span>
                )}
              </div>
              <div className="mt-3 h-2 rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full transition-all ${done ? "bg-emerald-400" : "bg-brand-500"}`}
                  style={{ width: `${Math.min(100, progress * 100)}%` }}
                />
              </div>
              {task.goal && (
                <p className="mt-1 text-xs text-white/50">
                  {typeof task.progress === "number" ? task.progress : 0} / {task.goal}
                </p>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Commission Table ─── */
function CommissionTable({ rows }: { rows: CommissionTransaction[] }) {
  if (!rows.length) {
    return <StateMessage variant="empty" title="No commissions yet" body="Share your link or remind friends to top up." />;
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
                {row.createdAt ? new Date(row.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── History Table ─── */
function HistoryTable({ rows }: { rows: { id: string; primary: string; secondary?: string | null; status?: string | null; timestamp?: string | null; amount?: number | null }[] }) {
  if (!rows.length) {
    return <StateMessage variant="empty" title="No conversions yet" body="Share your link to see activity here." />;
  }
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <article key={row.id} className="flex flex-col gap-2 rounded-3xl border border-white/10 bg-[#0b0b0b] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-white">{row.primary}</p>
            <p className="text-sm text-white/60">{row.secondary || "—"}</p>
          </div>
          <div className="flex flex-col items-start gap-2 text-sm text-white/60 sm:flex-row sm:items-center sm:gap-4">
            <StatusPill status={row.status} />
            {row.amount != null && <span>{currency.format(row.amount)}</span>}
            <span>{row.timestamp ? new Date(row.timestamp).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "—"}</span>
          </div>
        </article>
      ))}
    </div>
  );
}

function StatusPill({ status }: { status?: string | null }) {
  if (!status) return <span className="rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white/60">Pending</span>;
  const palette: Record<string, string> = {
    paid: "bg-emerald-400/10 text-emerald-200 border-emerald-400/40",
    active: "bg-brand-500/10 text-brand-200 border-brand-500/40",
    completed: "bg-emerald-400/10 text-emerald-200 border-emerald-400/40",
    pending: "bg-yellow-400/10 text-yellow-200 border-yellow-400/40",
    processing: "bg-blue-400/10 text-blue-200 border-blue-400/40",
  };
  const cls = palette[status.toLowerCase()] || "bg-white/5 text-white/70 border-white/20";
  return <span className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.3em] ${cls}`}>{status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span>;
}

function HowItWorksCard() {
  return (
    <div className="rounded-3xl border border-white/10 bg-night-950/60 p-4 sm:rounded-[40px] sm:p-6">
      <h2 className="text-xl font-semibold text-white sm:text-2xl">How referrals work</h2>
      <ol className="mt-3 list-decimal space-y-2 pl-6 text-sm leading-relaxed text-white/70">
        <li>Share your invite link with trusted friends.</li>
        <li>Every unique click earns you £0.30 instantly.</li>
        <li>When they place an order, you earn {((0.1) * 100).toFixed(0)}% of their spend.</li>
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
