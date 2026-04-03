"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/components/providers/NotificationProvider";
import { useAuth } from "@/components/providers/AuthProvider";

export function NotificationBell() {
  const { unreadCount, notifications, loading, error, refreshNotifications, markRead, markAllRead } = useNotifications();
  const { token } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open && token) refreshNotifications();
  }, [open, token, refreshNotifications]);

  const toggle = () => {
    if (!token) {
      router.push('/login');
      return;
    }
    setOpen((prev) => !prev);
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Notifications"
        onClick={toggle}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-white transition hover:border-white/40"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-500 px-1 text-[11px] font-semibold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)}>
          <div
            className="absolute right-4 top-16 w-full max-w-sm rounded-[32px] border border-white/10 bg-night-950/95 p-4 text-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">Notifications</p>
                <p className="text-lg font-semibold">Latest updates</p>
              </div>
              <button
                className="text-xs text-white/60 underline"
                onClick={async () => {
                  await markAllRead();
                  await refreshNotifications();
                }}
              >
                Mark all
              </button>
            </div>
            <div className="mt-4 max-h-[360px] space-y-3 overflow-y-auto pr-1">
              {loading && <p className="text-sm text-white/60">Loading…</p>}
              {error && <p className="text-sm text-red-300">{error}</p>}
              {!loading && notifications.length === 0 && !error && (
                <p className="text-sm text-white/60">No notifications yet.</p>
              )}
              {notifications.map((notification) => (
                <article
                  key={notification.id}
                  className={`rounded-2xl border px-4 py-3 text-sm ${notification.read ? "border-white/10 text-white/70" : "border-white/40 bg-white/5"}`}
                >
                  <h4 className="font-semibold text-white">{notification.title}</h4>
                  <p className="text-white/70">{notification.message}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-white/40">
                    <span>{new Date(notification.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</span>
                    {!notification.read && (
                      <button className="text-white/70 underline" onClick={() => markRead([notification.id])}>
                        Mark read
                      </button>
                    )}
                  </div>
                  {notification.metadata?.ctaUrl && (
                    <Link
                      href={notification.metadata.ctaUrl}
                      className="mt-2 inline-flex items-center text-xs font-semibold uppercase tracking-[0.3em] text-brand-200"
                    >
                      {notification.metadata?.ctaLabel || "View"} →
                    </Link>
                  )}
                </article>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-white/70">
              <Link href="/notifications" className="font-semibold text-white underline" onClick={() => setOpen(false)}>
                View all
              </Link>
              <button className="text-xs uppercase tracking-[0.3em]" onClick={() => refreshNotifications()}>
                Refresh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="stroke-white">
      <path
        d="M7 8a5 5 0 0 1 10 0v3.5c0 .7.2 1.4.6 2l1 1.5H5.4l1-1.5c.4-.6.6-1.3.6-2V8Z"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M10 19a2 2 0 0 0 4 0" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
