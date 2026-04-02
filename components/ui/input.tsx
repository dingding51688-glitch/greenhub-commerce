import clsx from "clsx";
import { forwardRef, InputHTMLAttributes } from "react";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  isInvalid?: boolean;
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, isInvalid = false, disabled = false, ...props }, ref) => (
    <input
      ref={ref}
      disabled={disabled}
      className={clsx(
        "w-full h-11 rounded-lg bg-night-800/70 border text-white placeholder:text-ink-600 px-md text-base",
        "focus-visible:outline-none",
        !disabled && "focus-visible:ring-2",
        !disabled && (isInvalid ? "focus-visible:ring-amber-500" : "focus-visible:ring-plum-600"),
        isInvalid ? "border-amber-500" : "border-night-700",
        disabled && "opacity-60 cursor-not-allowed",
        disabled ? "focus-visible:ring-0" : undefined,
        className
      )}
      {...props}
    />
  )
);

Input.displayName = "Input";

export default Input;
