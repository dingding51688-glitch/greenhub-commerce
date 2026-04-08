"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  getUnreadCount,
  listNotifications,
  markRead as apiMarkRead,
  markAllRead as apiMarkAllRead,
  type NotificationRecord
} from "@/lib/notifications-api";

interface NotificationContextValue {
  notifications: NotificationRecord[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refreshNotifications: () => Promise<void>;
  markRead: (ids: number[]) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: unreadCount = 0, mutate: mutateUnread } = useSWR(token ? "notifications-unread" : null, () => getUnreadCount().then((res) => res.count), {
    refreshInterval: 60_000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true
  });

  useEffect(() => {
    if (!token) {
      setNotifications([]);
      setError(null);
    }
  }, [token]);

  const refreshNotifications = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await listNotifications({ page: 1, pageSize: 10 });
      setNotifications(response.data);
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Unable to load notifications");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const markRead = useCallback(
    async (ids: number[]) => {
      if (!ids.length || !token) return;
      await apiMarkRead(ids);
      setNotifications((prev) => prev.map((notification) => (ids.includes(notification.id) ? { ...notification, read: true } : notification)));
      // Force immediate revalidation of unread count
      await mutateUnread(undefined, { revalidate: true });
    },
    [mutateUnread, token]
  );

  const markAllRead = useCallback(async () => {
    if (!token) return;
    await apiMarkAllRead();
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
    // Optimistically set to 0 and revalidate
    await mutateUnread(0, { revalidate: true });
  }, [mutateUnread, token]);

  const value = useMemo(
    () => ({ notifications, unreadCount, loading, error, refreshNotifications, markRead, markAllRead }),
    [notifications, unreadCount, loading, error, refreshNotifications, markRead, markAllRead]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
