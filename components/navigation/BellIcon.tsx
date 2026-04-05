import clsx from "clsx";

export function BellIcon({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      className={clsx("stroke-white", className)}
      aria-hidden="true"
    >
      <path
        d="M15 8a3 3 0 0 0-6 0c0 5.25-1.5 6.75-3 8h12c-1.5-1.25-3-2.75-3-8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M10 18a2 2 0 0 0 4 0"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default BellIcon;
