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

const inputCls = "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-base text-white outline-none placeholder:text-white/25 focus:border-emerald-400/40 focus:bg-white/[0.06] transition";

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
    <div className="mx-auto w-full max-w-sm space-y-5 pb-8">
      {/* Header */}
      <div className="text-center">
        <p className="text-4xl">🌿</p>
        <h1 className="mt-2 text-xl font-bold text-white">Create Account</h1>
        <p className="mt-1 text-sm text-white/40">Join Green Hub — order & collect anonymously</p>
      </div>

      {/* Referral badge */}
      {referralCode && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-purple-400/20 bg-purple-400/5 px-3 py-2.5">
          <span className="text-base">🎁</span>
          <p className="text-xs text-purple-200">Invited by <span className="font-mono font-bold">{referralCode}</span></p>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="space-y-3 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-5">
          <div className="text-center">
            <p className="text-4xl">✅</p>
            <p className="mt-2 text-base font-bold text-emerald-200">Account created!</p>
            <p className="mt-1 text-sm text-emerald-200/70">Redirecting in {countdown > 0 ? countdown : 1}s…</p>
          </div>
          <Link href="/products" className="flex w-full min-h-[48px] items-center justify-center rounded-xl cta-gradient text-sm font-bold text-white">
            Browse Products
          </Link>
        </div>
      )}

      {/* Form */}
      {!success && (
        <form className="space-y-3" onSubmit={handleSubmit(onSubmit)} noValidate>
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
            <input type="password" {...register("password")} className={inputCls} placeholder="Min 8 chars, 1 uppercase, 1 symbol" autoComplete="new-password" />
            {pw && (
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/8">
                  <div className={`h-full rounded-full transition-all ${str.cls}`} style={{ width: `${str.pct}%` }} />
                </div>
                <span className={`text-[10px] font-medium ${str.pct === 100 ? "text-emerald-400" : str.pct >= 66 ? "text-amber-400" : "text-red-400"}`}>{str.label}</span>
              </div>
            )}
          </Field>

          <Field label="Confirm password" error={errors.confirm?.message}>
            <input type="password" {...register("confirm")} className={inputCls} placeholder="Re-enter password" autoComplete="new-password" />
          </Field>

          {error && (
            <div className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full min-h-[52px] items-center justify-center rounded-xl cta-gradient text-base font-bold text-white disabled:opacity-40 active:scale-[0.98] transition"
          >
            {isSubmitting ? "Creating…" : "Create Account"}
          </button>
        </form>
      )}

      {/* Login link */}
      {!success && (
        <>
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-white/8" />
            <span className="text-[10px] text-white/25">ALREADY HAVE AN ACCOUNT?</span>
            <div className="h-px flex-1 bg-white/8" />
          </div>

          <Link
            href="/login"
            className="flex w-full min-h-[48px] items-center justify-center rounded-xl border border-white/10 text-sm font-medium text-white transition hover:bg-white/[0.04] active:scale-[0.98]"
          >
            Sign In
          </Link>
        </>
      )}

      <p className="text-center text-[10px] text-white/20">
        By registering you agree to our terms of service
      </p>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wider text-white/40">{label}</label>
      <div className="mt-1">{children}</div>
      {error && <p className="mt-1 text-xs text-red-300">{error}</p>}
    </div>
  );
}
