"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "@/components/ui/button";
import { StateMessage } from "@/components/StateMessage";
import { useAuth } from "@/components/providers/AuthProvider";
import { swrFetcher } from "@/lib/api";

const emailSchema = z
  .object({
    newEmail: z.string().email("Enter a valid email"),
    confirmEmail: z.string().email("Confirm with the same email"),
    currentPassword: z.string().min(8, "Enter your current password"),
  })
  .refine((data) => data.newEmail === data.confirmEmail, {
    path: ["confirmEmail"],
    message: "Emails do not match",
  });

const passwordSchema = z
  .object({
    currentPassword: z.string().min(8, "Enter your current password"),
    newPassword: z
      .string()
      .min(12, "Use at least 12 characters")
      .regex(/(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/, "Add upper, lower, number, symbol"),
    confirmPassword: z.string()
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match"
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

type EmailFormValues = z.infer<typeof emailSchema>;

type DeviceRecord = {
  id: number;
  device: string;
  location: string;
  lastActive: string;
  current?: boolean;
};

const dateFmt = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });

function passwordStrength(password: string) {
  const score = [
    /.{12,}/.test(password),
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password)
  ].filter(Boolean).length;
  if (!password) return { label: "Enter a new password", tone: "muted" };
  if (score <= 2) return { label: "Weak", tone: "weak" };
  if (score === 3) return { label: "Okay", tone: "ok" };
  return { label: "Strong", tone: "strong" };
}

