"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  markClickTracked,
  setStoredReferralCode,
  shouldTrackClick,
} from "@/lib/referral-tracking";

const CLICK_ENDPOINT = "/api/referral/click";

export function ReferralTrackingProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const lastTracked = useRef<string | null>(null);
  const code = searchParams?.get("ref") || null;

  useEffect(() => {
    if (!code) return;
    setStoredReferralCode(code);

    if (!shouldTrackClick(code) || lastTracked.current === code) return;

    const landingPath = pathname || window.location.pathname;
    const utmParams: Record<string, string> = {};
    if (searchParams) {
      searchParams.forEach((value, key) => {
        if (key.startsWith("utm_")) utmParams[key] = value;
      });
    }
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const fingerprint = [
      navigator.userAgent, navigator.language, timezone,
      `${window.screen.width}x${window.screen.height}`,
    ].join("|");

    fetch(CLICK_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, landingPath, utm: utmParams, userAgent: navigator.userAgent, fingerprint }),
    })
      .then((res) => {
        if (res.ok) {
          markClickTracked(code);
          lastTracked.current = code;
        }
      })
      .catch(() => {});
  }, [code, pathname, searchParams]);

  return <>{children}</>;
}
