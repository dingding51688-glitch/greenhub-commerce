import clsx from "clsx";

export type LogoMarkProps = {
  size?: number;
  showText?: boolean;
  className?: string;
};

function LeafIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Circular background with gradient */}
      <defs>
        <linearGradient id="logo-bg" x1="0" y1="0" x2="48" y2="48">
          <stop offset="0%" stopColor="#0d5b3f" />
          <stop offset="100%" stopColor="#13a86b" />
        </linearGradient>
        <linearGradient id="leaf-grad" x1="14" y1="10" x2="34" y2="38">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#a7f3d0" stopOpacity="0.8" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="24" fill="url(#logo-bg)" />
      {/* Stylised cannabis leaf — simplified 3-finger silhouette */}
      <path
        d="M24 8c0 0-4 6-4 12 0 2 .8 3.5 2 4.5-3-1-7-1.5-9 1 2.5 1.5 5.5 1.2 8 0-.5 2-1.5 4-3.5 5.5 3-1 5.2-3 6.5-5.5 1.3 2.5 3.5 4.5 6.5 5.5-2-1.5-3-3.5-3.5-5.5 2.5 1.2 5.5 1.5 8 0-2-2.5-6-2-9-1 1.2-1 2-2.5 2-4.5 0-6-4-12-4-12z"
        fill="url(#leaf-grad)"
      />
      {/* Centre stem */}
      <line x1="24" y1="18" x2="24" y2="38" stroke="white" strokeOpacity="0.3" strokeWidth="0.8" />
    </svg>
  );
}

export function LogoMark({ size = 40, showText = true, className }: LogoMarkProps) {
  return (
    <div className={clsx("flex items-center gap-2.5 text-white", className)}>
      <LeafIcon size={size} />
      {showText && (
        <div className="leading-tight">
          <p className="text-[13px] font-bold uppercase tracking-[0.3em]">
            Green Hub
            <span className="ml-1 text-emerald-400">420</span>
          </p>
          <p className="text-[9px] font-medium uppercase tracking-[0.35em] text-white/50">
            Distributor
          </p>
        </div>
      )}
    </div>
  );
}

export default LogoMark;
