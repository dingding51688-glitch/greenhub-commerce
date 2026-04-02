import clsx from "clsx";
import { HTMLAttributes, ReactNode } from "react";

export type CardVariant = "elevated" | "outlined";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: "sm" | "md" | "lg";
  title?: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
}

const paddingMap = {
  sm: "p-sm",
  md: "p-md",
  lg: "p-lg"
};

const variantMap: Record<CardVariant, string> = {
  elevated: "bg-night-900/70 border border-white/5 shadow-surface",
  outlined: "bg-night-950/60 border border-night-700"
};

export function Card({
  className,
  variant = "elevated",
  padding = "md",
  title,
  description,
  children,
  footer,
  ...rest
}: CardProps) {
  return (
    <section
      className={clsx(
        "rounded-lg text-ink-400",
        variantMap[variant],
        paddingMap[padding],
        className
      )}
      {...rest}
    >
      {(title || description) && (
        <header className="mb-sm flex flex-col gap-1">
          {title && <h3 className="text-white font-semibold text-lg">{title}</h3>}
          {description && <p className="text-sm text-ink-500">{description}</p>}
        </header>
      )}
      {children && <div className="space-y-sm">{children}</div>}
      {footer && <footer className="mt-md pt-sm border-t border-white/5">{footer}</footer>}
    </section>
  );
}

export default Card;
