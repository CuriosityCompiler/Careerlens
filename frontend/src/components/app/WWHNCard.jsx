import React from "react";
import { Card } from "@/components/ui/card";

const badge = {
  what: "bg-slate-100 text-slate-800 border border-slate-200",
  why: "bg-amber-50 text-amber-800 border border-amber-200",
  how: "bg-indigo-50 text-indigo-800 border border-indigo-200",
  next: "bg-emerald-50 text-emerald-800 border border-emerald-200",
};

export default function WWHNCard({ title, what, why, how, next, testid, score }) {
  return (
    <Card className="p-5 border border-slate-200 bg-white rounded-xl space-y-3.5 hover:border-indigo-300 transition-all hover:shadow-xs" data-testid={testid}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900 text-base" style={{ fontFamily: "Outfit, sans-serif" }}>
          {title}
        </h3>
        {typeof score === "number" && (
          <div className="text-2xl font-bold text-indigo-600 tabular-nums bg-indigo-50/50 px-2.5 py-0.5 rounded-lg border border-indigo-100" data-testid={`${testid}-score`}>
            {score}<span className="text-xs text-indigo-400 font-normal">/100</span>
          </div>
        )}
      </div>
      <div className="space-y-2 text-sm text-slate-700 leading-relaxed">
        <div className="flex items-start gap-2">
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded shrink-0 uppercase tracking-wide ${badge.what}`}>WHAT</span>
          <span className="text-slate-800">{what}</span>
        </div>
        <div className="flex items-start gap-2">
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded shrink-0 uppercase tracking-wide ${badge.why}`}>WHY</span>
          <span className="text-slate-700">{why}</span>
        </div>
        <div className="flex items-start gap-2">
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded shrink-0 uppercase tracking-wide ${badge.how}`}>HOW</span>
          <span className="text-slate-700">{how}</span>
        </div>
        <div className="flex items-start gap-2">
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded shrink-0 uppercase tracking-wide ${badge.next}`}>NEXT</span>
          <span className="text-slate-900 font-medium">{next}</span>
        </div>
      </div>
    </Card>
  );
}
