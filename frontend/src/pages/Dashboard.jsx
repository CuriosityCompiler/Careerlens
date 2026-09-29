import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Target,
  Sparkles,
  TrendingUp,
  BookOpen,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Trophy,
  Gauge,
  BrainCircuit,
} from "lucide-react";

const feedIcon = {
  resume_alert: FileText,
  skill_gap: Target,
  interview_weakness: MessageSquare,
  weekly_goal: TrendingUp,
  improvement: Sparkles,
};

export default function Dashboard() {
  const nav = useNavigate();
  const [latest, setLatest] = useState(null);
  const [recs, setRecs] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [a, r, n, iv] = await Promise.all([
        api.get("/analyses/latest").then((x) => x.data).catch(() => ({})),
        api.get("/recommendations").then((x) => x.data).catch(() => []),
        api.get("/notifications").then((x) => x.data).catch(() => []),
        api.get("/interviews").then((x) => x.data).catch(() => []),
      ]);
      setLatest(a && a.result ? a : null);
      setRecs(r);
      setNotifs(n);
      setInterviews(iv);
    } catch {
      // Ignore load error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const scores = interviews
      .map((iv) => Number(iv.summary?.avg_score || 0))
      .filter((score) => Number.isFinite(score));

    const avg = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
    const best = scores.length ? Math.max(...scores) : 0;
    const total = interviews.length;
    const resumeScore = Number(latest?.result?.scores?.overall || 0);

    return { avg, best, total, resumeScore };
  }, [interviews, latest]);

  const personalizedFeed = useMemo(() => {
    const feed = [];

    if (!latest) {
      feed.push({
        id: "no-resume",
        type: "resume_alert",
        title: "Upload your resume to start",
        body: "Get instant local analysis across 6 dimensions. Test ATS readiness and target role alignment with zero data leaks.",
        actionLabel: "Analyze Resume",
        actionPath: "/resume",
      });
    } else {
      const s = latest.result?.scores || {};
      if (s.overall !== undefined) {
        feed.push({
          id: "score",
          type: "improvement",
          title: `Resume strength: ${s.overall}/100 for ${latest.result?.role?.name || "your target role"}`,
          body: `ATS Readiness: ${s.ats_readiness}/100 · Role Alignment: ${s.role_alignment}/100. Your profile is ready for a deeper interview sprint.`,
          actionLabel: "View Full Diagnostic",
          actionPath: "/resume",
        });
      }

      if (latest.result?.missing_must?.length) {
        const topGaps = latest.result.missing_must.slice(0, 3).join(", ");
        feed.push({
          id: "gap",
          type: "skill_gap",
          title: `${latest.result.missing_must.length} critical skill gaps to close`,
          body: `Missing must-haves: ${topGaps}. These are the exact keywords recruiters are filtering for in your target track.`,
          actionLabel: "Explore Resources",
          actionPath: "/resources",
        });
      }
    }

    if (!interviews.length) {
      feed.push({
        id: "iv",
        type: "interview_weakness",
        title: "Your interview streak has not started yet",
        body: "Take your first mock interview to unlock personalized coaching, trend tracking, and a smarter difficulty ramp.",
        actionLabel: "Start Interview",
        actionPath: "/interview",
      });
    } else {
      const lastIv = interviews[0];
      const latestScore = lastIv.summary?.avg_score ?? 0;
      const nextDifficulty = lastIv.summary?.next_difficulty || "intermediate";

      if (latestScore < 60) {
        feed.push({
          id: "iv-low-score",
          type: "interview_weakness",
          title: "You are below your target interview score",
          body: `Your latest mock interview landed at ${latestScore}/100. Focus on clear explanations, edge cases, and faster structure to move into ${nextDifficulty} level.`,
          actionLabel: "Practice Again",
          actionPath: "/interview",
        });
      } else {
        feed.push({
          id: "iv-good-score",
          type: "improvement",
          title: `Strong interview momentum: ${latestScore}/100`,
          body: `You are progressing well. Your next move is a ${nextDifficulty} challenge to stretch precision without sacrificing confidence.`,
          actionLabel: "Level Up",
          actionPath: "/interview",
        });
      }
    }

    if (stats.avg >= 75 || stats.resumeScore >= 80) {
      feed.push({
        id: "goal",
        type: "weekly_goal",
        title: "You are ready for higher-pressure sessions",
        body: "Your recent performance suggests you can handle more advanced questions. Aim for a stronger narrative and cleaner algorithm explanations.",
        actionLabel: "Check Analytics",
        actionPath: "/analytics",
      });
    } else {
      feed.push({
        id: "goal",
        type: "weekly_goal",
        title: "Weekly improvement target",
        body: "Aim for a 10-point lift by focusing on one priority skill and completing one harder mock interview this week.",
        actionLabel: "Check Analytics",
        actionPath: "/analytics",
      });
    }

    return feed.slice(0, 4);
  }, [interviews, latest, stats.avg, stats.resumeScore]);

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900" style={{ fontFamily: "Outfit, sans-serif" }}>
            Personal Career Feed
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Tailored to your latest resume, interview trends, and skill gaps.
          </p>
        </div>
        <Button
          data-testid="btn-analyze-resume"
          onClick={() => nav("/resume")}
          className="bg-indigo-600 text-white shadow-sm hover:bg-indigo-700"
        >
          <FileText className="mr-1.5 h-4 w-4" /> Analyze Resume
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            <span>Avg score</span>
            <Gauge className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-slate-100">{stats.avg || 0}</div>
        </Card>
        <Card className="border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            <span>Best score</span>
            <Trophy className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-slate-100">{stats.best || 0}</div>
        </Card>
        <Card className="border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            <span>Sessions</span>
            <BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-slate-100">{stats.total}</div>
        </Card>
        <Card className="border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            <span>Resume</span>
            <BrainCircuit className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-slate-100">{stats.resumeScore || 0}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2" data-testid="feed-column">
          {personalizedFeed.map((c) => {
            const Icon = feedIcon[c.type] || Sparkles;
            return (
              <Card
                key={c.id}
                className="flex flex-col justify-between gap-4 border-slate-200 p-5 shadow-xs transition-all hover:border-indigo-300 sm:flex-row sm:items-start"
                data-testid={`feed-card-${c.type}`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-base font-semibold text-slate-900">{c.title}</div>
                    <div className="text-sm leading-relaxed text-slate-600">{c.body}</div>
                  </div>
                </div>
                {c.actionPath && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => nav(c.actionPath)}
                    className="shrink-0 self-start border-slate-200 text-xs font-semibold hover:border-indigo-300 hover:text-indigo-600 sm:self-center"
                  >
                    {c.actionLabel} <ChevronRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                )}
              </Card>
            );
          })}
        </div>

        <div className="space-y-5">
          <Card className="border-slate-200 p-5 shadow-xs" data-testid="top-recs-card">
            <div className="mb-3.5 flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="font-bold text-slate-900" style={{ fontFamily: "Outfit, sans-serif" }}>
                Top Recommendations
              </div>
              <Link to="/resources" className="text-xs font-semibold text-indigo-600 hover:underline" data-testid="link-resources">
                All Resources →
              </Link>
            </div>
            {recs.length === 0 ? (
              <div className="py-4 text-center text-sm text-slate-500">
                Analyze your resume to unlock personalized resources.
              </div>
            ) : (
              <div className="space-y-3.5">
                {recs.slice(0, 3).map((r) => (
                  <div key={r.id} className="space-y-1 border-l-3 border-indigo-500 pl-3 py-0.5" data-testid={`rec-${r.target_skill}`}>
                    <a
                      href={r.resource.url}
                      target="_blank"
                      rel="noreferrer"
                      className="line-clamp-1 text-sm font-semibold text-slate-900 transition-colors hover:text-indigo-600"
                    >
                      {r.resource.title}
                    </a>
                    <div className="text-xs text-slate-600">{r.reason}</div>
                    <div className="flex items-center gap-2 pt-1 text-[11px]">
                      <span className={`rounded border px-1.5 py-0.5 font-semibold uppercase ${
                        r.priority === "high" ? "border-red-200 bg-red-50 text-red-700" : "border-amber-200 bg-amber-50 text-amber-700"
                      }`}>
                        {r.priority} Priority
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="font-medium text-slate-500">{r.effort}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="border-slate-200 p-5 shadow-xs" data-testid="notifs-card">
            <div className="mb-3 border-b border-slate-100 pb-2 font-bold text-slate-900" style={{ fontFamily: "Outfit, sans-serif" }}>
              Recent Notifications
            </div>
            {notifs.length === 0 ? (
              <div className="py-3 text-center text-sm text-slate-500">No notifications yet.</div>
            ) : (
              <div className="space-y-3">
                {notifs.slice(0, 4).map((n) => (
                  <div key={n.id} className="border-b border-slate-100 pb-2.5 text-sm last:border-0 last:pb-0">
                    <div className="flex items-center gap-1.5 font-medium text-slate-900">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-indigo-600" />
                      {n.title}
                    </div>
                    <div className="mt-1 pl-5 text-xs text-slate-600">{n.body}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
