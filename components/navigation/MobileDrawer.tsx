"use client";

import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { DrawerSection, NavigationCTA, NavItem } from "@/data/fixtures/navigation";
import { NavLink } from "./NavLink";
import { LogoMark } from "./LogoMark";
import { BellIcon } from "./BellIcon";
import { Button } from "@/components/ui";
import { useNotifications } from "@/components/providers/NotificationProvider";

export type MobileDrawerProps = {
  open: boolean;
  onClose: () => void;
  sections: DrawerSection[];
  ctas: { primary: NavigationCTA; secondary: NavigationCTA };
  navItems: NavItem[];
};

export function MobileDrawer({ open, onClose, sections, ctas, navItems }: MobileDrawerProps) {
  const router = useRouter();
  const { unreadCount } = useNotifications();
  const notificationBadge = unreadCount > 0 ? (unreadCount > 99 ? "99+" : `${unreadCount}`) : null;
  const defaultAccordion = useMemo(() => navItems.find((item) => item.children)?.label ?? null, [navItems]);
  const [expanded, setExpanded] = useState<string | null>(defaultAccordion);

  useEffect(() => {
    if (open) {
      setExpanded(defaultAccordion);
    }
  }, [open, defaultAccordion]);

  const toggle = (label: string) => {
    setExpanded((prev) => (prev === label ? null : label));
  };

  const goToNotifications = () => {
    router.push("/account/notifications");
    onClose();
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
          "absolute inset-0 bg-black/50 transition-opacity",
          open ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />
      <aside
        className={clsx(
          "absolute inset-y-0 right-0 flex w-80 max-w-full flex-col gap-6 border-l border-white/10 bg-[rgba(5,5,5,0.98)] p-6 shadow-header transition-transform",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <LogoMark size={36} />
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="relative rounded-full border border-white/15 p-2 text-white transition hover:border-white/40"
              onClick={goToNotifications}
              aria-label="Notifications"
            >
              {notificationBadge ? (
                <span className="absolute -right-1.5 -top-1.5 min-w-[1.2rem] rounded-full border border-[#050505] bg-rose-500 px-1.5 text-[10px] font-semibold leading-[1.2] text-white">
                  {notificationBadge}
                </span>
              ) : null}
              <BellIcon />
            </button>
            <button
              className="rounded-full border border-white/15 p-2 text-white transition hover:border-white/40"
              onClick={onClose}
              aria-label="Close menu"
            >
              <span className="inline-block text-lg leading-none">×</span>
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-6 overflow-y-auto">
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[rgba(255,255,255,0.6)]">
              MENU
            </p>
            <div className="flex flex-col gap-2">
              {navItems.map((item) =>
                item.children ? (
                  <div key={item.label} className="space-y-2">
                    <button
                      type="button"
                      onClick={() => toggle(item.label)}
                      className="flex w-full items-center justify-between rounded-xl border border-white/10 px-3 py-2 text-left text-sm font-semibold uppercase tracking-[0.15em] text-white/80"
                    >
                      <span>{item.label}</span>
                      <span className="text-white/60">{expanded === item.label ? "−" : "+"}</span>
                    </button>
                    {expanded === item.label && (
                      <div className="space-y-1 pl-3">
                        {item.children.map((child) => (
                          <NavLink
                            key={child.href}
                            {...child}
                            variant="drawer"
                            onClick={onClose}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <NavLink
                    key={item.href}
                    {...item}
                    variant="drawer"
                    onClick={onClose}
                  />
                )
              )}
            </div>
          </div>
          {sections.map((section) => (
            <div key={section.title} className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[rgba(255,255,255,0.6)]">
                {section.title}
              </p>
              <div className="flex flex-col gap-2">
                {section.links.map((link) => (
                  <NavLink
                    key={link.href}
                    {...link}
                    variant="drawer"
                    onClick={onClose}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-auto space-y-3">
          <Button asChild fullWidth>
            <a href={ctas.primary.href} onClick={onClose}>
              {ctas.primary.label}
            </a>
          </Button>
          <Button variant="secondary" asChild fullWidth>
            <a href={ctas.secondary.href} onClick={onClose}>
              {ctas.secondary.label}
            </a>
          </Button>
        </div>
      </aside>
    </div>
  );
}

export default MobileDrawer;
