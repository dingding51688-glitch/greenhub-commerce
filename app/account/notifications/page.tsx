"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "@/components/ui/button";
import { StateMessage } from "@/components/StateMessage";
import { useAuth } from "@/components/providers/AuthProvider";
import { swrFetcher } from "@/lib/api";

const prefSchema = z.object({
  enableSystem: z.boolean().default(true),
  enableEmail: z.boolean().default(true),
  enableTelegram: z.boolean().default(false),
  enableSms: z.boolean().default(false),
  quietHoursStart: z.string().default("22:00"),
  quietHoursEnd: z.string().default("08:00")
});

export type NotificationPreferenceForm = z.infer<typeof prefSchema>;

type PreferenceResponse = {
  enableSystem?: boolean;
  enableEmail?: boolean;
  enableTelegram?: boolean;
  enableSms?: boolean;
  quietHours?: {
    start?: string;
    end?: string;
  } | null;
};

function toFormValues(payload?: PreferenceResponse): NotificationPreferenceForm {
  return {
    enableSystem: payload?.enableSystem ?? true,
    enableEmail: payload?.enableEmail ?? true,
    enableTelegram: payload?.enableTelegram ?? false,
    enableSms: payload?.enableSms ?? false,
    quietHoursStart: payload?.quietHours?.start ?? "22:00",
    quietHoursEnd: payload?.quietHours?.end ?? "08:00"
  };
}

function toPayload(values: NotificationPreferenceForm) {
  return {
    enableSystem: true,
    enableEmail: values.enableEmail,
    enableTelegram: values.enableTelegram,
    enableSms: values.enableSms,
    quietHours: {
      start: values.quietHoursStart,
      end: values.quietHoursEnd
    }
  };
}

