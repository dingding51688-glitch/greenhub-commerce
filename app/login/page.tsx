"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/components/providers/AuthProvider";
import Button from "@/components/ui/button";
import { StateMessage } from "@/components/StateMessage";

const schema = z.object({
  identifier: z.string().min(3, "Enter your email or username"),
  password: z.string().min(8, "Password must be at least 8 characters")
});

type LoginFormValues = z.infer<typeof schema>;

const inputClass = "mt-1 w-full rounded-2xl border border-white/15 bg-transparent px-3 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [welcome, setWelcome] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { identifier: "", password: "" }
  });

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (welcome) {
      timer = setTimeout(() => router.push("/account"), 1200);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [welcome, router]);

  const onSubmit = async (values: LoginFormValues) => {
    setSubmissionError(null);
    setWelcome(false);
    try {
      await login(values.identifier, values.password);
      setWelcome(true);
    } catch (error: any) {
      setSubmissionError(error?.message || "Unable to sign in");
    }
  };

  return (
    <section className="mx-auto mt-10 max-w-md space-y-4 rounded-[40px] border border-white/10 bg-night-950/80 p-6 shadow-card">
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-ink-500">Login</p>
        <h1 className="text-3xl font-semibold text-white">Sign in to your account</h1>
        <p className="text-sm text-ink-400">Use your verified email or username plus password.</p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <label className="block text-xs uppercase tracking-[0.3em] text-ink-500">
          Email or username
          <input type="text" {...register("identifier")} className={inputClass} placeholder="you@email.com" />
          {errors.identifier && <p className="mt-1 text-xs text-red-300">{errors.identifier.message}</p>}
        </label>
        <label className="block text-xs uppercase tracking-[0.3em] text-ink-500">
          Password
          <input type="password" {...register("password")} className={inputClass} placeholder="••••••••" />
          {errors.password && <p className="mt-1 text-xs text-red-300">{errors.password.message}</p>}
        </label>
        {submissionError && <p className="text-sm text-red-300">{submissionError}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      {welcome && <StateMessage variant="info" title="Welcome back" body="Redirecting you to your account…" />}

      <p className="text-sm text-ink-400">
        Need an account?{" "}
        <Link className="text-white underline" href="/register">
          Register
        </Link>
      </p>
    </section>
  );
}
