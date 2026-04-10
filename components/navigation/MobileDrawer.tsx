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

const quickLinks = [
  { icon: "👤", label: "Account", href: "/account" },
  { icon: "📦", label: "Orders", href: "/orders" },
  { icon: "💳", label: "Wallet", href: "/wallet" },
  { icon: "🔔", label: "Notifications", href: "/account/notifications", badgeKey: "notifications" as const },
];

const shopCategories = [
  { label: "All Products", href: "/products", emoji: "🛍️" },
  { label: "Flowers", href: "/products?category=flowers", emoji: "🌿" },
  { label: "Pre-rolls", href: "/products?category=pre-rolls", emoji: "🚬" },
  { label: "Vapes", href: "/products?category=vapes", emoji: "💨" },
  { label: "Edibles", href: "/products?category=edibles", emoji: "🍬" },
  { label: "Concentrates", href: "/products?category=concentrates", emoji: "🧊" },
];

export function MobileDrawer({ open, onClose, ctas }: MobileDrawerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { unreadCount } = useNotifications();
  const { logout, token } = useAuth();
  const { totalItems } = useCart();
  const isAuthenticated = Boolean(token);
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!open || !token) return;
    apiFetch("/api/account/wallet/balance")
      .then((res: any) => {
        const bal = res?.data?.balance ?? res?.balance;
        if (typeof bal === "number") setBalance(bal);
        else if (typeof bal === "string") setBalance(parseFloat(bal));
      })
      .catch(() => {});
  }, [open, token]);

  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <div
      className={clsx(
        "fixed inset-0 z-40 transition duration-300",
        open ? "pointer-events-auto" : "pointer-events-none"
      )}
    >
      <div
        className={clsx(
          "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity",
          open ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />
      <aside
        className={clsx(
          "absolute inset-y-0 right-0 flex w-[85vw] max-w-[340px] flex-col border-l border-white/10 bg-[#0a0a0a] shadow-2xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
          <LogoMark size={32} />
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Balance Card (logged in) */}
          {isAuthenticated && (
            <button
              onClick={() => go("/wallet")}
              className="flex w-full items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-3"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400/15 text-lg">💰</span>
              <div className="text-left">
                <p className="text-[10px] uppercase tracking-wider text-emerald-300/60">Balance</p>
                <p className="text-lg font-bold text-emerald-300">
                  {balance !== null ? `£${balance.toFixed(2)}` : "—"}
                </p>
              </div>
              <span className="ml-auto text-xs text-white/30">→</span>
            </button>
          )}

          {/* Quick Links Grid */}
          {isAuthenticated && (
            <div className="grid grid-cols-4 gap-2">
              {quickLinks.map((link) => {
                const badge = link.badgeKey === "notifications" && unreadCount > 0
                  ? (unreadCount > 99 ? "99+" : `${unreadCount}`)
                  : null;
                return (
                  <button
                    key={link.href}
                    onClick={() => go(link.href)}
                    className="relative flex flex-col items-center gap-1 rounded-xl border border-white/8 bg-white/[0.03] py-2.5"
                  >
                    <span className="text-lg">{link.icon}</span>
                    <span className="text-[9px] font-medium text-white/50">{link.label}</span>
                    {badge && (
                      <span className="absolute -right-1 -top-1 min-w-[16px] rounded-full bg-rose-500 px-1 text-[9px] font-bold leading-[16px] text-white text-center">
                        {badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Shop Categories */}
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/30 mb-2">Shop</p>
            <div className="grid grid-cols-2 gap-1.5">
              {shopCategories.map((cat) => (
                <button
                  key={cat.href}
                  onClick={() => go(cat.href)}
                  className={clsx(
                    "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition",
                    pathname === cat.href || (cat.href !== "/products" && pathname?.includes(cat.href.split("=")[1] || ""))
                      ? "border-emerald-400/30 bg-emerald-400/10 text-white"
                      : "border-white/8 bg-white/[0.02] text-white/70 hover:bg-white/[0.05]"
                  )}
                >
                  <span className="text-base">{cat.emoji}</span>
                  <span className="text-xs font-medium">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Info Links */}
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/30 mb-2">Info</p>
            <div className="space-y-1">
              {[
                { icon: "📖", label: "How It Works", href: "/how-it-works" },
                { icon: "💬", label: "Support", href: "/support" },
              ].map((link) => (
                <button
                  key={link.href}
                  onClick={() => go(link.href)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-white/60 transition hover:bg-white/[0.04] hover:text-white"
                >
                  <span>{link.icon}</span>
                  <span className="text-sm font-medium">{link.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer CTAs */}
        <div className="border-t border-white/8 px-5 py-4 space-y-2.5">
          <button
            onClick={() => go(isAuthenticated ? (ctas.primary?.href ?? "/account/commission") : "/login")}
            className="flex w-full min-h-[44px] items-center justify-center rounded-full cta-gradient text-sm font-bold uppercase tracking-wider text-white"
          >
            💰 Earn Hub
          </button>
          {isAuthenticated ? (
            <button
              onClick={() => { logout(); onClose(); router.push("/login"); }}
              className="flex w-full min-h-[40px] items-center justify-center rounded-full border border-white/10 text-xs font-medium text-white/40 transition hover:text-white/60"
            >
              Sign Out
            </button>
          ) : (
            <button
              onClick={() => go("/login")}
              className="flex w-full min-h-[40px] items-center justify-center rounded-full border border-white/10 text-xs font-medium text-white/60"
            >
              Sign In
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}

export default MobileDrawer;
