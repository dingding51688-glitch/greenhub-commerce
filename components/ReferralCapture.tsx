"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { setStoredReferralCode, shouldTrackClick, markClickTracked } from "@/lib/referral-tracking";

/**
 * Captures ?ref=xxx from any page URL, stores in localStorage,
 * and fires track-click API to record the visit.
 */
export function ReferralCapture() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams?.get("ref")?.trim();
    if (!ref) return;

    setStoredReferralCode(ref);

    // Track click (deduped per 24h)
    if (shouldTrackClick(ref)) {
      fetch("/api/referral/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: ref }),
      })
        .then((res) => {
          if (res.ok) markClickTracked(ref);
        })
        .catch(() => {});
    }
  }, [searchParams]);

  return null;
}
