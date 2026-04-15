"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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
  type CommissionTransaction,
} from "@/lib/referral-api";
import { consumeClickError, getLastTrackedClickTime } from "@/lib/referral-tracking";
import dynamic from "next/dynamic";

const QRCode = dynamic(
  () => import("qrcode.react").then((mod) => mod.QRCodeCanvas ?? mod.default),
  { ssr: false }
);

const GBP = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

/* Tiers */
const TIERS = [
  { name: "Bronze", emoji: "🥉", min: 0, rate: 15, color: "text-amber-400" },
  { name: "Silver", emoji: "🥈", min: 100, rate: 20, color: "text-gray-300" },
  { name: "Gold", emoji: "🥇", min: 200, rate: 25, color: "text-yellow-300" },
];

function getTier(conversions: number) {
  let tier = TIERS[0];
  for (const t of TIERS) if (conversions >= t.min) tier = t;
  const nextTier = TIERS[TIERS.indexOf(tier) + 1];
  const progress = nextTier ? (conversions - tier.min) / (nextTier.min - tier.min) : 1;
  return { tier, nextTier, progress: Math.min(1, Math.max(0, progress)), conversions };
}

const PROMO_CAPTION = `🔥 Premium UK bud delivered to your nearest InPost locker — no meetups, no hassle, just quality.

📦 Vacuum-sealed, discreet packaging. Pick up 24/7 from any locker across the UK.

✨ Lab-tested, slow-cured indoor strains. Only the best makes the cut.

🚚 Order online → dispatched within 24 hours → collect from your locker. Simple.`;

/* ─── Tab type ─── */
type Tab = "overview" | "friends" | "history";

