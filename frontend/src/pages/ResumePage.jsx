import React, { useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import WWHNCard from "@/components/app/WWHNCard";
import ProcessingBadge from "@/components/app/ProcessingBadge";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import {
  UploadCloud,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
  FileCheck,
  Zap,
  X,
} from "lucide-react";

export default function ResumePage() {
  const { user, privacyMode } = useAuth();
  const [text, setText] = useState("");
  const [filename, setFilename] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [role, setRole] = useState(user?.target_role || "frontend");
  const [roles, setRoles] = useState([]);
  const [localResult, setLocalResult] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [aiCritique, setAiCritique] = useState(null);
  const [busy, setBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const workerRef = useRef(null);

  useEffect(() => {
    api.get("/roles").then((r) => setRoles(r.data)).catch(() => {});
    api.get("/analyses/latest").then((r) => {
      if (r.data?.result) {
        setAnalysis(r.data.result);
        if (r.data.target_role) setRole(r.data.target_role);
      }
    }).catch(() => {});

    // Spin up local Mode A Web Worker
    workerRef.current = new Worker("/workers/resumeParser.worker.js");
    workerRef.current.onmessage = (e) => {
      if (e.data.type === "result") {
        setLocalResult(e.data.result);
      }
    };
    return () => workerRef.current?.terminate();
  }, []);

  // Dispatch text to Web Worker for live 100% on-device pre-parsing
  useEffect(() => {
    if (text.trim()) {
      workerRef.current?.postMessage({ type: "parse", text });
    } else {
      setLocalResult(null);
    }
  }, [text]);

  // Handle file upload: call backend extract-file endpoint for PDF/DOCX, read text for TXT
  const onFile = async (f) => {
    if (!f) return;

    if (f.size > 3 * 1024 * 1024) {
      return toast.error("File exceeds 3MB limit. Please use a smaller file.");
    }

    const isTxt = f.type === "text/plain" || f.name.toLowerCase().endsWith(".txt");
    const isSupported = /\.(pdf|docx|doc|txt)$/i.test(f.name);

    if (!isSupported) {
      return toast.error("Unsupported format. Please upload a PDF, DOCX, DOC, or TXT file.");
    }

    setFilename(f.name);
    setText("");
    setLocalResult(null);

    if (isTxt) {
      // Plain text - read directly in browser
      const t = await f.text();
      setText(t);
      toast.success(`Loaded "${f.name}" successfully.`);
      return;
    }

    // PDF / DOCX / DOC - extract via backend OCR endpoint
    setExtracting(true);
    try {
      const form = new FormData();
      form.append("file", f);
      const { data } = await api.post("/resumes/extract-file", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (!data.text || data.text.trim().length < 20) {
        toast.warning("Extracted text seems very short. You can paste additional content below.");
      } else {
        toast.success(
          `Extracted ${data.length.toLocaleString()} characters from "${data.filename}" via ${data.extraction_method}.`
        );
      }
      setText(data.text || "");
    } catch (err) {
      toast.error(
        err.response?.data?.detail ||
        "File extraction failed. Please paste your resume text below instead."
      );
      setFilename("");
    } finally {
      setExtracting(false);
    }
  };

  const clearFile = () => {
    setFilename("");
    setText("");
    setLocalResult(null);
    setAnalysis(null);
    setAiCritique(null);
  };

  const analyze = async () => {
    if (!text.trim()) return toast.error("Upload a resume file or paste resume text first.");
    if (localResult?.empty_or_joke) return toast.error(localResult.message);

    setBusy(true);
    setAnalysis(null);
    setAiCritique(null);

    try {
      const { data } = await api.post("/resumes/analyze", {
        text,
        filename: filename || "resume.txt",
        target_role: role,
        mode: privacyMode,
      });

      setAnalysis(data.analysis);
      if (data.analysis.empty_or_joke) {
        toast.warning(data.analysis.message);
      } else {
        toast.success(`Analysis complete! Overall score: ${data.analysis.scores.overall}/100`);
      }

      // If user has enabled Mode B (Server AI), request AI Critique
      if (privacyMode === "B") {
        setAiBusy(true);
        try {
          const { data: c } = await api.post("/ai/critique", {
            text,
            target_role: role,
          });
          setAiCritique(c);
          toast.success("Server AI critique generated!");
        } catch (e) {
          toast.warning(
            e.response?.data?.detail || "Server AI unavailable, falling back to local explanations."
          );
        } finally {
          setAiBusy(false);
        }
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || e.message || "Analysis failed");
    } finally {
      setBusy(false);
    }
  };

  const scores = analysis?.scores || {};
  const explanations = analysis?.explanations || {};

  return (
    <div className="space-y-6" data-testid="resume-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1
            className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight"
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            Resume Analyzer
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Local in-browser parsing (Mode A) · Transparent scoring.
          </p>
        </div>
        <ProcessingBadge mode={privacyMode} />
      </div>

      <Card
        className="p-6 border-slate-200 dark:border-slate-800 space-y-5 bg-white dark:bg-slate-900 shadow-xs"
        data-testid="upload-card"
      >
        {/* Target Role Selection */}
        <div>
          <Label className="font-semibold text-slate-900 dark:text-slate-100">Target Role</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1.5">
            {roles.map((r) => (
              <button
                key={r.id}
                type="button"
                data-testid={`role-btn-${r.id}`}
                onClick={() => setRole(r.id)}
                className={`px-3 py-2 rounded-lg border text-xs sm:text-sm font-medium text-left transition-all ${
                  role === r.id
                    ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 ring-1 ring-indigo-600 shadow-xs"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800"
                }`}
              >
                {r.name}
              </button>
            ))}
          </div>
        </div>

        {/* File Upload Zone */}
        <div>
          <Label className="font-semibold text-slate-900 dark:text-slate-100 mb-1.5 block">
            Upload Resume File
          </Label>
          <label className="block border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/50">
            <input
              type="file"
              accept=".pdf,.docx,.doc,.txt"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])}
              data-testid="file-upload-input"
            />
            {extracting ? (
              <div className="flex flex-col items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-sm font-medium">Extracting text from file...</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Using OCR for scanned documents
                </span>
              </div>
            ) : (
              <>
                <UploadCloud className="w-8 h-8 mx-auto text-indigo-600 dark:text-indigo-400 mb-2" />
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Click to upload resume (.PDF, .DOCX, .TXT)
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  PDF and DOCX are extracted automatically via OCR (Max 3MB)
                </div>
              </>
            )}
          </label>

          {/* Uploaded file indicator */}
          {filename && !extracting && (
            <div className="flex items-center justify-between mt-2 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-2 rounded-lg border border-indigo-100 dark:border-indigo-900">
              <div
                className="text-xs text-indigo-700 dark:text-indigo-300 font-semibold inline-flex items-center gap-1"
                data-testid="uploaded-filename"
              >
                <FileCheck className="w-3.5 h-3.5" /> {filename}
              </div>
              <button
                onClick={clearFile}
                className="text-slate-400 hover:text-red-500 transition-colors"
                title="Clear file"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Resume Text Area */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <Label className="font-semibold text-slate-900 dark:text-slate-100 mb-0">
              {filename ? "Extracted Resume Content" : "Paste Resume Text"}
            </Label>
            {localResult && !localResult.empty_or_joke && (
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" /> {localResult.skills_detected?.length} skills found
              </span>
            )}
          </div>
          <Textarea
            data-testid="resume-textarea"
            rows={9}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              filename
                ? "Extracted text will appear here. You can edit it before analyzing..."
                : "Paste your full resume text here, or upload a PDF/DOCX above..."
            }
            className="font-mono text-xs leading-relaxed dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:placeholder-slate-500"
          />
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {text.length > 0 ? `${text.length.toLocaleString()} characters` : "No content yet"}
          </p>
        </div>

        {/* Local pre-check results */}
        {localResult && !localResult.empty_or_joke && (
          <div
            className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-4"
            data-testid="local-preview"
          >
            <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Local pre-check passed
            </div>
            <div>
              <strong>Skills:</strong> {localResult.skills_detected?.length}
            </div>
            <div>
              <strong>Impact bullets:</strong> {localResult.achievements}
            </div>
            <div>
              <strong>ATS readiness:</strong> {localResult.local_scores?.ats_readiness}/100
            </div>
          </div>
        )}

        {localResult?.empty_or_joke && (
          <div
            className="text-xs text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 p-3 rounded-lg border border-red-200 dark:border-red-900 flex items-center gap-2"
            data-testid="local-empty"
          >
            <XCircle className="w-4 h-4 shrink-0" />
            <span>{localResult.message}</span>
          </div>
        )}

        {/* Action Bar */}
        <div className="flex items-center justify-between pt-1">
          <Button
            data-testid="btn-run-analyze"
            onClick={analyze}
            disabled={busy || !text.trim() || extracting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm px-6"
          >
            {busy ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" /> Run Explainable Analysis
              </>
            )}
          </Button>

          {privacyMode === "B" && (
            <span className="text-xs text-indigo-700 dark:text-indigo-300 font-medium bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded border border-indigo-200 dark:border-indigo-800">
              Mode B Active: Includes Server AI Coaching
            </span>
          )}
        </div>
      </Card>

      {/* Analysis Results */}
      {analysis && !analysis.empty_or_joke && (
        <div className="space-y-6">
          {/* 6-Dimension Score Grid */}
          <div>
            <h2
              className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-3"
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              6-Dimensional Evaluation
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3" data-testid="score-grid">
              {[
                ["overall", "Overall Score"],
                ["ats_readiness", "ATS Readiness"],
                ["role_alignment", "Role Fit"],
                ["skill_coverage", "Skill Coverage"],
                ["achievement_strength", "Quantified Impact"],
                ["completeness", "Completeness"],
              ].map(([k, l]) => (
                <Card
                  key={k}
                  className="p-4 border-slate-200 dark:border-slate-800 text-center bg-white dark:bg-slate-900 shadow-xs"
                  data-testid={`score-${k}`}
                >
                  <div className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                    {l}
                  </div>
                  <div
                    className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 tabular-nums mt-1.5"
                    style={{ fontFamily: "Outfit, sans-serif" }}
                  >
                    {scores[k] ?? 0}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* WWHN Explainability Cards */}
          <div>
            <h2
              className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-3"
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              Diagnostic Insights (What / Why / How / Next)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="explanations-grid">
              {Object.entries(explanations).map(([k, ex]) => (
                <WWHNCard
                  key={k}
                  testid={`wwhn-${k}`}
                  title={k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  score={scores[k]}
                  what={ex.what}
                  why={ex.why}
                  how={ex.how}
                  next={ex.next}
                />
              ))}
            </div>
          </div>

          {/* Skill Gap Matrix */}
          <Card
            className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs"
            data-testid="skill-gap-matrix"
          >
            <div className="mb-4">
              <h3
                className="text-lg font-bold text-slate-900 dark:text-slate-100"
                style={{ fontFamily: "Outfit, sans-serif" }}
              >
                Skill Gap Matrix — {analysis.role?.name || "Target Role"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Direct comparison against industry requirements for this role.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {analysis.gap_matrix?.map((g) => (
                <div
                  key={g.skill}
                  data-testid={`gap-${g.skill}`}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg border text-sm font-medium ${
                    g.present
                      ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300"
                      : g.severity === "high"
                      ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-300"
                      : "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {g.present ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                    )}
                    <span className="capitalize">{g.skill}</span>
                  </div>
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
                      g.present
                        ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300"
                        : "bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {g.level}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Mode B: Server AI Critique */}
          {privacyMode === "B" && (
            <Card
              className="p-6 border-indigo-200 dark:border-indigo-800 bg-indigo-50/30 dark:bg-indigo-950/20 rounded-xl space-y-3"
              data-testid="ai-critique-card"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3
                    className="font-bold text-slate-900 dark:text-slate-100 text-lg"
                    style={{ fontFamily: "Outfit, sans-serif" }}
                  >
                    Server AI Career Coach Critique
                  </h3>
                </div>
                <ProcessingBadge mode="B" />
              </div>

              {aiBusy ? (
                <div className="py-6 flex items-center justify-center gap-2 text-sm text-indigo-700 dark:text-indigo-300 font-medium">
                  <Loader2 className="w-4 h-4 animate-spin" /> Querying Gemini Flash Coach...
                </div>
              ) : aiCritique ? (
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                    Model: {aiCritique.provider}
                  </div>
                  <pre className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-sans bg-white dark:bg-slate-900 p-4 rounded-lg border border-indigo-100 dark:border-indigo-900 leading-relaxed">
                    {aiCritique.text}
                  </pre>
                </div>
              ) : null}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
