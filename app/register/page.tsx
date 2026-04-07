"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/components/providers/AuthProvider";
import Button from "@/components/ui/button";

const registerSchema = z
  .object({
    fullName: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Enter a valid email"),
    postcode: z
      .string()
      .min(1, "Postcode is required")
      .regex(/^[A-Za-z0-9\s]{4,9}$/, "Enter a valid UK postcode (e.g. BT1 1AA)"),
    phone: z
      .string()
      .min(1, "Phone number is required")
      .regex(/^[+\d\s-]{7,18}$/, "Phone must be 7–18 digits (may include +, spaces, dashes)"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least 1 uppercase letter")
      .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, "Password must contain at least 1 symbol (!@#$%^&*)"),
    confirm: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirm, {
    path: ["confirm"],
    message: "Passwords must match",
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

const inputClass =
  "mt-1 w-full rounded-2xl border border-white/15 bg-transparent px-3 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40";

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!success) return;
    const interval = setInterval(() => setCountdown((c) => c - 1), 1000);
    const timeout = setTimeout(() => router.push("/products"), 2000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [success, router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      postcode: "",
      phone: "",
      password: "",
      confirm: "",
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setSubmissionError(null);
    setSuccess(false);
    try {
      await registerUser({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        phone: values.phone.trim(),
        postcode: values.postcode.trim().toUpperCase(),
      });
      setSuccess(true);
      reset({ ...values, password: "", confirm: "" });
    } catch (error: any) {
      setSubmissionError(error?.message || "Unable to register right now");
    }
  };

  return (
    <section className="mx-auto mt-10 max-w-lg space-y-6 rounded-[40px] border border-white/10 bg-night-950/80 p-6 shadow-card">
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-ink-500">Register</p>
        <h1 className="text-3xl font-semibold text-white">Create your account</h1>
        <p className="text-sm text-ink-400">Sign up to browse products, track orders, and manage your account.</p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Field label="Name" error={errors.fullName?.message}>
          <input type="text" {...register("fullName")} className={inputClass} placeholder="Jane Doe" />
        </Field>

        <Field label="Email" error={errors.email?.message}>
          <input type="email" {...register("email")} className={inputClass} placeholder="you@email.com" />
        </Field>

        <Field label="Postcode" error={errors.postcode?.message}>
          <input
            type="text"
            {...register("postcode")}
            className={inputClass}
            placeholder="BT1 1AA"
            autoComplete="postal-code"
          />
        </Field>

        <Field label="Phone number" error={errors.phone?.message}>
          <input
            type="tel"
            {...register("phone")}
            className={inputClass}
            placeholder="+44 7700 900000"
            autoComplete="tel"
          />
        </Field>

        <Field label="Password" error={errors.password?.message}>
          <input type="password" {...register("password")} className={inputClass} placeholder="••••••••" />
          <p className="mt-1 text-[10px] text-ink-500">Min 8 chars, 1 uppercase, 1 symbol</p>
        </Field>

        <Field label="Confirm password" error={errors.confirm?.message}>
          <input type="password" {...register("confirm")} className={inputClass} placeholder="••••••••" />
        </Field>

        {submissionError && <p className="text-sm text-red-300">{submissionError}</p>}

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating account…" : "Create account"}
        </Button>
      </form>

      {success && (
        <div className="space-y-3 rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-100">
          <p className="font-semibold text-emerald-200">✅ Account created — you&apos;re logged in!</p>
          <p>Redirecting to products in {countdown > 0 ? countdown : 1}s…</p>
          <Button asChild size="lg" className="w-full">
            <Link href="/products">Browse products now</Link>
          </Button>
        </div>
      )}

      <p className="text-sm text-ink-400">
        Already have an account?{" "}
        <Link className="text-white underline" href="/login">
          Log in
        </Link>
      </p>
    </section>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs uppercase tracking-[0.3em] text-ink-500">
      {label}
      <div className="mt-1">
        {children}
        {error && <p className="mt-1 text-xs text-red-300">{error}</p>}
      </div>
    </label>
  );
}