export default function NotificationPreferencesPage() {
  const { token, profile } = useAuth();
  const router = useRouter();
  const { data, error, isLoading, mutate } = useSWR<PreferenceResponse>(token ? "/api/account/notifications" : null, swrFetcher);
  const prefForm = useForm<NotificationPreferenceForm>({ resolver: zodResolver(prefSchema), defaultValues: toFormValues() });
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      prefForm.reset(toFormValues(data));
    }
  }, [data, prefForm]);

  if (!token) {
    return (
      <StateMessage
        title="Please sign in"
        body="Log in to manage notifications."
        actionLabel="Go to login"
        onAction={() => router.push("/login")}
      />
    );
  }

  if (error) {
    return (
      <StateMessage
        variant="error"
        title="Unable to load preferences"
        body={error.message}
        actionLabel="Retry"
        onAction={() => mutate()}
      />
    );
  }

  const canUseTelegram = Boolean(profile?.telegramHandle);
  const canUseSms = Boolean(profile?.phone);

  const persist = async (nextValues: NotificationPreferenceForm, previousValues?: NotificationPreferenceForm) => {
    setSaving(true);
    setStatus(null);
    try {
      const response = await fetch("/api/account/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(nextValues))
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error?.message || "Unable to update preferences");
      }
      await mutate(undefined, true);
      setStatus({ type: "success", message: "Preferences saved" });
    } catch (prefError: any) {
      if (previousValues) {
        prefForm.reset(previousValues);
      }
      setStatus({ type: "error", message: prefError?.message || "Update failed" });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (field: keyof NotificationPreferenceForm, value: boolean) => {
    const previous = prefForm.getValues();
    const nextValues = { ...previous, [field]: value };
    prefForm.setValue(field, value);
    void persist(nextValues, previous);
  };

  const handleQuietHoursSave = (values: NotificationPreferenceForm) => {
    void persist(values);
  };

  return (
    <section className="space-y-8">
      <header className="rounded-3xl border border-white/10 bg-card p-6 shadow-card">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Notification preferences</p>
        <h1 className="text-3xl font-semibold text-white">Choose how we reach you</h1>
        <p className="mt-2 text-sm text-white/60">
          Critical order and security alerts stay on. Quiet hours only mute marketing pushes. Update contact info in {" "}
          <Link href="/account" className="underline">account settings</Link> or chat with <Link href="/support" className="underline">support</Link>.
        </p>
      </header>

      {isLoading && !data ? (
        <div className="h-48 animate-pulse rounded-3xl bg-white/5" />
      ) : (
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-night-950/70 p-6">
            <PreferenceToggle
              label="In-app notifications"
              description="System alerts in the bell menu — cannot be disabled."
              value={prefForm.watch("enableSystem")}
              disabled
            />
            <PreferenceToggle
              label="Email"
              description="Order receipts, locker updates, promotional drops."
              value={prefForm.watch("enableEmail")}
              onChange={(checked) => handleToggle("enableEmail", checked)}
            />
            <PreferenceToggle
              label="Telegram"
              description={canUseTelegram ? "Direct DM from concierge." : "Add your @handle first, then enable."}
              value={canUseTelegram && prefForm.watch("enableTelegram")}
              disabled={!canUseTelegram}
              actionLabel={!canUseTelegram ? "Link Telegram" : undefined}
              actionHref={!canUseTelegram ? "/support" : undefined}
              onChange={(checked) => handleToggle("enableTelegram", checked)}
            />
            <PreferenceToggle
              label="SMS"
              description={canUseSms ? "Locker ready texts and urgent alerts." : "Add a phone number to enable SMS."}
              value={canUseSms && prefForm.watch("enableSms")}
              disabled={!canUseSms}
              actionLabel={!canUseSms ? "Update phone" : undefined}
              actionHref={!canUseSms ? "/account" : undefined}
              onChange={(checked) => handleToggle("enableSms", checked)}
            />
          </div>

          <div className="rounded-3xl border border-white/10 bg-night-950/60 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Quiet hours</p>
            <p className="mt-1 text-sm text-white/60">Applies to marketing/promo pings only. Concierge + order updates still break through.</p>
            <form
              className="mt-4 grid gap-4 sm:grid-cols-2"
              onSubmit={prefForm.handleSubmit(handleQuietHoursSave)}
            >
              <label className="text-xs uppercase tracking-[0.3em] text-white/40">
                Start
                <input
                  type="time"
                  step={300}
                  {...prefForm.register("quietHoursStart")}
                  className="mt-1 w-full rounded-2xl border border-white/15 bg-transparent px-3 py-2 text-sm text-white"
                />
              </label>
              <label className="text-xs uppercase tracking-[0.3em] text-white/40">
                End
                <input
                  type="time"
                  step={300}
                  {...prefForm.register("quietHoursEnd")}
                  className="mt-1 w-full rounded-2xl border border-white/15 bg-transparent px-3 py-2 text-sm text-white"
                />
              </label>
              <div className="sm:col-span-2 flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save quiet hours"}
                </Button>
              </div>
            </form>
          </div>

          {status && (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm ${
                status.type === "success"
                  ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
                  : "border-red-400/40 bg-red-400/10 text-red-100"
              }`}
            >
              {status.message}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

type ToggleProps = {
  label: string;
  description: string;
  value: boolean;
  disabled?: boolean;
  actionLabel?: string;
  actionHref?: string;
  onChange?: (value: boolean) => void;
};

function PreferenceToggle({ label, description, value, disabled, actionLabel, actionHref, onChange }: ToggleProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-white/10 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="text-xs text-white/50">{description}</p>
        {actionLabel && actionHref && (
          <Link href={actionHref} className="text-xs text-brand-200 underline">
            {actionLabel}
          </Link>
        )}
      </div>
      <label className={`relative inline-flex h-8 w-14 items-center rounded-full ${disabled ? "opacity-40" : "cursor-pointer"}`}>
        <input
          type="checkbox"
          className="sr-only"
          disabled={disabled}
          checked={value}
          onChange={(event) => onChange?.(event.target.checked)}
        />
        <span className={`inline-block h-6 w-6 rounded-full bg-white transition ${value ? "translate-x-6" : "translate-x-1"}`} />
      </label>
    </div>
  );
}
