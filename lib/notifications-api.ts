import { getStoredToken } from "@/lib/auth-store";

/**
 * Notifications use the dedicated Next.js API route at /api/account/notifications
 * rather than the generic Strapi proxy (/api/strapi/...) because:
 *  - The server route resolves STRAPI_DIRECT_URL correctly at runtime
 *  - Avoids double-path issues (/api/strapi/api/notifications)
 *  - Works even when STRAPI_DIRECT_URL isn't set as a NEXT_PUBLIC_ env var
 */

const NOTIFICATIONS_ROUTE = "/api/account/notifications";

async function authFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const token = getStoredToken();
  if (!token) throw new Error("Login required");
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init?.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");
  const response = await fetch(url, { ...init, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) throw new Error("Unauthorized. Please sign in again.");
    throw new Error(payload?.error?.message || payload?.error || "Notification request failed");
  }
  return payload as T;
}

export type NotificationRecord = {
  id: number;
  title: string;
  message: string;
  type?: string;
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
  return authFetch<ListNotificationsResponse>(`${NOTIFICATIONS_ROUTE}${qs ? `?${qs}` : ""}`);
}

export async function getUnreadCount() {
  // Use the list route with unreadOnly flag and count from response
  // This avoids needing a separate endpoint
  try {
    const response = await authFetch<ListNotificationsResponse>(`${NOTIFICATIONS_ROUTE}?unreadOnly=true&pageSize=100`);
    return { count: response.data?.filter((n) => !n.read).length ?? 0 };
  } catch {
    return { count: 0 };
  }
}

export async function markRead(ids: number[]) {
  return authFetch<{ success: boolean }>(NOTIFICATIONS_ROUTE, {
    method: "PUT",
    body: JSON.stringify({ notificationIds: ids }),
  });
}

export async function markAllRead() {
  return authFetch<{ success: boolean }>(NOTIFICATIONS_ROUTE, {
    method: "PUT",
    body: JSON.stringify({ action: "markAll" }),
  });
}
