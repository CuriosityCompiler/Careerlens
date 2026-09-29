import React from "react";
import { cn } from "@/lib/utils";

export const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm", className)}
    {...props}
  />
));
Card.displayName = "Card";
