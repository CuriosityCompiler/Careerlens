import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Hls from "hls.js";
import { Button } from "@/components/ui/button";
import { Shield, Zap, LineChart, ArrowRight } from "lucide-react";

const streamUrl = "https://stream.mux.com/tLkHO1qZoaaQOUeVWo8hEBeGQfySP02EPS02BmnNFyXys.m3u8";

const features = [
  {
    icon: Zap,
    title: "Local-First Parser (Mode A)",
    body: "Resume analysis runs in an in-browser Web Worker. Your raw resume never leaves your machine unless you opt-in to Server Mode.",
  },
  {
    icon: LineChart,
    title: "Explainable 6D Scoring",
    body: "ATS readiness, role fit, skill coverage, impact, projects, and completeness with traceable rule checklists and exact recommendations.",
  },
  {
    icon: Shield,
    title: "Adaptive Mock Interviews",
    body: "Role-aware questions across 7 tech careers with STAR framework evaluation, instant rubric scoring, and Hard (DSA) coding challenges.",
  },
];

export default function Landing() {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;
      video.play().catch(() => {});
      return;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: false });
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANAGED_MEDIA_ATTACHED, () => {
        video.play().catch(() => {});
      });

      return () => hls.destroy();
    }
  }, []);

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100"
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
      data-testid="landing-page"
    >
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <video
          ref={videoRef}
          className="h-full w-full object-cover opacity-20 blur-[1px]"
          autoPlay
          muted
          loop
          playsInline
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070b0a] via-[#070b0a]/85 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070b0a] via-[#070b0a]/40 to-[#070b0a]/10" />
      </div>

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2.5 group">
          <img
            src="/logo.png"
            alt="CareerLens"
            className="h-8 w-8 rounded-lg border border-indigo-500/20 object-contain shadow-xs transition-transform group-hover:scale-105"
          />
          <span
            className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100"
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            CareerLens
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link to="/login">
            <Button
              variant="ghost"
              data-testid="btn-nav-login"
              className="text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
            >
              Log in
            </Button>
          </Link>
          <Link to="/register">
            <Button
              data-testid="btn-nav-register"
              className="bg-indigo-600 text-white shadow-sm hover:bg-indigo-700"
            >
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-4xl px-6 pb-12 pt-16 text-center">
        <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
          <Shield className="h-3.5 w-3.5" /> Privacy-First - Local Mode A by Default
        </div>

        <h1
          className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl lg:text-6xl"
          style={{ fontFamily: "Outfit, sans-serif" }}
        >
          Explainable career intelligence.
          <br />
          <span className="text-indigo-600 dark:text-indigo-400">Zero black-box magic.</span>
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-400">
          Diagnose, Explain, Recommend, Practice, Measure, and Improve. Every score transparently
          explains{" "}
          <strong className="text-slate-800 dark:text-slate-200">WHAT</strong>,{" "}
          <strong className="text-slate-800 dark:text-slate-200">WHY</strong>,{" "}
          <strong className="text-slate-800 dark:text-slate-200">HOW</strong>, and{" "}
          <strong className="text-slate-800 dark:text-slate-200">NEXT</strong>.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/register">
            <Button
              size="lg"
              data-testid="btn-cta-primary"
              className="bg-indigo-600 text-white shadow-md hover:bg-indigo-700"
            >
              Start Free Assessment <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
          <Link to="/login">
            <Button
              size="lg"
              variant="outline"
              data-testid="btn-cta-secondary"
              className="border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Demo Student Login
            </Button>
          </Link>
        </div>
      </section>

      <section className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 gap-5 px-6 pb-16 md:grid-cols-3">
        {features.map((f, i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-xs transition-all hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-700"
          >
            <div className="mb-4 grid h-10 w-10 place-items-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <f.icon className="h-5 w-5" />
            </div>
            <h3
              className="mb-2 text-lg font-bold text-slate-900 dark:text-slate-100"
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              {f.title}
            </h3>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{f.body}</p>
          </div>
        ))}
      </section>

      <footer className="relative z-10 border-t border-slate-200 py-6 text-center text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
        CareerLens MVP - Privacy-first career intelligence
      </footer>
    </div>
  );
}
