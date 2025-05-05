import * as React from "react";

import { cn } from "@mcw/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "ui-flex ui-w-full ui-rounded-md ui-border ui-border-input ui-bg-transparent ui-px-3 ui-py-1 ui-text-base ui-shadow-sm ui-transition-colors file:ui-border-0 file:ui-bg-transparent file:ui-text-sm file:ui-font-medium file:ui-text-foreground placeholder:ui-text-muted-foreground focus-visible:ui-outline-none focus-visible:ui-ring-2 focus-visible:ui-ring-ring focus-visible:ui-ring-offset-2 disabled:ui-cursor-not-allowed disabled:ui-opacity-50 md:ui-text-sm [&.border-red-500]:focus-visible:ui-ring-red-500 [&.border-red-500]:ui-border-red-500",
          className,
        )}
        type={type}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
