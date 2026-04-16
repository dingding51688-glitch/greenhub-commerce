"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z
  .object({
    password: z
      .string()
      .min(8, "Min 8 characters")
      .regex(/[A-Z]/, "Need 1 uppercase letter")
      .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, "Need 1 symbol"),
    confirm: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirm, {
    path: ["confirm"],
    message: "Passwords must match",
  });

type FormValues = z.infer<typeof schema>;

const inputCls = "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-base text-white outline-none placeholder:text-white/25 focus:border-emerald-400/40 focus:bg-white/[0.06] transition";

function strength(pw: string) {
  const s = [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length;
  if (!pw) return { cls: "bg-white/10", pct: 0, label: "" };
  if (s <= 2) return { cls: "bg-red-400", pct: 33, label: "Weak" };
  if (s === 3) return { cls: "bg-amber-400", pct: 66, label: "Good" };
  return { cls: "bg-emerald-400", pct: 100, label: "Strong" };
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code") || "";

  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirm: "" },
  });

  const pw = watch("password") || "";
  const str = strength(pw);

  if (!code) {
    return (
      <div className="mx-auto w-full max-w-sm space-y-5 pb-8">
        <div className="text-center">
          <p className="text-4xl">⚠️</p>
          <h1 className="mt-2 text-xl font-bold text-white">Invalid Reset Link</h1>
          <p className="mt-1 text-sm text-white/40">This link is missing a reset code. Please request a new one.</p>
        </div>
        <Link
          href="/forgot-password"
          className="flex w-full min-h-[52px] items-center justify-center rounded-xl cta-gradient text-base font-bold text-white"
        >
          Request New Link
        </Link>
        <div className="text-center">
          <Link href="/login" className="text-sm text-white/50 hover:text-white transition">← Back to login</Link>
        </div>
      </div>
    );
  }

  const onSubmit = async (values: FormValues) => {
    setError(null);
    setDone(false);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          password: values.password,
          passwordConfirmation: values.confirm,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error?.message || "Reset failed. The link may have expired.");
        return;
      }
      setDone(true);
    } catch {
      setError("Unable to reach the server. Please try again.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-sm space-y-5 pb-8">
      {/* Header */}
      <div className="text-center">
        <p className="text-4xl">🔐</p>
        <h1 className="mt-2 text-xl font-bold text-white">Set New Password</h1>
        <p className="mt-1 text-sm text-white/40">Choose a strong new password for your account</p>
      </div>

      {done ? (
        <div className="space-y-4 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-5">
          <div className="text-center">
            <p className="text-4xl">✅</p>
            <p className="mt-2 text-base font-bold text-emerald-200">Password Updated!</p>
            <p className="mt-1 text-sm text-emerald-200/70">You can now sign in with your new password.</p>
          </div>
          <Link
            href="/login"
            className="flex w-full min-h-[52px] items-center justify-center rounded-xl cta-gradient text-base font-bold text-white"
          >
            Go to Login
          </Link>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-white/40">New password</label>
            <div className="mt-1">
              <input type="password" {...register("password")} className={inputCls} placeholder="Min 8 chars, 1 uppercase, 1 symbol" />
            </div>
            {pw && (
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/8">
                  <div className={`h-full rounded-full transition-all ${str.cls}`} style={{ width: `${str.pct}%` }} />
                </div>
                <span className={`text-[10px] font-medium ${str.pct === 100 ? "text-emerald-400" : str.pct >= 66 ? "text-amber-400" : "text-red-400"}`}>{str.label}</span>
              </div>
            )}
            {errors.password && <p className="mt-1 text-xs text-red-300">{errors.password.message}</p>}
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-white/40">Confirm new password</label>
            <div className="mt-1">
              <input type="password" {...register("confirm")} className={inputCls} placeholder="Re-enter new password" />
            </div>
            {errors.confirm && <p className="mt-1 text-xs text-red-300">{errors.confirm.message}</p>}
          </div>

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
            {isSubmitting ? "Updating…" : "Update Password"}
          </button>
        </form>
      )}

      <div className="text-center">
        <Link href="/login" className="text-sm text-white/50 hover:text-white transition">← Back to login</Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-white/30">Loading…</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
