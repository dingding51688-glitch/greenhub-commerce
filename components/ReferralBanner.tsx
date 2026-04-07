"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { setStoredReferralCode } from "@/lib/referral-tracking";

export default function ReferralBanner() {
  const searchParams = useSearchParams();
  const ref = searchParams?.get("ref")?.trim().toUpperCase() || "";
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (ref) {
      setStoredReferralCode(ref);
      setVisible(true);
    }
  }, [ref]);

  if (!visible) return null;

  return (
    <div className="rounded-3xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-4 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-300/80">Friend invite detected</p>
          <p className="mt-1 text-lg font-semibold text-white">
            Referral code: <span className="font-mono">{ref}</span>
          </p>
          <p className="text-sm text-white/60">Sign up with this code to get started</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/register?ref=${ref}`}
            className="inline-flex min-h-[44px] items-center justify-center rounded-full cta-gradient border border-transparent px-6 text-sm font-semibold text-white shadow-cta transition hover:opacity-95"
          >
            Register now
          </Link>
          <Link
            href="/products"
            className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/30 px-6 text-sm font-semibold text-white/85 transition hover:border-white/60"
          >
            Browse products
          </Link>
        </div>
      </div>
    </div>
  );
}
