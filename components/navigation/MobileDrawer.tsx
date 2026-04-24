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
        "absolute inset-y-0 right-0 flex w-[85vw] max-w-[340px] flex-col border-l border-emerald-400/10 bg-[#0a0a0a] shadow-2xl transition-transform duration-300",
        open ? "translate-x-0" : "translate-x-full"
      )}>
        {/* ── Header ── */}
        <div className="relative border-b border-white/6 px-5 py-3">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/[0.03] to-transparent" aria-hidden="true" />
          <div className="relative flex items-center justify-between">
            <LogoMark size={28} />
            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-white/50 hover:text-white transition" aria-label="Close">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* ── User Card (logged in) ── */}
          {isAuthenticated && (
            <div className="px-4 pt-4 pb-2">
              <div className="relative isolate overflow-hidden rounded-xl border border-emerald-400/10 p-3.5">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0a1a12] to-[#0d0d0d]" aria-hidden="true" />
                <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "24px 24px" }} aria-hidden="true" />
                <div className="absolute -top-6 -right-6 h-16 w-16 rounded-full bg-emerald-400/8 blur-2xl" aria-hidden="true" />

                <div className="relative z-10">
                  <button onClick={() => go("/account")} className="flex w-full items-center gap-3 text-left">
                    <div className="relative">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400/20 to-cyan-400/10 text-base font-bold text-emerald-300 ring-1 ring-emerald-400/25">
                        {displayName.charAt(0).toUpperCase() || "?"}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 border-[1.5px] border-[#0a0a0a]" />
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{displayName}</p>
                      <p className="text-[10px] text-white/25">View account →</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] uppercase tracking-widest text-white/20">Balance</p>
                      <p className="text-sm font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                        {balance !== null ? `£${balance.toFixed(2)}` : "—"}
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Quick Actions ── */}
          {isAuthenticated && (
            <div className="px-4 py-1.5">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {[
                  { emoji: "📦", label: "Orders", href: "/orders", glow: "bg-blue-400/8", border: "border-blue-400/10" },
                  { emoji: "💰", label: "Top Up", href: "/wallet/topup", glow: "bg-emerald-400/8", border: "border-emerald-400/10" },
                  { emoji: "🎰", label: "Lucky", href: "/lottery", glow: "bg-amber-400/8", border: "border-amber-400/10" },
                  { emoji: "🔔", label: "Alerts", href: "/account/notifications", glow: "bg-rose-400/8", border: "border-rose-400/10", badge: unreadCount > 0 ? (unreadCount > 99 ? "99+" : `${unreadCount}`) : undefined },
                ].map((a) => (
                  <button key={a.href} onClick={() => go(a.href)}
                    className={`relative isolate overflow-hidden flex flex-col items-center gap-1 rounded-xl border ${a.border} bg-white/[0.01] px-4 py-2.5 active:scale-[0.95] transition shrink-0`}>
                    <div className={`absolute -top-3 -right-3 h-10 w-10 ${a.glow} rounded-full blur-xl`} aria-hidden="true" />
                    <span className="relative text-base">{a.emoji}</span>
                    <span className="relative text-[9px] font-medium text-white/40">{a.label}</span>
                    {a.badge && (
                      <span className="absolute -right-1 -top-1 min-w-[18px] h-[18px] rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-[18px] text-white text-center shadow-lg">{a.badge}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Shop ── */}
          <div className="px-4 py-2">
            <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/20 mb-2">Shop</p>
            <div className="rounded-xl border border-white/6 bg-white/[0.01] overflow-hidden divide-y divide-white/5">
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
                      "flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition",
                      isActive ? "bg-emerald-400/[0.06] text-emerald-300" : "text-white/50 active:bg-white/[0.04]"
                    )}>
                    <span className="text-sm">{cat.emoji}</span>
                    <span className="text-xs font-medium">{cat.label}</span>
                    {isActive && <span className="ml-auto inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Lucky Draw ── */}
          <div className="px-4 py-2">
            <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-amber-400/40 mb-2">🎰 Lucky Draw</p>
            <div className="rounded-xl border border-amber-400/10 bg-gradient-to-br from-amber-400/[0.03] to-transparent overflow-hidden divide-y divide-amber-400/5">
              {[
                { emoji: "🎰", label: "Daily £100 Bonus", href: "/lottery", desc: "Free daily draw" },
                { emoji: "🎟️", label: "Competition", href: "/competition", desc: "£2/ticket, £200 prize" },
                { emoji: "📊", label: "Draw History", href: "/competition/history", desc: "Past results" },
              ].map((item) => {
                const isActive = pathname === item.href;
                return (
                  <button key={item.href} onClick={() => go(item.href)}
                    className={clsx(
                      "flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition",
                      isActive ? "bg-amber-400/[0.06] text-amber-300" : "text-white/50 active:bg-white/[0.04]"
                    )}>
                    <span className="text-sm">{item.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium block">{item.label}</span>
                      <span className="text-[9px] text-white/25 block">{item.desc}</span>
                    </div>
                    {isActive && <span className="ml-auto inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />}
                  </button>
                );
              })}
            </div>
          </div>


          {/* ── Navigation ── */}
          <div className="px-4 py-2">
            <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/20 mb-2">More</p>
            <div className="rounded-xl border border-white/6 bg-white/[0.01] overflow-hidden divide-y divide-white/5">
              {[
                ...(isAuthenticated ? [
                  { icon: "👤", label: "Account", href: "/account", color: "text-cyan-400" },
                  { icon: "🤝", label: "Earn Hub", href: "/account/commission", color: "text-purple-400" },
                ] : []),
                { icon: "📖", label: "How It Works", href: "/how-it-works", color: "text-emerald-400" },
                { icon: "💬", label: "AI Support", href: "/support", color: "text-blue-400" },
                { icon: "📝", label: "Blog", href: "/blog", color: "text-amber-400" },
              ].map((item) => {
                const isActive = pathname === item.href;
                return (
                  <button key={item.href} onClick={() => go(item.href)}
                    className={clsx(
                      "flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition",
                      isActive ? "bg-white/[0.04] text-white" : "text-white/50 active:bg-white/[0.03]"
                    )}>
                    <div className={`flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.04] text-xs ${item.color}`}>
                      {item.icon}
                    </div>
                    <span className="text-xs font-medium">{item.label}</span>
                    {isActive && <span className="ml-auto inline-block h-1.5 w-1.5 rounded-full bg-white/40" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Telegram ── */}
          <div className="px-4 py-2">
            <a href="https://t.me/greenhub420" target="_blank" rel="noopener noreferrer"
              className="relative isolate overflow-hidden flex w-full items-center gap-3 rounded-xl border border-blue-400/10 px-3.5 py-2.5 active:bg-blue-400/[0.06] transition">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/[0.04] to-transparent" aria-hidden="true" />
              <div className="relative z-10 flex h-7 w-7 items-center justify-center rounded-lg bg-blue-400/10">
                <span className="text-xs">✈️</span>
              </div>
              <span className="relative z-10 text-xs font-medium text-blue-300/70">Telegram Channel</span>
              <span className="relative z-10 ml-auto rounded-full bg-blue-400/15 px-2 py-0.5 text-[8px] font-bold text-blue-300/60">JOIN</span>
            </a>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-white/6 px-4 py-3">
          {isAuthenticated ? (
            <button onClick={() => { logout(); onClose(); router.push("/login"); }}
              className="relative isolate overflow-hidden flex w-full min-h-[40px] items-center justify-center gap-2 rounded-xl border border-red-400/10 text-sm font-medium text-red-400/50 active:bg-red-400/5 transition">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/[0.03] to-transparent" aria-hidden="true" />
              <span className="relative z-10">⏻ Sign Out</span>
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => go("/login")}
                className="flex flex-1 min-h-[44px] items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-sm font-bold text-black shadow-lg shadow-emerald-500/20">
                Sign In
              </button>
              <button onClick={() => go("/register")}
                className="flex flex-1 min-h-[44px] items-center justify-center rounded-xl border border-white/15 bg-white/[0.03] text-sm font-medium text-white/70">
                Register
              </button>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

export default MobileDrawer;
