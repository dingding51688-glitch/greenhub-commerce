"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/components/providers/AuthProvider";
import useSWR from "swr";
import Button from "@/components/ui/button";
import { StateMessage } from "@/components/StateMessage";
import { swrFetcher } from "@/lib/api";
import type { WalletBalanceResponse, WalletTransactionsResponse } from "@/lib/types";

const currency = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
const dateFmt = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });

const phoneRegex = /^\+?[0-9]{7,15}$/;
const telegramRegex = /^@?[a-zA-Z0-9_]{5,32}$/;

const profileSchema = z.object({
  fullName: z.string().nonempty(),
  email: z.string().email(),
  phone: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || phoneRegex.test(value), {
      message: "Enter a valid phone number"
    }),
  telegramHandle: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || telegramRegex.test(value), {
      message: "Enter a valid Telegram handle"
    }),
  preferredLocker: z.string().optional().or(z.literal("")),
  marketingOptIn: z.boolean()
});

type ProfileFormValues = z.infer<typeof profileSchema>;

type CustomerProfileResponse = {
  data?: {
    id: number;
    attributes: {
      fullName?: string;
      email?: string;
      phone?: string | null;
      telegramHandle?: string | null;
      preferredLocker?: string | null;
      marketingOptIn?: boolean;
      lockerPreferences?: {
        data: {
          id: number;
          attributes?: {
            code?: string;
            label?: string;
          };
        }[];
      };
    };
  };
};

