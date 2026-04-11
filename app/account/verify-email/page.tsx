"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/button";

type VerifyState = "loading" | "success" | "error";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <section className="mx-auto max-w-md space-y-6 px-4 py-16 text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-emerald-400" />
        <h1 className="text-xl font-semibold text-white">Verifying your email…</h1>
      </section>
    }>
      <VerifyEmailInner />
    </Suspense>
  );
}

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [state, setState] = useState<VerifyState>("loading");
  const [message, setMessage] = useState("");
  const [rewardGranted, setRewardGranted] = useState(false);
  const [rewardAmount, setRewardAmount] = useState(0);
  const calledRef = useRef(false);

  useEffect(() => {
    if (!token) {
      setState("error");
      setMessage("Missing verification token. Please use the link from your email.");
      return;
    }

    // Prevent double-fire in React StrictMode
    if (calledRef.current) return;
    calledRef.current = true;

    async function verify() {
      try {
        const response = await fetch("/api/account/security/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const payload = await response.json().catch(() => ({}));

        if (response.ok && payload.success) {
          setState("success");
          setMessage(payload.message || "Your email has been verified and updated.");
          if (payload.rewardGranted) {
            setRewardGranted(true);
            setRewardAmount(payload.rewardAmount || 5);
          }
        } else if (
          response.status === 400 &&
          (payload.error?.message || payload.message || "").toLowerCase().includes("already verified")
        ) {
          // Token was already consumed — email is verified, show success
          setState("success");
          setMessage("Your email has already been verified.");
        } else {
          setState("error");
          setMessage(
            payload.error?.message || payload.message || "Verification failed. The link may have expired."
          );
        }
      } catch {
        setState("error");
        setMessage("Unable to connect to the server. Please try again later.");
      }
    }

    verify();
  }, [token]);

  return (
    <section className="mx-auto max-w-md space-y-6 px-4 py-16 text-center">
      {state === "loading" && (
        <>
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-emerald-400" />
          <h1 className="text-xl font-semibold text-white">Verifying your email…</h1>
          <p className="text-sm text-white/60">This will only take a moment.</p>
        </>
      )}

      {state === "success" && (
        <>
          <p className="text-5xl">✅</p>
          <h1 className="text-2xl font-semibold text-white">Email verified!</h1>
          <p className="text-sm leading-relaxed text-white/70">{message}</p>
          {rewardGranted && (
            <div className="rounded-2xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
              🎉 +£{rewardAmount} verification reward credited to your wallet!
            </div>
          )}
          <div className="flex flex-col gap-3">
            <Button asChild className="w-full min-h-[48px]">
              <Link href="/account">Go to account</Link>
            </Button>
            <Button asChild variant="secondary" className="w-full min-h-[48px]">
              <Link href="/wallet">Go to wallet</Link>
            </Button>
          </div>
        </>
      )}

      {state === "error" && (
        <>
          <p className="text-5xl">❌</p>
          <h1 className="text-2xl font-semibold text-white">Verification failed</h1>
          <p className="text-sm leading-relaxed text-white/70">{message}</p>
          <div className="flex flex-col gap-3">
            <Button asChild className="w-full min-h-[48px]">
              <Link href="/account/security">Try again</Link>
            </Button>
            <Button asChild variant="secondary" className="w-full min-h-[48px]">
              <Link href="/account">Back to account</Link>
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
