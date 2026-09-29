import React from "react";
import { cn } from "@/lib/utils";

export const Button = React.forwardRef(({ className, variant = "default", size = "default", children, ...props }, ref) => {
  const base = "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-50 select-none";
  
  const variants = {
    default: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm",
    destructive: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
    outline: "border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 shadow-sm",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
    ghost: "hover:bg-slate-100 text-slate-700",
    link: "text-indigo-600 underline-offset-4 hover:underline",
  };

  const sizes = {
    default: "h-9 px-4 py-2",
    sm: "h-8 rounded-md px-3 text-xs",
    lg: "h-11 rounded-lg px-8 text-base",
    icon: "h-9 w-9",
  };

  return (
    <button
      ref={ref}
      className={cn(base, variants[variant] || variants.default, sizes[size] || sizes.default, className)}
      {...props}
    >
      {children}
    </button>
  );
});
Button.displayName = "Button";
