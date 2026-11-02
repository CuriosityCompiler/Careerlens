import React, { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AlertCircle, CheckCircle2, ExternalLink, Search } from "lucide-react";

export default function Resources() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("All topics");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadResources = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get("/resources");
      if (!Array.isArray(data)) {
        throw new Error("The resource library returned an unexpected response.");
      }
      setItems(data);
    } catch (loadError) {
      setError(loadError.message || "Could not load learning resources. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, []);

  const domains = useMemo(
    () => [...new Set(items.map((item) => item.domain).filter(Boolean))].sort(),
    [items]
  );

  const filtered = items.filter((resource) => {
    const searchableText = [
      resource.title,
      resource.name,
      resource.skill,
      resource.provider,
      resource.topic,
      resource.domain,
      resource.type,
      resource.difficulty,
      resource.description,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch = !q.trim() || searchableText.includes(q.trim().toLowerCase());
    const matchesDomain = selectedDomain === "All topics" || resource.domain === selectedDomain;
    return matchesSearch && matchesDomain;
  });

  return (
    <div className="space-y-7 pb-8" data-testid="resources-page">
      <header className="flex flex-col gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between dark:border-slate-800">
        <div>
          <div className="mb-2 text-xs font-semibold tracking-[0.14em] text-indigo-700 dark:text-indigo-300">
            CAREERLENS LIBRARY
          </div>
          <h1
            className="font-[Outfit,sans-serif] text-3xl font-bold tracking-tight text-slate-950 dark:text-white"
            data-testid="resources-heading"
          >
            Learn your next skill
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
            Explore free, hand-picked courses, documentation, and practice guides from trusted providers.
          </p>
        </div>
        {!loading && !error && (
          <div className="text-sm text-slate-500 dark:text-slate-400" data-testid="resource-count">
            <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">{filtered.length}</span>
            {" "}of {items.length} resources
          </div>
        )}
      </header>

      <section className="space-y-4" aria-label="Filter learning resources">
        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            data-testid="resource-search"
            aria-label="Search resources"
            placeholder="Search a skill, provider, or topic..."
            value={q}
            onChange={(event) => setQ(event.target.value)}
            className="h-11 border-slate-200 bg-white pl-9 dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
        {!loading && !error && (
          <div
            className="flex gap-2 overflow-x-auto pb-1"
            aria-label="Filter resources by topic"
            data-testid="resource-domain-filters"
          >
            {["All topics", ...domains].map((domain) => {
              const isSelected = selectedDomain === domain;
              return (
                <button
                  key={domain}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedDomain(domain)}
                  className={`shrink-0 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    isSelected
                      ? "border-indigo-700 bg-indigo-700 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-indigo-800 dark:hover:text-indigo-300"
                  }`}
                >
                  {domain}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {loading ? (
        <div
          className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
          aria-label="Loading resources"
          data-testid="resources-loading"
        >
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="h-44 animate-pulse rounded-xl bg-slate-200/70 dark:bg-slate-800" />
          ))}
        </div>
      ) : error ? (
        <div
          role="alert"
          className="flex flex-col items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200"
          data-testid="resources-error"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
          <button
            type="button"
            onClick={loadResources}
            className="rounded-md border border-red-300 bg-white px-3 py-1.5 font-semibold hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:border-red-800 dark:bg-transparent dark:hover:bg-red-950"
          >
            Try again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900"
          data-testid="resources-empty"
        >
          <Search className="mx-auto h-5 w-5 text-slate-400" />
          <h2 className="mt-3 font-semibold text-slate-900 dark:text-slate-100">No matching resources</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Try another search or choose a different topic.</p>
          <button
            type="button"
            onClick={() => {
              setQ("");
              setSelectedDomain("All topics");
            }}
            className="mt-3 text-sm font-semibold text-indigo-700 hover:underline dark:text-indigo-300"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3" data-testid="resource-grid">
          {filtered.map((resource) => (
            <Card
              key={resource.id}
              className="group flex flex-col justify-between border-slate-200 bg-white p-5 shadow-none transition duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-800"
              data-testid={`resource-${resource.id}`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="inline-block max-w-full truncate rounded-sm bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                      {resource.skill || resource.topic || resource.domain || "Learning"}
                    </span>
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 block text-base font-semibold leading-5 text-slate-950 transition-colors hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-100 dark:hover:text-indigo-300"
                      style={{ fontFamily: "Outfit, sans-serif" }}
                      data-testid={`resource-link-${resource.id}`}
                    >
                      {resource.title || resource.name}
                    </a>
                  </div>
                  <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition-colors group-hover:text-indigo-600" />
                </div>

                {resource.description && (
                  <p className="mt-2.5 line-clamp-3 text-sm leading-5 text-slate-600 dark:text-slate-400">
                    {resource.description}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    {resource.provider}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{resource.type}</span>
                  <span aria-hidden="true">·</span>
                  <span>{resource.difficulty || "Beginner"}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">
                  {resource.effort || "4-8 hours"}
                </span>
                <span className="font-medium text-slate-600 dark:text-slate-300">{resource.cost || "Free"}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
