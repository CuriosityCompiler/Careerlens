import React from "react";
import { Shield, Server } from "lucide-react";

export default function ProcessingBadge({ mode, className = "" }) {
  const isLocal = mode === "A";
  const label = isLocal ? "Processing: Local (Mode A)" : "Processing: Server (Mode B)";
  const Icon = isLocal ? Shield : Server;
  const cls = isLocal
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : "bg-indigo-50 text-indigo-700 border-indigo-200 animate-pulse";

  return (
    <span
      data-testid={`processing-badge-${isLocal ? "local" : "server"}`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shadow-sm ${cls} ${className}`}
      title={isLocal ? "100% on-device local Web Worker processing" : "Encrypted server AI critique enabled"}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
    </span>
  );
}
