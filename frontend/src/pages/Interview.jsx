import React, { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import CircuitChallenge from "@/components/CircuitChallenge";
import { toast } from "sonner";
import {
  Loader2,
  Play,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Award,
  Code2,
  Lightbulb,
  Clock3,
  Gauge,
  Target,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

const difficulties = ["beginner", "intermediate", "advanced", "hard"];
const DSA_LANGUAGES = ["c", "c++", "python", "java", "javascript"];

const languageLabels = {
  c: "C",
  "c++": "C++",
  python: "Python",
  java: "Java",
  javascript: "JavaScript",
};

const starterSnippets = {
  c: `#include <stdio.h>

int main() {
    // Write your solution here
    return 0;
}`,
  "c++": `#include <bits/stdc++.h>
using namespace std;

int main() {
    // Write your solution here
    return 0;
}`,
  python: `def solve():
    # Write your solution here
    pass

if __name__ == "__main__":
    solve()`,
  java: `public class Main {
    public static void main(String[] args) {
        // Write your solution here
    }
}`,
  javascript: `function solve() {
  // Write your solution here
}

solve();`,
};

const DSA_ELIGIBLE_ROLES = new Set([
  "frontend",
  "backend",
  "fullstack",
  "data_analyst",
  "python_developer",
  "java_developer",
  "aiml",
]);

const DIFF_META = {
  beginner: { label: "Beginner", color: "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800" },
  intermediate: { label: "Intermediate", color: "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800" },
  advanced: { label: "Advanced", color: "text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800" },
  hard: { label: "Elite", color: "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800" },
};

export default function Interview() {
  const { user } = useAuth();
  const [roles, setRoles] = useState([]);
  const [roleId, setRoleId] = useState(user?.target_role || "frontend");
  const [difficulty, setDifficulty] = useState("beginner");
  const [language, setLanguage] = useState("javascript");
  const [session, setSession] = useState(null);
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [circuit, setCircuit] = useState({ components: [], connections: [] });
  const [evals, setEvals] = useState({});
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState(null);
  const [activeTab, setActiveTab] = useState("problem");
  const [consoleOutput, setConsoleOutput] = useState("Output will appear here...");
  const [runningCode, setRunningCode] = useState(false);

  useEffect(() => {
    api.get("/roles").then((r) => setRoles(r.data)).catch(() => {});
  }, []);

  const currentQ = session?.questions?.[idx];
  const isCodingQ = currentQ?.type === "coding";
  const isCircuitQ = currentQ?.type === "circuit";
  const currentEval = evals[idx];
  const isDsaEligibleRole = DSA_ELIGIBLE_ROLES.has(roleId);
  const hardDifficultyLabel = isDsaEligibleRole ? "Elite (DSA)" : "Elite";
  const hardDifficultyMessage = isDsaEligibleRole
    ? "DSA coding challenge: LeetCode-style problems with starter code and complexity analysis."
    : roleId === "electronics_engineer"
      ? "Practical circuit design, firmware implementation, fault handling, and automated evaluation."
      : "Elite challenge: system-level reasoning, trade-off analysis, and deep technical troubleshooting.";

  const stats = useMemo(() => {
    const values = Object.values(evals).map((item) => Number(item?.score || 0));
    const avg = values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
    const best = values.length ? Math.max(...values) : 0;
    const current = currentEval ? currentEval.score : 0;

    return {
      avg,
      best,
      current,
      attempted: values.length,
    };
  }, [currentEval, evals]);

  useEffect(() => {
    if (!isCodingQ) return;
    const defaultSnippet = starterSnippets[language] || starterSnippets.javascript;
    const previousDefaultTemplates = [
      starterSnippets.c,
      starterSnippets["c++"],
      starterSnippets.python,
      starterSnippets.java,
      starterSnippets.javascript,
    ];
    const isDefaultTemplate = previousDefaultTemplates.includes((answer || "").trim());

    if (!answer || isDefaultTemplate) {
      setAnswer(defaultSnippet);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, session, language, isCodingQ]);

  useEffect(() => {
    if (!session && summary) {
      setActiveTab("problem");
    }
  }, [session, summary]);

  const runCodeConsole = async () => {
    if (!isCodingQ && !isCircuitQ) return;
    const code = answer || "";
    const sanitized = code.trim();
    if (!sanitized) {
      setConsoleOutput("Output will appear here...");
      return;
    }

    const isSimpleHelloWorld =
      (language === "python" && /^print\s*\(\s*["']hello world["']\s*\)\s*;?\s*$/.test(sanitized.toLowerCase())) ||
      (language === "javascript" && /^(console\.log\s*\(\s*["']hello world["']\s*\)|print\s*\(\s*["']hello world["']\s*\))\s*;?\s*$/.test(sanitized.toLowerCase()));

    if (isSimpleHelloWorld && !isCircuitQ) {
      setConsoleOutput("Hello World");
      return;
    }

    try {
      setRunningCode(true);
      setConsoleOutput("Running code...");
      const { data } = await api.post(
        isCircuitQ ? "/code/run/arduino" : "/code/run",
        isCircuitQ ? { code } : { language, code }
      );
      const output = data?.output || (data?.ok === false ? data?.error : "Code executed without output.");
      const stderr = data?.ok === false ? null : data?.error;
      setConsoleOutput(stderr ? `${output}\n\n${stderr}` : output);
    } catch (error) {
      const status = error?.response?.status;
      const normalized = String(error?.response?.data?.detail || error?.message || "").toLowerCase();

      if (status === 404 || normalized.includes("not found")) {
        setConsoleOutput("The code runner is currently unavailable. Please try again in a moment.");
        return;
      }

      if (status === 400 || status === 500 || normalized.includes("execution failed") || normalized.includes("compile")) {
        setConsoleOutput("Code execution failed. Please check your syntax and try again.");
        return;
      }

      setConsoleOutput("The code runner is currently unavailable. Please try again in a moment.");
    } finally {
      setRunningCode(false);
    }
  };

  const start = async () => {
    if (!roleId || !roles.some((r) => r.id === roleId)) {
      toast.warning("Select a valid role before starting the interview.");
      return;
    }

    setBusy(true);
    setSummary(null);
    setEvals({});
    setIdx(0);
    setAnswer("");
    setCircuit({ components: [], connections: [] });
    setConsoleOutput("Output will appear here...");
    setActiveTab("problem");
    try {
      const { data } = await api.post("/interviews/start", {
        role_id: roleId,
        difficulty,
        missing_skills: [],
        language,
      });
      if (!data?.questions?.length) {
        toast.warning("The interview could not be started. Please try a different role or difficulty.");
        return;
      }
      setSession(data);
      setLanguage(data.language || language);
      toast.success(
        `Mock Interview started: ${data.questions.length} ${difficulty === "hard" && isDsaEligibleRole ? "DSA" : ""} questions`
      );
    } catch (e) {
      toast.warning(e.response?.data?.detail || e.message || "Failed to start interview");
    } finally {
      setBusy(false);
    }
  };

  const submitAnswer = async () => {
    if (!session?.id || idx < 0 || idx >= (session?.questions?.length || 0)) {
      toast.warning("This interview step is no longer available.");
      return;
    }

    const normalizedAnswer = (answer || "").trim();
    if (!isCircuitQ && !normalizedAnswer) {
      toast.warning("Please write a response before submitting.");
      return;
    }

    if (isCircuitQ && (!circuit || !Array.isArray(circuit.components) || !Array.isArray(circuit.connections))) {
      toast.warning("The circuit submission is incomplete. Add components and connections before submitting.");
      return;
    }

    setBusy(true);
    try {
      const { data } = await api.post("/interviews/answer", {
        session_id: session.id,
        question_index: idx,
        answer: normalizedAnswer,
        language,
        ...(isCircuitQ ? { circuit_submission: circuit } : {}),
      });
      setEvals((prev) => ({ ...prev, [idx]: data.evaluation }));
      toast.success(`Evaluated! Score: ${data.evaluation.score}/100`);
    } catch (e) {
      toast.warning(e.response?.data?.detail || e.message || "Failed to evaluate answer");
    } finally {
      setBusy(false);
    }
  };

  const nextQ = () => {
    if (!session?.questions?.length) {
      toast.warning("There is no active interview session to continue.");
      return;
    }

    setAnswer("");
    setCircuit({ components: [], connections: [] });
    setConsoleOutput("Output will appear here...");
    setIdx((i) => Math.min(i + 1, session.questions.length - 1));
  };

  const finish = async () => {
    if (!session?.id) {
      toast.warning("No active interview session to complete.");
      return;
    }

    setBusy(true);
    try {
      const { data } = await api.post(`/interviews/finish?session_id=${session.id}`);
      setSummary(data.summary);
      toast.success(`Session complete! Avg score: ${data.summary.avg_score}/100`);
    } catch (e) {
      toast.warning(e.response?.data?.detail || e.message || "Failed to finalize session");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="interview-page">
      <div>
        <h1
          className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100"
          style={{ fontFamily: "Outfit, sans-serif" }}
        >
          {roleId === "electronics_engineer" && difficulty === "hard"
            ? "Electronics Engineer Practical Interview"
            : "Adaptive Mock Interview"}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {roleId === "electronics_engineer" && difficulty === "hard"
            ? "Arduino Uno circuit challenges · Firmware implementation · Automated evaluation."
            : "Role-aware questions · STAR feedback · Coding drills · Interview analytics."}
        </p>
      </div>

      {!session && (
        <Card
          className="space-y-5 border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900"
          data-testid="interview-setup-card"
        >
          <div>
            <div className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              1. Select Target Role
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {roles.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  data-testid={`iv-role-${r.id}`}
                  onClick={() => setRoleId(r.id)}
                  className={`rounded-lg border px-3 py-2 text-left text-xs font-medium transition-all sm:text-sm ${
                    roleId === r.id
                      ? "border-indigo-600 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-600 shadow-xs dark:bg-indigo-950/50 dark:text-indigo-200"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  {r.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              2. Select Difficulty
            </div>
            <div className="flex flex-wrap gap-2">
              {difficulties.map((d) => (
                <button
                  key={d}
                  type="button"
                  data-testid={`iv-diff-${d}`}
                  onClick={() => setDifficulty(d)}
                  className={`rounded-lg border px-4 py-1.5 text-xs font-medium capitalize transition-all sm:text-sm ${
                    difficulty === d
                      ? "border-indigo-600 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-600 shadow-xs dark:bg-indigo-950/50 dark:text-indigo-200"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  {d === "hard" ? hardDifficultyLabel : DIFF_META[d].label}
                </button>
              ))}
            </div>

            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {difficulty === "beginner" && "Conceptual questions: definitions, patterns, and practical explanations."}
              {difficulty === "intermediate" && "Practical questions: code review, debugging, and system design trade-offs."}
              {difficulty === "advanced" && "Architecture and optimization questions with deeper trade-off analysis."}
              {difficulty === "hard" && (
                <span className="font-medium text-red-600 dark:text-red-400">
                  {hardDifficultyMessage}
                </span>
              )}
            </div>
          </div>

          <Button
            data-testid="btn-start-interview"
            onClick={start}
            disabled={busy}
            className="bg-indigo-600 px-6 text-white shadow-sm hover:bg-indigo-700"
          >
            {busy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" /> Start Practice Session
              </>
            )}
          </Button>
        </Card>
      )}

      {session && !summary && (
        <div className="space-y-4">
          <div
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
            data-testid="iv-progress"
          >
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              Question {idx + 1} of {session.questions.length}
            </span>
            <div className="flex items-center gap-2">
              {isCodingQ && (
                <span className="flex items-center gap-1 rounded border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
                  <Code2 className="h-3 w-3" /> DSA Coding
                </span>
              )}
              {isCircuitQ && (
                <span className="flex items-center gap-1 rounded border border-teal-200 bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-800 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-300">
                  <Code2 className="h-3 w-3" /> Circuit Challenge
                </span>
              )}
              <span
                className={`rounded border px-2 py-0.5 text-xs font-semibold capitalize ${
                  DIFF_META[session.difficulty]?.color || "border-indigo-100 bg-indigo-50 text-indigo-700"
                }`}
              >
                {session.difficulty === "hard" ? hardDifficultyLabel : DIFF_META[session.difficulty]?.label || session.difficulty} level
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_1.5fr]">
            <Card className="space-y-5 border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
                  {currentQ?.type || "challenge"}
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                  {session.difficulty}
                </span>
              </div>

              <div className="space-y-3">
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100" style={{ fontFamily: "Outfit, sans-serif" }}>
                  {currentQ?.q}
                </h3>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Topic: {currentQ?.topic}
                </div>
              </div>

              {isCodingQ && (
                <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Problem breakdown</span>
                    <span>Complexity target</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
                      <div className="text-slate-500 dark:text-slate-400">Time</div>
                      <div className="mt-1 font-semibold text-slate-900 dark:text-slate-100">O(n)</div>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
                      <div className="text-slate-500 dark:text-slate-400">Space</div>
                      <div className="mt-1 font-semibold text-slate-900 dark:text-slate-100">O(1)</div>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
                      <div className="text-slate-500 dark:text-slate-400">Focus</div>
                      <div className="mt-1 font-semibold text-slate-900 dark:text-slate-100">Logic</div>
                    </div>
                  </div>
                </div>
              )}

              {!isCircuitQ && currentQ?.hint && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                  <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    <strong>Hint:</strong> {currentQ.hint}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
                  <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    <Gauge className="h-3.5 w-3.5" /> Score
                  </div>
                  <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.current || "—"}</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
                  <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    <Target className="h-3.5 w-3.5" /> Best
                  </div>
                  <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.best || "—"}</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
                  <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    <Clock3 className="h-3.5 w-3.5" /> Avg
                  </div>
                  <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.avg || "—"}</div>
                </div>
              </div>
            </Card>

            <Card className="border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex gap-2">
                  {(isCircuitQ ? [{ id: "problem", label: "Challenge" }] : [
                    { id: "problem", label: "Problem" },
                    { id: "notes", label: "Notes" },
                    { id: "history", label: "History" },
                  ]) .map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        activeTab === tab.id
                          ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                          : "bg-slate-100 text-slate-600 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-slate-100"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <BarChart3 className="h-3.5 w-3.5" />
                  {stats.attempted || 0} attempts
                </div>
              </div>

              {activeTab === "problem" && (
                <div className="space-y-4">
                  {isCircuitQ ? (
                    <CircuitChallenge
                      value={circuit}
                      onChange={setCircuit}
                      code={answer}
                      onCodeChange={setAnswer}
                      onRun={runCodeConsole}
                      consoleOutput={consoleOutput}
                      runningCode={runningCode}
                      disabled={Boolean(evals[idx])}
                    />
                  ) : isCodingQ ? (
                    <div>
                      <div className="mb-2 flex items-center justify-between gap-3 text-xs font-semibold text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Code2 className="h-3.5 w-3.5" /> Write your solution
                        </span>
                        <label className="flex items-center gap-2 rounded border border-slate-200 bg-slate-50 px-2 py-1 dark:border-slate-700 dark:bg-slate-800">
                          <span>Language:</span>
                          <select
                            value={language}
                            onChange={(e) => {
                              const nextLanguage = e.target.value;
                              setLanguage(nextLanguage);
                              setAnswer(starterSnippets[nextLanguage] || starterSnippets.javascript);
                            }}
                            className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                          >
                            {DSA_LANGUAGES.map((lang) => (
                              <option key={lang} value={lang}>
                                {languageLabels[lang]}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <Textarea
                        data-testid="iv-answer"
                        rows={16}
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="Write your solution here..."
                        className="resize-y border-slate-700 bg-slate-950 font-mono text-sm leading-relaxed text-green-300 placeholder-slate-600"
                        spellCheck={false}
                      />

                      <div className="rounded-xl border border-slate-200 bg-slate-950 p-3 dark:border-slate-700">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Output Console</div>
                          <button
                            type="button"
                            onClick={runCodeConsole}
                            className="rounded bg-emerald-600 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-emerald-500"
                          >
                            Run
                          </button>
                        </div>

                        <div className="grid gap-3 rounded-lg border border-slate-800 bg-black p-3">
                          <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-slate-300">
                            <div className="rounded border border-slate-700 bg-slate-900 p-2">
                              <div className="text-slate-400">Result</div>
                              <div className="mt-1 text-sm font-bold text-emerald-300">
                                {evals[idx]?.score ?? "—"}
                              </div>
                            </div>
                            <div className="rounded border border-slate-700 bg-slate-900 p-2">
                              <div className="text-slate-400">Relevance</div>
                              <div className="mt-1 text-sm font-bold text-cyan-300">
                                {evals[idx]?.relevance ?? "—"}
                              </div>
                            </div>
                            <div className="rounded border border-slate-700 bg-slate-900 p-2">
                              <div className="text-slate-400">Status</div>
                              <div className="mt-1 text-sm font-bold text-amber-300">
                                {evals[idx] ? "Scored" : "Ready"}
                              </div>
                            </div>
                          </div>

                          <div className="rounded border border-slate-700 bg-slate-900 p-3">
                            <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Output</div>
                            <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-green-300">
                              {consoleOutput}
                            </pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Textarea
                      data-testid="iv-answer"
                      rows={10}
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="Type your response here. Structure with STAR for behavioral questions..."
                      className="border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500"
                    />
                  )}
                </div>
              )}

              {activeTab === "notes" && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300">
                  <div className="mb-2 font-semibold text-slate-800 dark:text-slate-200">Interview checklist</div>
                  <ul className="space-y-2 list-disc pl-5">
                    <li>Explain your approach before code.</li>
                    <li>State time and space complexity clearly.</li>
                    <li>Call out edge cases and invalid inputs.</li>
                    <li>Use clear variable names and readable structure.</li>
                  </ul>
                </div>
              )}

              {activeTab === "history" && (
                <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                  {Object.keys(evals).length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 p-4 text-slate-500 dark:border-slate-700 dark:text-slate-400">
                      No previous attempts for this session yet.
                    </div>
                  ) : (
                    Object.entries(evals).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/80">
                        <span>Question {Number(key) + 1}</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{value.score}/100</span>
                      </div>
                    ))
                  )}
                </div>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button
                  data-testid="btn-iv-submit"
                  onClick={submitAnswer}
                  disabled={busy || (!isCircuitQ && !answer.trim()) || Boolean(evals[idx])}
                  className="bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isCircuitQ ? "Submit Challenge" : isCodingQ ? "Submit Solution" : "Evaluate Response"}
                </Button>

                {evals[idx] && idx < session.questions.length - 1 && (
                  <Button
                    data-testid="btn-iv-next"
                    variant="outline"
                    onClick={nextQ}
                    className="border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Next Question <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                )}

                {evals[idx] && idx === session.questions.length - 1 && (
                  <Button
                    data-testid="btn-iv-finish"
                    onClick={finish}
                    disabled={busy}
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    Complete and View Summary
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSession(null);
                    setSummary(null);
                  }}
                  className="ml-auto text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  Exit Session
                </Button>
              </div>

              {currentEval && (
                <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-800" data-testid={`iv-eval-${idx}`}>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      Evaluation Result
                    </div>
                    <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                      {currentEval.score}
                      <span className="text-xs text-indigo-400 dark:text-indigo-500">/100</span>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {currentEval.feedback}
                  </div>

                  <div className="mt-4 grid grid-cols-5 gap-2 text-xs">
                    {(isCircuitQ
                      ? [["circuit", "Circuit"], ["component_selection", "Parts"], ["code", "Code"], ["logic", "Logic"], ["behavior", "Behavior"]]
                      : [["correctness", "Correctness"], ["relevance", "Relevance"], ["completeness", "Completeness"], ["structure", "Structure"], ["clarity", "Clarity"]]
                    ).map(([key, label]) => (
                      <div key={key} className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-center dark:border-slate-700 dark:bg-slate-800">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          {label}
                        </div>
                        <div className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                          {currentEval[key]}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 text-xs text-slate-700 dark:text-slate-300">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">Recommended improvements:</span>
                    <ul className="ml-5 mt-1 list-disc space-y-0.5 text-slate-600 dark:text-slate-400">
                      {currentEval.improvements?.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {summary && (
        <Card
          className="space-y-5 rounded-xl border-emerald-200 bg-emerald-50/30 p-6 shadow-xs dark:border-emerald-800 dark:bg-emerald-950/20"
          data-testid="iv-summary-card"
        >
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
            <Award className="h-6 w-6" />
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100" style={{ fontFamily: "Outfit, sans-serif" }}>
              Interview Session Complete
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Average Score
              </div>
              <div className="mt-1 text-3xl font-extrabold text-indigo-600 dark:text-indigo-400" style={{ fontFamily: "Outfit, sans-serif" }}>
                {summary.avg_score}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Questions Answered
              </div>
              <div className="mt-1 text-3xl font-extrabold text-slate-900 dark:text-slate-100" style={{ fontFamily: "Outfit, sans-serif" }}>
                {summary.questions_answered}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Next Recommended
              </div>
              <div className="mt-1 text-2xl font-bold capitalize text-emerald-700 dark:text-emerald-400" style={{ fontFamily: "Outfit, sans-serif" }}>
                {summary.next_difficulty}
              </div>
            </div>
          </div>

          <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900">
            <div>
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">Strengths: </span>
              <span className="text-slate-700 dark:text-slate-300">{summary.strengths?.join(", ") || "Good engagement and effort"}</span>
            </div>
            <div>
              <span className="font-semibold text-amber-700 dark:text-amber-400">Improvements: </span>
              <span className="text-slate-700 dark:text-slate-300">{summary.weaknesses?.join(", ") || "Continue polishing depth and structure"}</span>
            </div>
          </div>

          <Button
            data-testid="btn-iv-restart"
            onClick={() => {
              setSession(null);
              setSummary(null);
              setDifficulty(summary.next_difficulty || "beginner");
            }}
            className="bg-indigo-600 text-white hover:bg-indigo-700"
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Start Another Session
          </Button>
        </Card>
      )}
    </div>
  );
}
