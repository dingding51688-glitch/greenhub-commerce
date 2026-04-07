"use client";

import { clsx } from "clsx";

interface StateMessageProps {
  title: string;
  body?: string;
  variant?: "info" | "error" | "empty";
  actionLabel?: string;
  onAction?: () => void;
}

export function StateMessage({ title, body, variant = "info", actionLabel, onAction }: StateMessageProps) {
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
