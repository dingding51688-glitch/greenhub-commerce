import Image from "next/image";
import Link from "next/link";

const toneMap = {
  green: {
    bg: "from-emerald-400/8 to-emerald-400/[0.01]",
    border: "border-emerald-400/12",
    glow: "bg-emerald-400/10",
    label: "text-emerald-400/70",
    accent: "text-emerald-400",
  },
  orange: {
    bg: "from-amber-400/8 to-amber-400/[0.01]",
    border: "border-amber-400/12",
    glow: "bg-amber-400/10",
    label: "text-amber-400/70",
    accent: "text-amber-400",
  },
  cream: {
    bg: "from-cyan-400/8 to-cyan-400/[0.01]",
    border: "border-cyan-400/12",
    glow: "bg-cyan-400/10",
    label: "text-cyan-400/70",
    accent: "text-cyan-400",
  },
  purple: {
    bg: "from-purple-400/8 to-purple-400/[0.01]",
    border: "border-purple-400/12",
    glow: "bg-purple-400/10",
    label: "text-purple-400/70",
    accent: "text-purple-400",
  },
  blue: {
    bg: "from-blue-400/8 to-blue-400/[0.01]",
    border: "border-blue-400/12",
    glow: "bg-blue-400/10",
    label: "text-blue-400/70",
    accent: "text-blue-400",
  },
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
  imageEmojiFallback = "🍃",
}: ProductCategoryCardProps) {
  const palette = toneMap[tone] ?? toneMap.green;

  return (
    <Link
      href={href}
      className={`group relative isolate flex flex-col overflow-hidden rounded-2xl border ${palette.border} bg-[#0a0a0a] text-white shadow-lg active:scale-[0.97] transition`}
    >
      {/* Grid texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
        aria-hidden="true"
      />

      {/* Gradient overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-b ${palette.bg}`}
        aria-hidden="true"
      />

      {/* Glow */}
      <div
        className={`absolute -top-8 -right-8 h-24 w-24 ${palette.glow} rounded-full blur-3xl`}
        aria-hidden="true"
      />
      <div
        className={`absolute -bottom-4 -left-4 h-16 w-16 ${palette.glow} rounded-full blur-2xl opacity-50`}
        aria-hidden="true"
      />

      {/* Image area */}
      <div className="relative z-10 flex aspect-square items-center justify-center p-5">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={imageAlt || title}
            width={200}
            height={200}
            className="mx-auto h-[75%] w-[75%] object-contain drop-shadow-[0_10px_25px_rgba(0,0,0,0.6)]"
            priority={false}
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-3xl">
            <span role="img" aria-hidden="true">
              {imageEmojiFallback}
            </span>
          </div>
        )}
      </div>

      {/* Text area */}
      <div className="relative z-10 px-3 pb-3">
        {label && (
          <p
            className={`text-[8px] font-bold uppercase tracking-[0.25em] ${palette.label}`}
          >
            {label}
          </p>
        )}
        <h3 className="mt-0.5 text-sm font-bold uppercase tracking-[0.08em] text-white">
          {title}
        </h3>
        {subtitle && (
          <p className="mt-0.5 text-[10px] leading-snug text-white/35 line-clamp-2">
            {subtitle}
          </p>
        )}
      </div>
    </Link>
  );
}

export default ProductCategoryCard;
