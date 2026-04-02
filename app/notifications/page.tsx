"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import useSWR from "swr";
import { StateMessage } from "@/components/StateMessage";
import { apiMutate, swrFetcher } from "@/lib/api";
import type { NotificationsResponse, NotificationRecord, UnreadCountResponse } from "@/lib/types";

const PAGE_SIZE = 10;
const dateFmt = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const { token } = useAuth();
  const router = useRouter();

  const baseKey = token
    ? `/api/notifications?page=${page}&pageSize=${PAGE_SIZE}&unreadOnly=${unreadOnly}`
    : null;

  const { data, error, isLoading, mutate } = useSWR<NotificationsResponse>(baseKey, swrFetcher, {
    refreshInterval: 90_000,
  });
  const { data: unread, mutate: refreshUnread } = useSWR<UnreadCountResponse>(
    token ? "/api/notifications/unread-count" : null,
    swrFetcher,
    { refreshInterval: 60_000 }
  );

  const rows = useMemo(() => data?.data || [], [data]);
  const canGoNext = rows.length === PAGE_SIZE;

  const toggleSelection = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]));
  };

  const clearBannerLater = () => {
    setTimeout(() => setBanner(null), 3_000);
  };

  const handleMarkSelected = async () => {
    if (selectedIds.length === 0) return;
    try {
      await apiMutate("/api/notifications/mark-read", "PUT", { notificationIds: selectedIds });
      setSelectedIds([]);
      setBanner({ type: "success", message: "Selected notifications marked as read." });
      await Promise.all([mutate(), refreshUnread()]);
      clearBannerLater();
    } catch (err: any) {
      setBanner({ type: "error", message: err.message || "Failed to mark notifications" });
      clearBannerLater();
    }
  };

  const handleMarkAll = async () => {
    try {
      await apiMutate("/api/notifications/mark-all-read", "PUT");
      setSelectedIds([]);
      setBanner({ type: "success", message: "All notifications marked as read." });
      await Promise.all([mutate(), refreshUnread()]);
      clearBannerLater();
    } catch (err: any) {
      setBanner({ type: "error", message: err.message || "Failed to mark all read" });
      clearBannerLater();
    }
  };

  const listContent = useMemo(() => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-3xl bg-white/5" />
          ))}
        </div>
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

    if (rows.length === 0) {
      return (
        <StateMessage
          variant="empty"
          title={unreadOnly ? "No unread notifications" : "No notifications yet"}
          body={unreadOnly ? "Switch to All to see archived messages." : "Your activity feed will appear here."}
        />
      );
    }

    return (
      <div className="space-y-3">
        {rows.map((notification) => (
          <NotificationCard
            key={notification.id}
            record={notification}
            checked={selectedIds.includes(notification.id)}
            onToggle={() => toggleSelection(notification.id)}
          />
        ))}
      </div>
    );
  }, [rows, isLoading, error, unreadOnly, selectedIds, mutate]);

  if (!token) {
    return (
      <StateMessage
        title="Please sign in"
        body="Login to see in-app messages and alerts."
        actionLabel="Go to login"
        onAction={() => router.push("/login")}
      />
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setUnreadOnly((prev) => !prev)}
          className={`rounded-full border px-4 py-2 text-sm transition ${
            unreadOnly ? "border-brand-500 bg-brand-500/20 text-white" : "border-white/15 text-white/70 hover:border-white/40"
          }`}
        >
          {unreadOnly ? "Showing unread" : "Showing all"}
        </button>
        <button
          onClick={handleMarkSelected}
          disabled={selectedIds.length === 0}
          className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/80 transition enabled:hover:border-white/40 disabled:opacity-40"
        >
          Mark selected read
        </button>
        <button
          onClick={handleMarkAll}
          className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/80 transition hover:border-white/40"
        >
          Mark all read
        </button>
        <div className="ml-auto text-sm text-white/60">
          Unread: {unread?.unreadCount ?? "—"}
        </div>
      </div>

      {banner && (
        <div
          className={`rounded-3xl border px-4 py-3 text-sm ${
            banner.type === "success"
              ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
              : "border-red-400/40 bg-red-400/10 text-red-100"
          }`}
        >
          {banner.message}
        </div>
      )}

      {listContent}

      <div className="flex items-center justify-between text-sm text-white/60">
        <button
          onClick={() => {
            setPage((prev) => Math.max(1, prev - 1));
            setSelectedIds([]);
          }}
          disabled={page === 1 || isLoading}
          className="rounded-full border border-white/10 px-4 py-2 enabled:hover:border-white/40 disabled:opacity-30"
        >
          Previous
        </button>
        <p>Page {page}</p>
        <button
          onClick={() => {
            if (!canGoNext) return;
            setPage((prev) => prev + 1);
            setSelectedIds([]);
          }}
          disabled={!canGoNext || isLoading}
          className="rounded-full border border-white/10 px-4 py-2 enabled:hover:border-white/40 disabled:opacity-30"
        >
          Next
        </button>
      </div>
    </section>
  );
}

function NotificationCard({
  record,
  checked,
  onToggle,
}: {
  record: NotificationRecord;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="flex cursor-pointer gap-4 rounded-3xl border border-white/10 bg-card p-4">
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 rounded border-white/30 bg-transparent"
        checked={checked}
        onChange={onToggle}
      />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs uppercase tracking-wide text-white/70">
            {record.type.replace(/_/g, " ")}
          </span>
          {!record.isRead && <span className="h-2 w-2 rounded-full bg-brand-500" />}
          {record.createdAt && (
            <span className="text-xs text-white/40">{dateFmt.format(new Date(record.createdAt))}</span>
          )}
        </div>
        <p className="mt-2 text-base font-semibold text-white">{record.title}</p>
        <p className="text-sm text-white/70">{record.message}</p>
        {record.metadata && Object.keys(record.metadata).length > 0 && (
          <p className="mt-2 text-xs text-white/50">{JSON.stringify(record.metadata)}</p>
        )}
      </div>
    </label>
  );
}
