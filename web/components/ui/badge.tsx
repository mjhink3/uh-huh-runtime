import * as React from "react";
import { cn } from "@/lib/utils";

const tones = {
  neutral: "border-border bg-muted/70 text-muted-foreground",
  blue: "border-primary/35 bg-primary/10 text-primary",
  amber: "border-warning/35 bg-warning/10 text-warning",
  green: "border-success/35 bg-success/10 text-success",
  red: "border-danger/35 bg-danger/10 text-danger",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof tones }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
