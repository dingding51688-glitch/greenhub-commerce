"use client";

import { useState, useEffect } from "react";

const AGE_VERIFIED_KEY = "gh_age_verified";

export function AgeGate({ children }: { children: React.ReactNode }) {
  const [verified, setVerified] = useState<boolean | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(AGE_VERIFIED_KEY);
    setVerified(stored === "true");
  }, []);

  const handleConfirm = () => {
    localStorage.setItem(AGE_VERIFIED_KEY, "true");
    setVerified(true);
  };

  const handleDeny = () => {
    window.location.href = "https://www.google.com";
  };

  // Loading state — don't flash the gate
  if (verified === null) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#0C0C0E]" />
    );
  }

  if (verified) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm px-6">
      <div className="w-full max-w-sm text-center">
        {/* Logo */}
        <div className="mb-6">
          <span className="text-2xl font-bold tracking-tight text-white">
            GREEN<span className="font-extrabold text-emerald-400">HUB</span>{" "}
            <span className="text-white/60">420</span>
          </span>
        </div>

        {/* Age warning */}
        <div className="bg-[#1C1C1E] rounded-2xl p-6 border border-white/10">
          <div className="text-5xl mb-4">🔞</div>
          <h2 className="text-xl font-bold text-white mb-2">Age Verification</h2>
          <p className="text-white/60 text-sm mb-6">
            You must be 18 years or older to enter this website. By clicking
            &quot;I am 18+&quot; you confirm that you are of legal age.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleConfirm}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-base transition-colors"
            >
              I am 18+ — Enter
            </button>
            <button
              onClick={handleDeny}
              className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 font-medium text-sm transition-colors"
            >
              I am under 18 — Leave
            </button>
          </div>
        </div>

        <p className="text-white/30 text-xs mt-4">
          This website contains age-restricted content.
        </p>
      </div>
    </div>
  );
}
