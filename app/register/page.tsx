"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/components/providers/AuthProvider";
import { getStoredReferralCode, clearStoredReferralCode } from "@/lib/referral-tracking";

const schema = z
  .object({
    fullName: z.string().min(2, "At least 2 characters"),
    email: z.string().email("Enter a valid email"),
    postcode: z.string().min(1, "Required").regex(/^[A-Za-z0-9\s]{4,9}$/, "e.g. BT1 1AA"),
    phone: z.string().min(1, "Required").regex(/^[+\d\s-]{7,18}$/, "7–18 digits"),
    password: z.string().min(8, "Min 8 characters").regex(/[A-Z]/, "Need 1 uppercase").regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, "Need 1 symbol"),
    confirm: z.string().min(1, "Confirm password"),
  })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Passwords must match" });

type Form = z.infer<typeof schema>;

const inputCls = "w-full rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2.5 text-[15px] text-white outline-none placeholder:text-white/20 focus:border-emerald-400/30 focus:bg-white/[0.05] transition";

function strength(pw: string) {
  const s = [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length;
  if (!pw) return { cls: "bg-white/10", pct: 0, label: "" };
  if (s <= 2) return { cls: "bg-red-400", pct: 33, label: "Weak" };
  if (s === 3) return { cls: "bg-amber-400", pct: 66, label: "Good" };
  return { cls: "bg-emerald-400", pct: 100, label: "Strong" };
}

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register: registerUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const referralCode = searchParams?.get("ref")?.trim() || getStoredReferralCode() || "";

  useEffect(() => {
    if (!success) return;
    const i = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    const t = setTimeout(() => router.push("/products"), 2000);
    return () => { clearInterval(i); clearTimeout(t); };
  }, [success, router]);

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch, reset } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: "", email: "", postcode: "", phone: "", password: "", confirm: "" },
  });

  const pw = watch("password") || "";
  const str = strength(pw);

  const onSubmit = async (v: Form) => {
    setError(null);
    try {
      await registerUser({
        fullName: v.fullName,
        email: v.email,
        password: v.password,
        phone: v.phone.trim(),
        postcode: v.postcode.trim().toUpperCase(),
        referralCode: referralCode || undefined,
      });
      clearStoredReferralCode();
      setSuccess(true);
      reset({ ...v, password: "", confirm: "" });
    } catch (e: any) {
      setError(e?.message || "Unable to register");
    }
  };

  return (
    <div className="mx-auto w-full max-w-[340px] pb-8">
      {/* Header — compact */}
      <div className="relative isolate overflow-hidden rounded-2xl border border-emerald-400/10 p-4 mb-4">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1a12] to-transparent opacity-60" aria-hidden="true" />
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: "linear-gradient(rgba(16,185,129,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.5) 1px, transparent 1px)",
          backgroundSize: "24px 24px"
        }} aria-hidden="true" />
        <div className="absolute -top-8 right-0 h-16 w-24 rounded-full bg-emerald-400/10 blur-3xl" aria-hidden="true" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 ring-1 ring-emerald-400/20">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-emerald-400">
              <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="9" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="19" y1="8" x2="19" y2="14" strokeLinecap="round"/><line x1="22" y1="11" x2="16" y2="11" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold text-white">Create Account</h1>
            <p className="text-[10px] text-white/30">Anonymous ordering & collection</p>
          </div>
        </div>
      </div>

      {/* Referral badge */}
      {referralCode && (
        <div className="flex items-center gap-2 rounded-lg border border-purple-400/15 bg-purple-400/5 px-3 py-2 mb-3">
          <span className="text-sm">🎁</span>
          <p className="text-[11px] text-purple-200">Invited by <span className="font-mono font-bold">{referralCode}</span></p>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="space-y-3 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4">
          <div className="text-center">
            <p className="text-3xl">✅</p>
            <p className="mt-2 text-sm font-bold text-emerald-200">Account created!</p>
            <p className="mt-1 text-xs text-emerald-200/60">Redirecting in {countdown > 0 ? countdown : 1}s…</p>
          </div>
          <Link href="/products" className="flex w-full min-h-[44px] items-center justify-center rounded-xl cta-gradient text-sm font-bold text-white">
            Browse Products
          </Link>
        </div>
      )}

      {/* Form */}
      {!success && (
        <form className="space-y-2.5" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Field label="Full name" error={errors.fullName?.message}>
            <input type="text" {...register("fullName")} className={inputCls} placeholder="John Smith" autoComplete="name" />
          </Field>

          <Field label="Email" error={errors.email?.message}>
            <input type="email" {...register("email")} className={inputCls} placeholder="you@email.com" autoComplete="email" />
          </Field>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Postcode" error={errors.postcode?.message}>
              <input type="text" {...register("postcode")} className={inputCls} placeholder="BT1 1AA" autoComplete="postal-code" />
            </Field>
            <Field label="Phone" error={errors.phone?.message}>
              <input type="tel" {...register("phone")} className={inputCls} placeholder="+44 7XXX" autoComplete="tel" />
            </Field>
          </div>

          <Field label="Password" error={errors.password?.message}>
            <input type="password" {...register("password")} className={inputCls} placeholder="Min 8, 1 upper, 1 symbol" autoComplete="new-password" />
            {pw && (
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/6">
                  <div className={`h-full rounded-full transition-all ${str.cls}`} style={{ width: `${str.pct}%` }} />
                </div>
                <span className={`text-[9px] font-medium ${str.pct === 100 ? "text-emerald-400" : str.pct >= 66 ? "text-amber-400" : "text-red-400"}`}>{str.label}</span>
              </div>
            )}
          </Field>

          <Field label="Confirm" error={errors.confirm?.message}>
            <input type="password" {...register("confirm")} className={inputCls} placeholder="Re-enter password" autoComplete="new-password" />
          </Field>

          {error && (
            <div className="rounded-lg border border-red-400/20 bg-red-400/5 px-3 py-2 text-xs text-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-sm font-bold text-black shadow-lg shadow-emerald-500/20 disabled:opacity-40 active:scale-[0.97] transition mt-1"
          >
            {isSubmitting ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
            ) : (
              <>
                Create Account
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </>
            )}
          </button>
        </form>
      )}

      {/* Login link */}
      {!success && (
        <div className="mt-4 text-center">
          <span className="text-[10px] text-white/20">Already have an account? </span>
          <Link href="/login" className="text-[10px] font-medium text-emerald-400/70 hover:text-emerald-400">
            Sign In →
          </Link>
        </div>
      )}

      <p className="mt-3 text-center text-[9px] text-white/15">
        By registering you agree to our terms of service
      </p>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[9px] uppercase tracking-widest text-white/30 font-medium">{label}</label>
      <div className="mt-0.5">{children}</div>
      {error && <p className="mt-0.5 text-[10px] text-red-300">{error}</p>}
    </div>
  );
}
