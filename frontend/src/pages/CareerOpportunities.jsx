import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  GraduationCap,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

const levelLabels = {
  fresher: "Fresher",
  entry_level: "Entry-Level",
  junior: "Junior",
  mid_level: "Mid-Level",
  senior: "Senior",
};

function CareerOpportunitiesSkeleton() {
  return (
    <div className="space-y-5 animate-pulse" aria-label="Loading career opportunities" data-testid="career-opportunities-loading">
      <div className="h-24 rounded-xl bg-slate-200/70 dark:bg-slate-800" />
      <div className="h-32 rounded-xl bg-slate-200/70 dark:bg-slate-800" />
      <div className="h-72 rounded-xl bg-slate-200/70 dark:bg-slate-800" />
    </div>
  );
}

function ProgressMetric({ label, value, detail }) {
  return (
    <div className="min-w-0">
      <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-1 font-[Outfit,sans-serif] text-xl font-bold text-slate-950 dark:text-white">{value}</div>
      <div className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">{detail}</div>
    </div>
  );
}

function Recommendation({ role }) {
  const isApplyReady = role.readiness === "Apply now";
  const isExploration = role.readiness === "Explore branch";

  return (
    <Card
      className="border-slate-200 bg-white p-5 shadow-none dark:border-slate-800 dark:bg-slate-900 sm:p-6"
      data-testid={`career-role-${role.role_id}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-[Outfit,sans-serif] text-lg font-bold text-slate-950 dark:text-white">
              {role.titles[0]}
            </h3>
            {role.is_interest_role && (
              <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-800 dark:border-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-200">
                Your profile target
              </span>
            )}
            <span
              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                isApplyReady
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : isExploration
                    ? "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
              }`}
            >
              {role.readiness}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {role.role_family}
            {role.titles.length > 1 ? ` · Also consider ${role.titles[1]}` : ""}
          </p>
          {isExploration && (
            <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
              This branch is included for exploration, but your current profile does not yet list its core skills.
            </p>
          )}
        </div>
        <div className="shrink-0 rounded-lg bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200">
          {role.skill_match} matched
        </div>
      </div>

      <div className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2">
        <div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Experience match</div>
          <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
            {levelLabels[role.experience_level]} · {role.required_experience}
          </p>
          {role.current_experience_years !== null && role.current_experience_years !== undefined && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Your profile: {role.current_experience_years} years
            </p>
          )}
        </div>
        <div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">India hiring outlook</div>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-900 dark:text-slate-100">
            <TrendingUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            {role.demand} demand · {role.availability} availability
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{role.future_outlook}</p>
        </div>
        <div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Indicative annual salary</div>
          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
            ₹{role.salary_lpa} LPA <span className="font-normal text-slate-500 dark:text-slate-400">({role.salary_level} level)</span>
          </p>
          <a
            href={`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(role.titles[0])}&location=India`}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:underline dark:text-indigo-300"
          >
            Check current India listings <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
        <div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Skills to strengthen</div>
          {role.skill_gaps.length ? (
            <div className="mt-1 flex flex-wrap gap-1.5">
              {role.skill_gaps.map((skill) => (
                <span key={skill} className="rounded-md bg-slate-100 px-2 py-1 text-xs capitalize text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">No core skill gaps found in your current profile.</p>
          )}
        </div>
      </div>

      <details className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
        <summary className="cursor-pointer text-sm font-semibold text-indigo-700 hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-200">
          View skill evidence and career path
        </summary>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <div>
            <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-300">Commonly assessed soft skills</h4>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              Listed skills are profile evidence. Not listed means the profile does not show evidence yet, not that you lack the skill.
            </p>
            <div className="mt-2 space-y-2">
              {role.soft_skill_evidence.map((skill) => (
                <div key={skill.name} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-700 dark:text-slate-300">{skill.name}</span>
                  <span className={skill.listed ? "text-emerald-700 dark:text-emerald-300" : "text-slate-500 dark:text-slate-400"}>
                    {skill.listed ? "In profile" : "Not listed"}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-300">A possible progression</h4>
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
              {role.career_progression.join(" → ")}
            </p>
            <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
              Progress by building production experience, documenting outcomes, and revisiting your target level as your responsibilities grow.
            </p>
          </div>
        </div>
      </details>
    </Card>
  );
}

export default function CareerOpportunities() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/career-opportunities");
      setData(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.detail || requestError.message || "Could not load career recommendations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <CareerOpportunitiesSkeleton />;

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200" role="alert">
        <p>{error}</p>
        <Button onClick={load} variant="outline" size="sm" className="mt-3 border-rose-300 bg-white text-rose-900 hover:bg-rose-100 dark:border-rose-800 dark:bg-transparent dark:text-rose-200">
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Try again
        </Button>
      </div>
    );
  }

  const progress = data.learning_progress;

  return (
    <div className="space-y-6 pb-8" data-testid="career-opportunities-page">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-[Outfit,sans-serif] text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            Career opportunities
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
            Job roles matched to your saved profile target, skills, learning evidence, and experience level.
          </p>
        </div>
        <Button onClick={load} variant="outline" className="shrink-0 border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900">
          <RefreshCw className="mr-1.5 h-4 w-4" /> Refresh matches
        </Button>
      </header>

      <Card className="border-slate-200 bg-white p-5 shadow-none dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="flex items-start gap-3">
          <BriefcaseBusiness className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-400" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h2 className="font-[Outfit,sans-serif] text-lg font-bold text-slate-950 dark:text-white">
                {levelLabels[data.experience_level]} opportunities
              </h2>
              {data.interest_role_name && (
                <span className="text-sm text-slate-600 dark:text-slate-400">Career interest: {data.interest_role_name}</span>
              )}
            </div>
            <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
              Role seniority is kept within your stated career stage. Update your experience in your profile if this level is incorrect.
            </p>
          </div>
          <Link to="/profile" className="shrink-0 text-sm font-semibold text-indigo-700 hover:underline dark:text-indigo-300">
            Edit profile
          </Link>
        </div>

        <h3 className="mt-5 border-t border-slate-100 pt-5 text-sm font-bold text-slate-900 dark:border-slate-800 dark:text-slate-100">
          Learning progress and evidence
        </h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <ProgressMetric label="Resume reviews" value={progress.resume_analyses} detail="Resume analyses on your account" />
          <ProgressMetric
            label="Interview practice"
            value={progress.completed_interviews}
            detail={progress.latest_interview_score === null || progress.latest_interview_score === undefined ? "Completed sessions" : `Latest score: ${progress.latest_interview_score}/100`}
          />
          <ProgressMetric
            label="Role requirements"
            value={progress.total_requirements ? `${progress.matched_requirements} / ${progress.total_requirements}` : "Not assessed"}
            detail={progress.total_requirements ? "Matched against your profile and latest resume" : "Analyze a resume to see role-skill coverage"}
          />
        </div>

        {data.skills.length > 0 && (
          <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Skills considered</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {data.skills.slice(0, 12).map((skill) => (
                <span key={skill} className="rounded-md bg-indigo-50 px-2 py-1 text-xs capitalize text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200">
                  {skill}
                </span>
              ))}
              {data.skills.length > 12 && <span className="px-1 py-1 text-xs text-slate-500">+{data.skills.length - 12} more</span>}
            </div>
          </div>
        )}
        <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
          <GraduationCap className="mt-0.5 h-4 w-4 shrink-0" />
          Course completions are not tracked yet. Learning progress shown here reflects resume analyses, skill coverage, and completed mock interviews.
        </p>
      </Card>

      <section className="space-y-3" aria-labelledby="role-recommendations-heading">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="role-recommendations-heading" className="font-[Outfit,sans-serif] text-xl font-bold text-slate-950 dark:text-white">
              {data.interest_role_name ? `Roles for ${data.interest_role_name}` : "Roles to consider"}
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Your selected career path comes first, followed by roles that also match your current skills.
            </p>
          </div>
        </div>

        {data.recommendations.length ? (
          <div className="space-y-4">
            {data.recommendations.map((role) => <Recommendation key={role.role_id} role={role} />)}
          </div>
        ) : (
          <Card className="border-slate-200 bg-white p-6 shadow-none dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">Add evidence to find a suitable match</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Add your skills to your profile or analyze a resume to get a more accurate view of your fit across branches.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link to="/profile" className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-700 hover:underline dark:text-indigo-300">
                    Update skills <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link to="/resume" className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-700 hover:underline dark:text-indigo-300">
                    Analyze resume <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        )}
      </section>

      <p className="rounded-lg border border-slate-200 bg-slate-100/70 px-4 py-3 text-xs leading-5 text-slate-600 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-400">
        {data.market_data_note} Hiring outlook and availability are broad directional estimates, not a live job-board feed. Verify current openings and compensation with employers in your location.
      </p>
    </div>
  );
}
