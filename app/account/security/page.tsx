"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/components/providers/AuthProvider";

const emailSchema = z
  .object({
    newEmail: z.string().email("Enter a valid email"),
    confirmEmail: z.string().email("Confirm email"),
    currentPassword: z.string().min(8, "Enter your current password"),
  })
  .refine((d) => d.newEmail === d.confirmEmail, { path: ["confirmEmail"], message: "Emails do not match" });

const passwordSchema = z
  .object({
    currentPassword: z.string().min(8, "Enter your current password"),
    newPassword: z.string().min(12, "At least 12 characters").regex(/(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/, "Need upper, lower, number, symbol"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" });

type EmailForm = z.infer<typeof emailSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

const inputCls = "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/25";

function strength(pw: string) {
  const s = [/.{12,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length;
  if (!pw) return { label: "", cls: "bg-white/10", pct: 0 };
  if (s <= 2) return { label: "Weak", cls: "bg-red-400", pct: 33 };
  if (s === 3) return { label: "Okay", cls: "bg-amber-400", pct: 66 };
  return { label: "Strong", cls: "bg-emerald-400", pct: 100 };
}

export default function SecurityPage() {
  const { token, userEmail } = useAuth();
  const router = useRouter();
  const [section, setSection] = useState<"email" | "password" | null>(null);

  const emailForm = useForm<EmailForm>({ resolver: zodResolver(emailSchema) });
  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const [emailStatus, setEmailStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [pwStatus, setPwStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  if (!token) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="space-y-3 text-center">
          <p className="text-4xl">🔐</p>
          <p className="text-sm font-bold text-white">Sign in first</p>
          <Link href="/login" className="inline-flex min-h-[40px] items-center rounded-xl cta-gradient px-5 text-sm font-bold text-white">Log in</Link>
        </div>
      </div>
    );
  }

  const submitEmail = async (v: EmailForm) => {
    setEmailStatus(null);
    setEmailLoading(true);
    try {
      const res = await fetch("/api/account/security/change-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail: v.newEmail, currentPassword: v.currentPassword }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d?.error?.message || "Failed");
      emailForm.reset();
      setEmailStatus({ ok: true, msg: d.message || "Verification email sent! Check your inbox." });
    } catch (e: any) {
      setEmailStatus({ ok: false, msg: e?.message || "Failed" });
    } finally { setEmailLoading(false); }
  };

  const submitPassword = async (v: PasswordForm) => {
    setPwStatus(null);
    setPwLoading(true);
    try {
      const res = await fetch("/api/account/security/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: v.currentPassword, password: v.newPassword, passwordConfirmation: v.confirmPassword }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d?.error?.message || "Failed");
      passwordForm.reset();
      setPwStatus({ ok: true, msg: "Password updated" });
    } catch (e: any) {
      setPwStatus({ ok: false, msg: e?.message || "Failed" });
    } finally { setPwLoading(false); }
  };

  const pw = passwordForm.watch("newPassword") || "";
  const str = strength(pw);

  return (
    <div className="space-y-4 pb-24 sm:space-y-6 sm:pb-20">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href="/account" className="text-white/30 hover:text-white/50">← Account</Link>
        <span className="text-white/15">/</span>
        <span className="text-xs text-white/50">Security</span>
      </div>

      <div>
        <h1 className="text-xl font-bold text-white">Security</h1>
        <p className="mt-0.5 text-xs text-white/40">Manage your email and password</p>
      </div>

      {/* Current email display */}
      <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3">
        <span className="text-lg">📧</span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] text-white/30">Current email</p>
          <p className="truncate text-sm font-mono text-white">{userEmail || "—"}</p>
        </div>
      </div>

      {/* Change Email */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02]">
        <button
          onClick={() => setSection(section === "email" ? null : "email")}
          className="flex w-full items-center justify-between px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <span className="text-base">✉️</span>
            <div className="text-left">
              <p className="text-sm font-medium text-white">Change Email</p>
              <p className="text-[10px] text-white/30">We&apos;ll send a verification link to the new address</p>
            </div>
          </div>
          <span className={`text-white/30 transition ${section === "email" ? "rotate-180" : ""}`}>▾</span>
        </button>

        {section === "email" && (
          <form className="space-y-3 border-t border-white/5 px-4 pb-4 pt-3" onSubmit={emailForm.handleSubmit(submitEmail)}>
            <Field label="New email" error={emailForm.formState.errors.newEmail?.message}>
              <input type="email" placeholder="new@example.com" {...emailForm.register("newEmail")} className={inputCls} />
            </Field>
            <Field label="Confirm email" error={emailForm.formState.errors.confirmEmail?.message}>
              <input type="email" placeholder="new@example.com" {...emailForm.register("confirmEmail")} className={inputCls} />
            </Field>
            <Field label="Current password" error={emailForm.formState.errors.currentPassword?.message}>
              <input type="password" placeholder="••••••••" {...emailForm.register("currentPassword")} className={inputCls} />
            </Field>

            {emailStatus && (
              <div className={`rounded-xl border px-3 py-2 text-xs ${emailStatus.ok ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-red-400/30 bg-red-400/10 text-red-200"}`}>
                {emailStatus.msg}
              </div>
            )}

            <button type="submit" disabled={emailLoading}
              className="flex w-full min-h-[44px] items-center justify-center rounded-xl cta-gradient text-sm font-bold text-white disabled:opacity-40">
              {emailLoading ? "Sending…" : "Send Verification Email"}
            </button>
          </form>
        )}
      </div>

      {/* Change Password */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02]">
        <button
          onClick={() => setSection(section === "password" ? null : "password")}
          className="flex w-full items-center justify-between px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <span className="text-base">🔑</span>
            <div className="text-left">
              <p className="text-sm font-medium text-white">Change Password</p>
              <p className="text-[10px] text-white/30">Use a strong, unique password</p>
            </div>
          </div>
          <span className={`text-white/30 transition ${section === "password" ? "rotate-180" : ""}`}>▾</span>
        </button>

        {section === "password" && (
          <form className="space-y-3 border-t border-white/5 px-4 pb-4 pt-3" onSubmit={passwordForm.handleSubmit(submitPassword)}>
            <Field label="Current password" error={passwordForm.formState.errors.currentPassword?.message}>
              <input type="password" placeholder="••••••••" {...passwordForm.register("currentPassword")} className={inputCls} />
            </Field>
            <Field label="New password" error={passwordForm.formState.errors.newPassword?.message}>
              <input type="password" placeholder="Min 12 chars" {...passwordForm.register("newPassword")} className={inputCls} />
              {pw && (
                <div className="mt-1.5 space-y-1">
                  <div className="h-1 overflow-hidden rounded-full bg-white/8">
                    <div className={`h-full rounded-full transition-all ${str.cls}`} style={{ width: `${str.pct}%` }} />
                  </div>
                  <p className={`text-[9px] ${str.pct === 100 ? "text-emerald-300" : str.pct > 33 ? "text-amber-300" : "text-red-300"}`}>{str.label}</p>
                </div>
              )}
            </Field>
            <Field label="Confirm password" error={passwordForm.formState.errors.confirmPassword?.message}>
              <input type="password" placeholder="••••••••" {...passwordForm.register("confirmPassword")} className={inputCls} />
            </Field>

            {pwStatus && (
              <div className={`rounded-xl border px-3 py-2 text-xs ${pwStatus.ok ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-red-400/30 bg-red-400/10 text-red-200"}`}>
                {pwStatus.msg}
              </div>
            )}

            <button type="submit" disabled={pwLoading}
              className="flex w-full min-h-[44px] items-center justify-center rounded-xl cta-gradient text-sm font-bold text-white disabled:opacity-40">
              {pwLoading ? "Saving…" : "Update Password"}
            </button>
          </form>
        )}
      </div>

      {/* Security tips */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <p className="text-sm font-bold text-white mb-2">🛡️ Security Tips</p>
        <div className="space-y-1.5 text-xs text-white/40">
          <p>• Use a unique password not used on other sites</p>
          <p>• Enable biometric lock on your password manager</p>
          <p>• Lock your Telegram with a PIN code</p>
          <p>• Report suspicious activity via <Link href="/support" className="text-emerald-400 underline">support</Link></p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wider text-white/40">{label}</span>
      <div className="mt-1">{children}</div>
      {error && <p className="mt-1 text-[10px] text-red-300">{error}</p>}
    </label>
  );
}
