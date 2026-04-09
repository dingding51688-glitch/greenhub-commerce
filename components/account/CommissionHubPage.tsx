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
  type CommissionTransaction
} from "@/lib/referral-api";
import { consumeClickError, getLastTrackedClickTime } from "@/lib/referral-tracking";
import dynamic from "next/dynamic";
import { useRef } from "react";

const QRCode = dynamic(
  () => import("qrcode.react").then((mod) => mod.QRCodeCanvas ?? mod.default),
  { ssr: false }
);

const GBP = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

/* ─── Tier system (matches backend TIER_RATES) ─── */
const TIERS = [
  { name: "Bronze",  emoji: "🥉", min: 0,   rate: 10, color: "text-amber-400" },
  { name: "Silver",  emoji: "🥈", min: 100, rate: 15, color: "text-gray-300" },
  { name: "Gold",    emoji: "🥇", min: 200, rate: 20, color: "text-yellow-300" },
];

function getTier(conversions: number) {
  let tier = TIERS[0];
  for (const t of TIERS) {
    if (conversions >= t.min) tier = t;
  }
  const nextTier = TIERS[TIERS.indexOf(tier) + 1];
  const progress = nextTier
    ? (conversions - tier.min) / (nextTier.min - tier.min)
    : 1;
  return { tier, nextTier, progress: Math.min(1, Math.max(0, progress)), conversions };
}