const profileInputClass = "w-full rounded-2xl border border-white/15 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/40";
export default function AccountPage() {
  const { token, userEmail, profile, refreshProfile } = useAuth();
  const router = useRouter();

  const {
    data: balanceData,
    error: balanceError,
    isLoading: balanceLoading,
    mutate: refreshBalance,
  } = useSWR<WalletBalanceResponse>(token ? "/api/wallet/balance" : null, swrFetcher, {
    refreshInterval: 60_000,
  });

  const {
    data: txData,
    error: txError,
    isLoading: txLoading,
    mutate: refreshTransactions,
  } = useSWR<WalletTransactionsResponse>(
    token ? "/api/wallet/transactions?page=1&pageSize=10" : null,
    swrFetcher,
    { refreshInterval: 90_000 }
  );

  const nextApiFetcher = useCallback(async (path: string) => {
    const response = await fetch(path, { cache: "no-store" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.error?.message || payload?.message || "Request failed");
    }
    return payload as CustomerProfileResponse;
  }, []);

  const {
    data: customerProfile,
    error: customerError,
    isLoading: customerLoading,
    mutate: refreshCustomerProfile,
  } = useSWR<CustomerProfileResponse>(token ? "/api/account/profile" : null, nextApiFetcher);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: profile?.fullName || "",
      email: profile?.email || userEmail || "",
      phone: "",
      telegramHandle: "",
      preferredLocker: "",
      marketingOptIn: false
    }
  });

  const [profileAlert, setProfileAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const lockerOptions = useMemo(() => {
    const nodes = customerProfile?.data?.attributes?.lockerPreferences?.data || [];
    return nodes.map((node) => ({
      value: node.attributes?.code || String(node.id),
      label: node.attributes?.label || node.attributes?.code || `Locker ${node.id}`
    }));
  }, [customerProfile]);

  useEffect(() => {
    const attrs = customerProfile?.data?.attributes;
    if (!attrs) return;
    profileForm.reset({
      fullName: attrs.fullName || profile?.fullName || "",
      email: attrs.email || profile?.email || userEmail || "",
      phone: attrs.phone || "",
      telegramHandle: attrs.telegramHandle || "",
      preferredLocker: attrs.preferredLocker || "",
      marketingOptIn: Boolean(attrs.marketingOptIn)
    });
  }, [customerProfile, profileForm, profile, userEmail]);

  const transactionsSection = useMemo(() => {
    if (txLoading) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-16 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      );
    }

    if (txError) {
      return (
        <StateMessage
          variant="error"
          title="Unable to load transactions"
          body={txError.message}
          actionLabel="Retry"
          onAction={() => refreshTransactions()}
        />
      );
    }

    const rows = txData?.data || [];
    if (rows.length === 0) {
      return (
        <StateMessage
          variant="empty"
          title="No wallet activity yet"
          body="Place an order or top up to see history."
        />
      );
    }

    return (
      <div className="divide-y divide-white/5 overflow-hidden rounded-3xl border border-white/10 bg-card">
        {rows.map((tx) => (
          <div key={tx.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold capitalize">{tx.type.replace(/_/g, " ")}</p>
              <p className="text-xs text-white/50">{tx.reference}</p>
            </div>
            <div className="text-sm text-white/60">
              {tx.createdAt ? dateFmt.format(new Date(tx.createdAt)) : "—"}
            </div>
            <div className="text-right">
              <p className={tx.amount >= 0 ? "text-emerald-300" : "text-red-300"}>
                {tx.amount >= 0 ? "+" : ""}
                {currency.format(tx.amount)}
              </p>
              <p className="text-xs text-white/50">
                Balance {tx.balanceAfter !== undefined ? currency.format(tx.balanceAfter) : "—"}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  }, [txData, txError, txLoading, refreshTransactions]);
  const submitProfile = async (values: ProfileFormValues) => {
    setProfileAlert(null);
    setSavingProfile(true);
    try {
      const response = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: values.phone?.trim() ? values.phone.trim() : null,
          telegramHandle: values.telegramHandle ? values.telegramHandle.replace(/^@/, "") : null,
          preferredLocker: values.preferredLocker || null,
          marketingOptIn: values.marketingOptIn
        })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error?.message || "Unable to update profile");
      }
      setProfileAlert({ type: "success", message: "Profile updated" });
      await Promise.all([refreshCustomerProfile(), refreshProfile()]);
    } catch (error: any) {
      setProfileAlert({ type: "error", message: error?.message || "Update failed" });
    } finally {
      setSavingProfile(false);
    }
  };


  if (!token) {
    return (
      <StateMessage
        title="Please sign in"
        body="Log in to see your wallet balance and recent activity."
        actionLabel="Go to login"
        onAction={() => router.push("/login")}
      />
    );
  }

  return (
    <section className="space-y-8">
      <div className="rounded-3xl border border-white/10 bg-card p-6 shadow-card">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Profile settings</p>
            <h2 className="text-2xl font-semibold text-white">Manage your locker identity</h2>
          </div>
          <button
            onClick={() => refreshCustomerProfile()}
            className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60 underline"
          >
            Reload
          </button>
        </div>
        <p className="mt-2 text-sm text-white/60">Need concierge help? Visit the <Link className="text-white underline" href="/support">support hub</Link>.</p>
        <p className="text-sm text-white/60">Manage alerts in the <Link className="text-white underline" href="/account/notifications">notification center</Link>.</p>
        {customerLoading && !customerProfile ? (
          <div className="mt-4 space-y-3">
            <div className="h-12 animate-pulse rounded-2xl bg-white/5" />
            <div className="h-12 animate-pulse rounded-2xl bg-white/5" />
            <div className="h-12 animate-pulse rounded-2xl bg-white/5" />
          </div>
        ) : customerError ? (
          <StateMessage
            variant="error"
            title="Unable to load profile"
            body={customerError.message}
            actionLabel="Retry"
            onAction={() => refreshCustomerProfile()}
          />
        ) : (
          <form className="mt-4 space-y-4" onSubmit={profileForm.handleSubmit(submitProfile)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <ProfileField label="Full name" error={profileForm.formState.errors.fullName?.message}>
                <input
                  type="text"
                  readOnly
                  {...profileForm.register("fullName")}
                  className={profileInputClass}
                />
              </ProfileField>
              <ProfileField label="Email" error={profileForm.formState.errors.email?.message}>
                <input type="email" readOnly {...profileForm.register("email")} className={profileInputClass} />
              </ProfileField>
              <ProfileField label="Phone" error={profileForm.formState.errors.phone?.message}>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    placeholder="+44 7700 900000"
                    {...profileForm.register("phone")}
                    className={`${profileInputClass} flex-1`}
                  />
                  <button
                    type="button"
                    onClick={() => profileForm.setValue("phone", "", { shouldDirty: true })}
                    className="rounded-2xl border border-white/10 px-3 text-xs font-semibold uppercase tracking-[0.3em] text-white/60 transition hover:border-white/30"
                  >
                    Clear
                  </button>
                </div>
                <p className="text-xs text-white/40">Leave blank if you don’t want a phone on file.</p>
              </ProfileField>
              <ProfileField label="Telegram" error={profileForm.formState.errors.telegramHandle?.message}>
                <input type="text" placeholder="@locker_member" {...profileForm.register("telegramHandle")} className={profileInputClass} />
              </ProfileField>
              <ProfileField label="Preferred locker" error={profileForm.formState.errors.preferredLocker?.message}>
                <select {...profileForm.register("preferredLocker")} className={profileInputClass}>
                  <option value="">Select a locker</option>
                  {lockerOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </ProfileField>
            </div>
            <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
              <input type="checkbox" className="mt-1 h-4 w-4 accent-brand-500" {...profileForm.register("marketingOptIn")} />
              <span>
                Opt-in to Bloom locker marketing updates
                <small className="block text-white/50">Discount drops + locker opening alerts.</small>
              </span>
            </label>
            {profileAlert && (
              <div
                className={`rounded-2xl border px-3 py-2 text-sm ${
                  profileAlert.type === "success"
                    ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
                    : "border-red-400/40 bg-red-400/10 text-red-100"
                }`}
              >
                {profileAlert.message}
              </div>
            )}
            <div className="flex justify-end">
              <Button type="submit" disabled={savingProfile}>
                {savingProfile ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        )}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {balanceLoading ? (
          <div className="h-40 animate-pulse rounded-3xl bg-white/5" />
        ) : balanceError ? (
          <StateMessage
            variant="error"
            title="Unable to load balance"
            body={balanceError.message}
            actionLabel="Retry"
            onAction={() => refreshBalance()}
          />
        ) : (
          <div className="rounded-3xl border border-white/10 bg-card p-6 shadow-2xl shadow-brand-600/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-white/60">Available</p>
                <p className="mt-2 text-4xl font-semibold">
                  {balanceData ? currency.format(balanceData.balance) : "—"}
                </p>
                <p className="mt-2 text-sm text-white/60">
                  Lifetime top-up {balanceData ? currency.format(balanceData.lifetimeTopUp) : "—"} · Bonus {" "}
                  {balanceData ? currency.format(balanceData.bonusAwarded) : "—"}
                </p>
              </div>
              <button
                onClick={() => refreshBalance()}
                className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/80 transition hover:border-white/50"
              >
                Refresh
              </button>
            </div>
          </div>
        )}
        <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-white/80">
          <p className="text-lg font-semibold">Top up your wallet</p>
          <p className="mt-1 text-sm text-white/60">
            Real recharge flow will live here. For now, use the dashboard or NowPayments to add funds.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              disabled
              placeholder="Amount (£)"
              className="flex-1 rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-white/80 placeholder:text-white/40"
            />
            <button className="rounded-2xl bg-white/10 px-6 py-3 text-sm font-semibold text-white/60" disabled>
              Coming soon
            </button>
          </div>
        </div>
      </div>
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent activity</h2>
          <button
            onClick={() => refreshTransactions()}
            className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/70 hover:border-white/40"
          >
            Refresh
          </button>
        </div>
        {transactionsSection}
      </div>
    </section>
  );
}

function ProfileField({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
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
