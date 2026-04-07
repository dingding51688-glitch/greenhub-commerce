import clsx from "clsx";
import { Slot } from "@radix-ui/react-slot";
import { ButtonHTMLAttributes, forwardRef } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  asChild?: boolean;
}

const baseStyles =
  "inline-flex items-center justify-center font-semibold uppercase tracking-[0.12em] transition focus-visible:outline-none rounded-pill disabled:opacity-40 disabled:cursor-not-allowed";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "cta-gradient text-white shadow-cta border border-white/10 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200",
  secondary:
    "border border-white/20 bg-white/[0.03] text-white/85 backdrop-blur-sm hover:bg-white/[0.06] hover:border-white/40 hover:text-white active:scale-[0.98] transition-all duration-200",
  ghost:
    "text-white/60 hover:text-white hover:bg-white/[0.04] active:scale-[0.98] transition-all duration-200"
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-10 px-6 text-[11px]",
  md: "h-12 px-8 text-xs",
  lg: "h-14 px-9 text-sm"
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", fullWidth = false, asChild = false, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref as any}
        className={clsx(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export default Button;
