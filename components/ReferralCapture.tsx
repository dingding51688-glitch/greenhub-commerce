"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { setStoredReferralCode } from "@/lib/referral-tracking";

/**
 * Captures ?ref=xxx from any page URL and stores in localStorage.
 * The ReferralTrackingProvider handles track-click API + Turnstile.
 */
export function ReferralCapture() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams?.get("ref")?.trim();
    if (ref) {
      setStoredReferralCode(ref);
    }
  }, [searchParams]);

  return null;
}
