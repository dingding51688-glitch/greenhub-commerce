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

const inputCls = "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/25";

function strength(pw: string) {
  const s = [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length;
  if (!pw) return { cls: "bg-white/10", pct: 0 };
  if (s <= 2) return { cls: "bg-red-400", pct: 33 };
  if (s === 3) return { cls: "bg-amber-400", pct: 66 };
  return { cls: "bg-emerald-400", pct: 100 };
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
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-5">
        {/* Header */}
        <div className="text-center">
          <p className="text-3xl">🌿</p>
          <h1 className="mt-2 text-xl font-bold text-white">Create Account</h1>
          <p className="mt-1 text-xs text-white/40">Join Green Hub to order & collect anonymously</p>
        </div>

        {/* Referral badge */}
        {referralCode && (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-purple-400/20 bg-purple-400/5 px-3 py-2">
            <span className="text-sm">🎁</span>
            <p className="text-[10px] text-purple-200">Invited by <span className="font-mono font-bold">{referralCode}</span></p>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="space-y-3 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4">
            <p className="text-sm font-bold text-emerald-200">✅ Account created!</p>
            <p className="text-xs text-emerald-200/70">Redirecting to products in {countdown > 0 ? countdown : 1}s…</p>
            <Link href="/products" className="flex w-full min-h-[44px] items-center justify-center rounded-xl cta-gradient text-sm font-bold text-white">
              Browse Products
            </Link>
          </div>
        )}

        {/* Form */}
        {!success && (
          <form className="space-y-3" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Field error={errors.fullName?.message}>
              <input type="text" {...register("fullName")} className={inputCls} placeholder="Full name" autoComplete="name" />
            </Field>

            <Field error={errors.email?.message}>
              <input type="email" {...register("email")} className={inputCls} placeholder="Email" autoComplete="email" />
            </Field>

            <div className="grid grid-cols-2 gap-2">
              <Field error={errors.postcode?.message}>
                <input type="text" {...register("postcode")} className={inputCls} placeholder="Postcode" autoComplete="postal-code" />
              </Field>
              <Field error={errors.phone?.message}>
                <input type="tel" {...register("phone")} className={inputCls} placeholder="Phone" autoComplete="tel" />
              </Field>
            </div>

            <Field error={errors.password?.message}>
              <input type="password" {...register("password")} className={inputCls} placeholder="Password" autoComplete="new-password" />
              {pw && (
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/8">
                  <div className={`h-full rounded-full transition-all ${str.cls}`} style={{ width: `${str.pct}%` }} />
                </div>
              )}
            </Field>

            <Field error={errors.confirm?.message}>
              <input type="password" {...register("confirm")} className={inputCls} placeholder="Confirm password" autoComplete="new-password" />
            </Field>

            <p className="text-[8px] text-white/15">Min 8 chars · 1 uppercase · 1 symbol</p>

            {error && (
              <div className="rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs text-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full min-h-[48px] items-center justify-center rounded-xl cta-gradient text-sm font-bold text-white disabled:opacity-40"
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
              <span className="text-[9px] text-white/20">ALREADY HAVE AN ACCOUNT?</span>
              <div className="h-px flex-1 bg-white/8" />
            </div>

            <Link
              href="/login"
              className="flex w-full min-h-[48px] items-center justify-center rounded-xl border border-white/10 text-sm font-medium text-white transition hover:bg-white/[0.04]"
            >
              Sign In
            </Link>
          </>
        )}

        <p className="text-center text-[9px] text-white/15">
          By registering you agree to our terms of service
        </p>
      </div>
    </div>
  );
}

function Field({ error, children }: { error?: string; children: React.ReactNode }) {
  return (
    <div>
      {children}
      {error && <p className="mt-1 text-[10px] text-red-300">{error}</p>}
    </div>
  );
}
