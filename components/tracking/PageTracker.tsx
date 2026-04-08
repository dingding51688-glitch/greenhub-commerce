"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export default function PageTracker() {
  const pathname = usePathname();
  const lastPath = useRef("");

  useEffect(() => {
    // Avoid double-tracking same path
    if (pathname === lastPath.current) return;
    lastPath.current = pathname;

    // Don't track admin pages
    if (pathname.startsWith("/admin")) return;

    const track = async () => {
      try {
        await fetch(`${API_BASE}/api/track`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: pathname,
            referrer: document.referrer || undefined,
          }),
          keepalive: true,
        });
      } catch {
        // Silent fail — tracking should never break the app
      }
    };

    // Small delay to not block page load
    const timer = setTimeout(track, 100);
    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}
