import clsx from "clsx";
import { forwardRef, InputHTMLAttributes } from "react";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  isInvalid?: boolean;
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, isInvalid = false, ...props }, ref) => (
    <input
      ref={ref}
      className={clsx(
        "w-full h-12 rounded-xl bg-white/[0.03] border text-white placeholder:text-white/35",
        "px-4 text-sm focus-visible:outline-none input-glow",
        isInvalid
          ? "border-amber-500/60 focus-visible:ring-amber-500"
          : "border-white/10 hover:border-white/15",
        className
      )}
      {...props}
    />
  )
);

Input.displayName = "Input";

export default Input;
