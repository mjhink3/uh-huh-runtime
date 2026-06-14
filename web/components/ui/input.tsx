import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-border bg-[#101114] px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-warning/60 focus:ring-2 focus:ring-warning/10",
        className,
      )}
      {...props}
    />
  );
}
