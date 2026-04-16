"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/components/providers/AuthProvider";

const schema = z.object({
  identifier: z.string().min(3, "Enter your email"),
  password: z.string().min(8, "Min 8 characters"),
});
type Form = z.infer<typeof schema>;

const inputCls = "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-base text-white outline-none placeholder:text-white/25 focus:border-emerald-400/40 focus:bg-white/[0.06] transition";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { identifier: "", password: "" },
  });

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => router.push("/account"), 800);
      return () => clearTimeout(t);
    }
  }, [success, router]);

  const onSubmit = async (v: Form) => {
    setError(null);
    try {
      await login(v.identifier, v.password);
      setSuccess(true);
    } catch (e: any) {
      setError(e?.message || "Unable to sign in");
    }
  };

  return (
    <div className="mx-auto w-full max-w-sm space-y-5 pb-8">
      {/* Header */}
      <div className="text-center">
        <p className="text-4xl">🌿</p>
        <h1 className="mt-2 text-xl font-bold text-white">Welcome back</h1>
        <p className="mt-1 text-sm text-white/40">Sign in to your Green Hub account</p>
      </div>

      {/* Form */}
      <form className="space-y-3" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-white/40">Email</label>
          <div className="mt-1">
            <input
              type="text"
              {...register("identifier")}
              className={inputCls}
              placeholder="you@email.com"
              autoComplete="email"
            />
          </div>
          {errors.identifier && <p className="mt-1 text-xs text-red-300">{errors.identifier.message}</p>}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="text-[10px] uppercase tracking-wider text-white/40">Password</label>
            <Link href="/forgot-password" className="text-[10px] text-white/30 hover:text-white/50">
              Forgot?
            </Link>
          </div>
          <div className="mt-1">
            <input
              type="password"
              {...register("password")}
              className={inputCls}
              placeholder="Enter password"
              autoComplete="current-password"
            />
          </div>
          {errors.password && <p className="mt-1 text-xs text-red-300">{errors.password.message}</p>}
        </div>

        {error && (
          <div className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
            ✓ Signed in — redirecting…
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || success}
          className="flex w-full min-h-[52px] items-center justify-center rounded-xl cta-gradient text-base font-bold text-white disabled:opacity-40 active:scale-[0.98] transition"
        >
          {isSubmitting ? "Signing in…" : "Sign In"}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-white/8" />
        <span className="text-[10px] text-white/25">NEW HERE?</span>
        <div className="h-px flex-1 bg-white/8" />
      </div>

      {/* Register link */}
      <Link
        href="/register"
        className="flex w-full min-h-[48px] items-center justify-center rounded-xl border border-white/10 text-sm font-medium text-white transition hover:bg-white/[0.04] active:scale-[0.98]"
      >
        Create Account
      </Link>

      <p className="text-center text-[10px] text-white/20">
        By signing in you agree to our terms of service
      </p>
    </div>
  );
}
