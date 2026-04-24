"use client";

import { type ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/components/providers/AuthProvider";
import useSWR from "swr";
import { swrFetcher, apiMutate } from "@/lib/api";
import type { WalletBalanceResponse } from "@/lib/types";

const phoneRegex = /^\+?[0-9]{7,15}$/;
const postcodeRegex = /^[A-Za-z0-9\s]{4,9}$/;
const inputCls =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-base text-white outline-none placeholder:text-white/25 focus:border-emerald-400/40 transition";

const profileSchema = z.object({
  fullName: z.string().nonempty(),
  email: z.string().email(),
  phone: z.string().optional().or(z.literal("")).refine((v) => !v || phoneRegex.test(v), { message: "Invalid phone" }),
  postcode: z.string().optional().or(z.literal("")).refine((v) => !v || postcodeRegex.test(v), { message: "Invalid postcode" }),
});
type ProfileForm = z.infer<typeof profileSchema>;

type CustomerProfileResponse = {
  data?: {
    id: number;
    attributes: {
      fullName?: string;
      email?: string;
      phone?: string | null;
      postcode?: string | null;
      transferHandle?: string;
      emailVerifiedAt?: string | null;
      pendingEmail?: string | null;
    };
  };
};

const noRetryOnAuth = {
  shouldRetryOnError: (error: Error & { status?: number }) => error?.status !== 401 && error?.status !== 403,
};

export default function AccountPage() {
  const { isReady, token, userEmail, profile, refreshProfile, logout } = useAuth();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!isReady || token || redirecting) return;
    const t = setTimeout(() => { setRedirecting(true); router.push("/login"); }, 2500);
    return () => clearTimeout(t);
  }, [isReady, token, redirecting, router]);

  const { data: customer, error: customerError, isLoading: customerLoading, mutate: refreshCustomer } =
    useSWR<CustomerProfileResponse>(token ? "/api/account/profile" : null, swrFetcher, noRetryOnAuth);

  const { data: walletData } =
    useSWR<WalletBalanceResponse>(token ? "/api/wallet/balance" : null, swrFetcher, noRetryOnAuth);

  const profileStatus = (customerError as Error & { status?: number })?.status;
  const profileMessage = customerError?.message || "";
  const isCustomerMissing = profileStatus === 401 && profileMessage.includes("could not determine customer");
  const isTokenInvalid = profileStatus === 401 && !isCustomerMissing;

  useEffect(() => { if (isTokenInvalid) logout(); }, [isTokenInvalid, logout]);

  if (!isReady) {
    return (
      <div className="space-y-3 pb-24">
        <div className="h-32 animate-pulse rounded-2xl bg-white/5" />
        <div className="h-20 animate-pulse rounded-2xl bg-white/5" />
        <div className="h-40 animate-pulse rounded-2xl bg-white/5" />
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="space-y-4 text-center">
          <p className="text-4xl">🔐</p>
          <p className="text-lg font-bold text-white">Sign in to continue</p>
          <p className="text-xs text-white/40">Redirecting to login…</p>
          <div className="flex justify-center gap-2">
            <Link href="/login" className="inline-flex min-h-[40px] items-center rounded-xl cta-gradient px-5 text-sm font-bold text-white">Log in</Link>
            <Link href="/register" className="inline-flex min-h-[40px] items-center rounded-xl border border-white/15 px-5 text-sm font-medium text-white">Register</Link>
          </div>
        </div>
      </div>
    );
  }

  if (isCustomerMissing) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="space-y-4 text-center">
          <p className="text-4xl">⏳</p>
          <p className="text-lg font-bold text-white">Account pending setup</p>
          <p className="text-xs text-white/40">Your profile is being created. This usually takes a few minutes.</p>
          <div className="flex justify-center gap-2">
            <button onClick={() => refreshCustomer()} className="inline-flex min-h-[40px] items-center rounded-xl cta-gradient px-5 text-sm font-bold text-white">Try again</button>
            <Link href="/support" className="inline-flex min-h-[40px] items-center rounded-xl border border-white/15 px-5 text-sm font-medium text-white">Contact support</Link>
          </div>
        </div>
      </div>
    );
  }

  const attrs = customer?.data?.attributes;
  const userId = customer?.data?.id;
  const transferHandle = attrs?.transferHandle;
  const displayId = transferHandle || (userId ? `GH-${String(userId).padStart(6, "0")}` : "");
  const displayName = attrs?.fullName || profile?.fullName || userEmail || "User";
  const balance = walletData?.balance ?? 0;

  return (
    <div className="space-y-4 pb-24 sm:space-y-6 sm:pb-20">
      {/* ── Header card — holographic ID ── */}
      <div className="relative isolate overflow-hidden rounded-2xl border border-emerald-400/15 p-4">
        {/* Sci-fi bg layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1a12] via-[#0d0d0d] to-[#0a0d1a]" aria-hidden="true" />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "30px 30px" }} aria-hidden="true" />
        <div className="absolute -top-8 -right-8 h-28 w-28 rounded-full bg-emerald-400/8 blur-3xl animate-pulse" aria-hidden="true" />
        <div className="absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-cyan-400/6 blur-2xl" aria-hidden="true" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            {/* Avatar with glow ring */}
            <div className="relative">
              <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400/20 to-cyan-400/10 text-xl font-bold text-emerald-300 ring-2 ring-emerald-400/30 ring-offset-2 ring-offset-[#0d0d0d]">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-emerald-400 border-2 border-[#0d0d0d]" />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-bold text-white">{displayName}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <CopyBadge text={displayId} />
                {attrs?.emailVerifiedAt ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-0.5 text-[8px] font-bold text-emerald-400">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" /> Verified
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-[8px] font-bold text-amber-400">Unverified</span>
                )}
              </div>
            </div>
          </div>

          {/* Balance display */}
          <div className="mt-3 rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-2.5 flex items-center justify-between">
            <div>
              <p className="text-[9px] uppercase tracking-widest text-white/25">Available Balance</p>
              <p className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">£{balance.toFixed(2)}</p>
            </div>
            <Link href="/wallet" className="rounded-full bg-emerald-400/10 px-3 py-1.5 text-[10px] font-semibold text-emerald-400 transition hover:bg-emerald-400/20">
              Top Up →
            </Link>
          </div>
        </div>
      </div>

      {/* ── Quick actions 2x2 — glowing tiles ── */}
      <div className="grid grid-cols-2 gap-2.5">
        {[
          { icon: "💰", label: "Wallet", desc: "Balance & history", href: "/wallet", glow: "bg-amber-400/8", border: "border-amber-400/10 hover:border-amber-400/25" },
          { icon: "📦", label: "Orders", desc: "Track deliveries", href: "/orders", glow: "bg-blue-400/8", border: "border-blue-400/10 hover:border-blue-400/25" },
          { icon: "🤝", label: "Earn Hub", desc: "Invite & earn", href: "/account/commission", glow: "bg-purple-400/8", border: "border-purple-400/10 hover:border-purple-400/25" },
          { icon: "🔔", label: "Notifications", desc: "Alerts & updates", href: "/account/notifications", glow: "bg-cyan-400/8", border: "border-cyan-400/10 hover:border-cyan-400/25" },
        ].map((item) => (
          <Link key={item.href} href={item.href}
            className={`relative isolate overflow-hidden rounded-xl border ${item.border} bg-white/[0.02] p-3.5 transition active:scale-[0.97]`}>
            <div className={`absolute -top-4 -right-4 h-16 w-16 ${item.glow} rounded-full blur-2xl`} aria-hidden="true" />
            <div className="relative z-10">
              <span className="text-xl">{item.icon}</span>
              <p className="mt-1.5 text-xs font-bold text-white">{item.label}</p>
              <p className="mt-0.5 text-[9px] text-white/30">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Email verification CTA ── */}
      {!attrs?.emailVerifiedAt && (
        <VerifyEmailBanner
          pendingEmail={attrs?.pendingEmail}
          onSuccess={() => refreshCustomer()}
        />
      )}

      {/* ── Profile form ── */}
      <ProfileSection
        customer={customer}
        customerLoading={customerLoading}
        customerError={customerError}
        refreshCustomer={refreshCustomer}
        refreshProfile={refreshProfile}
        profile={profile}
        userEmail={userEmail || undefined}
      />

      {/* ── Telegram Bind CTA ── */}
      <a href="https://t.me/gh420lottery_bot?start=bind" target="_blank" rel="noopener noreferrer"
        className="relative isolate flex items-center gap-3 overflow-hidden rounded-xl border border-blue-400/20 bg-blue-500/5 px-4 py-3.5 active:scale-[0.98] transition">
        <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-blue-400/8 blur-2xl" aria-hidden="true" />
        <div className="relative z-10 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-400/15 text-lg">✈️</div>
        <div className="relative z-10 flex-1 min-w-0">
          <p className="text-sm font-medium text-white">Bind Telegram</p>
          <p className="text-[10px] text-blue-300/50">Link account → get £5 bonus + daily £100 lottery</p>
        </div>
        <span className="relative z-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-400 px-3 py-1 text-[10px] font-bold text-white">Bind</span>
      </a>

      {/* ── Account actions — terminal style ── */}
      <div className="rounded-xl border border-white/8 bg-white/[0.01] overflow-hidden divide-y divide-white/5">
        {[
          { icon: "🔒", label: "Security", desc: "Change email or password", href: "/account/security", color: "text-amber-400" },
          { icon: "💬", label: "Support", desc: "24/7 AI chat support", href: "/support", color: "text-cyan-400" },
          { icon: "📖", label: "How It Works", desc: "Ordering, delivery & payment", href: "/how-it-works", color: "text-emerald-400" },
        ].map((item) => (
          <Link key={item.href} href={item.href}
            className="flex items-center justify-between px-4 py-3.5 transition hover:bg-white/[0.03] active:bg-white/[0.05]">
            <div className="flex items-center gap-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] text-sm ${item.color}`}>
                {item.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{item.label}</p>
                <p className="text-[10px] text-white/25">{item.desc}</p>
              </div>
            </div>
            <span className="text-white/15 text-sm">→</span>
          </Link>
        ))}
      </div>

      {/* ── Sign out — danger zone ── */}
      <button
        onClick={() => { logout(); router.push("/login"); }}
        className="relative isolate overflow-hidden flex w-full items-center justify-center gap-2 rounded-xl border border-red-400/15 py-3.5 text-sm font-semibold text-red-400 transition hover:bg-red-400/10 active:scale-[0.98]"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-transparent to-red-500/5" aria-hidden="true" />
        <span className="relative z-10 flex items-center gap-2">⏻ Sign Out</span>
      </button>
    </div>
  );
}

/* ━━━━━━━━━ Verify Email Banner ━━━━━━━━━ */
function VerifyEmailBanner({ pendingEmail, onSuccess }: { pendingEmail?: string | null; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");

  const handleVerify = async () => {
    setLoading(true);
    setStatus("idle");
    try {
      const res = await fetch("/api/account/security/request-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setStatus("sent");
        onSuccess();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-3">
      <div className="flex items-start gap-3">
        <span className="text-lg">✉️</span>
        <div className="flex-1">
          <p className="text-xs font-semibold text-amber-200">Verify your email for £5 credit</p>
          {status === "sent" ? (
            <p className="mt-1 text-[10px] text-emerald-300">✓ Verification email sent! Check your inbox.</p>
          ) : status === "error" ? (
            <p className="mt-1 text-[10px] text-red-300">Failed to send. Try again.</p>
          ) : pendingEmail ? (
            <p className="mt-1 text-[10px] text-white/30">Verification sent to {pendingEmail}</p>
          ) : (
            <p className="mt-1 text-[10px] text-white/30">Verify and get £5 in your wallet instantly</p>
          )}
        </div>
        <button
          onClick={handleVerify}
          disabled={loading}
          className="shrink-0 rounded-lg bg-amber-400/15 px-3 py-1.5 text-[10px] font-bold text-amber-200 transition hover:bg-amber-400/25 disabled:opacity-40"
        >
          {loading ? "…" : status === "sent" ? "Resend" : "Verify"}
        </button>
      </div>
    </div>
  );
}

/* ━━━━━━━━━ Profile Section ━━━━━━━━━ */
function ProfileSection({
  customer, customerLoading, customerError, refreshCustomer, refreshProfile, profile, userEmail,
}: {
  customer?: CustomerProfileResponse;
  customerLoading: boolean;
  customerError: Error | undefined;
  refreshCustomer: () => void;
  refreshProfile: () => Promise<void>;
  profile: any;
  userEmail: string | undefined;
}) {
  const attrs = customer?.data?.attributes;
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: "", email: "", phone: "", postcode: "" },
  });

  useEffect(() => {
    if (!attrs) return;
    form.reset({
      fullName: attrs.fullName || profile?.fullName || "",
      email: attrs.email || profile?.email || userEmail || "",
      phone: attrs.phone || "",
      postcode: attrs.postcode || "",
    });
  }, [customer, form, profile, userEmail, attrs]);

  const onSubmit = async (values: ProfileForm) => {
    setAlert(null);
    setSaving(true);
    try {
      await apiMutate<{ data?: unknown }>("/api/account/profile", "PUT", {
        phone: values.phone?.trim() || null,
        postcode: values.postcode?.trim().toUpperCase() || null,
      });
      setAlert({ type: "success", message: "Profile updated" });
      await Promise.all([refreshCustomer(), refreshProfile()]);
    } catch (err: any) {
      setAlert({ type: "error", message: err?.message || "Update failed" });
    } finally { setSaving(false); }
  };

  if (customerLoading && !customer) {
    return <div className="h-32 animate-pulse rounded-2xl bg-white/5" />;
  }

  if (customerError) {
    return (
      <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-center">
        <p className="text-sm text-red-200">Unable to load profile</p>
        <button onClick={() => refreshCustomer()} className="mt-2 text-xs text-white/50 underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="relative isolate overflow-hidden rounded-2xl border border-white/8 p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.03] to-transparent" aria-hidden="true" />
      <button
        onClick={() => setExpanded(!expanded)}
        className="relative z-10 flex w-full items-center justify-between"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-400/10 text-sm text-blue-400">👤</div>
          <p className="text-sm font-bold text-white">Profile Details</p>
        </div>
        <span className={`text-white/25 transition text-xs ${expanded ? "rotate-180" : ""}`}>▼</span>
      </button>

      {expanded && (
        <form className="mt-4 space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Full name" error={form.formState.errors.fullName?.message}>
              <input type="text" readOnly {...form.register("fullName")} className={inputCls + " opacity-50"} />
            </Field>
            <Field label="Email" error={form.formState.errors.email?.message}>
              <input type="email" readOnly {...form.register("email")} className={inputCls + " opacity-50"} />
            </Field>
            <Field label="Phone" error={form.formState.errors.phone?.message}>
              <input type="tel" placeholder="+44 7700 900000" {...form.register("phone")} className={inputCls} />
            </Field>
            <Field label="Postcode" error={form.formState.errors.postcode?.message}>
              <input type="text" placeholder="BT1 1AA" {...form.register("postcode")} className={inputCls} autoComplete="postal-code" />
            </Field>
          </div>

          {alert && (
            <div className={`rounded-xl border px-3 py-2 text-xs ${alert.type === "success" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-red-400/30 bg-red-400/10 text-red-200"}`}>
              {alert.message}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="flex w-full min-h-[44px] items-center justify-center rounded-xl cta-gradient text-sm font-bold text-white disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </form>
      )}
    </div>
  );
}

/* ━━━━━━━━━ Copy Badge ━━━━━━━━━ */
function CopyBadge({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  if (!text) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <button onClick={handleCopy} className="flex items-center gap-1.5 rounded-md bg-emerald-400/5 border border-emerald-400/10 px-2 py-0.5 text-[9px] font-mono text-emerald-400/60 transition hover:text-emerald-400/80 hover:border-emerald-400/20">
      <span className="text-emerald-400/30">$</span>{text}
      <span className="text-[8px]">{copied ? "✓" : "📋"}</span>
    </button>
  );
}

/* ━━━━━━━━━ Field ━━━━━━━━━ */
function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wider text-white/40">{label}</span>
      <div className="mt-1">{children}</div>
      {error && <p className="mt-1 text-[10px] text-red-300">{error}</p>}
    </label>
  );
}
