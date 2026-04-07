import clsx from "clsx";
import { forwardRef, TextareaHTMLAttributes } from "react";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  isInvalid?: boolean;
};

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, isInvalid = false, ...props }, ref) => (
    <textarea
      ref={ref}
      className={clsx(
        "w-full rounded-xl bg-white/[0.03] border text-white placeholder:text-white/35",
        "px-4 py-3 text-sm focus-visible:outline-none input-glow",
        isInvalid
          ? "border-amber-500/60 focus-visible:ring-amber-500"
          : "border-white/10 hover:border-white/15",
        "min-h-[140px] resize-vertical",
        className
      )}
      {...props}
    />
  )
);

Textarea.displayName = "Textarea";

export default Textarea;
