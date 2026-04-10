"use client";

import { type ReactNode, useEffect, useState } from "react";
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


/* ─── constants ─── */

const phoneRegex = /^\+?[0-9]{7,15}$/;
const postcodeRegex = /^[A-Za-z0-9\s]{4,9}$/;
const inputCls = "w-full rounded-2xl border border-white/15 bg-transparent px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none";

/* ─── profile schema ─── */
const profileSchema = z.object({
  fullName: z.string().nonempty(),
  email: z.string().email(),
  phone: z.string().optional().or(z.literal("")).refine((v) => !v || phoneRegex.test(v), { message: "Enter a valid phone number" }),
  postcode: z.string().optional().or(z.literal("")).refine((v) => !v || postcodeRegex.test(v), { message: "Enter a valid UK postcode" }),
});
type ProfileFormValues = z.infer<typeof profileSchema>;

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
          <p className="mt-2 text-xl font-semibold text-white">Earn Hub</p>
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
  const emailVerifiedAt = attrs?.emailVerifiedAt;
  const pendingEmail = attrs?.pendingEmail;
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [profileAlert, setProfileAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: "", email: "", phone: "", postcode: "" },
  });

  useEffect(() => {
    if (!attrs) return;
    profileForm.reset({
      fullName: attrs.fullName || profile?.fullName || "",
      email: attrs.email || profile?.email || userEmail || "",
      phone: attrs.phone || "",
      postcode: attrs.postcode || "",

    });
  }, [customer, profileForm, profile, userEmail, attrs]);



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
        postcode: values.postcode?.trim().toUpperCase() || null,

      });
      setProfileAlert({ type: "success", message: "Profile updated" });
      await Promise.all([refreshCustomer(), refreshProfile()]);
    } catch (err: any) {
      setProfileAlert({ type: "error", message: err?.message || "Update failed" });
    } finally { setSaving(false); }
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-card p-4 sm:rounded-[40px] sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Account Center</p>
          <h2 className="text-2xl font-semibold text-white">Profile</h2>
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
        <form className="mt-5 space-y-5" onSubmit={profileForm.handleSubmit(submitProfile)}>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Full name" error={profileForm.formState.errors.fullName?.message}>
              <input type="text" readOnly {...profileForm.register("fullName")} className={inputCls} />
            </Field>
            <Field label="Email" error={profileForm.formState.errors.email?.message}>
              <input type="email" readOnly {...profileForm.register("email")} className={inputCls} />
              <EmailVerificationBadge
                emailVerifiedAt={emailVerifiedAt}
                pendingEmail={pendingEmail}
                verifyLoading={verifyLoading}
                onRequestVerify={async () => {
                  setVerifyLoading(true);
                  try {
                    const res = await fetch("/api/account/security/request-verification", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      credentials: "include",
                    });
                    const data = await res.json().catch(() => ({}));
                    if (res.ok && data.success) {
                      setProfileAlert({ type: "success", message: data.message || "Verification email sent! First verification earns £5." });
                      refreshCustomer();
                    } else {
                      setProfileAlert({ type: "error", message: data.error?.message || data.message || "Failed to send verification email" });
                    }
                  } catch {
                    setProfileAlert({ type: "error", message: "Unable to send verification email" });
                  } finally {
                    setVerifyLoading(false);
                  }
                }}
              />
            </Field>
            <Field label="Phone" error={profileForm.formState.errors.phone?.message}>
              <input type="tel" placeholder="+44 7700 900000" {...profileForm.register("phone")} className={inputCls} />
            </Field>
            <Field label="Postcode" error={profileForm.formState.errors.postcode?.message}>
              <input type="text" placeholder="BT1 1AA" {...profileForm.register("postcode")} className={inputCls} autoComplete="postal-code" />
            </Field>
          </div>
          {profileAlert && (
            <div className={`rounded-2xl border px-4 py-3 text-sm ${profileAlert.type === "success" ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100" : "border-red-400/40 bg-red-400/10 text-red-100"}`}>{profileAlert.message}</div>
          )}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="submit" disabled={saving} className="w-full min-h-[48px] text-base sm:w-auto">{saving ? "Saving…" : "Save changes"}</Button>
            <Button asChild variant="secondary" className="w-full min-h-[48px] text-base sm:w-auto"><Link href="/account/security">Change email or password</Link></Button>
          </div>
        </form>
      )}
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━ Shared components ━━━━━━━━━━━━━━━━━━━━━ */

function EmailVerificationBadge({
  emailVerifiedAt,
  pendingEmail,
  verifyLoading,
  onRequestVerify,
}: {
  emailVerifiedAt?: string | null;
  pendingEmail?: string | null;
  verifyLoading: boolean;
  onRequestVerify: () => void;
}) {
  if (emailVerifiedAt) {
    return (
      <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-200">
        ✓ Verified
      </span>
    );
  }

  return (
    <div className="mt-1.5 space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-200">
          ✗ Not verified
        </span>
        <button
          type="button"
          onClick={onRequestVerify}
          disabled={verifyLoading}
          className="rounded-full border border-white/20 px-3 py-1 text-[11px] font-semibold text-white/70 transition hover:border-white/40 disabled:opacity-50"
        >
          {verifyLoading ? "Sending…" : "Verify now"}
        </button>
      </div>
      {pendingEmail && (
        <p className="text-[11px] text-white/40">
          Verification sent to {pendingEmail} · <button type="button" onClick={onRequestVerify} disabled={verifyLoading} className="underline">Resend</button>
        </p>
      )}
      {!pendingEmail && (
        <p className="text-[11px] text-white/40">First verification earns £5 wallet bonus</p>
      )}
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block text-xs font-medium uppercase tracking-[0.3em] text-white/60">
      {label}
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1 text-xs text-red-300">{error}</p>}
    </label>
  );
}
