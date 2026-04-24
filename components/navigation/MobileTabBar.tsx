"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useCart } from "@/components/providers/CartProvider";
import { useNotifications } from "@/components/providers/NotificationProvider";

/* ── SVG Icons ── */

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5L12 3l9 7.5" stroke="currentColor" />
      {active ? (
        <path d="M5 10.5V19a1 1 0 001 1h4v-4.5a2 2 0 014 0V20h4a1 1 0 001-1v-8.5" fill="currentColor" stroke="currentColor" />
      ) : (
        <path d="M5 10.5V19a1 1 0 001 1h4v-4.5a2 2 0 014 0V20h4a1 1 0 001-1v-8.5" stroke="currentColor" />
      )}
    </svg>
  );
}

function ShopIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16l-1.5 9a2 2 0 01-2 1.5H7.5a2 2 0 01-2-1.5L4 7z" stroke="currentColor" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.2 : 0} />
      <path d="M4 7l1-3h14l1 3" stroke="currentColor" />
      <line x1="12" y1="7" x2="12" y2="4" stroke="currentColor" />
    </svg>
  );
}

function LuckyIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {/* Star/sparkle icon for lottery/lucky draw */}
      <path d="M12 2l2.4 7.2H22l-6 4.8 2.4 7.2L12 16.4l-6.4 4.8 2.4-7.2-6-4.8h7.6z" 
        stroke="currentColor" 
        fill={active ? "currentColor" : "none"} 
        fillOpacity={active ? 0.2 : 0} />
    </svg>
  );
}

function WalletIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2.5" stroke="currentColor" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.15 : 0} />
      <circle cx="16.5" cy="12" r="1.5" fill={active ? "#fff" : "currentColor"} />
      <path d="M2 10h20" stroke="currentColor" />
    </svg>
  );
}

function MenuIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" />
      {active && <circle cx="20" cy="5" r="3" fill="currentColor" opacity="0.3" />}
    </svg>
  );
}

const tabs = [
  { label: "Home", href: "/", icon: HomeIcon, match: "exact" as const },
  { label: "Shop", href: "/products", icon: ShopIcon, match: "prefix" as const, badge: "cart" as const },
  { label: "Lucky", href: "/lottery", icon: LuckyIcon, match: "prefix" as const, accent: true },
  { label: "Wallet", href: "/wallet", icon: WalletIcon, match: "prefix" as const },
  { label: "More", href: "/account", icon: MenuIcon, match: "prefix" as const, badge: "notifications" as const },
];

export function MobileTabBar() {
  const pathname = usePathname();
  const { totalItems } = useCart();
  const { unreadCount } = useNotifications();

  const isActive = (href: string, match: "exact" | "prefix") => {
    if (match === "exact") return pathname === href;
    // Special: "Lucky" tab matches /lottery and /competition
    if (href === "/lottery") return pathname.startsWith("/lottery") || pathname.startsWith("/competition");
    // Special: "More" tab matches /account, /orders, /referral, /support etc
    if (href === "/account") {
      return pathname.startsWith("/account") || pathname.startsWith("/orders") || pathname.startsWith("/referral") || pathname.startsWith("/support");
    }
    return pathname.startsWith(href);
  };

  const getBadge = (badge?: "cart" | "notifications") => {
    if (badge === "cart" && totalItems > 0) return totalItems > 99 ? "99+" : `${totalItems}`;
    if (badge === "notifications" && unreadCount > 0) return unreadCount > 99 ? "99+" : `${unreadCount}`;
    return null;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/6 sm:hidden">
      <div className="absolute inset-0 bg-[#060606]/95 backdrop-blur-xl" />
      <div className="relative flex items-center justify-around py-1 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
        {tabs.map((tab) => {
          const active = isActive(tab.href, tab.match);
          const badge = getBadge(tab.badge);
          const TabIcon = tab.icon;
          const isAccent = tab.accent;
          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={clsx(
                "relative flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] transition-colors",
                active
                  ? isAccent ? "text-amber-400" : "text-emerald-400"
                  : isAccent ? "text-amber-300/40" : "text-white/35"
              )}
            >
              <span className="relative">
                {active && (
                  <span className={clsx(
                    "absolute -inset-2 rounded-full blur-lg opacity-60",
                    isAccent ? "bg-amber-400/20" : "bg-emerald-400/20"
                  )} />
                )}
                <span className="relative block">
                  <TabIcon active={active} />
                </span>
                {badge && (
                  <span className="absolute -right-2.5 -top-1.5 min-w-[15px] rounded-full bg-rose-500 px-1 text-[8px] font-bold leading-[15px] text-white text-center shadow-lg shadow-rose-500/30">
                    {badge}
                  </span>
                )}
              </span>
              <span className={clsx("font-semibold", active && "tracking-wide")}>{tab.label}</span>
              {active && (
                <span className={clsx(
                  "absolute -top-px left-1/2 -translate-x-1/2 h-[2px] w-6 rounded-full",
                  isAccent ? "bg-amber-400" : "bg-emerald-400"
                )} />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default MobileTabBar;
