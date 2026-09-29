import React, { useEffect, useState } from "react";
import api, { API } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { Download, TrendingUp, CheckCircle, BarChart3, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/analytics/summary")
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const radar = Object.entries(data?.latest_scores || {})
    .filter(([k]) => k !== "overall")
    .map(([k, v]) => ({
      dimension: k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      value: v,
    }));

  const downloadCsv = async () => {
    try {
      const t = localStorage.getItem("cl_access");
      const resp = await fetch(`${API}/reports/weekly.csv`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "careerlens_weekly_report.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Downloaded weekly progress report (.CSV)");
    } catch {
      toast.error("Download failed. Make sure you are authenticated.");
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500 text-sm flex items-center justify-center gap-2" data-testid="analytics-loading">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-600" /> Loading analytics metrics...
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="analytics-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
            Performance & Skill Analytics
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Track historical trends across resume updates, mock interviews, and skill-gap closures.
          </p>
        </div>
        <Button data-testid="btn-download-csv" onClick={downloadCsv} variant="outline" className="border-slate-300">
          <Download className="w-4 h-4 mr-1.5" /> Download Progress CSV
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <Card className="p-5 border-slate-200 bg-white shadow-xs" data-testid="stat-readiness">
          <div className="text-xs uppercase tracking-wider text-slate-500 font-bold">Career Readiness</div>
          <div className="text-3xl font-extrabold text-indigo-600 mt-1.5" style={{ fontFamily: "Outfit, sans-serif" }}>
            {data?.career_readiness ?? 0}<span className="text-xs text-indigo-400 font-normal">/100</span>
          </div>
        </Card>
        <Card className="p-5 border-slate-200 bg-white shadow-xs" data-testid="stat-gap-closure">
          <div className="text-xs uppercase tracking-wider text-slate-500 font-bold">Gap Closure</div>
          <div className="text-3xl font-extrabold text-emerald-600 mt-1.5" style={{ fontFamily: "Outfit, sans-serif" }}>
            {data?.gap_closure_pct ?? 0}%
          </div>
        </Card>
        <Card className="p-5 border-slate-200 bg-white shadow-xs" data-testid="stat-analyses">
          <div className="text-xs uppercase tracking-wider text-slate-500 font-bold">Resume Analyses</div>
          <div className="text-3xl font-extrabold text-slate-900 mt-1.5" style={{ fontFamily: "Outfit, sans-serif" }}>
            {data?.total_analyses ?? 0}
          </div>
        </Card>
        <Card className="p-5 border-slate-200 bg-white shadow-xs" data-testid="stat-interviews">
          <div className="text-xs uppercase tracking-wider text-slate-500 font-bold">Interviews Done</div>
          <div className="text-3xl font-extrabold text-slate-900 mt-1.5" style={{ fontFamily: "Outfit, sans-serif" }}>
            {data?.total_interviews ?? 0}
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-5 border-slate-200 bg-white shadow-xs" data-testid="chart-resume-trend">
          <div className="font-bold text-slate-900 mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>
            Resume Score Progression
          </div>
          {data?.resume_trend?.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={data.resume_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#4F46E5" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-xs text-slate-400">
              Run resume analyses to visualize trend
            </div>
          )}
        </Card>

        <Card className="p-5 border-slate-200 bg-white shadow-xs" data-testid="chart-interview-trend">
          <div className="font-bold text-slate-900 mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>
            Mock Interview Score Progression
          </div>
          {data?.interview_trend?.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={data.interview_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#10B981" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-xs text-slate-400">
              Complete mock interviews to visualize trend
            </div>
          )}
        </Card>
      </div>

      {radar.length > 0 && (
        <Card className="p-6 border-slate-200 bg-white shadow-xs" data-testid="chart-radar">
          <div className="font-bold text-slate-900 mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>
            Multi-Dimensional Profile Assessment
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Radar visualization across the 5 primary ATS and content competency axes.
          </p>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={radar}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="dimension" fontSize={11} stroke="#64748b" />
              <PolarRadiusAxis domain={[0, 100]} fontSize={10} stroke="#94a3b8" />
              <Radar dataKey="value" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.25} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}
