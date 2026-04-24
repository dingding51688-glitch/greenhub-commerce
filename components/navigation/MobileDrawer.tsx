"use client";

import clsx from "clsx";
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
          {/* ── Sign In / Register (not logged in) ── */}
          {!isAuthenticated && (
            <div className="px-4 pt-4 pb-2">
              <div className="relative isolate overflow-hidden rounded-xl border border-emerald-400/10 p-4 text-center">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0a1a12] to-[#0d0d0d]" aria-hidden="true" />
                <div className="absolute -top-8 -right-8 h-20 w-20 rounded-full bg-emerald-400/8 blur-2xl" aria-hidden="true" />
                <div className="relative z-10">
                  <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-gradient-to-br from-emerald-400/20 to-cyan-400/10 text-xl ring-1 ring-emerald-400/25 mb-3">
                    👋
                  </div>
                  <p className="text-sm font-bold text-white">Welcome to GreenHub 420</p>
                  <p className="text-[10px] text-white/30 mt-1">Sign in to access your wallet, orders & more</p>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => go("/login")}
                      className="flex flex-1 min-h-[40px] items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-sm font-bold text-black shadow-lg shadow-emerald-500/20 active:scale-[0.97] transition">
                      Sign In
                    </button>
                    <button onClick={() => go("/register")}
                      className="flex flex-1 min-h-[40px] items-center justify-center rounded-xl border border-white/15 bg-white/[0.03] text-sm font-medium text-white/70 active:scale-[0.97] transition">
                      Register
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── User Card ── */}
          {isAuthenticated && (
            <div className="px-4 pt-4 pb-1">
              <button onClick={() => go("/account")} className="relative isolate overflow-hidden w-full rounded-xl border border-emerald-400/10 p-3.5 text-left">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0a1a12] to-[#0d0d0d]" aria-hidden="true" />
                <div className="absolute -top-6 -right-6 h-16 w-16 rounded-full bg-emerald-400/8 blur-2xl" aria-hidden="true" />
                <div className="relative z-10 flex items-center gap-3">
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
                </div>
              </button>
            </div>
          )}

          {/* ── 2×2 Grid Actions ── */}
          {isAuthenticated && (
            <div className="px-4 py-3">
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { emoji: "📦", label: "Orders", desc: "Track deliveries", href: "/orders", grad: "from-blue-500/10 to-blue-400/5", border: "border-blue-400/12", text: "text-blue-300" },
                  { emoji: "💰", label: "Wallet", desc: "Top up & transfer", href: "/wallet", grad: "from-emerald-500/10 to-emerald-400/5", border: "border-emerald-400/12", text: "text-emerald-300" },
                  { emoji: "🎰", label: "Lucky Draw", desc: "Win £100 daily", href: "/lottery", grad: "from-amber-500/10 to-yellow-400/5", border: "border-amber-400/12", text: "text-amber-300" },
                  { emoji: "🤝", label: "Earn Hub", desc: "Invite & earn", href: "/account/commission", grad: "from-purple-500/10 to-pink-400/5", border: "border-purple-400/12", text: "text-purple-300" },
                ].map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <button key={item.href} onClick={() => go(item.href)}
                      className={clsx(
                        "relative isolate overflow-hidden rounded-xl border p-3 text-left active:scale-[0.97] transition",
                        item.border, active ? "ring-1 ring-white/10" : ""
                      )}>
                      <div className={`absolute inset-0 bg-gradient-to-br ${item.grad}`} aria-hidden="true" />
                      <div className="relative z-10">
                        <span className="text-xl">{item.emoji}</span>
                        <p className={`text-xs font-bold mt-1.5 ${item.text}`}>{item.label}</p>
                        <p className="text-[9px] text-white/25 mt-0.5">{item.desc}</p>
                      </div>
                      {item.href === "/orders" && totalItems > 0 && (
                        <span className="absolute top-2 right-2 min-w-[18px] h-[18px] rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-[18px] text-white text-center">
                          {totalItems > 99 ? "99+" : totalItems}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Shop (single row) ── */}
          <div className="px-4 py-1">
            <button onClick={() => go("/products")}
              className={clsx(
                "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left active:scale-[0.98] transition",
                pathname.startsWith("/products")
                  ? "border-emerald-400/15 bg-emerald-400/[0.04]"
                  : "border-white/6 bg-white/[0.01]"
              )}>
              <span className="text-lg">🛍️</span>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">Shop</p>
                <p className="text-[9px] text-white/25">Flowers, vapes, edibles & more</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-white/20"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>

          {/* ── Links ── */}
          <div className="px-4 py-2">
            <div className="rounded-xl border border-white/6 bg-white/[0.01] overflow-hidden divide-y divide-white/5">
              {[
                ...(isAuthenticated ? [
                  { icon: "🔔", label: "Notifications", href: "/account/notifications", badge: unreadCount > 0 ? (unreadCount > 99 ? "99+" : `${unreadCount}`) : null },
                ] : []),
                { icon: "💬", label: "AI Support", href: "/support", badge: null },
                { icon: "📖", label: "How It Works", href: "/how-it-works", badge: null },
                { icon: "📝", label: "Blog", href: "/blog", badge: null },
              ].map((item) => {
                const active = pathname === item.href;
                return (
                  <button key={item.href} onClick={() => go(item.href)}
                    className={clsx(
                      "flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition",
                      active ? "bg-white/[0.04] text-white" : "text-white/50 active:bg-white/[0.03]"
                    )}>
                    <span className="text-sm w-5 text-center">{item.icon}</span>
                    <span className="flex-1 text-xs font-medium">{item.label}</span>
                    {item.badge && (
                      <span className="min-w-[20px] h-[20px] rounded-full bg-rose-500 px-1.5 text-[10px] font-bold leading-[20px] text-white text-center">{item.badge}</span>
                    )}
                    {active && <span className="inline-block h-1.5 w-1.5 rounded-full bg-white/40" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Sign Out (in scroll area so always visible) ── */}
          {isAuthenticated && (
            <div className="px-4 py-1">
              <button onClick={() => { logout(); onClose(); router.push("/login"); }}
                className="flex w-full items-center gap-3 rounded-xl border border-red-400/8 px-3.5 py-2.5 text-left active:bg-red-400/5 transition">
                <span className="text-sm w-5 text-center">⏻</span>
                <span className="text-xs font-medium text-red-400/50">Sign Out</span>
              </button>
            </div>
          )}

          {/* ── Telegram ── */}
          <div className="px-4 py-2">
            <a href="https://t.me/greenhub420" target="_blank" rel="noopener noreferrer"
              className="relative isolate overflow-hidden flex w-full items-center gap-3 rounded-xl border border-blue-400/10 px-3.5 py-2.5 active:bg-blue-400/[0.06] transition">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/[0.04] to-transparent" aria-hidden="true" />
              <span className="relative z-10 text-sm">✈️</span>
              <span className="relative z-10 text-xs font-medium text-blue-300/70">Telegram Channel</span>
              <span className="relative z-10 ml-auto rounded-full bg-blue-400/15 px-2 py-0.5 text-[8px] font-bold text-blue-300/60">JOIN</span>
            </a>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-white/6 px-4 py-3 pb-[max(0.75rem,calc(env(safe-area-inset-bottom)+0.75rem))]">
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
