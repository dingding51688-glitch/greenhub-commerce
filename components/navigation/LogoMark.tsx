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
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        {/* Neon glow filter */}
        <filter id="gh-neon" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Background gradient - dark with green edge */}
        <linearGradient id="gh-hex-bg" x1="0" y1="0" x2="56" y2="56">
          <stop offset="0%" stopColor="#0A0F0D" />
          <stop offset="100%" stopColor="#0D1F17" />
        </linearGradient>
        {/* Neon green gradient for edges */}
        <linearGradient id="gh-neon-edge" x1="0" y1="0" x2="56" y2="56">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="50%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#6EE7B7" />
        </linearGradient>
        {/* Leaf glow */}
        <radialGradient id="gh-center-glow" cx="50%" cy="45%" r="35%">
          <stop offset="0%" stopColor="#34D399" stopOpacity="0.25" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Hexagon shape */}
      <polygon
        points="28,2 50,15 50,41 28,54 6,41 6,15"
        fill="url(#gh-hex-bg)"
      />
      {/* Center glow */}
      <polygon
        points="28,2 50,15 50,41 28,54 6,41 6,15"
        fill="url(#gh-center-glow)"
      />
      {/* Neon border */}
      <polygon
        points="28,2 50,15 50,41 28,54 6,41 6,15"
        fill="none"
        stroke="url(#gh-neon-edge)"
        strokeWidth="1.5"
        filter="url(#gh-neon)"
      />

      {/* Inner circuit lines - tech aesthetic */}
      <path d="M28 8 L28 14" stroke="#34D399" strokeWidth="0.5" strokeOpacity="0.3" />
      <path d="M12 18 L18 18" stroke="#34D399" strokeWidth="0.5" strokeOpacity="0.3" />
      <path d="M38 18 L44 18" stroke="#34D399" strokeWidth="0.5" strokeOpacity="0.3" />
      <path d="M12 38 L18 38" stroke="#34D399" strokeWidth="0.5" strokeOpacity="0.3" />
      <path d="M38 38 L44 38" stroke="#34D399" strokeWidth="0.5" strokeOpacity="0.3" />
      {/* Corner dots */}
      <circle cx="28" cy="8" r="1" fill="#34D399" opacity="0.5" />
      <circle cx="12" cy="18" r="1" fill="#34D399" opacity="0.4" />
      <circle cx="44" cy="18" r="1" fill="#34D399" opacity="0.4" />

      {/* Minimalist leaf - geometric/angular style */}
      <g transform="translate(28,28)" filter="url(#gh-neon)">
        {/* Center blade */}
        <path d="M0-14 L-2.5-4 L0 2 L2.5-4 Z" fill="#34D399" />
        {/* Left blade */}
        <path d="M-3-10 L-9-2 L-6 2 L-2-4 Z" fill="#34D399" opacity="0.8" />
        {/* Right blade */}
        <path d="M3-10 L9-2 L6 2 L2-4 Z" fill="#34D399" opacity="0.8" />
        {/* Far left */}
        <path d="M-7-4 L-13 2 L-9 5 L-5 0 Z" fill="#34D399" opacity="0.55" />
        {/* Far right */}
        <path d="M7-4 L13 2 L9 5 L5 0 Z" fill="#34D399" opacity="0.55" />
        {/* Stem */}
        <path d="M0 2 L0 16" stroke="#34D399" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        {/* Stem node */}
        <circle cx="0" cy="10" r="1.5" fill="#0A0F0D" stroke="#34D399" strokeWidth="0.8" />
      </g>
    </svg>
  );
}

export function LogoMark({ size: _size = 42, showText: _showText = true, className }: LogoMarkProps) {
  return (
    <div className={clsx("flex items-baseline gap-1.5", className)}>
      <span className="text-[18px] font-black uppercase tracking-[0.12em] text-white">
        GREEN<span className="text-emerald-400">HUB</span>
      </span>
      <span className="text-[22px] font-black tracking-[0.06em] text-emerald-400">
        420
      </span>
    </div>
  );
}

export default LogoMark;
