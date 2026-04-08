"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/button";
import { useAuth } from "@/components/providers/AuthProvider";

type State = "sending" | "sent" | "error" | "login";

export default function VerifyNowPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [state, setState] = useState<State>(token ? "sending" : "login");
  const [message, setMessage] = useState("");
  const calledRef = useRef(false);

  useEffect(() => {
    if (!token || calledRef.current) return;
    calledRef.current = true;

    async function send() {
      try {
        const res = await fetch("/api/account/security/request-verification", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json().catch(() => ({}));

        if (res.ok && data.success) {
          setState("sent");
          setMessage(data.message || "Verification email sent! Check your inbox.");
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
  }, [token]);

  if (state === "login") {
    return (
      <section className="mx-auto max-w-md space-y-6 px-4 py-16 text-center">
        <p className="text-5xl">🔐</p>
        <h1 className="text-2xl font-semibold text-white">Please sign in first</h1>
        <p className="text-sm text-white/60">You need to be logged in to verify your email.</p>
        <Button asChild className="w-full min-h-[48px]">
          <Link href="/login">Login</Link>
        </Button>
      </section>
    );
  }

  if (state === "sending") {
    return (
      <section className="mx-auto max-w-md space-y-6 px-4 py-16 text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-emerald-400" />
        <h1 className="text-xl font-semibold text-white">Sending verification email…</h1>
        <p className="text-sm text-white/60">This will only take a moment.</p>
      </section>
    );
  }

  if (state === "sent") {
    return (
      <section className="mx-auto max-w-md space-y-6 px-4 py-16 text-center">
        <p className="text-5xl">📧</p>
        <h1 className="text-2xl font-semibold text-white">Verification email sent!</h1>
        <p className="text-sm leading-relaxed text-white/70">{message}</p>
        <div className="rounded-2xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
          💡 Check your inbox (and spam folder). Click the link in the email to verify and receive your £5 reward!
        </div>
        <div className="flex flex-col gap-3">
          <Button asChild className="w-full min-h-[48px]">
            <Link href="/account">Back to account</Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-md space-y-6 px-4 py-16 text-center">
      <p className="text-5xl">❌</p>
      <h1 className="text-2xl font-semibold text-white">Could not send verification email</h1>
      <p className="text-sm leading-relaxed text-white/70">{message}</p>
      <div className="flex flex-col gap-3">
        <Button
          className="w-full min-h-[48px]"
          onClick={() => {
            calledRef.current = false;
            setState("sending");
            window.location.reload();
          }}
        >
          Try again
        </Button>
        <Button asChild variant="secondary" className="w-full min-h-[48px]">
          <Link href="/account">Back to account</Link>
        </Button>
      </div>
    </section>
  );
}
