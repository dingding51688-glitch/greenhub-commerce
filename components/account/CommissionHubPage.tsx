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

/* Short promo templates */
const PROMO_TEMPLATES = [
  "🔥 Premium buds delivered to your locker. No hassle. Use my link for exclusive access 👉",
  "📦 UK's best kept secret. Vacuum-sealed, discreet InPost delivery 👉",
  "💨 Top shelf flower, edibles & more. Delivered to your door (well, locker) 👉",
];

/* ─── Tab type ─── */
type Tab = "overview" | "friends" | "history";

/* ─── Earnings Calculator (shared between logged-in and guest) ─── */
function EarningsCalculator({ rate }: { rate: number }) {
  const [friends, setFriends] = useState(5);
  const avgOrder = 50;
  const monthly = friends * avgOrder * (rate / 100);
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
      <p className="text-sm font-bold text-white mb-3">💷 Earnings Calculator</p>
      <label className="block text-xs text-white/50 mb-2">
        How many friends will you invite?
      </label>
      <input
        type="range"
        min={1}
        max={50}
        value={friends}
        onChange={(e) => setFriends(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none bg-white/10 accent-emerald-500 cursor-pointer"
      />
      <div className="flex justify-between text-[10px] text-white/30 mt-1 mb-3">
        <span>1</span>
        <span className="text-emerald-400 font-bold text-sm">{friends}</span>
        <span>50</span>
      </div>
      <div className="rounded-xl bg-emerald-500/10 border border-emerald-400/20 p-3 text-center">
        <p className="text-xs text-white/60">
          {friends} friends × £{avgOrder}/order × {rate}% =
        </p>
        <p className="text-2xl font-bold text-emerald-400 mt-1">
          {GBP.format(monthly)}/month
        </p>
      </div>
    </div>
  );
}

/* ─── Guest landing page (not logged in) ─── */
function GuestLanding({ onSignUp }: { onSignUp: () => void }) {
  return (
    <section className="pb-24 px-3 py-4 space-y-4">
      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-600/30 via-emerald-500/10 to-transparent border border-emerald-400/20 p-6 text-center">
        <p className="text-4xl mb-2">💰</p>
        <h1 className="text-2xl font-extrabold text-white leading-tight">
          Earn 15–25%<br />
          <span className="text-emerald-400">on every order</span>
        </h1>
        <p className="text-sm text-white/50 mt-3 leading-relaxed">
          Share your link. Friends shop. You earn commission — on every order, forever.
        </p>
      </div>

      {/* How it works */}
      <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
        <p className="text-sm font-bold text-white mb-3">How it works</p>
        <div className="space-y-3">
          {[
            { icon: "📤", title: "Share your link", desc: "Send it to friends via WhatsApp, Telegram, anywhere" },
            { icon: "🛒", title: "They shop", desc: "Friends sign up and place orders through your link" },
            { icon: "💰", title: "You earn", desc: "Get 15-25% commission on every single order" },
          ].map((s) => (
            <div key={s.title} className="flex items-start gap-3">
              <span className="text-xl shrink-0 mt-0.5">{s.icon}</span>
              <div>
                <p className="text-[13px] font-semibold text-white">{s.title}</p>
                <p className="text-[11px] text-white/40">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tier preview */}
      <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
        <p className="text-sm font-bold text-white mb-3">📈 Commission Tiers</p>
        <div className="grid grid-cols-3 gap-2">
          {TIERS.map((t) => (
            <div key={t.name} className="rounded-xl bg-white/[0.03] border border-white/5 p-3 text-center">
              <span className="text-xl">{t.emoji}</span>
              <p className={`text-lg font-bold ${t.color} mt-1`}>{t.rate}%</p>
              <p className="text-[10px] text-white/30 mt-0.5">{t.name}</p>
              <p className="text-[9px] text-white/20">{t.min === 0 ? "Start" : `${t.min}+ friends`}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Calculator */}
      <EarningsCalculator rate={15} />

      {/* CTA */}
      <button
        onClick={onSignUp}
        className="w-full rounded-2xl bg-emerald-500 py-4 text-base font-bold text-white active:bg-emerald-600 transition min-h-[52px]"
      >
        Sign Up to Start Earning 🚀
      </button>

      {/* Anti-fraud */}
      <p className="text-[9px] text-white/20 leading-relaxed px-1">
        ⚠️ Fair use: Fraudulent behaviour (fake accounts, manipulation) → account suspension + forfeiture of earnings.
      </p>
    </section>
  );
}

export default function CommissionHubPage() {
  const { token } = useAuth();
  const router = useRouter();
  const { notifications } = useNotifications();
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [promoCopied, setPromoCopied] = useState<number | null>(null);
  const [showTools, setShowTools] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const qrRef = useRef<HTMLDivElement>(null);

  const { data, error, isLoading, mutate } = useSWR<CommissionHubSnapshot>(
    token ? "commission-hub" : null,
    getCommissionHubSnapshot
  );

  useEffect(() => { consumeClickError(); }, []);

  /* Guest / not logged in */
  if (!token) {
    return <GuestLanding onSignUp={() => router.push("/login")} />;
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

  /* New user with no referrals — show intro + share */
  const isNewUser = !isLoading && (!hasSnapshot || notFound);

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

  const handlePromoCopy = async (index: number) => {
    const text = PROMO_TEMPLATES[index] + "\n" + summaryLink;
    try {
      await navigator.clipboard.writeText(text);
      setPromoCopied(index);
      setTimeout(() => setPromoCopied(null), 2000);
    } catch {}
  };

  return (
    <section className="pb-24 px-3 py-4 space-y-3">

      {/* ── New user intro ── */}
      {isNewUser ? (
        <div className="space-y-3">
          <div className="rounded-2xl bg-gradient-to-br from-emerald-600/30 via-emerald-500/10 to-transparent border border-emerald-400/20 p-6 text-center">
            <p className="text-4xl mb-2">💰</p>
            <h1 className="text-2xl font-extrabold text-white leading-tight">
              Earn 15–25%<br />
              <span className="text-emerald-400">on every order</span>
            </h1>
            <p className="text-sm text-white/50 mt-3">
              Share your link, friends shop, you earn. It&apos;s that simple.
            </p>
          </div>
          <EarningsCalculator rate={currentRate} />
          <HowItWorks rate={currentRate} />
        </div>
      ) : (
        <>
          {/* ── Hero: big earnings display ── */}
          <div className="rounded-2xl bg-gradient-to-br from-emerald-600/20 via-emerald-500/5 to-transparent border border-emerald-400/15 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/40">Total Earned</p>
                <p className="text-3xl font-extrabold text-white mt-0.5">{GBP.format(lifetimeCommission)}</p>
                {monthlyCommission > 0 && (
                  <p className="text-sm text-emerald-400 font-semibold mt-1">+{GBP.format(monthlyCommission)} this month</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1.5 bg-white/5 rounded-full px-3 py-1.5">
                  <span className="text-base">{tierInfo.tier.emoji}</span>
                  <span className={`text-sm font-bold ${tierInfo.tier.color}`}>{tierInfo.tier.name}</span>
                </div>
                <span className="text-emerald-400 text-lg font-bold">{currentRate}%</span>
              </div>
            </div>

            {/* Mini stats */}
            <div className="flex gap-3 mt-3 pt-3 border-t border-white/5">
              <MiniStat icon="👁" label="Views" value={String(clicks)} />
              <MiniStat icon="👥" label="Friends" value={String(totalFriends)} />
              <MiniStat icon="🛒" label="Orders" value={String(orderCount)} />
              <MiniStat icon="✅" label="Qualified" value={String(qualifiedFriends)} />
            </div>
          </div>
        </>
      )}

      {/* ── Share & Earn CTA — always visible, big and bold ── */}
      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
        <p className="text-sm font-bold text-white mb-3">📤 Share & Earn</p>

        {/* Link display + copy */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 min-w-0 truncate rounded-xl bg-black/30 border border-white/10 px-3 py-2.5 font-mono text-[12px] text-white/70" style={{ fontSize: "16px" }}>
            {summaryLink || "Link pending…"}
          </div>
          <button
            onClick={handleCopy}
            disabled={!summaryLink}
            className="shrink-0 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white active:bg-emerald-600 transition min-h-[44px]"
          >
            {copyToast || "📋 Copy"}
          </button>
        </div>

        {/* Big share buttons */}
        <div className="grid grid-cols-2 gap-2">
          {whatsappShare && (
            <a
              href={whatsappShare}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366]/20 border border-[#25D366]/30 py-3 text-sm font-bold text-[#25D366] active:bg-[#25D366]/30 transition min-h-[48px]"
            >
              📱 WhatsApp
            </a>
          )}
          {telegramShare && (
            <a
              href={telegramShare}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl bg-[#0088cc]/20 border border-[#0088cc]/30 py-3 text-sm font-bold text-[#0088cc] active:bg-[#0088cc]/30 transition min-h-[48px]"
            >
              ✈️ Telegram
            </a>
          )}
        </div>
      </div>

      {/* ── QR & Promo — collapsible for mobile ── */}
      <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
        <button onClick={() => setShowTools(!showTools)}
          className="flex w-full items-center justify-between px-4 py-3 active:bg-white/[0.03]">
          <span className="text-sm font-semibold text-white/70">🔧 Sharing Tools</span>
          <span className={`text-xs text-white/30 transition-transform ${showTools ? "rotate-180" : ""}`}>▾</span>
        </button>
        {showTools && (
          <div className="px-4 pb-4 space-y-4">
            {/* QR Code */}
            {summaryLink && (
              <div>
                <p className="text-xs font-bold text-white/50 mb-2">QR Code</p>
                <div className="flex items-center gap-4">
                  <div ref={qrRef} className="shrink-0 rounded-lg bg-white p-2">
                    <QRCode value={summaryLink} size={80} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => {
                        const canvas = qrRef.current?.querySelector("canvas") as HTMLCanvasElement | null;
                        if (!canvas) return;
                        const a = document.createElement("a");
                        a.href = canvas.toDataURL("image/png");
                        a.download = "greenhub-invite-qr.png";
                        a.click();
                      }}
                      className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-[11px] font-medium text-white/60 active:bg-white/[0.1] min-h-[36px]"
                    >⬇ Save</button>
                    <button
                      onClick={async () => {
                        const canvas = qrRef.current?.querySelector("canvas") as HTMLCanvasElement | null;
                        if (!canvas) return;
                        try {
                          const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, "image/png"));
                          if (blob && navigator.share) {
                            const file = new File([blob], "greenhub-invite-qr.png", { type: "image/png" });
                            await navigator.share({ files: [file], title: "GreenHub Invite" });
                          } else if (blob) {
                            await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
                          }
                        } catch {}
                      }}
                      className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-[11px] font-medium text-white/60 active:bg-white/[0.1] min-h-[36px]"
                    >📤 Share</button>
                  </div>
                </div>
              </div>
            )}

            {/* Promo templates */}
            <div>
              <p className="text-xs font-bold text-white/50 mb-2">Quick Messages</p>
              <p className="text-[10px] text-white/30 mb-2">Tap to copy with your link</p>
              <div className="space-y-1.5">
                {PROMO_TEMPLATES.map((tmpl, i) => (
                  <button key={i} onClick={() => handlePromoCopy(i)}
                    className="w-full text-left rounded-xl border border-white/6 bg-white/[0.02] px-3 py-2.5 active:bg-white/[0.06] transition">
                    <p className="text-[11px] text-white/60 leading-relaxed">{tmpl}</p>
                    <p className="text-[9px] text-emerald-400 mt-1 font-semibold">
                      {promoCopied === i ? "✓ Copied!" : "📋 Tap to copy"}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Tabs: Overview / Friends / History ── */}
      {!isNewUser && (
        <>
          <div className="flex rounded-xl border border-white/8 bg-white/[0.02] p-0.5">
            {(["overview", "friends", "history"] as Tab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 rounded-lg py-2.5 text-[12px] font-semibold transition min-h-[44px] ${
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

              {/* Earnings Calculator */}
              <EarningsCalculator rate={currentRate} />

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
                        <p className="text-[13px] font-semibold text-white">{s.title}</p>
                        <p className="text-[11px] text-white/40">{s.desc}</p>
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

              {/* Leaderboard entry */}
              <Link
                href="/referral/leaderboard"
                className="flex items-center justify-between rounded-2xl border border-yellow-400/20 bg-yellow-500/10 p-4 active:bg-yellow-500/15 transition"
              >
                <div>
                  <p className="text-sm font-bold text-white">🏆 Leaderboard</p>
                  <p className="text-[11px] text-white/40 mt-0.5">See top earners & your ranking</p>
                </div>
                <span className="text-white/30 text-xl">›</span>
              </Link>
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
        </>
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
      <p className="text-[16px] font-bold text-white">{value}</p>
      <p className="text-[9px] text-white/30">{icon} {label}</p>
    </div>
  );
}

/* ─── Tier card ─── */
function TierCard({ tierInfo, qualifiedFriends, totalFriends, currentRate }: {
  tierInfo: ReturnType<typeof getTier>; qualifiedFriends: number; totalFriends: number; currentRate: number;
}) {
  const { tier, nextTier, progress } = tierInfo;
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-lg">{tier.emoji}</span>
          <span className={`text-sm font-bold ${tier.color}`}>{tier.name}</span>
          <span className="text-sm text-emerald-300 font-bold">{currentRate}%</span>
        </div>
        {nextTier && (
          <p className="text-[11px] text-white/30">{nextTier.min - qualifiedFriends} more → {nextTier.emoji} {nextTier.name} ({nextTier.rate}%)</p>
        )}
      </div>
      {/* Progress bar */}
      <div className="mt-3 h-2 w-full rounded-full bg-white/8 overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
          style={{ width: `${progress * 100}%` }} />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-[10px] text-white/25">{qualifiedFriends} qualified / {totalFriends} total</span>
        {nextTier && <span className="text-[10px] text-white/25">{nextTier.min} needed</span>}
      </div>
      {/* Tier roadmap */}
      <div className="flex gap-1.5 mt-3 pt-3 border-t border-white/5">
        {TIERS.map(t => {
          const reached = qualifiedFriends >= t.min;
          return (
            <div key={t.name} className={`flex-1 rounded-xl px-2 py-2 text-center ${t.name === tier.name ? "bg-white/5 ring-1 ring-white/10" : ""}`}>
              <span className="text-base">{t.emoji}</span>
              <p className={`text-sm font-bold ${reached ? t.color : "text-white/20"}`}>{t.rate}%</p>
              <p className="text-[9px] text-white/20">{t.min === 0 ? "Start" : `${t.min}+`}</p>
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
        className="flex w-full items-center justify-between px-4 py-3 text-left min-h-[44px]">
        <span className="text-[13px] font-semibold text-white/60">{icon} {title}</span>
        <span className={`text-[11px] text-white/30 transition-transform ${open ? "rotate-180" : ""}`}>▼</span>
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

/* ─── How it works (for new/guest users) ─── */
function HowItWorks({ rate }: { rate: number }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
      <p className="text-sm font-bold text-white mb-3">How it works</p>
      <div className="space-y-3">
        {[
          { icon: "📤", title: "Share", desc: "Send your invite link to friends" },
          { icon: "🛒", title: "They Shop", desc: "Friends sign up and place orders" },
          { icon: "💰", title: "You Earn", desc: `Earn ${rate}% of every order` },
        ].map(s => (
          <div key={s.title} className="flex items-start gap-3">
            <span className="text-xl shrink-0 mt-0.5">{s.icon}</span>
            <div>
              <p className="text-[13px] font-semibold text-white">{s.title}</p>
              <p className="text-[11px] text-white/40">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Friend row ─── */
function FriendRow({ c }: { c: any }) {
  const isQualified = c.status === "topped_up" || c.status === "purchased" || (c.totalCommissionEarned ?? 0) > 0;
  const earned = c.totalCommissionEarned ?? c.orderValue ?? c.commission ?? 0;
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5">
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-mono text-[13px] font-semibold text-white truncate">{c.handle || "—"}</span>
        {isQualified
          ? <span className="shrink-0 rounded-full bg-emerald-400/10 px-2 py-0.5 text-[9px] text-emerald-300">✅</span>
          : <span className="shrink-0 rounded-full bg-yellow-400/10 px-2 py-0.5 text-[9px] text-yellow-300">pending</span>
        }
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {earned > 0 && <span className="text-[12px] font-semibold text-emerald-300">{GBP.format(earned)}</span>}
        <span className="text-[10px] text-white/20">
          {c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : ""}
        </span>
        {c.handle && (
          <Link href={`/wallet/transfer?to=${encodeURIComponent(c.handle)}`}
            className="rounded-full border border-white/10 px-2 py-1 text-[9px] text-white/40 active:bg-white/5">⇒</Link>
        )}
      </div>
    </div>
  );
}

/* ─── History row ─── */
function HistoryRow({ row }: { row: CommissionTransaction }) {
  const label = row.sourceInvitee ? `${row.sourceInvitee}'s order` : row.description || "Commission";
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-white truncate">{label}</p>
        <p className="text-[10px] text-white/20">
          {row.createdAt ? new Date(row.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
        </p>
      </div>
      <span className="shrink-0 text-[14px] font-bold text-emerald-300">+{GBP.format(row.amount ?? 0)}</span>
    </div>
  );
}