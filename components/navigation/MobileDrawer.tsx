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

  const displayName = profile?.fullName || "Guest";

  return (
    <div className={clsx("fixed inset-0 z-40 transition duration-300", open ? "pointer-events-auto" : "pointer-events-none")}>
      <div className={clsx("absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity", open ? "opacity-100" : "opacity-0")} onClick={onClose} />
      <aside className={clsx(
        "absolute inset-y-0 right-0 flex w-[85vw] max-w-[340px] flex-col border-l border-white/10 bg-[#0a0a0a] shadow-2xl transition-transform duration-300",
        open ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Header — user info or sign in */}
        <div className="border-b border-white/8 px-5 py-4">
          <div className="flex items-center justify-between">
            {isAuthenticated ? (
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-base font-bold text-emerald-300">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">{displayName}</p>
                  <p className="text-xs font-semibold text-emerald-400">
                    {balance !== null ? `£${balance.toFixed(2)}` : "—"}
                  </p>
                </div>
              </div>
            ) : (
              <LogoMark size={32} />
            )}
            <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white" aria-label="Close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Main navigation */}
          {isAuthenticated && (
            <div className="px-3 py-3 space-y-0.5">
              <MenuItem icon="📦" label="My Orders" desc="Track & manage" href="/orders" onClick={go} active={pathname === "/orders"} />
              <MenuItem icon="💳" label="Wallet" desc={balance !== null ? `£${balance.toFixed(2)}` : "Top up & pay"} href="/wallet" onClick={go} active={pathname?.startsWith("/wallet")} />
              <MenuItem icon="💰" label="Earn Hub" desc="Invite friends, earn commission" href="/account/commission" onClick={go} active={pathname === "/account/commission"} />
              <MenuItem icon="🔔" label="Notifications" href="/account/notifications" onClick={go} active={pathname === "/account/notifications"}
                badge={unreadCount > 0 ? (unreadCount > 99 ? "99+" : `${unreadCount}`) : undefined} />
              <MenuItem icon="👤" label="Account" desc="Profile & settings" href="/account" onClick={go} active={pathname === "/account"} />
            </div>
          )}

          {/* Shop */}
          <div className="px-3 py-2">
            <p className="px-2 text-[9px] font-bold uppercase tracking-[0.3em] text-white/25 mb-1.5">Shop</p>
            <div className="space-y-0.5">
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
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition",
                      isActive ? "bg-emerald-400/10 text-emerald-300" : "text-white/60 active:bg-white/[0.04]"
                    )}>
                    <span className="text-base">{cat.emoji}</span>
                    <span className="text-sm font-medium">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cart shortcut */}
          {totalItems > 0 && (
            <div className="px-3 py-2">
              <button onClick={() => go("/cart")}
                className="flex w-full items-center justify-between rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-base">🛒</span>
                  <span className="text-sm font-semibold text-white">Cart</span>
                </div>
                <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-xs font-bold text-emerald-300">{totalItems}</span>
              </button>
            </div>
          )}

          {/* Help & info */}
          <div className="px-3 py-2 border-t border-white/5">
            <p className="px-2 text-[9px] font-bold uppercase tracking-[0.3em] text-white/25 mb-1.5">Help</p>
            <div className="space-y-0.5">
              <MenuItem icon="📖" label="How It Works" href="/how-it-works" onClick={go} active={pathname === "/how-it-works"} />
              <MenuItem icon="💬" label="Support" href="/support" onClick={go} active={pathname === "/support"} />
              <MenuItem icon="❓" label="FAQ" href="/faq" onClick={go} active={pathname === "/faq"} />
            </div>
          </div>
        </div>

        {/* Footer */}
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

/* ── Menu Item ── */
function MenuItem({ icon, label, desc, href, onClick, active, badge }: {
  icon: string; label: string; desc?: string; href: string;
  onClick: (href: string) => void; active?: boolean; badge?: string;
}) {
  return (
    <button onClick={() => onClick(href)}
      className={clsx(
        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition",
        active ? "bg-white/[0.06] text-white" : "text-white/60 active:bg-white/[0.04]"
      )}>
      <span className="text-base">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        {desc && <p className="text-[10px] text-white/30 truncate">{desc}</p>}
      </div>
      {badge && (
        <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-bold text-white">{badge}</span>
      )}
    </button>
  );
}

export default MobileDrawer;
