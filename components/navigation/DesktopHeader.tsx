"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type FocusEvent } from "react";
import {
  primaryNav,
  drawerSections,
  menuCtas,
  type NavItem
} from "@/data/fixtures/navigation";
import { NavLink } from "./NavLink";
import { BellIcon } from "./BellIcon";
import { MobileDrawer } from "./MobileDrawer";
import { LogoMark } from "./LogoMark";
import { useNotifications } from "@/components/providers/NotificationProvider";
import { useCart } from "@/components/providers/CartProvider";
import { useAuth } from "@/components/providers/AuthProvider";


function IconLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-white transition hover:border-white/40"
    >
      {children}
    </Link>
  );
}

function IconButton({ onClick, label, children, badge }: { onClick: () => void; label: string; children: React.ReactNode; badge?: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-white transition hover:border-white/40"
    >
      {badge ? (
        <span className="absolute -right-1.5 -top-1.5 min-w-[1.2rem] rounded-full border border-[#050505] bg-rose-500 px-1.5 text-[10px] font-semibold leading-[1.2] text-white">
          {badge}
        </span>
      ) : null}
      {children}
    </button>
  );
}

const iconStroke = "stroke-white";

const formatBadge = (count: number) => (count > 99 ? "99+" : `${count}`);

function AccountIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={iconStroke}>
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 20c1.5-3 4.5-4.5 8-4.5s6.5 1.5 8 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={iconStroke}>
      <path
        d="M6.5 8.5h11l1 11a1.5 1.5 0 0 1-1.5 1.5h-10a1.5 1.5 0 0 1-1.5-1.5l1-11Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M9 8.5C9 6.567 10.567 5 12.5 5s3.5 1.567 3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={iconStroke}>
      <path d="M4 7h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4 12h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4 17h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      className={clsx("ml-1 transition-transform", open && "rotate-180")}
    >
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShopMenu({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const active = pathname.startsWith(item.href);

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      setOpen(false);
    }
  };

  return (
    <div
      className="relative hidden lg:block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocusCapture={() => setOpen(true)}
      onBlurCapture={handleBlur}
    >
      <Link
        href={item.href}
        className={clsx(
          "flex items-center gap-1 border-b-2 border-transparent pb-1.5 text-[11px] uppercase tracking-[0.2em] text-[rgba(255,255,255,0.55)] transition hover:text-white",
          active && "border-white text-white"
        )}
      >
        {item.label}
        <ChevronDown open={open} />
      </Link>
      {open && (
        <div className="absolute left-0 top-full mt-3 min-w-[220px] rounded-2xl border border-white/10 bg-[#050505] p-4 shadow-xl">
          <div className="flex flex-col gap-1">
            {item.children?.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                className="rounded-lg px-3 py-2 text-sm text-[rgba(255,255,255,0.75)] transition hover:bg-white/10 hover:text-white"
              >
                {child.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function DesktopHeader() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const router = useRouter();
  const { unreadCount } = useNotifications();
  const notificationBadge = unreadCount > 0 ? formatBadge(unreadCount) : undefined;
  const { totalItems } = useCart();
  const cartBadge = totalItems > 0 ? formatBadge(totalItems) : undefined;
  const { token, profile } = useAuth();
  const isAuthenticated = Boolean(token);
  const displayName = profile?.fullName || profile?.username || profile?.email?.split("@")[0] || "";

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-white/[0.06] backdrop-blur-xl bg-black/40">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="flex items-center">
            <LogoMark />
          </Link>
          <nav className="hidden flex-1 items-center justify-center gap-6 lg:flex">
            {primaryNav.map((item) =>
              item.children ? (
                <ShopMenu key={item.label} item={item} />
              ) : (
                <NavLink key={item.label} {...item} />
              )
            )}
          </nav>
          <div className="flex items-center gap-2">
            {/* ── Mobile: avatar or Sign In ── */}
            <span className="flex sm:hidden items-center">
              {isAuthenticated ? (
                <Link href="/account" className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400/20 to-cyan-400/10 text-xs font-bold text-emerald-300 ring-1 ring-emerald-400/20">
                  {displayName.charAt(0).toUpperCase() || "?"}
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 border border-black" />
                  </span>
                </Link>
              ) : (
                <Link href="/login" aria-label="Sign In" className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] active:scale-[0.9] transition">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-emerald-400">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c1.5-3 4.5-4.5 8-4.5s6.5 1.5 8 4.5" strokeLinecap="round" />
                  </svg>
                </Link>
              )}
            </span>
            {/* ── Desktop icons ── */}
            <span className="hidden sm:flex items-center gap-2">
              <IconButton onClick={() => router.push("/account/notifications")} label="Notifications" badge={notificationBadge}>
                <BellIcon className={iconStroke} />
              </IconButton>
              <IconLink href="/account" label="Account">
                <AccountIcon />
              </IconLink>
              <IconButton onClick={() => router.push("/cart")} label="Shopping cart" badge={cartBadge}>
                <BagIcon />
              </IconButton>
            </span>
            <IconButton onClick={() => setDrawerOpen(true)} label="Open menu" badge={notificationBadge}>
              <MenuIcon />
            </IconButton>
          </div>
        </div>
      </header>
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sections={drawerSections}
        ctas={menuCtas}
        navItems={primaryNav}
      />
    </>
  );
}

export default DesktopHeader;