export default function CommissionHubPage() {
  const { token } = useAuth();
  const router = useRouter();
  const { notifications } = useNotifications();
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [lastClickTime, setLastClickTime] = useState<number | null>(null);
  const [clickWarning, setClickWarning] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

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

  const conversions = data?.conversions ?? [];
  const history = data?.history ?? [];
  const hasSnapshot = Boolean(summary) || conversions.length > 0 || history.length > 0;
  const showEmpty = !isLoading && (!hasSnapshot || notFound);

  if (fatalError) {
    return (
      <StateMessage
        variant="error"
        title="Unable to load Earn Hub"
        body={error?.message || "Please refresh and try again."}
        actionLabel="Retry"
        onAction={() => mutate()}
      />
    );
  }

  if (isLoading && !hasSnapshot) {
    return <StateMessage title="Loading Earn Hub" body="Fetching your referral data…" />;
  }

  if (showEmpty) {
    return (
      <section className="space-y-6 px-4 py-8">
        <StateMessage
          variant="empty"
          title="No referrals yet"
          body="Share your referral link to start tracking clicks, conversions, and earnings."
        />
        <HowItWorks />
      </section>
    );
  }

  const commissionAlert = notifications.find(
    (notification) => notification.type === "commission_award" && !notification.read
  );

  const clicks = summary?.clicks ?? 0;
  const validClicks = summary?.validClicks ?? 0;
  const totalFriends = summary?.totalInvites ?? conversions.length;
  const registrations = summary?.registrations ?? 0;
  const orderCount = history.filter(h => h.type === "订单佣金" || h.type === "topup_commission" || h.type === "commission").length;
  const topups = summary?.topups ?? 0;
  const conversionRate = summary?.conversionRate ?? 0;
  const lifetimeCommission = summary?.bonusEarned ?? 0;
  const clickCommission = summary?.clickPayoutTotal ?? 0;
  const orderCommission = Math.max(0, lifetimeCommission - clickCommission);
  const monthlyCommission = summary?.monthCommission ?? summary?.thirtyDayCommission ?? 0;
  const summaryLink = summary?.link ?? "";
  const referralCode = summary?.code ?? "—";
  const shareText = encodeURIComponent("Join GreenHub and get great deals. Use my invite link!");
  const shareUrl = summaryLink ? encodeURIComponent(summaryLink) : "";
  const telegramShare = summaryLink ? `https://t.me/share/url?url=${shareUrl}&text=${shareText}` : null;
  const whatsappShare = summaryLink ? `https://api.whatsapp.com/send?text=${shareText}%20${shareUrl}` : null;
  const currentRate = summary?.commissionRate ? Math.round(summary.commissionRate * 100) : 10;
  const tierInfo = getTier(totalFriends);

  const handleCopy = async () => {
    if (!summaryLink) return;
    try {
      await navigator.clipboard.writeText(summaryLink);
      setCopyToast("Copied!");
      setTimeout(() => setCopyToast(null), 2500);
    } catch {
      setCopyToast("Copy failed");
      setTimeout(() => setCopyToast(null), 2500);
    }
  };

  return (
    <section className="space-y-5 px-4 py-8">

      {/* ── 1. Hero: Total Earnings ── */}
      <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-night-900 via-night-950 to-night-900 p-6 shadow-2xl shadow-brand-600/10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-brand-500/8 blur-2xl" />

        <p className="relative text-xs font-medium uppercase tracking-[0.3em] text-white/50">💰 Earn Hub</p>
        <p className="relative mt-2 text-4xl font-extrabold leading-none text-white drop-shadow-sm sm:text-5xl">
          {GBP.format(lifetimeCommission)}
        </p>
        <p className="relative mt-1 text-sm text-white/50">Total earnings</p>

        <div className="relative mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
          💸 Commission earnings can be withdrawn to your bank account
          <Link href="/wallet/withdraw" className="ml-1 underline underline-offset-2 hover:text-white">Withdraw</Link>
        </div>

        <div className="relative mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <span className="text-white/60">🔗 Clicks: <span className="font-semibold text-emerald-300">{GBP.format(clickCommission)}</span></span>
          <span className="text-white/60">🛒 Orders: <span className="font-semibold text-emerald-300">{GBP.format(orderCommission)}</span></span>
          {monthlyCommission > 0 && (
            <span className="text-white/60">📅 This month: <span className="font-semibold text-emerald-300">+{GBP.format(monthlyCommission)}</span></span>
          )}
        </div>
      </div>

      {/* ── Commission alert ── */}
      {commissionAlert && (
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-100">
          <p className="font-semibold">{commissionAlert.title}</p>
          <p className="text-white/80">{commissionAlert.message}</p>
        </div>
      )}

      {clickWarning && (
        <div className="rounded-2xl border border-yellow-400/40 bg-yellow-400/10 p-3 text-sm text-yellow-100">
          We couldn&apos;t record the latest click. Please refresh and try again.
        </div>
      )}

      {/* ── 2. Share Section with QR ── */}
      <div className="rounded-3xl border border-white/10 bg-card p-5">
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/50">📤 Your Invite Link</p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start">
          {/* QR Code - tap to copy/save */}
          {summaryLink && (
            <div className="shrink-0 self-center sm:self-start">
              <div ref={qrRef} className="rounded-xl bg-white p-3">
                <QRCode value={summaryLink} size={120} />
              </div>
              <div className="mt-1.5 flex justify-center gap-2">
                <button
                  onClick={async () => {
                    try {
                      const canvas = qrRef.current?.querySelector("canvas");
                      if (!canvas) return;
                      const blob = await new Promise<Blob | null>(r => (canvas as HTMLCanvasElement).toBlob(r, "image/png"));
                      if (blob) {
                        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
                        setCopyToast("QR copied!");
                        setTimeout(() => setCopyToast(null), 2000);
                      }
                    } catch {
                      // Fallback: download instead
                      const canvas = qrRef.current?.querySelector("canvas") as HTMLCanvasElement | null;
                      if (canvas) {
                        const a = document.createElement("a");
                        a.href = canvas.toDataURL("image/png");
                        a.download = "greenhub-invite-qr.png";
                        a.click();
                      }
                    }
                  }}
                  className="text-[10px] text-white/40 hover:text-white/60"
                >
                  📋 Copy QR
                </button>
                <button
                  onClick={() => {
                    const canvas = qrRef.current?.querySelector("canvas") as HTMLCanvasElement | null;
                    if (canvas) {
                      const a = document.createElement("a");
                      a.href = canvas.toDataURL("image/png");
                      a.download = "greenhub-invite-qr.png";
                      a.click();
                    }
                  }}
                  className="text-[10px] text-white/40 hover:text-white/60"
                >
                  ⬇ Save
                </button>
              </div>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="break-all rounded-xl bg-white/5 px-3 py-2.5 font-mono text-sm text-white">
              {summaryLink || "Link pending…"}
            </p>
            <p className="mt-1.5 text-xs text-white/40">Referral code: <span className="font-mono text-white/60">{referralCode}</span></p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={handleCopy} disabled={!summaryLink} className="min-h-[44px]">
                {copyToast || "📋 Copy link"}
              </Button>
              {whatsappShare && (
                <Button asChild variant="secondary" size="sm" className="min-h-[44px]">
                  <a href={whatsappShare} target="_blank" rel="noreferrer">📱 WhatsApp</a>
                </Button>
              )}
              {telegramShare && (
                <Button asChild variant="secondary" size="sm" className="min-h-[44px]">
                  <a href={telegramShare} target="_blank" rel="noreferrer">✈️ Telegram</a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Stats Grid ── */}
      <div className="grid grid-cols-3 gap-2.5">
        <StatCard label="Clicks" value={validClicks.toString()} sub={GBP.format(clickCommission)} />
        <StatCard label="Friends" value={totalFriends.toString()} sub={conversionRate ? `${(conversionRate * 100).toFixed(0)}% convert` : `${topups} topped up`} />
        <StatCard label="Orders" value={orderCount.toString()} sub="10% commission" />
      </div>

      {lastClickTime && (
        <p className="text-xs text-white/40">
          Last click: {new Date(lastClickTime).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
        </p>
      )}

      {/* ── 4. Tier Progress ── */}
      <div className="rounded-2xl border border-white/10 bg-card p-4">
        {/* Current tier header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{tierInfo.tier.emoji}</span>
            <div>
              <p className={`font-semibold ${tierInfo.tier.color}`}>{tierInfo.tier.name} Promoter · <span className="text-emerald-300">{currentRate}%</span></p>
              <p className="text-xs text-white/40">{totalFriends} friends referred</p>
            </div>
          </div>
          {tierInfo.nextTier && (
            <div className="text-right">
              <p className="text-xs text-white/50">
                {tierInfo.nextTier.min - totalFriends} more → {tierInfo.nextTier.emoji} {tierInfo.nextTier.name}
              </p>
              {tierInfo.nextTier.rate > tierInfo.tier.rate && (
                <p className="text-[10px] text-emerald-400">Unlocks {tierInfo.nextTier.rate}% commission</p>
              )}
            </div>
          )}
        </div>

        {/* Tier roadmap with inline progress bars */}
        <div className="mt-4 border-t border-white/5 pt-3">
          <div className="flex flex-col gap-2">
            {TIERS.map((t, i) => {
              const isCurrent = t.name === tierInfo.tier.name;
              const isReached = totalFriends >= t.min;
              const nextMin = TIERS[i + 1]?.min ?? t.min;
              const segmentTotal = nextMin - t.min;
              const segmentProgress = segmentTotal > 0
                ? Math.min(1, Math.max(0, (totalFriends - t.min) / segmentTotal))
                : (isReached ? 1 : 0);
              const isLast = i === TIERS.length - 1;

              return (
                <div key={t.name} className={`rounded-xl px-3 py-2 ${isCurrent ? "bg-white/5 ring-1 ring-white/10" : ""}`}>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{t.emoji}</span>
                      <span className={isReached ? t.color + " font-semibold" : "text-white/30"}>{t.name}</span>
                      {isCurrent && <span className="rounded-full bg-emerald-400/20 px-1.5 py-px text-[9px] font-bold uppercase text-emerald-300">You</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={isReached ? "text-white/60" : "text-white/25"}>{t.min === 0 ? "Start" : `${t.min}+ friends`}</span>
                      <span className={`font-mono font-semibold ${isReached ? "text-emerald-300" : "text-white/25"}`}>{t.rate}%</span>
                    </div>
                  </div>
                  {/* Progress bar for each tier segment */}
                  {!isLast && (
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isReached ? "bg-gradient-to-r from-emerald-500 to-brand-400" : "bg-white/5"
                        }`}
                        style={{ width: `${segmentProgress * 100}%` }}
                      />
                    </div>
                  )}
                  {!isLast && isReached && totalFriends < nextMin && (
                    <p className="mt-1 text-[10px] text-white/40 text-right">{totalFriends} / {nextMin} friends</p>
                  )}
                  {isLast && isReached && (
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-gradient-to-r from-emerald-500 to-brand-400" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tasks removed per request */}

      {/* ── 6. Activity: Conversions + Commission History ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-card p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.3em] text-white/50">👥 Conversions</p>
          <ConversionsList conversions={conversions} />
        </div>
        <div className="rounded-3xl border border-white/10 bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/50">📊 Commission History</p>
            <Button size="sm" variant="ghost" onClick={() => router.push("/dashboard")}>
              Dashboard
            </Button>
          </div>
          <CommissionList rows={history} />
        </div>
      </div>

      {/* ── 7. How It Works ── */}
      <HowItWorks />

      {/* ── 8. Rules ── */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3 text-xs leading-relaxed text-white/40">
        <p>💡 Every unique click pays <span className="text-white/60">£0.30</span> (24h dedup per visitor). Every friend&apos;s order earns you <span className="text-white/60">10% commission</span>. Referral earnings never expire and are credited to your wallet instantly.</p>
      </div>
    </section>
  );
}

/* ─── Sub-components ─── */

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-card p-3 text-center">
      <p className="text-[10px] uppercase tracking-[0.25em] text-white/50">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-white/40">{sub}</p>}
    </div>
  );
}



function ConversionsList({ conversions }: { conversions: { id: number | string; handle?: string; status?: string; createdAt?: string; orderValue?: number; commission?: number }[] }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!conversions.length) {
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
    <div className="space-y-2">
      {conversions.map((c) => {
        const id = String(c.id ?? `${c.handle ?? "c"}-${c.createdAt ?? Date.now()}`);
        return (
          <div key={id} className="flex items-center justify-between gap-2 rounded-xl bg-white/[0.03] px-3 py-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-sm font-semibold text-white truncate">{c.handle || "—"}</span>
              {c.handle && (
                <button
                  onClick={() => handleCopy(id, c.handle!)}
                  className="shrink-0 text-[10px] text-white/30 hover:text-white/50"
                >
                  {copiedId === id ? "✓" : "📋"}
                </button>
              )}
              {c.handle && (
                <Link
                  href={`/wallet/transfer?to=${encodeURIComponent(c.handle)}`}
                  className="shrink-0 rounded-full border border-brand-500/40 bg-brand-500/10 px-2 py-0.5 text-[10px] font-medium text-brand-200 hover:bg-brand-500/20"
                >
                  ⇒ Transfer
                </Link>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0 text-xs">
              <StatusPill status={c.status} />
              {(c.orderValue ?? c.commission) != null && (
                <span className="text-emerald-300 font-semibold">{GBP.format(c.orderValue ?? c.commission ?? 0)}</span>
              )}
              <span className="text-white/30">
                {c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CommissionList({ rows }: { rows: CommissionTransaction[] }) {
  if (!rows.length) {
    return <StateMessage variant="empty" title="No commissions yet" body="Share your referral link to start earning." />;
  }

  const isClick = (type?: string) => type === "click_bonus" || type === "referral_click_bonus" || type === "点击奖励";

  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div key={row.id} className="rounded-xl bg-white/[0.03] px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{isClick(row.type) ? "🔗" : "🛒"}</span>
                <p className="text-sm font-medium text-white truncate">
                  {isClick(row.type)
                    ? "Click reward"
                    : row.sourceInvitee ? `Order commission` : "Commission"}
                </p>
              </div>
            </div>
            <span className="text-sm font-semibold text-emerald-300 shrink-0">+{GBP.format(row.amount ?? 0)}</span>
          </div>
          {/* Detail line */}
          <div className="mt-1 flex items-center gap-2 text-[11px] text-white/40">
            {row.sourceInvitee && !isClick(row.type) && (
              <span>From <span className="font-mono text-white/60">{row.sourceInvitee}</span></span>
            )}
            {isClick(row.type) && <span>£0.30 per valid click</span>}
            {row.reference && <span className="font-mono truncate">{row.reference}</span>}
            <span className="ml-auto shrink-0">
              {row.createdAt ? new Date(row.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusPill({ status }: { status?: string | null }) {
  if (!status) {
    return <span className="rounded-full border border-white/20 px-2 py-0.5 text-[10px] uppercase text-white/50">Pending</span>;
  }
  const palette: Record<string, string> = {
    paid: "bg-emerald-400/10 text-emerald-200 border-emerald-400/40",
    active: "bg-brand-500/10 text-brand-200 border-brand-500/40",
    completed: "bg-emerald-400/10 text-emerald-200 border-emerald-400/40",
    pending: "bg-yellow-400/10 text-yellow-200 border-yellow-400/40",
    processing: "bg-blue-400/10 text-blue-200 border-blue-400/40",
  };
  const key = status.toLowerCase();
  const classes = palette[key] || "bg-white/5 text-white/70 border-white/20";
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase ${classes}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function HowItWorks() {
  return (
    <div className="rounded-3xl border border-white/10 bg-card p-5">
      <h2 className="text-lg font-semibold text-white">How it works</h2>
      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-2xl">📤</div>
          <p className="mt-2 text-sm font-semibold text-white">Share</p>
          <p className="mt-0.5 text-xs text-white/50">Send your invite link to friends</p>
        </div>
        <div>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-2xl">🛒</div>
          <p className="mt-2 text-sm font-semibold text-white">They Shop</p>
          <p className="mt-0.5 text-xs text-white/50">Friends sign up and place orders</p>
        </div>
        <div>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-2xl">💰</div>
          <p className="mt-2 text-sm font-semibold text-white">You Earn</p>
          <p className="mt-0.5 text-xs text-white/50">£0.30/click + 10% of orders</p>
        </div>
      </div>
    </div>
  );
}
