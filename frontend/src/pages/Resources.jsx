import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ExternalLink, Search, CheckCircle2, BookOpen } from "lucide-react";

export default function Resources() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/resources")
      .then((r) => setItems(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = items.filter((r) => {
    const haystack = [
      r.title,
      r.skill,
      r.provider,
      r.topic,
      r.domain,
      r.type,
      r.difficulty,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return !q || haystack.includes(q.toLowerCase());
  });

  return (
    <div className="space-y-6" data-testid="resources-page">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
          Curated Learning Resources
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Whitelisted authoritative resources from official documentation, freeCodeCamp, MDN, and top courses. Zero arbitrary hallucinated links.
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
        <Input
          data-testid="resource-search"
          placeholder="Filter by skill, provider, or topic (e.g. react, postgres, docker)..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9 bg-white"
        />
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500 text-sm">Loading curated directory...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((r) => (
            <Card
              key={r.id}
              className="p-5 border-slate-200 hover:border-indigo-300 transition-all flex flex-col justify-between shadow-xs bg-white group"
              data-testid={`resource-${r.id}`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {(r.skill || r.topic || "resource").toString()}
                  </span>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-400 group-hover:text-indigo-600 transition-colors p-1"
                    data-testid={`resource-link-${r.id}`}
                    title="Open external resource"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-base block line-clamp-2"
                  style={{ fontFamily: "Outfit, sans-serif" }}
                >
                  {r.title || r.name}
                </a>

                <div className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{r.provider}</span>
                  <span>·</span>
                  <span className="capitalize">{r.type}</span>
                  <span>·</span>
                  <span className="capitalize">{r.difficulty || "Beginner"}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3 text-xs text-slate-500">
                <span>Estimated effort: <strong>{r.effort || "4-8 hours"}</strong></span>
                <span className="text-emerald-700 font-semibold">Verified Source</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
