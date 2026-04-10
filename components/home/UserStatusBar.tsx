"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { useNotifications } from "@/components/providers/NotificationProvider";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export function UserStatusBar() {
  const { token } = useAuth();
  const { unreadCount } = useNotifications();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    apiFetch("/api/account/wallet/balance")
      .then((res: any) => {
        const bal = res?.data?.balance ?? res?.balance;
        if (typeof bal === "number") setBalance(bal);
        else if (typeof bal === "string") setBalance(parseFloat(bal));
      })
      .catch(() => {});
  }, [token]);

  if (!token) return null;

  return (
    <div className="flex items-center gap-2 sm:hidden">
      {/* Wallet */}
      <Link
        href="/wallet"
        className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5"
      >
        <span className="text-sm">💰</span>
        <span className="text-xs font-semibold text-emerald-300">
          {balance !== null ? `£${balance.toFixed(2)}` : "—"}
        </span>
      </Link>

      {/* Notifications */}
      <Link
        href="/account/notifications"
        className="relative flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5"
      >
        <span className="text-sm">🔔</span>
        {unreadCount > 0 ? (
          <span className="text-xs font-semibold text-rose-300">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : (
          <span className="text-xs text-white/40">0</span>
        )}
      </Link>
    </div>
  );
}

export default UserStatusBar;
