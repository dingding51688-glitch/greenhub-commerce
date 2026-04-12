import clsx from "clsx";

export type LogoMarkProps = {
  size?: number;
  showText?: boolean;
  className?: string;
};

function LogoIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 52 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        {/* Main gradient - deep emerald to bright green */}
        <linearGradient id="gh-bg" x1="0" y1="0" x2="52" y2="52">
          <stop offset="0%" stopColor="#064E3B" />
          <stop offset="50%" stopColor="#059669" />
          <stop offset="100%" stopColor="#34D399" />
        </linearGradient>
        {/* Inner glow */}
        <radialGradient id="gh-glow" cx="50%" cy="35%" r="50%">
          <stop offset="0%" stopColor="#6EE7B7" stopOpacity="0.4" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
        {/* Leaf gradient */}
        <linearGradient id="gh-leaf" x1="16" y1="8" x2="36" y2="42">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#D1FAE5" stopOpacity="0.9" />
        </linearGradient>
      </defs>

      {/* Rounded square background */}
      <rect x="2" y="2" width="48" height="48" rx="14" fill="url(#gh-bg)" />
      <rect x="2" y="2" width="48" height="48" rx="14" fill="url(#gh-glow)" />

      {/* Subtle border */}
      <rect x="2.5" y="2.5" width="47" height="47" rx="13.5" stroke="white" strokeOpacity="0.15" strokeWidth="1" />

      {/* Cannabis leaf - 5-pointed, more detailed */}
      <g transform="translate(26,26)">
        {/* Center leaf */}
        <path d="M0-16 C-2-10 -3-4 -2 0 C-1 3 0 4 0 6 C0 4 1 3 2 0 C3-4 2-10 0-16Z" fill="url(#gh-leaf)" />
        {/* Left inner leaf */}
        <path d="M-4-12 C-8-6 -10-1 -8 2 C-7 4 -5 4 -3 3 C-4 1 -4-2 -4-12Z" fill="url(#gh-leaf)" opacity="0.9" />
        {/* Right inner leaf */}
        <path d="M4-12 C8-6 10-1 8 2 C7 4 5 4 3 3 C4 1 4-2 4-12Z" fill="url(#gh-leaf)" opacity="0.9" />
        {/* Left outer leaf */}
        <path d="M-8-6 C-13 0 -14 5 -11 7 C-9 8 -7 7 -6 5 C-7 3 -8 0 -8-6Z" fill="url(#gh-leaf)" opacity="0.75" />
        {/* Right outer leaf */}
        <path d="M8-6 C13 0 14 5 11 7 C9 8 7 7 6 5 C7 3 8 0 8-6Z" fill="url(#gh-leaf)" opacity="0.75" />
        {/* Stem */}
        <path d="M0 4 C0 8 -0.5 12 0 16" stroke="white" strokeOpacity="0.5" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      </g>
    </svg>
  );
}

export function LogoMark({ size = 44, showText = true, className }: LogoMarkProps) {
  return (
    <div className={clsx("flex items-center gap-3", className)}>
      <LogoIcon size={size} />
      {showText && (
        <div className="flex flex-col leading-none">
          {/* GREEN HUB */}
          <span className="text-[17px] font-black uppercase tracking-[0.2em] text-white">
            GREEN HUB
          </span>
          {/* 420 - accent color, slightly offset */}
          <span className="mt-0.5 text-[22px] font-black tracking-[0.15em] text-emerald-400">
            420
          </span>
        </div>
      )}
    </div>
  );
}

export default LogoMark;
