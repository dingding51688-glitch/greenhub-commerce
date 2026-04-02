import clsx from "clsx";
import { ButtonHTMLAttributes, forwardRef } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const baseStyles =
  "inline-flex items-center justify-center font-medium transition-colors rounded-lg focus-visible:outline-none";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-plum-600 text-white shadow-surface hover:bg-plum-500 focus-visible:ring-plum-500",
  secondary:
    "bg-night-800 text-ink-400 border border-ink-800 hover:border-ink-600 hover:text-white",
  ghost: "text-plum-500 hover:bg-night-800/60 hover:text-white"
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-9 px-sm text-sm gap-2",
  md: "h-11 px-md gap-2",
  lg: "h-12 px-lg text-lg gap-3"
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", fullWidth = false, disabled = false, ...props },
    ref
  ) => (
    <button
      ref={ref}
      disabled={disabled}
      className={clsx(
        baseStyles,
        !disabled && "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-night-950",
        disabled && "opacity-60 cursor-not-allowed",
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    />
  )
);

Button.displayName = "Button";

export default Button;
