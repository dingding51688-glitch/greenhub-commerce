"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { useAuth } from "@/components/providers/AuthProvider";
import { useNotifications } from "@/components/providers/NotificationProvider";
import type { NotificationRecord } from "@/lib/types";

const ICON: Record<string, string> = {
  welcome: "🎉", topup_success: "💰", commission_earned: "🤝",
  friend_registered: "🙌", friend_topup: "💸", order_confirmed: "✅",
  order_shipped: "📦", order_tracking: "🚚", system: "🔔",
  withdrawal_submitted: "📤", withdrawal_approved: "✅",
  withdrawal_rejected: "❌", withdrawal_paid: "💵",
};

const WALLET_PREFIXES = ["wallet_", "topup_", "transfer_", "withdrawal_"];

function resolveAction(r: NotificationRecord): { label: string; href: string } | null {
  const meta = (r.metadata || {}) as Record<string, any>;
  if (meta?.ctaUrl && meta?.ctaLabel) return { label: meta.ctaLabel, href: meta.ctaUrl };
  if (r.type?.startsWith("order_")) {
    const ref = meta?.reference || meta?.orderReference || meta?.orderId || meta?.order?.reference;
    return { label: "View order", href: ref ? `/orders/${ref}` : "/orders" };
  }
  if (WALLET_PREFIXES.some((p) => r.type?.startsWith(p))) return { label: "View wallet", href: "/wallet" };
  return null;
}

function relativeTime(iso?: string) {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

type Res = { success: boolean; data: NotificationRecord[] };

const fetcher = async (): Promise<Res> => {
  const r = await fetch("/api/account/notifications", { cache: "no-store" });
  const p = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(p?.error?.message || "Failed");
  return p as Res;
};

export default function NotificationsPage() {
  const { token } = useAuth();
  const router = useRouter();
  const { refreshUnreadCount } = useNotifications();
  const { data, error, isLoading, mutate } = useSWR<Res>(token ? "/api/account/notifications" : null, fetcher, { revalidateOnFocus: false });
  const [marking, setMarking] = useState(false);

  const notifications = useMemo(() => data?.data ?? [], [data]);
  const unread = useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications]);

  const markAllRead = async () => {
    if (!unread) return;
    setMarking(true);
    try {
      await fetch("/api/account/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAll" }),
      });
      await mutate();
      refreshUnreadCount();
    } catch {} finally { setMarking(false); }
  };

  const markOne = async (id: number) => {
    try {
      await fetch("/api/account/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: [id] }),
      });
      await mutate();
      refreshUnreadCount();
    } catch {}
  };

  if (!token) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="space-y-3 text-center">
          <p className="text-4xl">🔐</p>
          <p className="text-sm font-bold text-white">Sign in to view notifications</p>
          <Link href="/login" className="inline-flex min-h-[40px] items-center rounded-xl cta-gradient px-5 text-sm font-bold text-white">Log in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24 sm:space-y-6 sm:pb-20">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href="/account" className="text-white/30 hover:text-white/50">← Account</Link>
        <span className="text-white/15">/</span>
        <span className="text-xs text-white/50">Notifications</span>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Notifications</h1>
          {unread > 0 && (
            <p className="mt-0.5 text-xs text-amber-300">{unread} unread</p>
          )}
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            disabled={marking}
            className="text-[10px] text-white/30 hover:text-white/50 disabled:opacity-40"
          >
            {marking ? "…" : "Mark all read"}
          </button>
        )}
      </div>

      {/* List */}
      {isLoading && notifications.length === 0 ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-white/5" />)}
        </div>
      ) : error && notifications.length === 0 ? (
        <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-center">
          <p className="text-sm text-red-200">Unable to load notifications</p>
          <button onClick={() => mutate()} className="mt-2 text-xs text-white/50 underline">Retry</button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="space-y-3 text-center">
            <p className="text-3xl">🔔</p>
            <p className="text-sm font-medium text-white">No notifications yet</p>
            <p className="text-xs text-white/30">Wallet, order, and referral updates appear here</p>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          {notifications.map((n) => (
            <NotificationRow key={n.id} record={n} onMarkRead={markOne} />
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationRow({ record, onMarkRead }: { record: NotificationRecord; onMarkRead: (id: number) => void }) {
  const icon = ICON[record.type] ?? "🔔";
  const action = resolveAction(record);
  const time = relativeTime(record.createdAt);

  return (
    <div className={`rounded-xl border px-3 py-3 transition ${
      record.isRead
        ? "border-white/5 bg-white/[0.01]"
        : "border-emerald-400/15 bg-emerald-400/[0.03]"
    }`}>
      <div className="flex gap-3">
        {/* Icon */}
        <span className="mt-0.5 text-lg">{icon}</span>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-xs font-semibold ${record.isRead ? "text-white/70" : "text-white"}`}>
              {record.title}
            </p>
            <span className="shrink-0 text-[9px] text-white/20">{time}</span>
          </div>
          <p className="mt-0.5 text-[11px] text-white/40 line-clamp-2">{record.message}</p>

          {/* Actions */}
          {(action || !record.isRead) && (
            <div className="mt-2 flex items-center gap-2">
              {action && (
                <Link href={action.href}
                  className="rounded-lg bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-white/60 transition hover:bg-white/10 hover:text-white">
                  {action.label}
                </Link>
              )}
              {!record.isRead && (
                <button
                  onClick={() => onMarkRead(record.id)}
                  className="text-[10px] text-white/25 hover:text-white/50"
                >
                  Mark read
                </button>
              )}
            </div>
          )}
        </div>

        {/* Unread dot */}
        {!record.isRead && (
          <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
        )}
      </div>
    </div>
  );
}
