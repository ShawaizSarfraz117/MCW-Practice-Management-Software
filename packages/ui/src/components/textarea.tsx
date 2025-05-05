import * as React from "react";
import { cn } from "@mcw/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "ui-flex ui-min-h-[60px] ui-w-full ui-rounded-md ui-border ui-border-input ui-bg-transparent ui-px-3 ui-py-2 ui-text-base ui-shadow-sm placeholder:ui-text-muted-foreground focus-visible:ui-outline-none focus-visible:ui-ring-1 focus-visible:ui-ring-ring disabled:ui-cursor-not-allowed disabled:ui-opacity-50 md:ui-text-sm",
        className,
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
