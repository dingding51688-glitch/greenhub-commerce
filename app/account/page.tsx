"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/components/providers/AuthProvider";
import useSWR from "swr";
import Button from "@/components/ui/button";
import { StateMessage } from "@/components/StateMessage";
import { Skeleton } from "@/components/Skeleton";
import { swrFetcher, apiMutate } from "@/lib/api";
import { getReferralSummary, type ReferralSummary } from "@/lib/referral-api";
import type { WalletBalanceResponse, WalletTransactionsResponse, WalletTransaction } from "@/lib/types";

/* ─── constants ─── */
const currency = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
const dateFmt = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });
const phoneRegex = /^\+?[0-9]{7,15}$/;
const telegramRegex = /^@?[a-zA-Z0-9_]{5,32}$/;
const inputCls = "w-full rounded-2xl border border-white/15 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/40";

/* ─── profile schema ─── */
const profileSchema = z.object({
  fullName: z.string().nonempty(),
  email: z.string().email(),
  phone: z.string().optional().or(z.literal("")).refine((v) => !v || phoneRegex.test(v), { message: "Enter a valid phone number" }),
  telegramHandle: z.string().optional().or(z.literal("")).refine((v) => !v || telegramRegex.test(v), { message: "Enter a valid Telegram handle" }),
  preferredLocker: z.string().optional().or(z.literal("")),
  marketingOptIn: z.boolean(),
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
      transferHandle?: string;
      lockerPreferences?: { data: { id: number; attributes?: { code?: string; label?: string } }[] };
    };
  };
};

/* ─── transfer modal schema ─── */
const transferSchema = z.object({
  handle: z.string().min(3, "Enter recipient handle"),
  amount: z.preprocess((v) => Number(v), z.number().min(1, "Min £1")),
  memo: z.string().optional().or(z.literal("")),
});
type TransferFormValues = z.infer<typeof transferSchema>;

/* ─── withdraw modal schema ─── */
const withdrawSchema = z.object({
  amount: z.preprocess((v) => Number(v), z.number().min(20, "Min £20")),
  method: z.enum(["bank", "crypto"]),
  bankAccountName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankSortCode: z.string().optional(),
  cryptoAddress: z.string().optional(),
  cryptoNetwork: z.string().optional(),
  note: z.string().optional().or(z.literal("")),
});
type WithdrawFormValues = z.infer<typeof withdrawSchema>;

/* ── SWR config: don't retry on 401/403 ── */
const noRetryOnAuth = {
  shouldRetryOnError: (error: Error & { status?: number }) => {
    if (error?.status === 401 || error?.status === 403) return false;
    return true;
  },
};

