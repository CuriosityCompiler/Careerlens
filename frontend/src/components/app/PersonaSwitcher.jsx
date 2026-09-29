import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { UserCheck } from "lucide-react";

export default function PersonaSwitcher() {
  const [personas, setPersonas] = useState([]);
  const [loadingId, setLoadingId] = useState(null);

  useEffect(() => {
    api.get("/personas").then((r) => setPersonas(r.data)).catch(() => {});
  }, []);

  const seed = async (id, name) => {
    setLoadingId(id);
    try {
      const { data } = await api.post(`/demo/seed-persona?persona_id=${id}`);
      const overall = data.analysis?.scores?.overall ?? "?";
      toast.success(`Loaded demo student ${name} — Score: ${overall}/100`);
      // Reload current page or navigate to dashboard so full state refreshes
      if (window.location.pathname === "/dashboard" || window.location.pathname === "/resume") {
        window.location.reload();
      } else {
        window.location.href = "/dashboard";
      }
    } catch (e) {
      toast.error("Seed failed: " + (e.response?.data?.detail || e.message));
    } finally {
      setLoadingId(null);
    }
  };

  if (!personas.length) return null;

  return (
    <div className="hidden lg:flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-lg border border-slate-200" data-testid="persona-switcher">
      <span className="text-xs font-semibold text-slate-500 px-1 flex items-center gap-1">
        <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
        Demo:
      </span>
      {personas.map((p) => {
        const shortName = p.name.split(" ")[0]; // "Vic", "Travis", "Cooper"
        const isBusy = loadingId === p.id;
        return (
          <button
            key={p.id}
            data-testid={`persona-switch-${shortName.toLowerCase()}`}
            onClick={() => seed(p.id, p.name)}
            disabled={isBusy}
            className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
              isBusy
                ? "bg-indigo-100 text-indigo-800 animate-pulse"
                : "bg-white text-slate-700 hover:text-indigo-600 hover:border-indigo-300 shadow-xs border border-slate-200"
            }`}
            title={`Load synthetic resume for ${p.name} (${p.role_target})`}
          >
            {isBusy ? "..." : shortName}
          </button>
        );
      })}
    </div>
  );
}
