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
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#050505] text-white shadow-lg card-hover"
      style={{ background }}
    >
      {/* Image area */}
      <div className="relative z-10 flex aspect-square items-center justify-center p-4">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={imageAlt || title}
            width={200}
            height={200}
            className="h-full w-full object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.5)]"
            priority={false}
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/5 text-3xl">
            <span role="img" aria-hidden="true">{imageEmojiFallback}</span>
          </div>
        )}
      </div>
      {/* Text area */}
      <div className="relative z-10 px-3 pb-3">
        {label && (
          <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-white/60">{label}</p>
        )}
        <h3 className="mt-0.5 text-sm font-bold uppercase tracking-[0.1em]">{title}</h3>
        {subtitle && <p className="mt-0.5 text-[10px] leading-snug text-white/60 line-clamp-2">{subtitle}</p>}
      </div>
      {/* Decorative overlay */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div
          className="absolute -bottom-6 -right-6 h-28 w-28 rounded-[50%] blur-[40px]"
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
