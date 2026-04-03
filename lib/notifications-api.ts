import { getStoredToken } from "@/lib/auth-store";

const AUTH_BASE = process.env.NEXT_PUBLIC_AUTH_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";

function ensureBase() {
  if (!AUTH_BASE) throw new Error("NEXT_PUBLIC_AUTH_BASE_URL missing");
}

async function notificationsFetch<T>(path: string, init?: RequestInit): Promise<T> {
  ensureBase();
  const token = getStoredToken();
  if (!token) throw new Error("Login required");
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init?.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");
  const response = await fetch(`${AUTH_BASE}${path}`, {
    ...init,
    headers
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized. Please sign in again.");
    }
    throw new Error(payload?.error?.message || "Notification request failed");
  }
  return payload as T;
}

export type NotificationRecord = {
  id: number;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  metadata?: {
    ctaLabel?: string;
    ctaUrl?: string;
    icon?: string;
    [key: string]: unknown;
  };
};

export type ListNotificationsResponse = {
  data: NotificationRecord[];
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
};

export async function listNotifications(params?: { page?: number; pageSize?: number; unreadOnly?: boolean }) {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", params.page.toString());
  if (params?.pageSize) query.set("pageSize", params.pageSize.toString());
  if (params?.unreadOnly) query.set("unreadOnly", "true");
  const qs = query.toString();
  const url = `/api/notifications${qs ? `?${qs}` : ""}`;
  return notificationsFetch<ListNotificationsResponse>(url);
}

export async function getUnreadCount() {
  return notificationsFetch<{ count: number }>("/api/notifications/unread-count");
}

export async function markRead(ids: number[]) {
  return notificationsFetch<{ success: boolean }>("/api/notifications/mark-read", {
    method: "PUT",
    body: JSON.stringify({ ids })
  });
}

export async function markAllRead() {
  return notificationsFetch<{ success: boolean }>("/api/notifications/mark-all-read", {
    method: "PUT"
  });
}
