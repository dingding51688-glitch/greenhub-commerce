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

const inputCls = "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/25";

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
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo / brand */}
        <div className="text-center">
          <p className="text-3xl">🌿</p>
          <h1 className="mt-2 text-xl font-bold text-white">Welcome back</h1>
          <p className="mt-1 text-xs text-white/40">Sign in to your Green Hub account</p>
        </div>

        {/* Form */}
        <form className="space-y-3" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div>
            <input
              type="text"
              {...register("identifier")}
              className={inputCls}
              placeholder="Email"
              autoComplete="email"
              autoFocus
            />
            {errors.identifier && <p className="mt-1 text-[10px] text-red-300">{errors.identifier.message}</p>}
          </div>

          <div>
            <input
              type="password"
              {...register("password")}
              className={inputCls}
              placeholder="Password"
              autoComplete="current-password"
            />
            {errors.password && <p className="mt-1 text-[10px] text-red-300">{errors.password.message}</p>}
          </div>

          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-[10px] text-white/30 hover:text-white/50">
              Forgot password?
            </Link>
          </div>

          {error && (
            <div className="rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs text-red-200">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200">
              ✓ Signed in — redirecting…
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || success}
            className="flex w-full min-h-[48px] items-center justify-center rounded-xl cta-gradient text-sm font-bold text-white disabled:opacity-40"
          >
            {isSubmitting ? "Signing in…" : "Sign In"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-white/8" />
          <span className="text-[9px] text-white/20">OR</span>
          <div className="h-px flex-1 bg-white/8" />
        </div>

        {/* Register link */}
        <Link
          href="/register"
          className="flex w-full min-h-[48px] items-center justify-center rounded-xl border border-white/10 text-sm font-medium text-white transition hover:bg-white/[0.04]"
        >
          Create Account
        </Link>

        {/* Footer */}
        <p className="text-center text-[9px] text-white/15">
          By signing in you agree to our terms of service
        </p>
      </div>
    </div>
  );
}
