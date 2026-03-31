import React from "react";
import { cn } from "@/lib/utils";
import type { BadgeProps, BadgeVariant, BadgeSize } from "@/types/ui";

export type { BadgeProps, BadgeVariant, BadgeSize };

const variantColorMap: Record<BadgeVariant, string> = {
  open: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  "in-progress":
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  completed:
    "bg-stellar-slate text-stellar-white dark:bg-stellar-navy dark:text-stellar-white",
  expired: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
  active: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  passed:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  executed:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  default:
    "bg-stellar-lightNavy text-stellar-white dark:bg-stellar-navy dark:text-stellar-white",
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-0.5 text-sm",
  lg: "px-3 py-1 text-base",
};

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    { className, variant = "default", size = "md", children, ...props },
    ref,
  ) => {
    const baseClasses =
      "inline-flex items-center justify-center font-medium rounded-full transition-colors";

    return (
      <span
        className={cn(
          baseClasses,
          variantColorMap[variant],
          sizeClasses[size],
          className,
        )}
        ref={ref}
        {...props}
      >
        {children}
      </span>
    );
  },
);

Badge.displayName = "Badge";

export { Badge };
