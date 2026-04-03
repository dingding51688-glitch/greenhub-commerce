"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import Button from "@/components/ui/button";
import { StateMessage } from "@/components/StateMessage";
import { useAuth } from "@/components/providers/AuthProvider";
import { swrFetcher } from "@/lib/api";

const countdownInterval = 1000;

type TelegramStatus = {
  linked?: boolean;
  handle?: string;
  linkedAt?: string;
};

type LinkCode = {
  code: string;
  deepLink: string;
  expiresAt: string;
};

export default function TelegramLinkingPage() {
  const { token, profile } = useAuth();
  const router = useRouter();
  const { data: status, error, isLoading, mutate } = useSWR<TelegramStatus>(token ? "/api/account/telegram" : null, swrFetcher);
  const [linkCode, setLinkCode] = useState<LinkCode | null>(null);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const [stepAlert, setStepAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState(false);

  useEffect(() => {
    if (!linkCode) {
      setRemainingMs(null);
      return;
    }
    const expiresAt = new Date(linkCode.expiresAt).getTime();
    const tick = () => {
      const ms = expiresAt - Date.now();
      setRemainingMs(ms > 0 ? ms : 0);
      if (ms <= 0) {
        clearInterval(intervalId);
      }
    };
    tick();
    const intervalId = window.setInterval(tick, countdownInterval);
    return () => clearInterval(intervalId);
  }, [linkCode]);

  const countdown = useMemo(() => {
    if (remainingMs === null || remainingMs <= 0) return "00:00";
    const minutes = Math.floor(remainingMs / 60000)
      .toString()
      .padStart(2, "0");
    const seconds = Math.floor((remainingMs % 60000) / 1000)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [remainingMs]);

  const qrSrc = useMemo(() => (linkCode ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(linkCode.deepLink)}` : null), [linkCode]);

  if (!token) {
    return (
      <StateMessage
        title="Please sign in"
        body="Log in to link Telegram notifications."
        actionLabel="Go to login"
        onAction={() => router.push("/login")}
      />
    );
  }

  const requestCode = async () => {
    setStepAlert(null);
    try {
      const response = await fetch("/api/account/telegram/request-code", { method: "POST" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error?.message || "Unable to request link code");
      }
      const fallbackLink = payload?.deepLink || `https://t.me/GreenHubBot?start=${payload?.code}`;
      const data: LinkCode = {
        code: payload?.code,
        deepLink: fallbackLink,
        expiresAt: payload?.expiresAt || new Date(Date.now() + 5 * 60 * 1000).toISOString()
      };
      setLinkCode(data);
    } catch (requestError: any) {
      setStepAlert({ type: "error", message: requestError?.message || "Request failed" });
    }
  };


  const copyCode = async () => {
    if (!linkCode) return;
    try {
      await navigator.clipboard.writeText(linkCode.code);
      setStepAlert({ type: "success", message: "Code copied" });
    } catch (clipboardError) {
      console.warn("Clipboard unavailable", clipboardError);
      setStepAlert({ type: "error", message: "Clipboard unavailable" });
    }
  };

  const confirmLink = async () => {
    if (!linkCode) return;
    setStepAlert(null);
    setPendingConfirm(true);
    try {
      const response = await fetch("/api/account/telegram/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: linkCode.code })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error?.message || "Verification failed");
      }
      setStepAlert({ type: "success", message: "Telegram linked" });
      setLinkCode(null);
      await mutate();
    } catch (confirmError: any) {
      setStepAlert({ type: "error", message: confirmError?.message || "Could not confirm" });
    } finally {
      setPendingConfirm(false);
    }
  };

  const unlinkTelegram = async () => {
    setStepAlert(null);
    try {
      const response = await fetch("/api/account/telegram", { method: "DELETE" });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error?.message || "Unable to unlink");
      }
      await mutate();
      setStepAlert({ type: "success", message: "Telegram disconnected" });
    } catch (unlinkError: any) {
      setStepAlert({ type: "error", message: unlinkError?.message || "Unlink failed" });
    }
  };
  return (
    <section className="space-y-8">
      <header className="rounded-3xl border border-white/10 bg-card p-6 shadow-card">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Telegram linking</p>
        <h1 className="text-3xl font-semibold text-white">Connect @GreenHubBot for approvals</h1>
        <p className="mt-2 text-sm text-white/60">Linked accounts receive order updates, referral pings, and concierge verifications inside Telegram.</p>
      </header>

      {stepAlert && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            stepAlert.type === "success"
              ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
              : "border-red-400/40 bg-red-400/10 text-red-100"
          }`}
        >
          {stepAlert.message}
        </div>
      )}

      <div className="rounded-3xl border border-white/10 bg-night-950/80 p-6">
        {isLoading ? (
          <div className="h-20 animate-pulse rounded-2xl bg-white/5" />
        ) : error ? (
          <StateMessage
            variant="error"
            title="Unable to load link status"
            body={error.message}
            actionLabel="Retry"
            onAction={() => mutate()}
          />
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-white/60">Current status</p>
              {status?.linked ? (
                <>
                  <p className="text-lg font-semibold text-white">Linked as @{status.handle || profile?.telegramHandle || "unknown"}</p>
                  {status.linkedAt && <p className="text-xs text-white/40">Linked {new Date(status.linkedAt).toLocaleString("en-GB")}</p>}
                </>
              ) : (
                <p className="text-lg font-semibold text-white">Not linked</p>
              )}
            </div>
            {status?.linked && (
              <Button variant="secondary" onClick={unlinkTelegram}>
                Disconnect
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-white/10 bg-night-950/70 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Step-by-step</p>
        <ol className="mt-4 space-y-5">
          <li className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-white">1 · Request a binding code</p>
              <p className="text-xs text-white/60">Code stays valid for 5 minutes. Don’t share it with anyone.</p>
              {linkCode && remainingMs !== null && (
                <p className={`text-xs ${remainingMs > 0 ? "text-emerald-200" : "text-red-200"}`}>Expires in {countdown}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={requestCode}>Get code</Button>
              {linkCode && (
                <Button variant="secondary" onClick={copyCode}>
                  Copy code
                </Button>
              )}
            </div>
          </li>
          <li className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-semibold text-white">2 · Send the code to @GreenHubBot</p>
            {linkCode ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/40">Code</p>
                  <p className="text-2xl font-mono text-white">{linkCode.code}</p>
                  <Link href={linkCode.deepLink} target="_blank" className="text-xs text-brand-200 underline">
                    Open Telegram
                  </Link>
                </div>
                {qrSrc && (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrSrc} alt="Telegram QR" width={150} height={150} className="rounded-xl" />
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-white/50">Press “Get code” first to reveal your unique link.</p>
            )}
          </li>
          <li className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-white">3 · Confirm linking</p>
              <p className="text-xs text-white/60">After sending the code, tap “Already sent” to finish.</p>
            </div>
            <Button onClick={confirmLink} disabled={!linkCode || remainingMs === 0 || pendingConfirm}>
              {pendingConfirm ? "Checking…" : "Already sent"}
            </Button>
          </li>
        </ol>
      </div>

      <div className="rounded-3xl border border-white/10 bg-night-950/60 p-6">
        <h2 className="text-xl font-semibold text-white">Why link Telegram?</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-white/70">
          <li>Instant locker alerts + referral bonuses pushed to your DM.</li>
          <li>Approve sensitive changes (payouts, device sign-ins) via concierge chat.</li>
          <li>Fallback channel when SMS or email is delayed.</li>
        </ul>
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
          FAQ: Codes expire in 5 minutes. If Telegram says “code already used,” request another. Need help? Ping <Link href="/support" className="underline">support</Link> and mention your locker email.
        </div>
      </div>
    </section>
  );
}
