"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useCart } from "@/components/providers/CartProvider";
import { useNotifications } from "@/components/providers/NotificationProvider";

const tabs = [
  {
    label: "Home",
    href: "/",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
        <path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-5h-6v5H4a1 1 0 01-1-1V10.5z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    match: "exact" as const,
  },
  {
    label: "Shop",
    href: "/products",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 6h18M3 6l2 14h14l2-14M10 10v4M14 10v4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    match: "prefix" as const,
  },
  {
    label: "Cart",
    href: "/cart",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M6.5 8.5h11l1 11a1.5 1.5 0 01-1.5 1.5h-10a1.5 1.5 0 01-1.5-1.5l1-11z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 8.5C9 6.567 10.567 5 12.5 5s3.5 1.567 3.5 3.5" strokeLinecap="round" />
      </svg>
    ),
    match: "exact" as const,
    badge: "cart" as const,
  },
  {
    label: "Account",
    href: "/account",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="8" r="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 20c1.5-3 4.5-4.5 8-4.5s6.5 1.5 8 4.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    match: "prefix" as const,
  },
  {
    label: "Wallet",
    href: "/wallet",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M16 12h2" strokeLinecap="round" />
        <path d="M2 10h20" />
      </svg>
    ),
    match: "prefix" as const,
  },
];

export function MobileTabBar() {
  const pathname = usePathname();
  const { totalItems } = useCart();
  const { unreadCount } = useNotifications();

  const isActive = (href: string, match: "exact" | "prefix") => {
    if (match === "exact") return pathname === href;
    return pathname.startsWith(href);
  };

  const getBadge = (badge?: "cart" | "notifications") => {
    if (badge === "cart" && totalItems > 0) return totalItems > 99 ? "99+" : `${totalItems}`;
    if (badge === "notifications" && unreadCount > 0) return unreadCount > 99 ? "99+" : `${unreadCount}`;
    return null;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-black/90 backdrop-blur-xl sm:hidden">
      <div className="flex items-center justify-around py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
        {tabs.map((tab) => {
          const active = isActive(tab.href, tab.match);
          const badge = getBadge(tab.badge);
          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={clsx(
                "relative flex flex-col items-center gap-0.5 px-3 py-1 text-[10px]",
                active ? "text-emerald-400" : "text-white/50"
              )}
            >
              <span className="relative">
                {tab.icon(active)}
                {badge && (
                  <span className="absolute -right-2 -top-1 min-w-[14px] rounded-full bg-rose-500 px-1 text-[9px] font-bold leading-[14px] text-white text-center">
                    {badge}
                  </span>
                )}
              </span>
              <span className="font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default MobileTabBar;