export default function AccountSecurityPage() {
  const { token, userEmail, refreshProfile } = useAuth();
  const router = useRouter();
  const emailForm = useForm<EmailFormValues>({ resolver: zodResolver(emailSchema) });
  const passwordForm = useForm<PasswordFormValues>({ resolver: zodResolver(passwordSchema) });
  const [emailStatus, setEmailStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const { data: devicesData, error: devicesError, isLoading: devicesLoading, mutate: refreshDevices } = useSWR<{ devices: DeviceRecord[] }>(
    token ? "/api/account/security/devices" : null,
    swrFetcher
  );

  if (!token) {
    return (
      <StateMessage
        title="Please sign in"
        body="Log in to manage your security settings."
        actionLabel="Go to login"
        onAction={() => router.push("/login")}
      />
    );
  }

  const onSubmit = async (values: PasswordFormValues) => {
    setPasswordStatus(null);
    setPasswordLoading(true);
    try {
      const response = await fetch("/api/account/security/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          password: values.newPassword,
          passwordConfirmation: values.confirmPassword
        })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error?.message || "Unable to change password");
      }
      passwordForm.reset();
      setPasswordStatus({ type: "success", message: "Password updated" });
    } catch (error: any) {
      setPasswordStatus({ type: "error", message: error?.message || "Update failed" });
    } finally {
      setPasswordLoading(false);
    }
  };

  const submitEmailChange = async (values: EmailFormValues) => {
    setEmailStatus(null);
    setEmailLoading(true);
    try {
      const response = await fetch("/api/account/security/change-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newEmail: values.newEmail,
          currentPassword: values.currentPassword
        })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error?.message || "Unable to change email");
      }
      emailForm.reset();
      setEmailStatus({ type: "success", message: "Email updated" });
      await refreshProfile();
    } catch (error: any) {
      setEmailStatus({ type: "error", message: error?.message || "Update failed" });
    } finally {
      setEmailLoading(false);
    }
  };

  const strength = passwordStrength(passwordForm.watch("newPassword"));

  const devices = devicesData?.devices || [];

  const revokeDevice = async (id: number) => {
    try {
      await fetch("/api/account/security/devices", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      await refreshDevices();
    } catch (error) {
      console.warn("Failed to revoke device", error);
    }
  };

  return (
    <section className="space-y-8">
      <header className="rounded-3xl border border-white/10 bg-card p-6 shadow-card">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Account security</p>
        <h1 className="hidden text-3xl font-semibold text-white sm:block">Keep your locker safe</h1>
        <p className="mt-2 hidden text-sm text-white/60 sm:block">Security reminder: avoid saving passwords on shared devices and enable concierge approvals for sensitive changes.</p>
      </header>

      <div className="rounded-3xl border border-white/10 bg-night-950/80 p-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold text-white">Change email</h2>
          <p className="text-sm text-white/60">
            Current: <span className="font-mono text-white">{userEmail || "—"}</span>. We’ll send a security alert to your locker inbox.
          </p>
        </div>
        <form className="mt-4 space-y-4" onSubmit={emailForm.handleSubmit(submitEmailChange)}>
          <InputField label="New email" error={emailForm.formState.errors.newEmail?.message}>
            <input type="email" {...emailForm.register("newEmail")} className="w-full rounded-2xl border border-white/15 bg-transparent px-3 py-2 text-white" />
          </InputField>
          <InputField label="Confirm email" error={emailForm.formState.errors.confirmEmail?.message}>
            <input type="email" {...emailForm.register("confirmEmail")} className="w-full rounded-2xl border border-white/15 bg-transparent px-3 py-2 text-white" />
          </InputField>
          <InputField label="Current password" error={emailForm.formState.errors.currentPassword?.message}>
            <input type="password" {...emailForm.register("currentPassword")} className="w-full rounded-2xl border border-white/15 bg-transparent px-3 py-2 text-white" />
          </InputField>
          {emailStatus && (
            <div
              className={`rounded-2xl border px-3 py-2 text-sm ${
                emailStatus.type === "success"
                  ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
                  : "border-red-400/40 bg-red-400/10 text-red-100"
              }`}
            >
              {emailStatus.message}
            </div>
          )}
          <div className="flex justify-end">
            <Button type="submit" disabled={emailLoading}>
              {emailLoading ? "Saving…" : "Update email"}
            </Button>
          </div>
        </form>
      </div>

      <div className="rounded-3xl border border-white/10 bg-night-950/80 p-6">
        <h2 className="text-xl font-semibold text-white">Change password</h2>
        <p className="text-sm text-white/60">Set a strong, unique password. We’ll sign out other sessions when you change it.</p>
        <form className="mt-4 space-y-4" onSubmit={passwordForm.handleSubmit(onSubmit)}>
          <InputField label="Current password" error={passwordForm.formState.errors.currentPassword?.message}>
            <input type="password" {...passwordForm.register("currentPassword")} className="w-full rounded-2xl border border-white/15 bg-transparent px-3 py-2 text-white" />
          </InputField>
          <InputField label="New password" error={passwordForm.formState.errors.newPassword?.message}>
            <input type="password" {...passwordForm.register("newPassword")} className="w-full rounded-2xl border border-white/15 bg-transparent px-3 py-2 text-white" />
            <p className={`text-xs ${strength.tone === "weak" ? "text-red-300" : strength.tone === "ok" ? "text-amber-200" : strength.tone === "strong" ? "text-emerald-300" : "text-white/50"}`}>
              {strength.label}
            </p>
          </InputField>
          <InputField label="Confirm password" error={passwordForm.formState.errors.confirmPassword?.message}>
            <input type="password" {...passwordForm.register("confirmPassword")} className="w-full rounded-2xl border border-white/15 bg-transparent px-3 py-2 text-white" />
          </InputField>
          {passwordStatus && (
            <div
              className={`rounded-2xl border px-3 py-2 text-sm ${
                passwordStatus.type === "success"
                  ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
                  : "border-red-400/40 bg-red-400/10 text-red-100"
              }`}
            >
              {passwordStatus.message}
            </div>
          )}
          <div className="flex justify-end">
            <Button type="submit" disabled={passwordLoading}>
              {passwordLoading ? "Saving…" : "Update password"}
            </Button>
          </div>
        </form>
      </div>

      <div className="rounded-3xl border border-white/10 bg-night-950/70 p-6">
        <h2 className="text-xl font-semibold text-white">Two-factor reminders</h2>
        <p className="text-sm text-white/60">
          Telegram concierge approvals double-check sensitive actions today. Full OTP-based 2FA is coming soon — watch the
          <Link href="/referral" className="underline"> updates feed</Link> for beta access.
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-white/70">
          <li>Lock down your Telegram handle with a PIN.</li>
          <li>Enable device biometrics for autofill managers.</li>
          <li>Report suspicious activity immediately via <Link href="/support" className="underline">support</Link>.</li>
        </ul>
      </div>

      <div className="rounded-3xl border border-white/10 bg-night-950/70 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Recent sessions</h2>
          <button className="text-xs uppercase tracking-[0.3em] text-white/60 underline" onClick={() => refreshDevices()}>
            Refresh
          </button>
        </div>
        {devicesLoading ? (
          <div className="mt-4 space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-16 animate-pulse rounded-2xl bg-white/5" />
            ))}
          </div>
        ) : devicesError ? (
          <StateMessage
            variant="error"
            title="Unable to load devices"
            body={devicesError.message}
            actionLabel="Retry"
            onAction={() => refreshDevices()}
          />
        ) : devices.length === 0 ? (
          <StateMessage variant="empty" title="No sessions" body="We’ll list new logins here." />
        ) : (
          <div className="mt-4 divide-y divide-white/10 rounded-3xl border border-white/10">
            {devices.map((device) => (
              <div key={device.id} className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-white">{device.device}</p>
                  <p className="text-xs text-white/50">{device.location}</p>
                </div>
                <p className="text-sm text-white/60">{dateFmt.format(new Date(device.lastActive))}</p>
                <div className="flex items-center gap-3">
                  {device.current && <span className="rounded-full border border-emerald-400/40 px-3 py-1 text-xs text-emerald-200">Current</span>}
                  {!device.current && (
                    <button className="text-xs text-red-200 underline" onClick={() => revokeDevice(device.id)}>
                      Sign out
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function InputField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs uppercase tracking-[0.3em] text-white/40">
      {label}
      <div className="mt-1 space-y-1">
        {children}
        {error && <p className="text-xs text-red-300">{error}</p>}
      </div>
    </label>
  );
}
