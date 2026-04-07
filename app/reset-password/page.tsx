"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "@/components/ui/button";

const schema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least 1 uppercase letter")
      .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, "Password must contain at least 1 symbol"),
    confirm: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirm, {
    path: ["confirm"],
    message: "Passwords must match",
  });

type FormValues = z.infer<typeof schema>;

const inputClass =
  "mt-1 w-full rounded-2xl border border-white/15 bg-transparent px-3 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code") || "";

  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirm: "" },
  });

  if (!code) {
    return (
      <section className="mx-auto mt-10 max-w-md space-y-6 rounded-[40px] border border-white/10 bg-night-950/80 p-6 shadow-card">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-white">Invalid reset link</h1>
          <p className="text-sm text-ink-400">
            This link is missing a reset code. Please request a new one.
          </p>
        </div>
        <Button asChild size="lg" className="w-full">
          <Link href="/forgot-password">Request new link</Link>
        </Button>
      </section>
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
    <section className="mx-auto mt-10 max-w-md space-y-6 rounded-[40px] border border-white/10 bg-night-950/80 p-6 shadow-card">
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-ink-500">Account recovery</p>
        <h1 className="text-3xl font-semibold text-white">Set new password</h1>
        <p className="text-sm text-ink-400">Choose a strong new password for your account.</p>
      </div>

      {done ? (
        <div className="space-y-3 rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-100">
          <p className="font-semibold text-emerald-200">✅ Password updated</p>
          <p>You can now sign in with your new password.</p>
          <Button asChild size="lg" className="w-full">
            <Link href="/login">Go to login</Link>
          </Button>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <label className="block text-xs uppercase tracking-[0.3em] text-ink-500">
            New password
            <input type="password" {...register("password")} className={inputClass} placeholder="••••••••" />
            <p className="mt-1 text-[10px] text-ink-500">Min 8 chars, 1 uppercase, 1 symbol</p>
            {errors.password && <p className="mt-1 text-xs text-red-300">{errors.password.message}</p>}
          </label>

          <label className="block text-xs uppercase tracking-[0.3em] text-ink-500">
            Confirm new password
            <input type="password" {...register("confirm")} className={inputClass} placeholder="••••••••" />
            {errors.confirm && <p className="mt-1 text-xs text-red-300">{errors.confirm.message}</p>}
          </label>

          {error && <p className="text-sm text-red-300">{error}</p>}

          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Updating…" : "Update password"}
          </Button>
        </form>
      )}

      <p className="text-sm text-ink-400">
        <Link className="text-white underline" href="/login">
          Back to login
        </Link>
      </p>
    </section>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="mx-auto mt-10 max-w-md p-6 text-center text-ink-400">Loading…</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
