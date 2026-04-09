import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";

const toneMap = {
  green: {
    top: "#0f1b0f",
    bottom: "#1b2b1b",
    accent: "#13a86b",
    overlay: "rgba(19,168,107,0.18)"
  },
  orange: {
    top: "#3b1b06",
    bottom: "#4c260c",
    accent: "#f2a33a",
    overlay: "rgba(242,163,58,0.2)"
  },
  cream: {
    top: "#2f2416",
    bottom: "#20170f",
    accent: "#f5d6a1",
    overlay: "rgba(245,214,161,0.15)"
  },
  purple: {
    top: "#1a0f2e",
    bottom: "#2d1b4e",
    accent: "#a855f7",
    overlay: "rgba(168,85,247,0.18)"
  },
  blue: {
    top: "#0c1929",
    bottom: "#132d4a",
    accent: "#38bdf8",
    overlay: "rgba(56,189,248,0.18)"
  }
};

export type ProductCategoryTone = keyof typeof toneMap;

export type ProductCategoryCardProps = {
  href: string;
  title: string;
  label?: string;
  subtitle?: string;
  imageUrl?: string;
  imageAlt?: string;
  tone?: ProductCategoryTone;
  imageEmojiFallback?: string;
};

export function ProductCategoryCard({
  href,
  title,
  label,
  subtitle,
  imageUrl,
  imageAlt,
  tone = "green",
  imageEmojiFallback = "🍃"
}: ProductCategoryCardProps) {
  const palette = toneMap[tone] ?? toneMap.green;
  const background = `linear-gradient(180deg, ${palette.top} 0%, ${palette.top} 58%, ${palette.bottom} 58%, ${palette.bottom} 100%)`;

  return (
    <Link
      href={href}
      className="group relative flex min-h-[140px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#050505] text-white shadow-lg sm:min-h-[220px] sm:flex-row sm:rounded-3xl card-hover"
      style={{ background }}
    >
      <div className="relative z-10 flex w-full flex-col justify-between gap-2 px-3 py-3 sm:w-3/5 sm:gap-4 sm:px-5 sm:py-5">
        <div>
          {label && (
            <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-white/70 sm:text-[11px] sm:tracking-[0.3em]">{label}</p>
          )}
          <h3 className="mt-1 text-base font-semibold uppercase tracking-[0.15em] sm:mt-2 sm:text-xl sm:tracking-[0.18em]">{title}</h3>
          {subtitle && <p className="mt-1 text-xs leading-relaxed text-white/75 sm:mt-2 sm:text-sm">{subtitle}</p>}
        </div>
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white transition group-hover:translate-x-1 group-hover:-translate-y-1 sm:h-10 sm:w-10">
          <ArrowIcon />
        </span>
      </div>
      <div className="relative z-10 flex flex-1 items-center justify-center px-3 pb-3 sm:items-end sm:justify-end sm:px-0 sm:pr-6">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={imageAlt || title}
            width={200}
            height={200}
            className="h-28 w-auto object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)] sm:h-40"
            priority={false}
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-white/5 text-3xl sm:h-28 sm:w-28 sm:text-4xl">
            <span role="img" aria-hidden="true">
              {imageEmojiFallback}
            </span>
          </div>
        )}
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)", backgroundSize: "24px 24px" }} />
        <div
          className="absolute -bottom-8 -right-10 h-36 w-36 rounded-[50%] blur-[50px]"
          style={{ background: palette.overlay }}
        />
      </div>
    </Link>
  );
}

function ArrowIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
    </svg>
  );
}

export default ProductCategoryCard;
