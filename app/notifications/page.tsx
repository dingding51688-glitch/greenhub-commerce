"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useNotifications } from "@/components/providers/NotificationProvider";
import { listNotifications, markRead as apiMarkRead } from "@/lib/notifications-api";
import type { NotificationRecord } from "@/lib/notifications-api";
import { StateMessage } from "@/components/StateMessage";
import Button from "@/components/ui/button";

const PAGE_SIZE = 10;

type Filter = "all" | "unread";

export default function NotificationsPage() {
  const { token } = useAuth();
  const router = useRouter();
  const { refreshNotifications, markAllRead } = useNotifications();
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<number[]>([]);
  const [items, setItems] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ page: number; pageCount: number; total: number } | null>(null);

  const loadNotifications = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const response = await listNotifications({ page, pageSize: PAGE_SIZE, unreadOnly: filter === "unread" });
      setItems(response.data);
      if (response.meta?.pagination) {
        setMeta(response.meta.pagination as typeof meta);
      }
    } catch (err: any) {
      setError(err?.message || "Unable to load notifications");
    } finally {
      setLoading(false);
    }
  }, [token, page, filter]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    setSelected([]);
  }, [page, filter]);

  const toggleSelection = (id: number) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const markSelectedRead = async () => {
    if (selected.length === 0) return;
    await apiMarkRead(selected);
    await Promise.all([loadNotifications(), refreshNotifications()]);
    setSelected([]);
  };

  if (!token) {
    return (
      <StateMessage
        title="Please login"
        body="Notifications sync with your Bloom locker profile."
        actionLabel="Login"
        onAction={() => router.push("/login")}
      />
    );
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Notifications</p>
          <h1 className="text-3xl font-semibold text-white">Inbox</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={async () => {
              await markAllRead();
              await Promise.all([refreshNotifications(), loadNotifications()]);
            }}
          >
            Mark all read
          </Button>
          <Button variant="ghost" onClick={() => loadNotifications()}>
            Refresh
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap gap-3 text-sm">
        {["all", "unread"].map((option) => (
          <button
            key={option}
            className={`rounded-full border px-4 py-2 uppercase tracking-[0.3em] ${
              filter === option ? "border-white text-white" : "border-white/15 text-white/60"
            }`}
            onClick={() => {
              setFilter(option as Filter);
              setPage(1);
            }}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="rounded-[40px] border border-white/10 bg-night-950/70 p-4">
        {loading ? (
          <p className="text-sm text-white/60">Loading…</p>
        ) : error ? (
          <StateMessage variant="error" title="Unable to load" body={error} actionLabel="Retry" onAction={loadNotifications} />
        ) : items.length === 0 ? (
          <StateMessage variant="empty" title="No notifications" body="You're all caught up." />
        ) : (
          <div className="space-y-3">
            {items.map((notification) => (
              <article key={notification.id} className={`rounded-3xl border px-4 py-3 ${notification.read ? "border-white/10" : "border-white/30 bg-white/5"}`}>
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 accent-brand-500"
                    checked={selected.includes(notification.id)}
                    onChange={() => toggleSelection(notification.id)}
                  />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-base font-semibold text-white">{notification.title}</h3>
                      <span className="text-xs text-white/40">
                        {new Date(notification.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-white/70">{notification.message}</p>
                    {notification.metadata?.ctaUrl && (
                      <a
                        href={notification.metadata.ctaUrl}
                        className="mt-2 inline-flex items-center text-xs font-semibold uppercase tracking-[0.3em] text-brand-200"
                      >
                        {notification.metadata?.ctaLabel || "View"} →
                      </a>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-white/60">Selected: {selected.length}</p>
          <Button disabled={selected.length === 0} onClick={markSelectedRead} className="mt-2 sm:mt-0">
            Mark selected read
          </Button>
        </div>
        {meta && meta.pageCount > 1 && (
          <div className="flex items-center gap-2 text-sm text-white/70">
            <button
              className="rounded-full border border-white/15 px-3 py-1 disabled:opacity-40"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
            >
              Prev
            </button>
            <span>
              Page {page} / {meta.pageCount}
            </span>
            <button
              className="rounded-full border border-white/15 px-3 py-1 disabled:opacity-40"
              onClick={() => setPage((prev) => Math.min(meta.pageCount, prev + 1))}
              disabled={page >= meta.pageCount}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
