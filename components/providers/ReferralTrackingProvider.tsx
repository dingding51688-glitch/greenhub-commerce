"use client";

import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  getStoredReferralCode,
  markClickError,
  markClickTracked,
  setStoredReferralCode,
  shouldTrackClick
} from "@/lib/referral-tracking";

const CLICK_ENDPOINT = "/api/referral/click";
const TURNSTILE_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const FALLBACK_KEY = "1x00000000000000000000AA";
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_KEY || FALLBACK_KEY;

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      execute: (id?: string) => void;
    };
  }
}

export function ReferralTrackingProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [token, setToken] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const retryRef = useRef(0);
  const lastTracked = useRef<string | null>(null);
  const [shouldRenderWidget, setShouldRenderWidget] = useState(false);
  const code = searchParams?.get("ref") || null;

  const setContainer = useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node ?? null;
  }, []);

  useEffect(() => {
    if (!code) return;
    setStoredReferralCode(code);
    setShouldRenderWidget(true);
    if (window.turnstile) {
      setScriptLoaded(true);
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>("script[data-turnstile]");
    if (existing) {
      existing.addEventListener("load", () => setScriptLoaded(true), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = TURNSTILE_SRC;
    script.async = true;
    script.defer = true;
    script.dataset.turnstile = "true";
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => console.warn("Turnstile script failed to load");
    document.head.appendChild(script);
  }, [code]);

  useEffect(() => {
    if (!code || !scriptLoaded || !containerRef.current || !window.turnstile) return;
    if (widgetIdRef.current) {
      window.turnstile.reset(widgetIdRef.current);
      widgetIdRef.current = null;
    }
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: SITE_KEY,
      size: "invisible",
      callback: (nextToken: string) => setToken(nextToken),
      "error-callback": () => setToken(null),
      "expired-callback": () => setToken(null)
    });
    window.turnstile.execute(widgetIdRef.current);
  }, [code, scriptLoaded]);

  useEffect(() => {
    if (!code || !token) return;
    if (!shouldTrackClick(code) || lastTracked.current === code) return;
    const landingPath = `${pathname || window.location.pathname}`;
    const utmParams: Record<string, string> = {};
    if (searchParams) {
      searchParams.forEach((value, key) => {
        if (key.startsWith("utm_")) {
          utmParams[key] = value;
        }
      });
    }
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const fingerprint = [navigator.userAgent, navigator.language, timezone, `${window.screen.width}x${window.screen.height}`].join("|");

    const body = {
      code,
      token,
      landingPath,
      utm: utmParams,
      userAgent: navigator.userAgent,
      fingerprint
    };

    fetch(CLICK_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Turnstile validation failed");
        }
        markClickTracked(code);
        lastTracked.current = code;
        retryRef.current = 0;
      })
      .catch((error) => {
        console.warn("Referral click tracking failed", error);
        if (retryRef.current < 1 && window.turnstile && widgetIdRef.current) {
          retryRef.current += 1;
          setToken(null);
          window.turnstile.reset(widgetIdRef.current);
          window.turnstile.execute(widgetIdRef.current);
          return;
        }
        markClickError();
      });
  }, [code, token, pathname, searchParams]);

  return (
    <>
      {children}
      {shouldRenderWidget && <div ref={setContainer} className="pointer-events-none opacity-0" aria-hidden="true" />}
    </>
  );
}
