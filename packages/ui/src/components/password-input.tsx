"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@mcw/utils";
import { Input } from "./input";

export type PasswordInputProps = Omit<
  React.ComponentPropsWithoutRef<typeof Input>,
  "type"
>;

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    return (
      <div className="ui-relative">
        <Input
          ref={ref}
          className={cn("ui-pr-10", className)}
          type={showPassword ? "text" : "password"}
          {...props}
        />
        <button
          className="ui-absolute ui-inset-y-0 ui-right-0 ui-flex ui-items-center ui-pr-3 ui-text-gray-400 hover:ui-text-gray-600"
          type="button"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? (
            <EyeOff className="ui-h-4 ui-w-4" />
          ) : (
            <Eye className="ui-h-4 ui-w-4" />
          )}
          <span className="ui-sr-only">
            {showPassword ? "Hide password" : "Show password"}
          </span>
        </button>
      </div>
    );
  },
);

PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
