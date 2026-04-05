"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/components/providers/AuthProvider";
import useSWR from "swr";
import Button from "@/components/ui/button";
import { StateMessage } from "@/components/StateMessage";
import { Skeleton } from "@/components/Skeleton";
import { swrFetcher, apiMutate } from "@/lib/api";
// Removed: getReferralSummary, ReferralSummary, WalletBalanceResponse, WalletTransactionsResponse, WalletTransaction
// (balance & commission now live in /wallet and /account/commission)

/* ─── constants ─── */
const currency = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
const dateFmt = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });
const phoneRegex = /^\+?[0-9]{7,15}$/;
const telegramRegex = /^@?[a-zA-Z0-9_]{5,32}$/;
const inputCls = "w-full rounded-2xl border border-white/15 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/40";

/* ─── profile schema ─── */
const profileSchema = z.object({
  fullName: z.string().nonempty(),
  email: z.string().email(),
  phone: z.string().optional().or(z.literal("")).refine((v) => !v || phoneRegex.test(v), { message: "Enter a valid phone number" }),
  telegramHandle: z.string().optional().or(z.literal("")).refine((v) => !v || telegramRegex.test(v), { message: "Enter a valid Telegram handle" }),
  preferredLocker: z.string().optional().or(z.literal("")),
  marketingOptIn: z.boolean(),
});
type ProfileFormValues = z.infer<typeof profileSchema>;

type CustomerProfileResponse = {
  data?: {
    id: number;
    attributes: {
      fullName?: string;
      email?: string;
      phone?: string | null;
      telegramHandle?: string | null;
      preferredLocker?: string | null;
      marketingOptIn?: boolean;
      transferHandle?: string;
      lockerPreferences?: { data: { id: number; attributes?: { code?: string; label?: string } }[] };
    };
  };
};

/* ── SWR config: don't retry on 401/403 ── */
const noRetryOnAuth = {
  shouldRetryOnError: (error: Error & { status?: number }) => {
    if (error?.status === 401 || error?.status === 403) return false;
    return true;
  },
};

