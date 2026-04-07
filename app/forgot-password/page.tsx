"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "@/components/ui/button";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
});

type FormValues = z.infer<typeof schema>;

const inputClass =
  "mt-1 w-full rounded-2xl border border-white/15 bg-transparent px-3 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40";

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
    <section className="mx-auto mt-10 max-w-md space-y-6 rounded-[40px] border border-white/10 bg-night-950/80 p-6 shadow-card">
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-ink-500">Account recovery</p>
        <h1 className="text-3xl font-semibold text-white">Forgot password?</h1>
        <p className="text-sm text-ink-400">
          Enter the email you registered with and we&apos;ll send you a password reset link.
        </p>
      </div>

      {sent ? (
        <div className="space-y-3 rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-100">
          <p className="font-semibold text-emerald-200">✅ Check your email</p>
          <p>If an account exists for that email, we&apos;ve sent a password reset link. Check your inbox (and spam folder).</p>
          <Button asChild size="lg" className="w-full">
            <Link href="/login">Back to login</Link>
          </Button>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <label className="block text-xs uppercase tracking-[0.3em] text-ink-500">
            Email address
            <input type="email" {...register("email")} className={inputClass} placeholder="you@email.com" />
            {errors.email && <p className="mt-1 text-xs text-red-300">{errors.email.message}</p>}
          </label>

          {error && <p className="text-sm text-red-300">{error}</p>}

          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}

      <p className="text-sm text-ink-400">
        Remember your password?{" "}
        <Link className="text-white underline" href="/login">
          Log in
        </Link>
      </p>
    </section>
  );
}
