import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { LogOut, UserCheck } from "lucide-react";

export default function PersonaSwitcher() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [personas, setPersonas] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const [exiting, setExiting] = useState(false);
  const [activePersona, setActivePersona] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("cl_active_demo_persona") || "null");
    } catch {
      return null;
    }
  });

  useEffect(() => {
    api.get("/personas").then((r) => setPersonas(r.data)).catch(() => {});
    if (!user?.id) return;

    api.get("/demo/persona-status")
      .then(({ data }) => {
        if (data.active) {
          const active = { id: data.persona_id, userId: user.id };
          localStorage.setItem("cl_active_demo_persona", JSON.stringify(active));
          setActivePersona(active);
        } else {
          try {
            const storedActive = JSON.parse(localStorage.getItem("cl_active_demo_persona") || "null");
            if (storedActive?.userId === user.id) {
              localStorage.removeItem("cl_active_demo_persona");
              setActivePersona(null);
            }
          } catch {
            localStorage.removeItem("cl_active_demo_persona");
            setActivePersona(null);
          }
        }
      })
      .catch((error) => {
        toast.error(`Could not check demo persona status: ${error.response?.data?.detail || error.message}`);
      });
  }, [user?.id]);

  const seed = async (id, name) => {
    setLoadingId(id);
    try {
      const { data } = await api.post(`/demo/seed-persona?persona_id=${id}`);
      const overall = data.analysis?.scores?.overall ?? "?";
      const active = { id, userId: user?.id };
      localStorage.setItem("cl_active_demo_persona", JSON.stringify(active));
      setActivePersona(active);
      toast.success(`Loaded demo student ${name} — Score: ${overall}/100`);
      navigate("/dashboard", { state: { personaLoadedAt: Date.now() } });
    } catch (e) {
      toast.error("Seed failed: " + (e.response?.data?.detail || e.message));
    } finally {
      setLoadingId(null);
    }
  };

  const isActiveForUser = activePersona?.userId && activePersona.userId === user?.id;
  const activeName = isActiveForUser
    ? personas.find((persona) => persona.id === activePersona.id)?.name || "Demo persona"
    : null;

  const exitPersona = async () => {
    if (!window.confirm("Exit the demo persona and remove its synthetic resume data? Your account, profile, and personal resumes will be kept.")) {
      return;
    }

    setExiting(true);
    try {
      await api.post("/demo/exit-persona");
      localStorage.removeItem("cl_active_demo_persona");
      setActivePersona(null);
      toast.success("Demo persona exited. Your own account data is restored.");
      navigate("/dashboard", { state: { personaExitedAt: Date.now() } });
    } catch (error) {
      toast.error(`Could not exit demo persona: ${error.response?.data?.detail || error.message}`);
    } finally {
      setExiting(false);
    }
  };

  if (!personas.length && !isActiveForUser) return null;

  return (
    <div
      className={`${isActiveForUser ? "flex" : "hidden lg:flex"} max-w-[48vw] lg:max-w-none items-center gap-1.5 overflow-x-auto bg-slate-100/80 p-1 rounded-lg border border-slate-200`}
      data-testid="persona-switcher"
    >
      <span className="hidden sm:flex text-xs font-semibold text-slate-500 px-1 items-center gap-1">
        <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
        Demo:
      </span>
      {isActiveForUser && (
        <span className="lg:hidden text-xs font-semibold text-slate-600 px-1 whitespace-nowrap" data-testid="active-demo-persona">
          {activeName}
        </span>
      )}
      {personas.map((p) => {
        const shortName = p.name.split(" ")[0]; // "Vic", "Travis", "Cooper"
        const isBusy = loadingId === p.id;
        return (
          <button
            key={p.id}
            data-testid={`persona-switch-${shortName.toLowerCase()}`}
            onClick={() => seed(p.id, p.name)}
            disabled={isBusy}
            className={`hidden lg:inline-flex text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
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
      {isActiveForUser && (
        <button
          type="button"
          data-testid="persona-exit"
          onClick={exitPersona}
          disabled={exiting}
          className="inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-xs transition-colors hover:border-red-300 hover:text-red-600 disabled:opacity-60"
          title="Exit the demo persona and return to your account"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{exiting ? "Exiting..." : "Exit persona"}</span>
          <span className="sm:hidden">{exiting ? "..." : "Exit"}</span>
        </button>
      )}
    </div>
  );
}
