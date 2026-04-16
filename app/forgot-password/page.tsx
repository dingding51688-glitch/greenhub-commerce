"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
});

type FormValues = z.infer<typeof schema>;

const inputCls = "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-base text-white outline-none placeholder:text-white/25 focus:border-emerald-400/40 focus:bg-white/[0.06] transition";

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    setSent(false);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error?.message || "Something went wrong. Please try again.");
        return;
      }
      setSent(true);
    } catch {
      setError("Unable to reach the server. Please try again.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-sm space-y-5 pb-8">
      {/* Header */}
      <div className="text-center">
        <p className="text-4xl">🔑</p>
        <h1 className="mt-2 text-xl font-bold text-white">Forgot Password?</h1>
        <p className="mt-1 text-sm text-white/40">
          Enter your email and we&apos;ll send a reset link
        </p>
      </div>

      {sent ? (
        <div className="space-y-4 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-5">
          <div className="text-center">
            <p className="text-4xl">📧</p>
            <p className="mt-2 text-base font-bold text-emerald-200">Check your email</p>
            <p className="mt-1 text-sm text-emerald-200/70">
              If an account exists for that email, we&apos;ve sent a password reset link. Check your inbox and spam folder.
            </p>
          </div>
          <Link
            href="/login"
            className="flex w-full min-h-[48px] items-center justify-center rounded-xl cta-gradient text-sm font-bold text-white"
          >
            Back to Login
          </Link>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-white/40">Email address</label>
            <div className="mt-1">
              <input
                type="email"
                {...register("email")}
                className={inputCls}
                placeholder="you@email.com"
                autoComplete="email"
              />
            </div>
            {errors.email && <p className="mt-1 text-xs text-red-300">{errors.email.message}</p>}
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
            {isSubmitting ? "Sending…" : "Send Reset Link"}
          </button>
        </form>
      )}

      {/* Back to login */}
      <div className="text-center">
        <Link href="/login" className="text-sm text-white/50 hover:text-white transition">
          ← Back to login
        </Link>
      </div>
    </div>
  );
}
