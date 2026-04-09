"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import Button from "@/components/ui/button";
import { StateMessage } from "@/components/StateMessage";
import { useAuth } from "@/components/providers/AuthProvider";
import { useNotifications } from "@/components/providers/NotificationProvider";
import type { NotificationRecord } from "@/lib/types";

const dateFmt = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });

const typeIcon: Record<string, string> = {
  welcome: "🎉",
  topup_success: "💰",
  commission_earned: "🤝",
  friend_registered: "🙌",
  friend_topup: "💸",
  order_confirmed: "✅",
  order_shipped: "📦",
  order_tracking: "🚚",
  system: "🔔",
  withdrawal_submitted: "📤",
  withdrawal_approved: "✅",
  withdrawal_rejected: "❌",
  withdrawal_paid: "💵",
};

type NotificationResponse = {
  success: boolean;
  data: NotificationRecord[];
};

type ActionNotice = {
  type: "success" | "error";
  message: string;
};

type NotificationAction = {
  label: string;
  href: string;
};

const ACTION_WALLET_PREFIXES = ["wallet_", "topup_", "transfer_", "withdrawal_"];

function resolveNotificationAction(record: NotificationRecord): NotificationAction | null {
  const type = record.type || "";
  const metadata = (record.metadata || {}) as Record<string, any>;

  if (type.startsWith("order_")) {
    const reference =
      (metadata?.reference as string) ||
      (metadata?.orderReference as string) ||
      (metadata?.orderId as string) ||
      (metadata?.order?.reference as string);
    const href = reference ? `/orders/${reference}` : "/orders";
    return { label: "View order", href };
  }

  if (ACTION_WALLET_PREFIXES.some((prefix) => type.startsWith(prefix))) {
    return { label: "View wallet", href: "/wallet" };
  }

  return null;
}

const notificationsFetcher = async (): Promise<NotificationResponse> => {
  const response = await fetch("/api/account/notifications", { cache: "no-store" });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message || payload?.error || "Unable to load notifications");
  }
  return payload as NotificationResponse;
};

export default function NotificationCenterPage() {
  const { token } = useAuth();
  const router = useRouter();
  const { refreshUnreadCount } = useNotifications();
  const { data, error, isLoading, mutate } = useSWR<NotificationResponse>(token ? "/api/account/notifications" : null, notificationsFetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
  });
  const [actionNotice, setActionNotice] = useState<ActionNotice | null>(null);
  const notifications = useMemo(() => data?.data ?? [], [data]);
  const unreadCount = useMemo(() => notifications.filter((record) => !record.isRead).length, [notifications]);

  const markAllRead = async () => {
    if (unreadCount === 0) return;
    try {
      setActionNotice(null);
      const response = await fetch("/api/account/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAll" }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error?.message || "Unable to mark all as read");
      }
      setActionNotice({ type: "success", message: "All notifications marked as read" });
      await mutate();
      refreshUnreadCount();
    } catch (markError: any) {
      setActionNotice({ type: "error", message: markError?.message || "Failed to update notifications" });
    }
  };

  const markSingle = async (id: number) => {
    try {
      setActionNotice(null);
      const response = await fetch("/api/account/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: [id] }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error?.message || "Unable to mark notification as read");
      }
      await mutate();
      refreshUnreadCount();
    } catch (markError: any) {
      setActionNotice({ type: "error", message: markError?.message || "Failed to update notifications" });
    }
  };

  if (!token) {
    return (
      <StateMessage
        title="Please sign in"
        body="Log in to view your inbox."
        actionLabel="Go to login"
        onAction={() => router.push("/login")}
      />
    );
  }

  if (error) {
    return (
      <StateMessage
        variant="error"
        title="Unable to load notifications"
        body={error.message}
        actionLabel="Retry"
        onAction={() => mutate()}
      />
    );
  }

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-white/10 bg-card p-6 shadow-card">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Notification center</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold text-white">Inbox</h1>
          {unreadCount > 0 && (
            <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">
              {unreadCount} unread
            </span>
          )}
        </div>
        <p className="mt-2 text-sm text-white/60">
          Concierge, wallet, and referral alerts appear here instantly. We keep the last 60 days.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={markAllRead} disabled={unreadCount === 0} variant="secondary">
            Mark all read
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/wallet">Back to wallet</Link>
          </Button>
        </div>
      </header>

      {actionNotice && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            actionNotice.type === "success"
              ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
              : "border-red-400/40 bg-red-400/10 text-red-100"
          }`}
        >
          {actionNotice.message}
        </div>
      )}

      {isLoading && notifications.length === 0 ? (
        <div className="h-56 animate-pulse rounded-3xl bg-white/5" />
      ) : notifications.length === 0 ? (
        <StateMessage
          title="No notifications yet"
          body="You’ll see wallet, order, and referral updates here."
          actionLabel="Browse products"
          variant="empty"
          onAction={() => router.push("/products")}
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((record) => (
            <NotificationCard key={record.id} record={record} onMarkRead={markSingle} />
          ))}
        </div>
      )}
    </section>
  );
}

function NotificationCard({ record, onMarkRead }: { record: NotificationRecord; onMarkRead: (id: number) => void }) {
  const icon = typeIcon[record.type] ?? "🔔";
  const createdAt = record.createdAt ? dateFmt.format(new Date(record.createdAt)) : "Just now";
  const action = resolveNotificationAction(record);

  return (
    <article
      className={`flex flex-col gap-4 rounded-3xl border px-4 py-4 text-sm shadow-card sm:flex-row sm:items-center sm:justify-between ${
        record.isRead ? "border-white/10 bg-white/5" : "border-emerald-400/20 bg-emerald-400/5"
      }`}
    >
      <div className="flex flex-1 items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 text-xl">{icon}</div>
        <div className="space-y-1 text-white/80">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-semibold text-white">{record.title}</p>
            {!record.isRead && (
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-white">Unread</span>
            )}
          </div>
          <p className="text-sm text-white/70">{record.message}</p>
          <p className="text-xs text-white/40">{createdAt}</p>
        </div>
      </div>
      {(action || !record.isRead) && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
          {action && (
            <Button asChild size="sm">
              <Link href={action.href}>{action.label}</Link>
            </Button>
          )}
          {!record.isRead && (
            <Button size="sm" variant="secondary" onClick={() => onMarkRead(record.id)}>
              Mark read
            </Button>
          )}
        </div>
      )}
    </article>
  );
}