/* ━━━━━━━━━━━━━━━━━━━━━ Main page ━━━━━━━━━━━━━━━━━━━━━ */
export default function AccountPage() {
  const { isReady, token, userEmail, profile, refreshProfile, logout } = useAuth();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  const handleSignOut = () => { logout(); router.push("/login"); };

  /* Auto-redirect to login — only after auth hydration is complete */
  useEffect(() => {
    if (!isReady || token || redirecting) return;
    const timer = setTimeout(() => { setRedirecting(true); router.push("/login"); }, 3000);
    return () => clearTimeout(timer);
  }, [isReady, token, redirecting, router]);

  /* ── data fetching ── */
  const { data: customerProfile, error: customerError, isLoading: customerLoading, mutate: refreshCustomer } =
    useSWR<CustomerProfileResponse>(token ? "/api/account/profile" : null, swrFetcher, noRetryOnAuth);

  /* Handle auth errors from profile API */
  const profileStatus = (customerError as Error & { status?: number })?.status;
  const profileMessage = customerError?.message || "";
  const isCustomerMissing = profileStatus === 401 && profileMessage.includes("could not determine customer");
  const isTokenInvalid = profileStatus === 401 && !isCustomerMissing;

  useEffect(() => {
    // Only logout on genuinely invalid tokens, NOT on missing customer records
    if (isTokenInvalid) {
      logout();
    }
  }, [isTokenInvalid, logout]);

  /* Debug banner — only in non-production or when NEXT_PUBLIC_SHOW_AUTH_DEBUG is set */
  const showDebug = process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_SHOW_AUTH_DEBUG === "1";

  /* Still hydrating auth from localStorage — show loading skeleton */
  if (!isReady) {
    return (
      <section className="space-y-8">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </section>
    );
  }

  /* Hydrated but no token — user is genuinely not logged in */
  if (!token) {
    return (
      <section className="mx-auto mt-20 max-w-md space-y-6 rounded-[40px] border border-white/10 bg-night-950/80 p-8 text-center shadow-card">
        <h2 className="text-2xl font-semibold text-white">Sign in to continue</h2>
        <p className="text-sm text-white/60">Log in or create an account to access your Account Center.</p>
        {!redirecting && <p className="text-xs text-white/40">Redirecting to login in a few seconds…</p>}
        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={() => router.push("/login")}>Log in</Button>
          <Button variant="secondary" onClick={() => router.push("/register")}>Create account</Button>
        </div>
      </section>
    );
  }

  /* Account not yet provisioned — user exists but no customer record */
  if (isCustomerMissing) {
    return (
      <section className="mx-auto mt-20 max-w-md space-y-6 rounded-[40px] border border-amber-500/20 bg-amber-500/5 p-8 text-center shadow-card">
        <h2 className="text-2xl font-semibold text-white">Account pending setup</h2>
        <p className="text-sm text-white/70">
          Your login works, but your account profile hasn&apos;t been created yet.
          This usually takes a few minutes after registration.
        </p>
        <p className="text-sm text-white/70">
          If this persists, contact support so we can link your profile manually.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={() => refreshCustomer()}>Try again</Button>
          <Button variant="secondary" onClick={() => router.push("/support")}>Contact support</Button>
        </div>
        {showDebug && (
          <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 font-mono text-xs text-amber-200 text-left">
            <p>Debug: user authenticated but no customer record found</p>
            <p>Email: {userEmail} | Error: {profileMessage}</p>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="space-y-8">
      {/* Debug banner */}
      {showDebug && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 font-mono text-xs text-amber-200">
          <p>🔧 Auth Debug: isReady={String(isReady)} | hasToken={String(!!token)} | email={userEmail ?? "null"} | profile={profile?.email ?? "loading..."}</p>
          <p>API base: {process.env.NEXT_PUBLIC_API_BASE_URL ?? "unset"} | Errors: profile={customerError?.message ?? "none"}</p>
        </div>
      )}
      {/* ─────── Profile & Settings ─────── */}
      <OverviewSection
        customer={customerProfile}
        customerLoading={customerLoading}
        customerError={customerError}
        refreshCustomer={refreshCustomer}
        refreshProfile={refreshProfile}
        profile={profile}
        userEmail={userEmail || undefined}
      />

      {/* ─────── Quick links ─────── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/wallet" className="group rounded-3xl border border-white/10 bg-card p-6 shadow-card transition hover:border-white/20">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Wallet</p>
          <p className="mt-2 text-xl font-semibold text-white">Balance & history</p>
          <p className="mt-1 text-sm text-white/60">Top up, transfer, withdraw, and view transactions.</p>
          <span className="mt-3 inline-block text-sm text-emerald-300 group-hover:underline">Open wallet →</span>
        </Link>
        <Link href="/account/commission" className="group rounded-3xl border border-white/10 bg-card p-6 shadow-card transition hover:border-white/20">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Referrals</p>
          <p className="mt-2 text-xl font-semibold text-white">Commission hub</p>
          <p className="mt-1 text-sm text-white/60">Invite friends, track earnings, and view your referral stats.</p>
          <span className="mt-3 inline-block text-sm text-emerald-300 group-hover:underline">View commissions →</span>
        </Link>
      </div>

      {/* ─────── Sign out ─────── */}
      <div className="flex justify-end">
        <Button variant="secondary" size="sm" onClick={handleSignOut}>Sign out</Button>
      </div>
    </section>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━ Section 1: Overview ━━━━━━━━━━━━━━━━━━━━━ */
function OverviewSection({
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
  const userId = customer?.data?.id;
  const transferHandle = attrs?.transferHandle;
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [profileAlert, setProfileAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: "", email: "", phone: "", telegramHandle: "", preferredLocker: "", marketingOptIn: false },
  });

  useEffect(() => {
    if (!attrs) return;
    profileForm.reset({
      fullName: attrs.fullName || profile?.fullName || "",
      email: attrs.email || profile?.email || userEmail || "",
      phone: attrs.phone || "",
      telegramHandle: attrs.telegramHandle || "",
      preferredLocker: attrs.preferredLocker || "",
      marketingOptIn: Boolean(attrs.marketingOptIn),
    });
  }, [customer, profileForm, profile, userEmail, attrs]);

  const lockerOptions = useMemo(() => {
    return (attrs?.lockerPreferences?.data || []).map((n) => ({
      value: n.attributes?.code || String(n.id),
      label: n.attributes?.label || n.attributes?.code || `Area ${n.id}`,
    }));
  }, [attrs]);

  const handleCopyId = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyToast("Copied!");
      setTimeout(() => setCopyToast(null), 2000);
    } catch { setCopyToast("Copy failed"); setTimeout(() => setCopyToast(null), 2000); }
  };

  const submitProfile = async (values: ProfileFormValues) => {
    setProfileAlert(null);
    setSaving(true);
    try {
      await apiMutate<{ data?: unknown }>("/api/account/profile", "PUT", {
        phone: values.phone?.trim() || null,
        telegramHandle: values.telegramHandle ? values.telegramHandle.replace(/^@/, "") : null,
        preferredLocker: values.preferredLocker || null,
        marketingOptIn: values.marketingOptIn,
      });
      setProfileAlert({ type: "success", message: "Profile updated" });
      await Promise.all([refreshCustomer(), refreshProfile()]);
    } catch (err: any) {
      setProfileAlert({ type: "error", message: err?.message || "Update failed" });
    } finally { setSaving(false); }
  };

  return (
    <div className="rounded-[40px] border border-white/10 bg-card p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Account Center</p>
          <h2 className="text-2xl font-semibold text-white">Overview</h2>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/account/security" className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60 underline">Security settings</Link>
          <button onClick={() => refreshCustomer()} className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60 underline">Reload</button>
        </div>
      </div>

      {/* User ID badge */}
      {userId && (
        <div className="mt-3 flex items-center gap-2">
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-mono text-white/70">
            User ID: {transferHandle || `GH-${String(userId).padStart(6, "0")}`}
          </span>
          <button onClick={() => handleCopyId(transferHandle || `GH-${String(userId).padStart(6, "0")}`)} className="text-xs text-white/50 underline">Copy</button>
          {copyToast && <span className="text-xs text-emerald-200">{copyToast}</span>}
        </div>
      )}

      {customerLoading && !customer ? (
        <div className="mt-4 space-y-3"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
      ) : customerError ? (
        <StateMessage variant="error" title="Unable to load profile" body={customerError.message} actionLabel="Retry" onAction={() => refreshCustomer()} />
      ) : (
        <form className="mt-4 space-y-4" onSubmit={profileForm.handleSubmit(submitProfile)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" error={profileForm.formState.errors.fullName?.message}>
              <input type="text" readOnly {...profileForm.register("fullName")} className={inputCls} />
            </Field>
            <Field label="Email" error={profileForm.formState.errors.email?.message}>
              <input type="email" readOnly {...profileForm.register("email")} className={inputCls} />
            </Field>
            <Field label="Phone" error={profileForm.formState.errors.phone?.message}>
              <div className="flex gap-2">
                <input type="tel" placeholder="+44 7700 900000" {...profileForm.register("phone")} className={`${inputCls} flex-1`} />
                <button type="button" onClick={() => profileForm.setValue("phone", "", { shouldDirty: true })} className="rounded-2xl border border-white/10 px-3 text-xs font-semibold uppercase tracking-[0.3em] text-white/60 transition hover:border-white/30">Clear</button>
              </div>
            </Field>
            <Field label="Telegram" error={profileForm.formState.errors.telegramHandle?.message}>
              <input type="text" placeholder="@your_handle" {...profileForm.register("telegramHandle")} className={inputCls} />
            </Field>
            <Field label="Preferred area" error={profileForm.formState.errors.preferredLocker?.message}>
              <select {...profileForm.register("preferredLocker")} className={inputCls}>
                <option value="">Select preferred area</option>
                {lockerOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
          </div>
          <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
            <input type="checkbox" className="mt-1 h-4 w-4 accent-brand-500" {...profileForm.register("marketingOptIn")} />
            <span>Opt-in to marketing updates <small className="block text-white/50">New product alerts + exclusive offers.</small></span>
          </label>
          {profileAlert && (
            <div className={`rounded-2xl border px-3 py-2 text-sm ${profileAlert.type === "success" ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100" : "border-red-400/40 bg-red-400/10 text-red-100"}`}>{profileAlert.message}</div>
          )}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
            <Button asChild variant="secondary"><Link href="/account/security">Change email or password</Link></Button>
          </div>
        </form>
      )}
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━ Shared components ━━━━━━━━━━━━━━━━━━━━━ */

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block text-xs uppercase tracking-[0.3em] text-white/50">
      {label}
      <div className="mt-1">{children}</div>
      {error && <p className="mt-1 text-xs text-red-300">{error}</p>}
    </label>
  );
}

