"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";

type State = "idle" | "sending" | "sent" | "error" | "login";

export default function VerifyNowPage() {
  const { token, isReady } = useAuth();
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");
  const calledRef = useRef(false);

  useEffect(() => {
    if (!isReady) return; // wait for auth hydration
    if (!token) { setState("login"); return; }
    if (calledRef.current) return;
    calledRef.current = true;
    setState("sending");

    async function send() {
      try {
        const res = await fetch("/api/account/security/request-verification", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });
        const data = await res.json().catch(() => ({}));

        if (res.ok && data.success) {
          setState("sent");
          setMessage(data.message || "Verification email sent! Check your inbox.");
        } else if (res.status === 401) {
          setState("login");
        } else {
          setState("error");
          setMessage(data.error?.message || data.message || data.error || "Failed to send verification email.");
        }
      } catch {
        setState("error");
        setMessage("Unable to connect. Please try again.");
      }
    }

    send();
  }, [token, isReady]);

  if (state === "idle" || state === "sending") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-emerald-400" />
          <p className="text-sm text-white/50">Sending verification email…</p>
        </div>
      </div>
    );
  }

  if (state === "login") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="space-y-4 text-center">
          <p className="text-4xl">🔐</p>
          <p className="text-lg font-bold text-white">Please sign in first</p>
          <p className="text-xs text-white/40">You need to be logged in to verify your email.</p>
          <Link href="/login" className="mt-2 inline-flex min-h-[44px] items-center justify-center rounded-xl cta-gradient px-6 text-sm font-bold text-white">
            Login
          </Link>
        </div>
      </div>
    );
  }

  if (state === "sent") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="mx-auto max-w-sm space-y-4 text-center">
          <p className="text-4xl">📧</p>
          <p className="text-lg font-bold text-white">Verification email sent!</p>
          <p className="text-xs text-white/50">{message}</p>
          <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-xs text-emerald-200">
            💡 Check your inbox (and spam folder). Click the link to verify and receive your £5 reward!
          </div>
          <Link href="/account" className="mt-2 inline-flex min-h-[44px] items-center justify-center rounded-xl border border-white/15 px-6 text-sm font-medium text-white">
            Back to account
          </Link>
        </div>
      </div>
    );
  }

  // error
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="mx-auto max-w-sm space-y-4 text-center">
        <p className="text-4xl">❌</p>
        <p className="text-lg font-bold text-white">Could not send verification email</p>
        <p className="text-xs text-white/50">{message}</p>
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => {
              calledRef.current = false;
              setState("idle");
            }}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl cta-gradient px-6 text-sm font-bold text-white"
          >
            Try again
          </button>
          <Link href="/account" className="text-xs text-white/30 underline">Back to account</Link>
        </div>
      </div>
    </div>
  );
}
