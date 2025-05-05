"use client";

import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";

import { cn } from "@mcw/utils";

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(
  (
    { className, orientation = "horizontal", decorative = true, ...props },
    ref,
  ) => (
    <SeparatorPrimitive.Root
      ref={ref}
      className={cn(
        "ui-shrink-0 ui-bg-border",
        orientation === "horizontal"
          ? "ui-h-[1px] ui-w-full"
          : "ui-h-full ui-w-[1px]",
        className,
      )}
      decorative={decorative}
      orientation={orientation}
      {...props}
    />
  ),
);
Separator.displayName = SeparatorPrimitive.Root.displayName;

export { Separator };
