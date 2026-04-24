"use client";

import { clsx } from "clsx";

interface StateMessageProps {
  title: string;
  body?: string;
  variant?: "info" | "error" | "empty" | "auth";
  actionLabel?: string;
  onAction?: () => void;
}

export function StateMessage({ title, body, variant = "info", actionLabel, onAction }: StateMessageProps) {
  if (variant === "auth") {
    return (
      <div className="relative isolate overflow-hidden rounded-2xl border border-emerald-400/15 bg-gradient-to-br from-[#0a1a12] to-[#080810] p-6 text-center">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(rgba(16,185,129,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.4) 1px, transparent 1px)",
          backgroundSize: "32px 32px"
        }} aria-hidden="true" />
        {/* Glow */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 h-24 w-40 rounded-full bg-emerald-400/10 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-8 right-0 h-16 w-32 rounded-full bg-cyan-400/8 blur-3xl" aria-hidden="true" />
        
        <div className="relative z-10">
          {/* Icon */}
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400/15 to-cyan-400/10 ring-1 ring-emerald-400/20">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
              <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
          </div>
          
          <p className="text-lg font-bold text-white">{title}</p>
          {body && <p className="mt-2 text-sm text-white/50">{body}</p>}
          
          {actionLabel && onAction && (
            <button onClick={onAction}
              className="mt-5 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 px-8 text-sm font-bold text-black shadow-lg shadow-emerald-500/20 active:scale-[0.97] transition">
              {actionLabel}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "rounded-2xl border px-4 py-6 text-center backdrop-blur-sm",
        variant === "error" && "border-red-500/30 bg-red-500/5 text-red-200",
        variant === "empty" && "border-white/10 bg-white/5 text-white/70",
        variant === "info" && "border-brand-500/40 bg-brand-500/10 text-brand-50"
      )}
    >
      <p className="text-base font-semibold">{title}</p>
      {body && <p className="mt-2 text-sm opacity-80">{body}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 inline-flex items-center justify-center rounded-full border border-white/20 px-4 py-1 text-sm font-medium text-white hover:border-white/40"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
