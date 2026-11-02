import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  BookOpen,
  CheckCircle2,
  FileText,
  Gauge,
  MessageSquare,
  RefreshCw,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";

const feedIcon = {
  resume_alert: FileText,
  skill_gap: Target,
  interview_weakness: MessageSquare,
  weekly_goal: Trophy,
  improvement: Sparkles,
};

const sourceLabels = ["resume analysis", "recommendations", "notifications", "interviews"];

function formatScore(value) {
  return value === null || value === undefined || !Number.isFinite(Number(value))
    ? "—"
    : Math.round(Number(value));
}

function ScoreRing({ score }) {
  const circumference = 2 * Math.PI * 43;
  const numericScore = score === null ? 0 : Math.max(0, Math.min(100, Number(score)));

  return (
    <div
      className="relative grid h-28 w-28 shrink-0 place-items-center"
      role="img"
      aria-label={score === null ? "No resume score yet" : `Resume score ${score} out of 100`}
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full -rotate-90">
        <circle cx="50" cy="50" r="43" fill="none" stroke="currentColor" strokeWidth="7" className="text-indigo-100" />
        {score !== null && (
          <circle
            cx="50"
            cy="50"
            r="43"
            fill="none"
            stroke="currentColor"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${(numericScore / 100) * circumference} ${circumference}`}
            className="text-indigo-600"
          />
        )}
      </svg>
      <div className="text-center">
        <div className="font-[Outfit,sans-serif] text-3xl font-bold leading-none tabular-nums text-slate-950">
          {formatScore(score)}
        </div>
        <div className="mt-1 text-[10px] font-medium tracking-wide text-slate-500">OUT OF 100</div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-label="Loading dashboard" data-testid="dashboard-loading">
      <div className="h-52 rounded-2xl bg-slate-200/70 dark:bg-slate-800" />
      <div className="h-24 rounded-xl bg-slate-200/70 dark:bg-slate-800" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="h-80 rounded-xl bg-slate-200/70 dark:bg-slate-800 lg:col-span-2" />
        <div className="h-80 rounded-xl bg-slate-200/70 dark:bg-slate-800" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const nav = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [latest, setLatest] = useState(null);
  const [recs, setRecs] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failedSources, setFailedSources] = useState([]);

  const load = async () => {
    setLoading(true);
    setFailedSources([]);

    const results = await Promise.allSettled([
      api.get("/analyses/latest").then((response) => response.data),
      api.get("/recommendations").then((response) => response.data),
      api.get("/notifications").then((response) => response.data),
      api.get("/interviews").then((response) => response.data),
    ]);

    const [analysisResult, recommendationsResult, notificationsResult, interviewsResult] = results;
    const analysis = analysisResult.status === "fulfilled" ? analysisResult.value : null;
    const recommendations = recommendationsResult.status === "fulfilled" ? recommendationsResult.value : [];
    const notifications = notificationsResult.status === "fulfilled" ? notificationsResult.value : [];
    const interviewData = interviewsResult.status === "fulfilled" ? interviewsResult.value : [];

    setLatest(analysis?.result ? analysis : null);
    setRecs(Array.isArray(recommendations) ? recommendations : []);
    setNotifs(Array.isArray(notifications) ? notifications : []);
    setInterviews(Array.isArray(interviewData) ? interviewData : []);
    setFailedSources(
      results.flatMap((result, index) => (result.status === "rejected" ? [sourceLabels[index]] : []))
    );
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [location.key]);

  const stats = useMemo(() => {
    const scores = interviews
      .map((interview) => interview.summary?.avg_score)
      .filter((score) => score !== null && score !== undefined && Number.isFinite(Number(score)))
      .map(Number);
    const rawResumeScore = latest?.result?.scores?.overall;
    const resumeScore =
      rawResumeScore === null || rawResumeScore === undefined || !Number.isFinite(Number(rawResumeScore))
        ? null
        : Number(rawResumeScore);

    return {
      avg: scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null,
      best: scores.length ? Math.max(...scores) : null,
      total: interviews.length,
      resumeScore,
    };
  }, [interviews, latest]);

  const personalizedFeed = useMemo(() => {
    const feed = [];

    if (!latest) {
      feed.push({
        id: "no-resume",
        type: "resume_alert",
        title: "Start with a resume review",
        body: "See ATS readiness, role alignment, and practical next steps based on the experience you already have.",
        actionLabel: "Analyze resume",
        actionPath: "/resume",
      });
    } else {
      const scores = latest.result?.scores || {};
      if (scores.overall !== undefined) {
        feed.push({
          id: "score",
          type: "improvement",
          title: `Resume strength: ${formatScore(scores.overall)}/100`,
          body: `${latest.result?.role?.name || "Your target role"} · ATS readiness ${formatScore(scores.ats_readiness)} · Role alignment ${formatScore(scores.role_alignment)}.`,
          actionLabel: "View diagnostic",
          actionPath: "/resume",
        });
      }

      if (latest.result?.missing_must?.length) {
        const topGaps = latest.result.missing_must.slice(0, 3).join(", ");
        feed.push({
          id: "gap",
          type: "skill_gap",
          title: `${latest.result.missing_must.length} priority skills to build`,
          body: `Your review flagged ${topGaps}. Focus on evidence of these skills in your projects and experience.`,
          actionLabel: "Explore resources",
          actionPath: "/resources",
        });
      }
    }

    if (!interviews.length) {
      feed.push({
        id: "iv",
        type: "interview_weakness",
        title: "Practice your first interview",
        body: "Start a mock session to get a baseline and receive focused coaching for your target role.",
        actionLabel: "Start interview",
        actionPath: "/interview",
      });
    } else {
      const lastInterview = interviews[0];
      const latestScore = lastInterview.summary?.avg_score;
      const nextDifficulty = lastInterview.summary?.next_difficulty || "intermediate";

      if (Number(latestScore) < 60) {
        feed.push({
          id: "iv-low-score",
          type: "interview_weakness",
          title: "Build on your latest interview",
          body: `Your latest score was ${formatScore(latestScore)}/100. Work on structured explanations and edge cases, then try another ${nextDifficulty}-level session.`,
          actionLabel: "Practice again",
          actionPath: "/interview",
        });
      } else {
        feed.push({
          id: "iv-good-score",
          type: "improvement",
          title: `Interview score: ${formatScore(latestScore)}/100`,
          body: `Keep the momentum with another ${nextDifficulty}-level challenge and focus on explaining your trade-offs clearly.`,
          actionLabel: "Level up",
          actionPath: "/interview",
        });
      }
    }

    if (stats.avg >= 75 || stats.resumeScore >= 80) {
      feed.push({
        id: "goal",
        type: "weekly_goal",
        title: "Take on a harder challenge",
        body: "Your recent results are a good reason to stretch. Try a more advanced session and keep your answers specific.",
        actionLabel: "View analytics",
        actionPath: "/analytics",
      });
    } else {
      feed.push({
        id: "goal",
        type: "weekly_goal",
        title: "Choose one focus for this week",
        body: "Pick a priority skill, add one concrete example to your resume, and test it in a mock interview.",
        actionLabel: "View analytics",
        actionPath: "/analytics",
      });
    }

    return feed.slice(0, 4);
  }, [interviews, latest, stats.avg, stats.resumeScore]);

  const firstName = String(user?.name || user?.email || "there").trim().split(/[\s@]/)[0];

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6 pb-8" data-testid="dashboard-page">
      {failedSources.length > 0 && (
        <div
          className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100"
          role="alert"
          data-testid="dashboard-load-error"
        >
          <p>Some dashboard data could not be loaded: {failedSources.join(", ")}.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={load}
            className="shrink-0 border-amber-300 bg-white text-amber-950 hover:bg-amber-100 dark:border-amber-800 dark:bg-transparent dark:text-amber-100 dark:hover:bg-amber-900/40"
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Try again
          </Button>
        </div>
      )}

      <section
        className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-indigo-50/70 p-5 sm:p-7 dark:border-indigo-900/60 dark:bg-indigo-950/25"
        aria-labelledby="dashboard-heading"
      >
        <div className="absolute -right-10 -top-20 h-56 w-56 rounded-full border border-indigo-200/70 dark:border-indigo-800/50" aria-hidden="true" />
        <div className="absolute -right-1 top-[-3.5rem] h-40 w-40 rounded-full border border-indigo-200/50 dark:border-indigo-800/40" aria-hidden="true" />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-indigo-700 dark:text-indigo-300">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
              CAREER WORKSPACE
            </div>
            <h1
              id="dashboard-heading"
              className="font-[Outfit,sans-serif] text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl dark:text-white"
              data-testid="dashboard-greeting"
            >
              Welcome back, {firstName}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              A focused view of your resume, interview practice, and the next step in your career plan.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Button
                data-testid="btn-analyze-resume"
                onClick={() => nav("/resume")}
                className="bg-indigo-600 text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-indigo-700 active:translate-y-0"
              >
                <FileText className="mr-1.5 h-4 w-4" /> Analyze resume
              </Button>
              <Button
                variant="outline"
                onClick={() => nav("/interview")}
                className="border-indigo-200 bg-white/70 text-slate-800 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-white dark:border-indigo-800 dark:bg-slate-950/40 dark:text-slate-100 dark:hover:bg-slate-900"
              >
                <MessageSquare className="mr-1.5 h-4 w-4" /> Practice interview
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-xl border border-white/80 bg-white/75 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/50">
            <ScoreRing score={stats.resumeScore} />
            <div className="min-w-32">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Latest resume score</div>
              <div className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                {stats.resumeScore === null ? "Not reviewed yet" : "Your current baseline"}
              </div>
              <button
                onClick={() => nav("/resume")}
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 transition hover:gap-1.5 dark:text-indigo-300"
              >
                {stats.resumeScore === null ? "Review a resume" : "Open analysis"}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 overflow-hidden rounded-xl border border-slate-200 bg-white divide-x divide-y divide-slate-200 sm:grid-cols-4 sm:divide-y-0 dark:border-slate-800 dark:bg-slate-900 dark:divide-slate-800" aria-label="Career progress">
        <div className="p-4 sm:p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <Gauge className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> Average interview
          </div>
          <div className="mt-2 font-[Outfit,sans-serif] text-2xl font-bold tabular-nums text-slate-950 dark:text-white">
            {formatScore(stats.avg)}<span className="ml-1 text-sm font-medium text-slate-400">/100</span>
          </div>
        </div>
        <div className="p-4 sm:p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <Trophy className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> Best interview
          </div>
          <div className="mt-2 font-[Outfit,sans-serif] text-2xl font-bold tabular-nums text-slate-950 dark:text-white">
            {formatScore(stats.best)}<span className="ml-1 text-sm font-medium text-slate-400">/100</span>
          </div>
        </div>
        <div className="p-4 sm:p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <MessageSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> Practice sessions
          </div>
          <div className="mt-2 font-[Outfit,sans-serif] text-2xl font-bold tabular-nums text-slate-950 dark:text-white">
            {stats.total}
          </div>
        </div>
        <div className="p-4 sm:p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> Resume score
          </div>
          <div className="mt-2 font-[Outfit,sans-serif] text-2xl font-bold tabular-nums text-slate-950 dark:text-white">
            {formatScore(stats.resumeScore)}<span className="ml-1 text-sm font-medium text-slate-400">/100</span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <section className="space-y-3 lg:col-span-2" data-testid="feed-column" aria-labelledby="next-steps-heading">
          <div className="flex items-end justify-between gap-3 px-1">
            <div>
              <h2 id="next-steps-heading" className="font-[Outfit,sans-serif] text-xl font-bold tracking-tight text-slate-950 dark:text-white">
                Your next steps
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Actions matched to your current progress</p>
            </div>
            <Link
              to="/analytics"
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-200"
            >
              Progress <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {personalizedFeed.map((item) => {
            const Icon = feedIcon[item.type] || Sparkles;
            return (
              <Card
                key={item.id}
                className="group border-slate-200 bg-white p-4 shadow-none transition duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-800"
                data-testid={`feed-card-${item.type}`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                    <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold leading-5 text-slate-900 dark:text-slate-100">{item.title}</h3>
                    <p className="mt-1.5 text-sm leading-6 text-slate-600 dark:text-slate-400">{item.body}</p>
                    <button
                      onClick={() => nav(item.actionPath)}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 transition group-hover:gap-2 dark:text-indigo-300"
                    >
                      {item.actionLabel} <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </section>

        <aside className="space-y-5">
          <Card className="border-slate-200 bg-white p-5 shadow-none dark:border-slate-800 dark:bg-slate-900" data-testid="top-recs-card">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <h2 className="font-[Outfit,sans-serif] font-bold text-slate-950 dark:text-white">Recommended for you</h2>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Practical resources for your next step</p>
              </div>
              <Link
                to="/resources"
                className="shrink-0 text-xs font-semibold text-indigo-700 hover:underline dark:text-indigo-300"
                data-testid="link-resources"
              >
                View all
              </Link>
            </div>
            {recs.length === 0 ? (
              <div className="rounded-lg bg-slate-50 px-3.5 py-4 text-sm leading-5 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                Review your resume to get resources matched to your skill gaps.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {recs.slice(0, 3).map((recommendation) => (
                  <div
                    key={recommendation.id}
                    className="py-3 first:pt-0 last:pb-0"
                    data-testid={`rec-${recommendation.target_skill}`}
                  >
                    {recommendation.resource?.url ? (
                      <a
                        href={recommendation.resource.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-start gap-1 text-sm font-semibold leading-5 text-slate-900 transition hover:text-indigo-700 dark:text-slate-100 dark:hover:text-indigo-300"
                      >
                        <span className="line-clamp-2">{recommendation.resource.title}</span>
                        <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      </a>
                    ) : (
                      <div className="line-clamp-2 text-sm font-semibold leading-5 text-slate-900 dark:text-slate-100">
                        {recommendation.resource?.title || recommendation.target_skill || "Suggested resource"}
                      </div>
                    )}
                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{recommendation.reason}</p>
                    <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="font-semibold capitalize text-indigo-700 dark:text-indigo-300">
                        {recommendation.priority || "Suggested"} priority
                      </span>
                      {recommendation.effort && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{recommendation.effort}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="border-slate-200 bg-white p-5 shadow-none dark:border-slate-800 dark:bg-slate-900" data-testid="notifs-card">
            <div className="mb-4 flex items-center gap-2">
              <Bell className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="font-[Outfit,sans-serif] font-bold text-slate-950 dark:text-white">Recent updates</h2>
            </div>
            {notifs.length === 0 ? (
              <p className="rounded-lg bg-slate-50 px-3.5 py-3 text-sm text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                You’re all caught up. New progress updates will appear here.
              </p>
            ) : (
              <div className="space-y-3.5">
                {notifs.slice(0, 4).map((notification) => (
                  <div key={notification.id} className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium leading-5 text-slate-900 dark:text-slate-100">{notification.title}</div>
                      <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">{notification.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}