/* ━━━━━━━━━━━━━━━━━━━━━ Main page ━━━━━━━━━━━━━━━━━━━━━ */
export default function AccountPage() {
  const { token, userEmail, profile, refreshProfile, logout } = useAuth();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  /* Auto-redirect to login if unauthenticated */
  useEffect(() => {
    if (token || redirecting) return;
    const timer = setTimeout(() => { setRedirecting(true); router.push("/login"); }, 3000);
    return () => clearTimeout(timer);
  }, [token, redirecting, router]);

  /* ── data fetching ── */
  const { data: customerProfile, error: customerError, isLoading: customerLoading, mutate: refreshCustomer } =
    useSWR<CustomerProfileResponse>(token ? "/api/account/profile" : null, swrFetcher, noRetryOnAuth);
  const { data: balanceData, error: balanceError, isLoading: balanceLoading, mutate: refreshBalance } =
    useSWR<WalletBalanceResponse>(token ? "/api/wallet/balance" : null, swrFetcher, { refreshInterval: 60_000, ...noRetryOnAuth });
  const { data: txData, error: txError, isLoading: txLoading, mutate: refreshTx } =
    useSWR<WalletTransactionsResponse>(token ? "/api/wallet/transactions?page=1&pageSize=10" : null, swrFetcher, { refreshInterval: 90_000, ...noRetryOnAuth });
  const { data: commissionData, error: commissionError, isLoading: commissionLoading } =
    useSWR<ReferralSummary>(token ? "referral-summary" : null, getReferralSummary, noRetryOnAuth);

  /* Handle stale/expired token: if profile returns 401/403, log out */
  useEffect(() => {
    const status = (customerError as Error & { status?: number })?.status;
    if (status === 401 || status === 403) {
      logout();
    }
  }, [customerError, logout]);

  if (!token) {
    return (
      <section className="mx-auto mt-20 max-w-md space-y-6 rounded-[40px] border border-white/10 bg-night-950/80 p-8 text-center shadow-card">
        <h2 className="text-2xl font-semibold text-white">Sign in to continue</h2>
        <p className="text-sm text-white/60">Log in or create an account to access your Account Center.</p>
        {!redirecting && <p className="text-xs text-white/40">Redirecting to login in a few seconds…</p>}
        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={() => router.push("/login")}>Log in</Button>
          <Button variant="secondary" onClick={() => router.push("/register")}>Create account</Button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-8">
      {/* ─────── Section 1: Overview ─────── */}
      <OverviewSection
        customer={customerProfile}
        customerLoading={customerLoading}
        customerError={customerError}
        refreshCustomer={refreshCustomer}
        refreshProfile={refreshProfile}
        profile={profile}
        userEmail={userEmail || undefined}
      />

      {/* ─────── Section 2: Balance ─────── */}
      <BalanceSection
        balance={balanceData}
        balanceLoading={balanceLoading}
        balanceError={balanceError}
        refreshBalance={refreshBalance}
        transactions={txData?.data}
        txLoading={txLoading}
        txError={txError}
        refreshTx={refreshTx}
      />

      {/* ─────── Section 3: Commission Hub ─────── */}
      <CommissionSection
        summary={commissionData}
        loading={commissionLoading}
        error={commissionError}
      />
    </section>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━ Section 1: Overview ━━━━━━━━━━━━━━━━━━━━━ */
function OverviewSection({
  customer, customerLoading, customerError, refreshCustomer, refreshProfile, profile, userEmail,
}: {
  customer?: CustomerProfileResponse;
  customerLoading: boolean;
  customerError: Error | undefined;
  refreshCustomer: () => void;
  refreshProfile: () => Promise<void>;
  profile: any;
  userEmail: string | undefined;
}) {
  const attrs = customer?.data?.attributes;
  const userId = customer?.data?.id;
  const transferHandle = attrs?.transferHandle;
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [profileAlert, setProfileAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: "", email: "", phone: "", telegramHandle: "", preferredLocker: "", marketingOptIn: false },
  });

  useEffect(() => {
    if (!attrs) return;
    profileForm.reset({
      fullName: attrs.fullName || profile?.fullName || "",
      email: attrs.email || profile?.email || userEmail || "",
      phone: attrs.phone || "",
      telegramHandle: attrs.telegramHandle || "",
      preferredLocker: attrs.preferredLocker || "",
      marketingOptIn: Boolean(attrs.marketingOptIn),
    });
  }, [customer, profileForm, profile, userEmail, attrs]);

  const lockerOptions = useMemo(() => {
    return (attrs?.lockerPreferences?.data || []).map((n) => ({
      value: n.attributes?.code || String(n.id),
      label: n.attributes?.label || n.attributes?.code || `Area ${n.id}`,
    }));
  }, [attrs]);

  const handleCopyId = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyToast("Copied!");
      setTimeout(() => setCopyToast(null), 2000);
    } catch { setCopyToast("Copy failed"); setTimeout(() => setCopyToast(null), 2000); }
  };

  const submitProfile = async (values: ProfileFormValues) => {
    setProfileAlert(null);
    setSaving(true);
    try {
      await apiMutate<{ data?: unknown }>("/api/account/profile", "PUT", {
        phone: values.phone?.trim() || null,
        telegramHandle: values.telegramHandle ? values.telegramHandle.replace(/^@/, "") : null,
        preferredLocker: values.preferredLocker || null,
        marketingOptIn: values.marketingOptIn,
      });
      setProfileAlert({ type: "success", message: "Profile updated" });
      await Promise.all([refreshCustomer(), refreshProfile()]);
    } catch (err: any) {
      setProfileAlert({ type: "error", message: err?.message || "Update failed" });
    } finally { setSaving(false); }
  };

  return (
    <div className="rounded-[40px] border border-white/10 bg-card p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Account Center</p>
          <h2 className="text-2xl font-semibold text-white">Overview</h2>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/account/security" className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60 underline">Security settings</Link>
          <button onClick={() => refreshCustomer()} className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60 underline">Reload</button>
        </div>
      </div>

      {/* User ID badge */}
      {userId && (
        <div className="mt-3 flex items-center gap-2">
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-mono text-white/70">
            User ID: {transferHandle || `GH-${String(userId).padStart(6, "0")}`}
          </span>
          <button onClick={() => handleCopyId(transferHandle || `GH-${String(userId).padStart(6, "0")}`)} className="text-xs text-white/50 underline">Copy</button>
          {copyToast && <span className="text-xs text-emerald-200">{copyToast}</span>}
        </div>
      )}

      {customerLoading && !customer ? (
        <div className="mt-4 space-y-3"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
      ) : customerError ? (
        <StateMessage variant="error" title="Unable to load profile" body={customerError.message} actionLabel="Retry" onAction={() => refreshCustomer()} />
      ) : (
        <form className="mt-4 space-y-4" onSubmit={profileForm.handleSubmit(submitProfile)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" error={profileForm.formState.errors.fullName?.message}>
              <input type="text" readOnly {...profileForm.register("fullName")} className={inputCls} />
            </Field>
            <Field label="Email" error={profileForm.formState.errors.email?.message}>
              <input type="email" readOnly {...profileForm.register("email")} className={inputCls} />
            </Field>
            <Field label="Phone" error={profileForm.formState.errors.phone?.message}>
              <div className="flex gap-2">
                <input type="tel" placeholder="+44 7700 900000" {...profileForm.register("phone")} className={`${inputCls} flex-1`} />
                <button type="button" onClick={() => profileForm.setValue("phone", "", { shouldDirty: true })} className="rounded-2xl border border-white/10 px-3 text-xs font-semibold uppercase tracking-[0.3em] text-white/60 transition hover:border-white/30">Clear</button>
              </div>
            </Field>
            <Field label="Telegram" error={profileForm.formState.errors.telegramHandle?.message}>
              <input type="text" placeholder="@your_handle" {...profileForm.register("telegramHandle")} className={inputCls} />
            </Field>
            <Field label="Preferred area" error={profileForm.formState.errors.preferredLocker?.message}>
              <select {...profileForm.register("preferredLocker")} className={inputCls}>
                <option value="">Select preferred area</option>
                {lockerOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
          </div>
          <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
            <input type="checkbox" className="mt-1 h-4 w-4 accent-brand-500" {...profileForm.register("marketingOptIn")} />
            <span>Opt-in to marketing updates <small className="block text-white/50">New product alerts + exclusive offers.</small></span>
          </label>
          {profileAlert && (
            <div className={`rounded-2xl border px-3 py-2 text-sm ${profileAlert.type === "success" ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100" : "border-red-400/40 bg-red-400/10 text-red-100"}`}>{profileAlert.message}</div>
          )}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
            <Button asChild variant="secondary"><Link href="/account/security">Change email or password</Link></Button>
          </div>
        </form>
      )}
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━ Section 2: Balance ━━━━━━━━━━━━━━━━━━━━━ */
function BalanceSection({
  balance, balanceLoading, balanceError, refreshBalance, transactions, txLoading, txError, refreshTx,
}: {
  balance?: WalletBalanceResponse;
  balanceLoading: boolean;
  balanceError: Error | undefined;
  refreshBalance: () => void;
  transactions?: WalletTransaction[];
  txLoading: boolean;
  txError: Error | undefined;
  refreshTx: () => void;
}) {
  const [modal, setModal] = useState<"transfer" | "withdraw" | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Account Center</p>
          <h2 className="text-2xl font-semibold text-white">Balance</h2>
        </div>
        <button onClick={() => refreshBalance()} className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/80 transition hover:border-white/50">Refresh</button>
      </div>

      {/* Balance card */}
      {balanceLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : balanceError ? (
        <StateMessage variant="error" title="Unable to load balance" body={balanceError.message} actionLabel="Retry" onAction={() => refreshBalance()} />
      ) : (
        <div className="rounded-3xl border border-white/10 bg-card p-6 shadow-2xl shadow-brand-600/10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-white/60">Available balance</p>
              <p className="mt-2 text-4xl font-semibold">{balance ? currency.format(balance.balance) : "—"}</p>
              <p className="mt-2 text-sm text-white/60">
                Lifetime top-up {balance ? currency.format(balance.lifetimeTopUp) : "—"} · Bonus {balance ? currency.format(balance.bonusAwarded) : "—"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm"><a href="/wallet/topup">Recharge</a></Button>
              <Button size="sm" variant="secondary" onClick={() => setModal("transfer")}>Transfer</Button>
              <Button size="sm" variant="secondary" onClick={() => setModal("withdraw")}>Withdraw</Button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer modal */}
      {modal === "transfer" && <TransferModal onClose={() => setModal(null)} onSuccess={() => { refreshBalance(); refreshTx(); }} />}
      {modal === "withdraw" && <WithdrawModal onClose={() => setModal(null)} onSuccess={() => { refreshBalance(); refreshTx(); }} />}

      {/* Recent transactions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Recent activity</h3>
        <button onClick={() => refreshTx()} className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/70 hover:border-white/40">Refresh</button>
      </div>
      {txLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : txError ? (
        <StateMessage variant="error" title="Unable to load transactions" body={txError.message} actionLabel="Retry" onAction={() => refreshTx()} />
      ) : !transactions?.length ? (
        <StateMessage variant="empty" title="No activity yet" body="Place an order or top up to see history." />
      ) : (
        <div className="divide-y divide-white/5 overflow-hidden rounded-3xl border border-white/10 bg-card">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold capitalize">{tx.type.replace(/_/g, " ")}</p>
                <p className="text-xs text-white/50">{tx.reference}</p>
              </div>
              <div className="text-sm text-white/60">{tx.createdAt ? dateFmt.format(new Date(tx.createdAt)) : "—"}</div>
              <div className="text-right">
                <p className={tx.amount >= 0 ? "text-emerald-300" : "text-red-300"}>{tx.amount >= 0 ? "+" : ""}{currency.format(tx.amount)}</p>
                <p className="text-xs text-white/50">Balance {tx.balanceAfter !== undefined ? currency.format(tx.balanceAfter) : "—"}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/wallet" className="text-white/70 underline">View full history</Link>
        <Link href="/wallet/withdraw/history" className="text-white/70 underline">Withdrawal history</Link>
      </div>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━ Section 3: Commission Hub ━━━━━━━━━━━━━━━━━━━━━ */
function CommissionSection({ summary, loading, error }: { summary?: ReferralSummary; loading: boolean; error?: Error }) {
  const [copyToast, setCopyToast] = useState<string | null>(null);

  const handleCopy = async () => {
    if (!summary?.link) return;
    try {
      await navigator.clipboard.writeText(summary.link);
      setCopyToast("Link copied!");
      setTimeout(() => setCopyToast(null), 2000);
    } catch { setCopyToast("Copy failed"); setTimeout(() => setCopyToast(null), 2000); }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Account Center</p>
        <h2 className="text-2xl font-semibold text-white">Commission Hub</h2>
        <p className="text-sm text-white/60">Share products and earn cash rewards — 10% of every order your referrals place.</p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : error ? (
        <StateMessage variant="error" title="Unable to load commission data" body={error.message} />
      ) : summary ? (
        <>
          {/* Stats grid */}
          <div className="grid gap-4 sm:grid-cols-4">
            <StatCard label="Total clicks" value={String(summary.clicks)} sub={`${summary.validClicks ?? 0} valid (paid)`} />
            <StatCard label="Commission earned" value={currency.format((summary.totalCommission ?? summary.bonusEarned) || 0)} sub={`${currency.format(summary.thirtyDayCommission ?? summary.monthCommission ?? 0)} last 30 days`} />
            <StatCard label="Referred spend" value={currency.format(summary.totalOrderValue ?? 0)} sub={`${summary.totalConverted ?? summary.totalInvites} customers`} />
            <StatCard label="Registrations" value={String(summary.registrations)} sub={`${summary.topups} top-ups`} />
          </div>

          {/* Invite link */}
          <div className="rounded-3xl border border-white/15 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Your invite link</p>
            <p className="mt-1 break-words font-mono text-sm text-white">{summary.link}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={handleCopy}>Copy link</Button>
              <Button asChild variant="secondary" size="sm">
                <a href={`https://t.me/share/url?url=${encodeURIComponent(summary.link)}&text=${encodeURIComponent("Join GreenHub and get great deals!")}`} target="_blank" rel="noreferrer">Share Telegram</a>
              </Button>
              <Button asChild variant="secondary" size="sm"><Link href="/referral">Full commission dashboard</Link></Button>
              <Button asChild variant="secondary" size="sm"><Link href="/referral/poster">Generate poster</Link></Button>
            </div>
            {copyToast && <p className="mt-2 text-xs text-emerald-200">{copyToast}</p>}
          </div>

          {/* Converted customers */}
          {summary.customers && summary.customers.length > 0 && (
            <div className="rounded-3xl border border-white/10 bg-card p-5">
              <p className="mb-3 text-xs uppercase tracking-[0.3em] text-white/50">Converted customers</p>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-white/80">
                  <thead className="text-white/50">
                    <tr><th className="py-2">Customer</th><th>Orders</th><th>Spend</th><th>Commission</th><th>Last order</th></tr>
                  </thead>
                  <tbody>
                    {summary.customers.map((c, index) => (
                      <tr key={c.email || `customer-${index}`} className="border-t border-white/10">
                        <td className="py-2 font-mono text-xs">{c.email || `Customer ${index + 1}`}</td>
                        <td>{c.orders}</td>
                        <td>{currency.format(c.totalSpend)}</td>
                        <td>{currency.format(c.commission)}</td>
                        <td>{c.lastOrder ? dateFmt.format(new Date(c.lastOrder)) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <StateMessage variant="empty" title="No commission data" body="Share your invite link to start earning." />
      )}
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━ Transfer Modal ━━━━━━━━━━━━━━━━━━━━━ */
function TransferModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const form = useForm<TransferFormValues>({ resolver: zodResolver(transferSchema) as Resolver<TransferFormValues>, defaultValues: { handle: "", amount: 0, memo: "" } });

  const onSubmit = async (values: TransferFormValues) => {
    setStatus(null);
    try {
      await apiMutate("/api/account/transfer", "POST", {
        recipientHandle: values.handle,
        amount: values.amount,
        memo: values.memo || undefined,
      });
      setStatus({ type: "success", message: `Transferred ${currency.format(values.amount)} to ${values.handle}` });
      onSuccess();
    } catch (err: any) {
      setStatus({ type: "error", message: err?.message || "Transfer failed" });
    }
  };

  return (
    <div className="rounded-3xl border border-white/15 bg-night-950/90 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Transfer balance</h3>
        <button onClick={onClose} className="text-sm text-white/60 underline">Close</button>
      </div>
      <form className="mt-4 space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
        <Field label="Recipient handle" error={form.formState.errors.handle?.message}>
          <input type="text" placeholder="GH-XXXXXXXX" {...form.register("handle")} className={inputCls} />
        </Field>
        <Field label="Amount (£)" error={form.formState.errors.amount?.message}>
          <input type="number" step="0.01" min="1" {...form.register("amount")} className={inputCls} />
        </Field>
        <Field label="Memo (optional)">
          <input type="text" placeholder="e.g. Split order" {...form.register("memo")} className={inputCls} />
        </Field>
        {status && <div className={`rounded-2xl border px-3 py-2 text-sm ${status.type === "success" ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100" : "border-red-400/40 bg-red-400/10 text-red-100"}`}>{status.message}</div>}
        <div className="flex gap-3">
          <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Sending…" : "Send transfer"}</Button>
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━ Withdraw Modal ━━━━━━━━━━━━━━━━━━━━━ */
function WithdrawModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const form = useForm<WithdrawFormValues>({
    resolver: zodResolver(withdrawSchema) as Resolver<WithdrawFormValues>,
    defaultValues: { amount: 20, method: "bank", bankAccountName: "", bankAccountNumber: "", bankSortCode: "", cryptoAddress: "", cryptoNetwork: "TRC20", note: "" },
  });
  const method = form.watch("method");

  const onSubmit = async (values: WithdrawFormValues) => {
    setStatus(null);
    const payoutDetails: Record<string, unknown> = {};
    if (values.method === "bank") {
      payoutDetails.accountName = values.bankAccountName;
      payoutDetails.accountNumber = values.bankAccountNumber;
      payoutDetails.sortCode = values.bankSortCode;
    } else {
      payoutDetails.address = values.cryptoAddress;
      payoutDetails.network = values.cryptoNetwork;
    }
    try {
      const { createWithdrawalRequest } = await import("@/lib/withdrawal-api");
      const result = await createWithdrawalRequest({
        amount: values.amount,
        payoutMethod: values.method,
        payoutDetails,
        note: values.note,
      });
      if (result.success) {
        setStatus({ type: "success", message: `Withdrawal request submitted (${currency.format(values.amount)})` });
        onSuccess();
      } else {
        throw new Error("Withdrawal failed");
      }
    } catch (err: any) {
      setStatus({ type: "error", message: err?.message || "Withdrawal failed" });
    }
  };

  return (
    <div className="rounded-3xl border border-white/15 bg-night-950/90 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Request withdrawal</h3>
        <button onClick={onClose} className="text-sm text-white/60 underline">Close</button>
      </div>
      <form className="mt-4 space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
        <Field label="Amount (£)" error={form.formState.errors.amount?.message}>
          <input type="number" step="0.01" min="20" {...form.register("amount")} className={inputCls} />
        </Field>
        <Field label="Method">
          <select {...form.register("method")} className={inputCls}>
            <option value="bank">UK bank transfer</option>
            <option value="crypto">USDT (TRC20 / ERC20)</option>
          </select>
        </Field>
        {method === "bank" && (
          <div className="space-y-3">
            <Field label="Account name"><input type="text" {...form.register("bankAccountName")} className={inputCls} /></Field>
            <Field label="Account number"><input type="text" {...form.register("bankAccountNumber")} className={inputCls} /></Field>
            <Field label="Sort code"><input type="text" placeholder="00-00-00" {...form.register("bankSortCode")} className={inputCls} /></Field>
          </div>
        )}
        {method === "crypto" && (
          <div className="space-y-3">
            <Field label="Wallet address"><input type="text" placeholder="T..." {...form.register("cryptoAddress")} className={inputCls} /></Field>
            <Field label="Network">
              <select {...form.register("cryptoNetwork")} className={inputCls}>
                <option value="TRC20">TRC20</option>
                <option value="ERC20">ERC20</option>
              </select>
            </Field>
          </div>
        )}
        <Field label="Note (optional)"><input type="text" {...form.register("note")} className={inputCls} /></Field>
        {status && <div className={`rounded-2xl border px-3 py-2 text-sm ${status.type === "success" ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100" : "border-red-400/40 bg-red-400/10 text-red-100"}`}>{status.message}</div>}
        <div className="flex gap-3">
          <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Submitting…" : "Submit withdrawal"}</Button>
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━ Shared components ━━━━━━━━━━━━━━━━━━━━━ */
function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-card p-4">
      <p className="text-xs uppercase tracking-[0.3em] text-white/50">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      {sub && <p className="text-sm text-white/60">{sub}</p>}
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block text-xs uppercase tracking-[0.3em] text-white/50">
      {label}
      <div className="mt-1">{children}</div>
      {error && <p className="mt-1 text-xs text-red-300">{error}</p>}
    </label>
  );
}