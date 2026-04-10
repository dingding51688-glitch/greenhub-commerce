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
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/25";

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
      {/* ── Header card ── */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-900/20 to-transparent p-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-xl font-bold text-emerald-300">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold text-white">{displayName}</p>
            <div className="flex items-center gap-2">
              <CopyBadge text={displayId} />
              {attrs?.emailVerifiedAt ? (
                <span className="rounded-full bg-emerald-400/15 px-1.5 py-0.5 text-[8px] font-bold text-emerald-300">✓ Verified</span>
              ) : (
                <span className="rounded-full bg-amber-400/15 px-1.5 py-0.5 text-[8px] font-bold text-amber-300">Unverified</span>
              )}
            </div>
          </div>
          {/* Balance */}
          <div className="text-right">
            <p className="text-[9px] text-white/30">Balance</p>
            <p className="text-lg font-bold text-emerald-300">£{balance.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* ── Quick actions 2x2 ── */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { icon: "💰", label: "Wallet", desc: "Balance & history", href: "/wallet" },
          { icon: "📦", label: "Orders", desc: "Track deliveries", href: "/orders" },
          { icon: "🤝", label: "Earn Hub", desc: "Invite & earn", href: "/account/commission" },
          { icon: "🔔", label: "Notifications", desc: "Alerts & updates", href: "/account/notifications" },
        ].map((item) => (
          <Link key={item.href} href={item.href}
            className="flex items-center gap-2.5 rounded-xl border border-white/8 bg-white/[0.02] p-3 transition hover:bg-white/[0.04]">
            <span className="text-xl">{item.icon}</span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white">{item.label}</p>
              <p className="truncate text-[9px] text-white/30">{item.desc}</p>
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

      {/* ── Account actions ── */}
      <div className="space-y-1.5">
        <Link href="/account/security"
          className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3 transition hover:bg-white/[0.04]">
          <div className="flex items-center gap-3">
            <span className="text-base">🔒</span>
            <div>
              <p className="text-sm font-medium text-white">Security</p>
              <p className="text-[10px] text-white/30">Change email or password</p>
            </div>
          </div>
          <span className="text-white/20">›</span>
        </Link>
        <Link href="/support"
          className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3 transition hover:bg-white/[0.04]">
          <div className="flex items-center gap-3">
            <span className="text-base">💬</span>
            <div>
              <p className="text-sm font-medium text-white">Support</p>
              <p className="text-[10px] text-white/30">Get help or submit a ticket</p>
            </div>
          </div>
          <span className="text-white/20">›</span>
        </Link>
        <Link href="/how-it-works"
          className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3 transition hover:bg-white/[0.04]">
          <div className="flex items-center gap-3">
            <span className="text-base">📖</span>
            <div>
              <p className="text-sm font-medium text-white">How It Works</p>
              <p className="text-[10px] text-white/30">Ordering, delivery & payment</p>
            </div>
          </div>
          <span className="text-white/20">›</span>
        </Link>
      </div>

      {/* ── Sign out ── */}
      <button
        onClick={() => { logout(); router.push("/login"); }}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-400/5 py-3 text-sm font-medium text-red-300 transition hover:bg-red-400/10"
      >
        Sign Out
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">👤</span>
          <p className="text-sm font-bold text-white">Profile Details</p>
        </div>
        <span className={`text-white/30 transition ${expanded ? "rotate-180" : ""}`}>▾</span>
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
    <button onClick={handleCopy} className="flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[9px] font-mono text-white/40 transition hover:text-white/60">
      {text}
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
