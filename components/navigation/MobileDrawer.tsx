"use client";

import clsx from "clsx";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { DrawerSection, MenuCTAGroup, NavItem } from "@/data/fixtures/navigation";
import { LogoMark } from "./LogoMark";
import { useNotifications } from "@/components/providers/NotificationProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCart } from "@/components/providers/CartProvider";
import { apiFetch } from "@/lib/api";

export type MobileDrawerProps = {
  open: boolean;
  onClose: () => void;
  sections: DrawerSection[];
  ctas: MenuCTAGroup;
  navItems: NavItem[];
};

export function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { unreadCount } = useNotifications();
  const { logout, token, profile } = useAuth();
  const { totalItems } = useCart();
  const isAuthenticated = Boolean(token);
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!open || !token) return;
    apiFetch("/api/wallet/balance")
      .then((res: any) => {
        const bal = res?.data?.balance ?? res?.balance;
        if (typeof bal === "number") setBalance(bal);
        else if (typeof bal === "string") setBalance(parseFloat(bal));
      })
      .catch(() => {});
  }, [open, token]);

  const go = (href: string) => { onClose(); router.push(href); };
  const displayName = profile?.fullName || profile?.username || profile?.email?.split("@")[0] || "";

  return (
    <div className={clsx("fixed inset-0 z-40 transition duration-300", open ? "pointer-events-auto" : "pointer-events-none")}>
      <div className={clsx("absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity", open ? "opacity-100" : "opacity-0")} onClick={onClose} />
      <aside className={clsx(
        "absolute inset-y-0 right-0 flex w-[85vw] max-w-[340px] flex-col border-l border-white/10 bg-[#0a0a0a] shadow-2xl transition-transform duration-300",
        open ? "translate-x-0" : "translate-x-full"
      )}>
        {/* ── Header ── */}
        <div className="border-b border-white/8 px-5 py-3">
          <div className="flex items-center justify-between">
            <LogoMark size={28} />
            <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white" aria-label="Close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* ── 🔥 Earn Hub — 醒目推广卡片 ── */}
          <div className="px-4 pt-4 pb-2">
            <button onClick={() => go("/account/commission")}
              className="relative w-full overflow-hidden rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/20 via-emerald-400/10 to-transparent p-4 text-left active:scale-[0.98] transition">
              {/* 背景装饰 */}
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-emerald-400/10 blur-2xl" />
              <div className="absolute -bottom-2 -left-2 h-16 w-16 rounded-full bg-emerald-400/5 blur-xl" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-lg">💰</span>
                  <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">15%+ Commission</span>
                </div>
                <p className="text-base font-bold text-white">Earn Hub</p>
                <p className="mt-0.5 text-xs text-white/50">Invite friends &amp; earn on every order they place — for life</p>
                <div className="mt-3 flex items-center gap-1.5 text-emerald-300">
                  <span className="text-xs font-semibold">Start earning</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
              </div>
            </button>
          </div>

          {/* ── Quick actions (logged in) ── */}
          {isAuthenticated && (
            <div className="px-4 py-2">
              {/* Wallet row */}
              <button onClick={() => go("/wallet")}
                className="flex w-full items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 mb-2 active:bg-white/[0.06] transition">
                <div className="flex items-center gap-2.5">
                  <span className="text-base">💳</span>
                  <span className="text-sm font-medium text-white/60">Balance</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-emerald-400">{balance !== null ? `£${balance.toFixed(2)}` : "—"}</span>
                  <span className="text-white/20">›</span>
                </div>
              </button>
              <div className="grid grid-cols-3 gap-2">
                <QuickAction emoji="📦" label="Orders" onClick={() => go("/orders")} />
                <QuickAction emoji="🔔" label="Alerts" onClick={() => go("/account/notifications")} badge={unreadCount > 0 ? (unreadCount > 99 ? "99+" : `${unreadCount}`) : undefined} />
                <QuickAction emoji="💰" label="Top Up" onClick={() => go("/wallet/topup")} />
              </div>
            </div>
          )}

          {/* ── Shop ── */}
          <div className="px-3 py-2">
            <p className="px-2 text-[9px] font-bold uppercase tracking-[0.3em] text-white/25 mb-1.5">Shop</p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { emoji: "🛍️", label: "All Products", href: "/products" },
                { emoji: "🌿", label: "Flowers", href: "/products?category=flowers" },
                { emoji: "🚬", label: "Pre-rolls", href: "/products?category=pre-rolls" },
                { emoji: "💨", label: "Vapes", href: "/products?category=vapes" },
                { emoji: "🍬", label: "Edibles", href: "/products?category=edibles" },
                { emoji: "🧊", label: "Concentrates", href: "/products?category=concentrates" },
              ].map((cat) => {
                const isActive = pathname === cat.href || (cat.href.includes("=") && pathname?.includes(cat.href.split("=")[1] || ""));
                return (
                  <button key={cat.href} onClick={() => go(cat.href)}
                    className={clsx(
                      "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition",
                      isActive ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" : "border-white/6 bg-white/[0.02] text-white/60 active:bg-white/[0.05]"
                    )}>
                    <span className="text-base">{cat.emoji}</span>
                    <span className="text-xs font-medium">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Cart (if has items) ── */}
          {totalItems > 0 && (
            <div className="px-3 py-2">
              <button onClick={() => go("/cart")}
                className="flex w-full items-center justify-between rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-3 active:scale-[0.98] transition">
                <div className="flex items-center gap-3">
                  <span className="text-base">🛒</span>
                  <span className="text-sm font-semibold text-white">Cart</span>
                </div>
                <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-xs font-bold text-emerald-300">{totalItems}</span>
              </button>
            </div>
          )}

          {/* ── Account & Help ── */}
          <div className="px-3 py-2 border-t border-white/5">
            <div className="space-y-0.5">
              {isAuthenticated && (
                <NavRow icon="👤" label="Account" href="/account" onClick={go} active={pathname === "/account"} />
              )}
              <NavRow icon="📖" label="How It Works" href="/how-it-works" onClick={go} active={pathname === "/how-it-works"} />
              <NavRow icon="💬" label="Support" href="/support" onClick={go} active={pathname === "/support"} />
              <NavRow icon="❓" label="FAQ" href="/faq" onClick={go} active={pathname === "/faq"} />
            </div>
            {/* Telegram channel */}
            <a href="https://t.me/greenhub420" target="_blank" rel="noopener noreferrer"
              className="mt-2 flex w-full items-center gap-3 rounded-xl border border-blue-400/15 bg-blue-400/5 px-3 py-2.5 active:bg-blue-400/10 transition">
              <span className="text-base">✈️</span>
              <span className="text-sm font-medium text-blue-300">Telegram Channel</span>
              <span className="ml-auto text-[9px] font-semibold text-blue-300/50">JOIN</span>
            </a>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-white/8 px-5 py-3">
          {isAuthenticated ? (
            <button onClick={() => { logout(); onClose(); router.push("/login"); }}
              className="flex w-full min-h-[40px] items-center justify-center gap-2 rounded-xl border border-red-400/15 text-sm font-medium text-red-300/60 active:bg-red-400/5">
              Sign Out
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => go("/login")}
                className="flex flex-1 min-h-[44px] items-center justify-center rounded-xl cta-gradient text-sm font-bold text-white">
                Sign In
              </button>
              <button onClick={() => go("/register")}
                className="flex flex-1 min-h-[44px] items-center justify-center rounded-xl border border-white/15 text-sm font-medium text-white/70">
                Register
              </button>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

/* ── Quick Action Button ── */
function QuickAction({ emoji, label, onClick, badge }: {
  emoji: string; label: string; onClick: () => void; badge?: string;
}) {
  return (
    <button onClick={onClick}
      className="relative flex flex-col items-center gap-1.5 rounded-xl border border-white/8 bg-white/[0.03] py-3 active:bg-white/[0.06] transition">
      <span className="text-lg">{emoji}</span>
      <span className="text-[10px] font-medium text-white/50">{label}</span>
      {badge && (
        <span className="absolute -right-1 -top-1 min-w-[16px] rounded-full bg-rose-500 px-1 text-[9px] font-bold leading-[16px] text-white text-center">{badge}</span>
      )}
    </button>
  );
}

/* ── Nav Row ── */
function NavRow({ icon, label, href, onClick, active }: {
  icon: string; label: string; href: string; onClick: (h: string) => void; active?: boolean;
}) {
  return (
    <button onClick={() => onClick(href)}
      className={clsx(
        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition",
        active ? "bg-white/[0.06] text-white" : "text-white/50 active:bg-white/[0.04]"
      )}>
      <span className="text-base">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

export default MobileDrawer;