export default function CommissionHubPage() {
  const { token } = useAuth();
  const router = useRouter();
  const { notifications } = useNotifications();
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const qrRef = useRef<HTMLDivElement>(null);

  const { data, error, isLoading, mutate } = useSWR<CommissionHubSnapshot>(
    token ? "commission-hub" : null,
    getCommissionHubSnapshot
  );

  useEffect(() => { consumeClickError(); }, []);

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

  if (fatalError) {
    return <StateMessage variant="error" title="Unable to load Earn Hub" body={error?.message || "Please refresh."} actionLabel="Retry" onAction={() => mutate()} />;
  }
  if (isLoading && !hasSnapshot) {
    return <StateMessage title="Loading Earn Hub" body="Fetching your referral data…" />;
  }
  if (!isLoading && (!hasSnapshot || notFound)) {
    return (
      <section className="space-y-4 px-3 py-6">
        <StateMessage variant="empty" title="No referrals yet" body="Share your referral link to start earning." />
        <HowItWorks />
      </section>
    );
  }

  const clicks = summary?.clicks ?? 0;
  const totalFriends = summary?.totalInvites ?? conversions.length;
  const orderCount = history.filter(h => h.type === "订单佣金" || h.type === "topup_commission" || h.type === "commission").length;
  const lifetimeCommission = summary?.bonusEarned ?? 0;
  const clickCommission = summary?.clickPayoutTotal ?? 0;
  const monthlyCommission = summary?.monthCommission ?? summary?.thirtyDayCommission ?? 0;
  const summaryLink = summary?.link ?? "";
  const referralCode = summary?.code ?? "—";
  const currentRate = summary?.commissionRate ? Math.round(summary.commissionRate * 100) : 15;
  const qualifiedFriends = summary?.topups ?? conversions.filter(c => (c as any).totalCommissionEarned > 0 || c.status === "topped_up" || c.status === "purchased").length;
  const tierInfo = getTier(qualifiedFriends);

  const shareText = encodeURIComponent("Join GreenHub and get great deals. Use my invite link!");
  const shareUrl = summaryLink ? encodeURIComponent(summaryLink) : "";
  const telegramShare = summaryLink ? `https://t.me/share/url?url=${shareUrl}&text=${shareText}` : null;
  const whatsappShare = summaryLink ? `https://api.whatsapp.com/send?text=${shareText}%20${shareUrl}` : null;

  const handleCopy = async () => {
    if (!summaryLink) return;
    try {
      await navigator.clipboard.writeText(summaryLink);
      setCopyToast("Copied!");
      setTimeout(() => setCopyToast(null), 2000);
    } catch { setCopyToast("Failed"); setTimeout(() => setCopyToast(null), 2000); }
  };

  return (
    <section className="pb-24 px-3 py-4 space-y-3">
      {/* ── Hero: compact earnings + tier ── */}
      <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-3.5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] uppercase tracking-wider text-white/30">💰 Total Earned</p>
            <p className="text-2xl font-bold text-white">{GBP.format(lifetimeCommission)}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1">
              <span className="text-sm">{tierInfo.tier.emoji}</span>
              <span className={`text-xs font-bold ${tierInfo.tier.color}`}>{tierInfo.tier.name}</span>
              <span className="text-xs text-emerald-300 font-bold">{currentRate}%</span>
            </div>
            {monthlyCommission > 0 && (
              <p className="text-[10px] text-emerald-400 mt-0.5">+{GBP.format(monthlyCommission)} this month</p>
            )}
          </div>
        </div>

        {/* Mini stats row */}
        <div className="flex gap-4 mt-2.5 pt-2.5 border-t border-white/5">
          <MiniStat icon="👁" label="Views" value={String(clicks)} />
          <MiniStat icon="👥" label="Friends" value={String(totalFriends)} />
          <MiniStat icon="🛒" label="Orders" value={String(orderCount)} />
          <MiniStat icon="✅" label="Qualified" value={String(qualifiedFriends)} />
        </div>
      </div>

      {/* ── Share link — compact ── */}
      <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-3">
        <p className="text-[9px] uppercase tracking-wider text-white/30">📤 Your Invite Link</p>
        <div className="mt-2 flex items-center gap-2">
          <p className="flex-1 min-w-0 truncate rounded-lg bg-white/5 px-2.5 py-2 font-mono text-[11px] text-white/70">
            {summaryLink || "Link pending…"}
          </p>
          <button onClick={handleCopy} disabled={!summaryLink}
            className="shrink-0 rounded-lg bg-emerald-500/15 border border-emerald-400/20 px-3 py-2 text-[11px] font-bold text-emerald-300 active:bg-emerald-500/25">
            {copyToast || "Copy"}
          </button>
        </div>
        <div className="flex gap-2 mt-2">
          {whatsappShare && (
            <a href={whatsappShare} target="_blank" rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-white/8 bg-white/[0.03] py-2 text-[11px] text-white/60 active:bg-white/[0.06]">
              📱 WhatsApp
            </a>
          )}
          {telegramShare && (
            <a href={telegramShare} target="_blank" rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-white/8 bg-white/[0.03] py-2 text-[11px] text-white/60 active:bg-white/[0.06]">
              ✈️ Telegram
            </a>
          )}
        </div>
        <p className="mt-1.5 text-[9px] text-white/25">Code: <span className="font-mono text-white/40">{referralCode}</span></p>
      </div>

      {/* ── Tabs: Overview / Friends / History ── */}
      <div className="flex rounded-xl border border-white/8 bg-white/[0.02] p-0.5">
        {(["overview", "friends", "history"] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-lg py-2 text-[11px] font-semibold transition ${
              activeTab === tab ? "bg-white/10 text-white" : "text-white/30"
            }`}
          >
            {tab === "overview" ? "📊 Overview" : tab === "friends" ? `👥 Friends (${totalFriends})` : `💰 History (${history.length})`}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      {activeTab === "overview" && (
        <div className="space-y-3">
          {/* Tier progress */}
          <TierCard tierInfo={tierInfo} qualifiedFriends={qualifiedFriends} totalFriends={totalFriends} currentRate={currentRate} />

          {/* QR + Promo (collapsible) */}
          <ExpandableSection icon="🖼" title="QR Code & Promo Caption">
            <div className="flex gap-3 items-start">
              {summaryLink && (
                <div className="shrink-0">
                  <div ref={qrRef} className="rounded-lg bg-white p-2">
                    <QRCode value={summaryLink} size={80} />
                  </div>
                </div>
              )}
              <div className="flex-1 min-w-0 text-[10px] text-white/50 leading-relaxed whitespace-pre-line line-clamp-6">
                {PROMO_CAPTION}
              </div>
            </div>
            <CopyPromoButton summaryLink={summaryLink} />
          </ExpandableSection>

          {/* How it works */}
          <ExpandableSection icon="❓" title="How It Works">
            <div className="space-y-2">
              {[
                { icon: "📤", title: "Share", desc: "Send your invite link to friends" },
                { icon: "🛒", title: "They Shop", desc: "Friends sign up and place orders" },
                { icon: "💰", title: "You Earn", desc: `Earn ${currentRate}% of every order` },
              ].map(s => (
                <div key={s.title} className="flex items-center gap-2.5">
                  <span className="text-lg">{s.icon}</span>
                  <div>
                    <p className="text-[12px] font-semibold text-white">{s.title}</p>
                    <p className="text-[10px] text-white/40">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </ExpandableSection>

          {/* Commission rules */}
          <ExpandableSection icon="💎" title="Commission Rules">
            <div className="space-y-1.5 text-[11px] text-white/60 leading-relaxed">
              <p>1. Friends sign up via your link → you earn <span className="text-emerald-300 font-semibold">15–25%</span> commission on their orders.</p>
              <p>2. Commission is credited to your wallet <span className="text-white/80 font-semibold">instantly</span>.</p>
              <p>3. You earn on <span className="text-white/80 font-semibold">every order</span> they place — lifetime tracking.</p>
              <p>4. 🥉 15% → 🥈 20% (100+ friends) → 🥇 25% (200+ friends).</p>
              <p>5. Earnings never expire. Withdraw anytime.</p>
            </div>
          </ExpandableSection>
        </div>
      )}

      {activeTab === "friends" && (
        <div className="space-y-1">
          {conversions.length === 0 ? (
            <p className="text-center text-xs text-white/30 py-6">No friends yet. Share your link!</p>
          ) : conversions.map((c) => (
            <FriendRow key={String(c.id)} c={c} />
          ))}
        </div>
      )}

      {activeTab === "history" && (
        <div className="space-y-1">
          {history.length === 0 ? (
            <p className="text-center text-xs text-white/30 py-6">No commissions yet.</p>
          ) : history.map((row) => (
            <HistoryRow key={row.id} row={row} />
          ))}
        </div>
      )}

      {/* Anti-fraud */}
      <p className="text-[9px] text-white/20 leading-relaxed px-1">
        ⚠️ Fair use: Fraudulent behaviour (fake accounts, manipulation) → account suspension + forfeiture of earnings.
      </p>
    </section>
  );
}

/* ─── Mini stat ─── */
function MiniStat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex-1 text-center">
      <p className="text-[15px] font-bold text-white">{value}</p>
      <p className="text-[8px] text-white/30">{icon} {label}</p>
    </div>
  );
}

/* ─── Tier card ─── */
function TierCard({ tierInfo, qualifiedFriends, totalFriends, currentRate }: {
  tierInfo: ReturnType<typeof getTier>; qualifiedFriends: number; totalFriends: number; currentRate: number;
}) {
  const { tier, nextTier, progress } = tierInfo;
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span>{tier.emoji}</span>
          <span className={`text-xs font-bold ${tier.color}`}>{tier.name}</span>
          <span className="text-[10px] text-emerald-300 font-bold">{currentRate}%</span>
        </div>
        {nextTier && (
          <p className="text-[10px] text-white/30">{nextTier.min - qualifiedFriends} more → {nextTier.emoji} {nextTier.name} ({nextTier.rate}%)</p>
        )}
      </div>
      {/* Single progress bar */}
      <div className="mt-2 h-1.5 w-full rounded-full bg-white/8 overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
          style={{ width: `${progress * 100}%` }} />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[8px] text-white/25">{qualifiedFriends} qualified / {totalFriends} total</span>
        {nextTier && <span className="text-[8px] text-white/25">{nextTier.min} needed</span>}
      </div>
      {/* Tier roadmap - inline */}
      <div className="flex gap-1 mt-2 pt-2 border-t border-white/5">
        {TIERS.map(t => {
          const reached = qualifiedFriends >= t.min;
          return (
            <div key={t.name} className={`flex-1 rounded-lg px-2 py-1 text-center ${t.name === tier.name ? "bg-white/5 ring-1 ring-white/10" : ""}`}>
              <span className="text-xs">{t.emoji}</span>
              <p className={`text-[9px] font-bold ${reached ? t.color : "text-white/20"}`}>{t.rate}%</p>
              <p className="text-[7px] text-white/20">{t.min === 0 ? "Start" : `${t.min}+`}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Expandable section ─── */
function ExpandableSection({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02]">
      <button onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-3 py-2.5 text-left">
        <span className="text-[12px] font-semibold text-white/60">{icon} {title}</span>
        <span className={`text-[10px] text-white/30 transition-transform ${open ? "rotate-180" : ""}`}>▼</span>
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}

/* ─── Copy promo ─── */
function CopyPromoButton({ summaryLink }: { summaryLink: string }) {
  const [copied, setCopied] = useState(false);
  const fullCaption = `${PROMO_CAPTION}\n\n👉 ${summaryLink}`;
  return (
    <button
      onClick={async () => {
        try { await navigator.clipboard.writeText(fullCaption); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
      }}
      className="mt-2 w-full rounded-lg border border-white/8 bg-white/[0.03] py-2 text-[10px] text-white/50 active:bg-white/[0.06]"
    >
      {copied ? "✓ Copied!" : "📋 Copy caption + link"}
    </button>
  );
}

/* ─── Friend row ─── */
function FriendRow({ c }: { c: any }) {
  const isQualified = c.status === "topped_up" || c.status === "purchased" || (c.totalCommissionEarned ?? 0) > 0;
  const earned = c.totalCommissionEarned ?? c.orderValue ?? c.commission ?? 0;
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2">
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-mono text-[12px] font-semibold text-white truncate">{c.handle || "—"}</span>
        {isQualified
          ? <span className="shrink-0 rounded-full bg-emerald-400/10 px-1.5 py-0.5 text-[8px] text-emerald-300">✅</span>
          : <span className="shrink-0 rounded-full bg-yellow-400/10 px-1.5 py-0.5 text-[8px] text-yellow-300">pending</span>
        }
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {earned > 0 && <span className="text-[11px] font-semibold text-emerald-300">{GBP.format(earned)}</span>}
        <span className="text-[9px] text-white/20">
          {c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : ""}
        </span>
        {c.handle && (
          <Link href={`/wallet/transfer?to=${encodeURIComponent(c.handle)}`}
            className="rounded-full border border-white/10 px-1.5 py-0.5 text-[8px] text-white/40 active:bg-white/5">⇒</Link>
        )}
      </div>
    </div>
  );
}

/* ─── History row ─── */
function HistoryRow({ row }: { row: CommissionTransaction }) {
  const label = row.sourceInvitee ? `${row.sourceInvitee}'s order` : row.description || "Commission";
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-medium text-white truncate">{label}</p>
        <p className="text-[9px] text-white/20">
          {row.createdAt ? new Date(row.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
        </p>
      </div>
      <span className="shrink-0 text-[13px] font-bold text-emerald-300">+{GBP.format(row.amount ?? 0)}</span>
    </div>
  );
}

/* ─── How it works ─── */
function HowItWorks() {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-3">
      <p className="text-xs font-bold text-white mb-2">How it works</p>
      <div className="space-y-2">
        {[
          { icon: "📤", title: "Share", desc: "Send your invite link to friends" },
          { icon: "🛒", title: "They Shop", desc: "Friends sign up and place orders" },
          { icon: "💰", title: "You Earn", desc: "Earn 15-25% of every order" },
        ].map(s => (
          <div key={s.title} className="flex items-center gap-2.5">
            <span className="text-lg">{s.icon}</span>
            <div>
              <p className="text-[12px] font-semibold text-white">{s.title}</p>
              <p className="text-[10px] text-white/40">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
