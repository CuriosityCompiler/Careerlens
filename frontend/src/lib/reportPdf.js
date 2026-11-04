import { jsPDF } from "jspdf";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 48;
const CONTENT_TOP = 68;
const CONTENT_BOTTOM = PAGE_HEIGHT - 58;
const COLORS = {
  ink: [15, 23, 42],
  muted: [100, 116, 139],
  line: [226, 232, 240],
  indigo: [79, 70, 229],
  green: [5, 150, 105],
  amber: [217, 119, 6],
  red: [220, 38, 38],
};

const SCORE_DIMENSIONS = [
  ["ats_readiness", "ATS readiness"],
  ["role_alignment", "Role alignment"],
  ["skill_coverage", "Skill coverage"],
  ["achievement_strength", "Quantified impact"],
  ["project_strength", "Project strength"],
  ["completeness", "Resume completeness"],
];

function safeText(value) {
  return String(value ?? "")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/[^\x20-\xFF]/g, "");
}

function score(value) {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.round(numeric) : null;
}

function dateLabel(value) {
  if (!value) return "Date not recorded";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? safeText(value).slice(0, 10) : parsed.toLocaleDateString();
}

function pageHeader(doc) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.indigo);
  doc.text("CAREERLENS  /  PROGRESS REPORT", MARGIN, 40);
  doc.setDrawColor(...COLORS.line);
  doc.line(MARGIN, 50, PAGE_WIDTH - MARGIN, 50);
  return CONTENT_TOP;
}

function ensureSpace(doc, y, height) {
  if (y + height <= CONTENT_BOTTOM) return y;
  doc.addPage();
  return pageHeader(doc);
}

function paragraph(doc, text, x, y, width, options = {}) {
  const fontSize = options.fontSize || 10;
  const lineHeight = fontSize * 1.45;
  doc.setFont("helvetica", options.bold ? "bold" : "normal");
  doc.setFontSize(fontSize);
  doc.setTextColor(...(options.color || COLORS.ink));
  const lines = doc.splitTextToSize(safeText(text), width);
  let index = 0;

  while (index < lines.length) {
    const availableLines = Math.max(1, Math.floor((CONTENT_BOTTOM - y) / lineHeight));
    const batch = lines.slice(index, index + availableLines);
    doc.text(batch, x, y);
    y += batch.length * lineHeight;
    index += batch.length;
    if (index < lines.length) {
      doc.addPage();
      y = pageHeader(doc);
    }
  }
  return y;
}

function sectionTitle(doc, title, y) {
  y = ensureSpace(doc, y, 34);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...COLORS.ink);
  doc.text(safeText(title), MARGIN, y);
  return y + 18;
}

function drawMetric(doc, x, y, width, label, value, color) {
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(...COLORS.line);
  doc.roundedRect(x, y, width, 66, 7, 7, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.text(safeText(label.toUpperCase()), x + 10, y + 18);
  doc.setFontSize(21);
  doc.setTextColor(...color);
  doc.text(safeText(value), x + 10, y + 46);
}

function drawLineChart(doc, title, points, color, y) {
  const height = 145;
  y = ensureSpace(doc, y, height);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.ink);
  doc.text(safeText(title), MARGIN, y + 12);

  const left = MARGIN + 34;
  const right = PAGE_WIDTH - MARGIN - 6;
  const top = y + 28;
  const bottom = y + 111;
  const width = right - left;

  [0, 25, 50, 75, 100].forEach((value) => {
    const gridY = bottom - (value / 100) * (bottom - top);
    doc.setDrawColor(...COLORS.line);
    doc.line(left, gridY, right, gridY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.muted);
    doc.text(String(value), MARGIN, gridY + 2);
  });

  const validPoints = points
    .map((point) => ({ ...point, score: score(point.score) }))
    .filter((point) => point.score !== null);
  if (validPoints.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.muted);
    doc.text("No completed results yet.", left + 8, top + 36);
    return y + height;
  }

  const xFor = (index) =>
    validPoints.length === 1 ? left + width / 2 : left + (index / (validPoints.length - 1)) * width;
  const yFor = (value) => bottom - (Math.max(0, Math.min(100, value)) / 100) * (bottom - top);
  doc.setDrawColor(...color);
  doc.setLineWidth(1.8);
  for (let index = 1; index < validPoints.length; index += 1) {
    doc.line(
      xFor(index - 1),
      yFor(validPoints[index - 1].score),
      xFor(index),
      yFor(validPoints[index].score)
    );
  }
  validPoints.forEach((point, index) => {
    doc.setFillColor(...color);
    doc.circle(xFor(index), yFor(point.score), 2.8, "F");
  });

  const labelIndexes = new Set(
    Array.from({ length: Math.min(5, validPoints.length) }, (_, index) =>
      Math.round((index * (validPoints.length - 1)) / Math.max(1, Math.min(5, validPoints.length) - 1))
    )
  );
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.muted);
  labelIndexes.forEach((index) => {
    const label = safeText(validPoints[index].date || "").slice(0, 10);
    doc.text(label, xFor(index), bottom + 13, { align: "center" });
  });
  return y + height;
}

function drawScoreBars(doc, scores, y) {
  const validScores = SCORE_DIMENSIONS
    .map(([key, label]) => ({ label, value: score(scores?.[key]) }))
    .filter((item) => item.value !== null);
  if (!validScores.length) return y;

  y = ensureSpace(doc, y, validScores.length * 30 + 16);
  const labelX = MARGIN;
  const barX = MARGIN + 155;
  const barWidth = 285;
  validScores.forEach((item, index) => {
    const rowY = y + index * 30;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.ink);
    doc.text(safeText(item.label), labelX, rowY + 12);
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(barX, rowY + 2, barWidth, 12, 4, 4, "F");
    doc.setFillColor(...(item.value >= 70 ? COLORS.green : item.value >= 50 ? COLORS.amber : COLORS.red));
    doc.roundedRect(barX, rowY + 2, (barWidth * Math.max(0, Math.min(100, item.value))) / 100, 12, 4, 4, "F");
    doc.setFont("helvetica", "bold");
    doc.text(`${item.value}/100`, barX + barWidth + 8, rowY + 12);
  });
  return y + validScores.length * 30;
}

function listItems(doc, items, y, options = {}) {
  const availableItems = Array.isArray(items) ? items.filter(Boolean) : [];
  if (!availableItems.length) {
    return paragraph(doc, options.emptyText || "None recorded.", MARGIN + 8, y, PAGE_WIDTH - MARGIN * 2 - 8, {
      fontSize: 9,
      color: COLORS.muted,
    }) + 3;
  }

  availableItems.forEach((item) => {
    y = ensureSpace(doc, y, 20);
    doc.setFillColor(...(options.color || COLORS.indigo));
    doc.circle(MARGIN + 3, y - 3, 2, "F");
    y = paragraph(doc, item, MARGIN + 12, y, PAGE_WIDTH - MARGIN * 2 - 12, { fontSize: 9 }) + 3;
  });
  return y;
}

function resumeHistory(analyses) {
  return [...analyses]
    .filter((item) => score(item?.overall_score ?? item?.result?.scores?.overall) !== null)
    .sort((a, b) => String(a.created_at || "").localeCompare(String(b.created_at || "")))
    .map((item) => ({
      date: item.created_at,
      score: item.overall_score ?? item.result?.scores?.overall,
    }));
}

function interviewHistory(interviews) {
  return [...interviews]
    .filter((item) => item?.status === "done" && score(item?.summary?.avg_score) !== null)
    .sort((a, b) => String(a.created_at || "").localeCompare(String(b.created_at || "")))
    .map((item) => ({ date: item.created_at, score: item.summary.avg_score }));
}

function improvementLabel(history) {
  if (history.length < 2) return "More results needed to show change";
  const change = score(history[history.length - 1].score) - score(history[0].score);
  return `${change > 0 ? "+" : ""}${change} points since first result`;
}

function drawResumeSection(doc, analysis, analyses) {
  doc.addPage();
  let y = pageHeader(doc);
  y = sectionTitle(doc, "Resume analysis", y);

  if (!analysis?.result || analysis.result.empty_or_joke) {
    paragraph(doc, "No resume analysis is available yet. Analyze a resume to add your detailed diagnostic to this report.", MARGIN, y, PAGE_WIDTH - MARGIN * 2);
    return;
  }

  const result = analysis.result;
  const scores = result.scores || {};
  const role = result.role?.name || analysis.target_role || "Target role";
  y = paragraph(doc, `Target role: ${role}  |  Latest analysis: ${dateLabel(analysis.created_at)}`, MARGIN, y, PAGE_WIDTH - MARGIN * 2, {
    fontSize: 9,
    color: COLORS.muted,
  }) + 12;

  y = sectionTitle(doc, `Score breakdown - ${score(scores.overall) ?? "—"}/100 overall`, y);
  y = drawScoreBars(doc, scores, y) + 10;
  const history = resumeHistory(analyses);
  y = paragraph(doc, `Progress: ${improvementLabel(history)} across ${history.length} recorded resume ${history.length === 1 ? "analysis" : "analyses"}.`, MARGIN, y, PAGE_WIDTH - MARGIN * 2, {
    fontSize: 9,
    bold: true,
  }) + 12;

  y = sectionTitle(doc, "Priority skill gaps", y);
  const missingMust = result.missing_must || [];
  const missingNice = result.missing_nice || [];
  y = listItems(doc, missingMust, y, { color: COLORS.red, emptyText: "No missing must-have skills were recorded." });
  if (missingNice.length) {
    y = paragraph(doc, "Additional skills to consider", MARGIN, y + 4, PAGE_WIDTH - MARGIN * 2, { fontSize: 10, bold: true }) + 4;
    y = listItems(doc, missingNice, y, { color: COLORS.amber });
  }

  const explanations = result.explanations || {};
  const recommendations = Object.entries(explanations).filter(([, detail]) => detail?.next);
  if (recommendations.length) {
    y = sectionTitle(doc, "Detailed improvement plan", y + 8);
    recommendations.forEach(([key, detail]) => {
      y = ensureSpace(doc, y, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.indigo);
      doc.text(safeText(key.replace(/_/g, " ")).toUpperCase(), MARGIN, y);
      y += 14;
      if (detail.what) y = paragraph(doc, detail.what, MARGIN, y, PAGE_WIDTH - MARGIN * 2, { fontSize: 9 }) + 2;
      if (detail.why) y = paragraph(doc, `Why it matters: ${detail.why}`, MARGIN, y, PAGE_WIDTH - MARGIN * 2, { fontSize: 9, color: COLORS.muted }) + 2;
      if (detail.how) y = paragraph(doc, `Evidence: ${detail.how}`, MARGIN, y, PAGE_WIDTH - MARGIN * 2, { fontSize: 9, color: COLORS.muted }) + 2;
      y = paragraph(doc, `Next step: ${detail.next}`, MARGIN, y, PAGE_WIDTH - MARGIN * 2, { fontSize: 9, bold: true }) + 10;
    });
  }

  const skills = result.skills_detected || [];
  if (skills.length) {
    y = sectionTitle(doc, "Skills detected in your resume", y + 2);
    paragraph(doc, skills.join(", "), MARGIN, y, PAGE_WIDTH - MARGIN * 2, { fontSize: 9 });
  }
}

function drawInterviewSection(doc, interviews) {
  doc.addPage();
  let y = pageHeader(doc);
  y = sectionTitle(doc, "Mock interview results", y);
  const history = interviewHistory(interviews);
  const completed = [...interviews]
    .filter((item) => item?.status === "done")
    .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));

  if (!completed.length) {
    paragraph(doc, "No completed mock interviews are available yet. Complete a practice session to add interview coaching and score trends to this report.", MARGIN, y, PAGE_WIDTH - MARGIN * 2);
    return;
  }

  const scores = history.map((item) => item.score);
  const average = scores.length ? Math.round(scores.reduce((sum, value) => sum + Number(value), 0) / scores.length) : null;
  const latest = completed[0];
  y = paragraph(doc, `${completed.length} completed ${completed.length === 1 ? "session" : "sessions"}  |  Average score: ${average ?? "—"}/100  |  Latest: ${dateLabel(latest.created_at)}`, MARGIN, y, PAGE_WIDTH - MARGIN * 2, {
    fontSize: 9,
    color: COLORS.muted,
  }) + 10;
  y = paragraph(doc, `Progress: ${improvementLabel(history)}.`, MARGIN, y, PAGE_WIDTH - MARGIN * 2, { fontSize: 9, bold: true }) + 8;
  y = drawLineChart(doc, "Interview score progression", history, COLORS.green, y) + 8;

  completed.forEach((session, sessionIndex) => {
    y = sectionTitle(
      doc,
      `Session ${sessionIndex + 1} - ${session.role_id || "Target role"} (${session.difficulty || "practice"})`,
      y + 4
    );
    const summary = session.summary || {};
    y = paragraph(
      doc,
      `Date: ${dateLabel(session.created_at)}  |  Score: ${score(summary.avg_score) ?? "—"}/100  |  Questions answered: ${summary.questions_answered ?? 0}`,
      MARGIN,
      y,
      PAGE_WIDTH - MARGIN * 2,
      { fontSize: 9, color: COLORS.muted }
    ) + 5;

    if (summary.strengths?.length) {
      y = paragraph(doc, `Strengths: ${summary.strengths.join(", ")}`, MARGIN, y, PAGE_WIDTH - MARGIN * 2, { fontSize: 9 }) + 3;
    }
    if (summary.weaknesses?.length) {
      y = paragraph(doc, `Focus areas: ${summary.weaknesses.join(", ")}`, MARGIN, y, PAGE_WIDTH - MARGIN * 2, { fontSize: 9, color: COLORS.red }) + 5;
    }

    (session.questions || []).forEach((question, index) => {
      const evaluation = session.evaluations?.[index];
      if (!evaluation) return;
      y = ensureSpace(doc, y, 44);
      y = paragraph(
        doc,
        `Q${index + 1} - ${question.topic || "Interview question"} - ${score(evaluation.score) ?? "—"}/100`,
        MARGIN,
        y,
        PAGE_WIDTH - MARGIN * 2,
        { fontSize: 9, bold: true, color: COLORS.indigo }
      );
      if (question.q) y = paragraph(doc, question.q, MARGIN + 8, y, PAGE_WIDTH - MARGIN * 2 - 8, { fontSize: 9 }) + 2;
      if (evaluation.feedback) y = paragraph(doc, `Feedback: ${evaluation.feedback}`, MARGIN + 8, y, PAGE_WIDTH - MARGIN * 2 - 8, { fontSize: 8, color: COLORS.muted }) + 2;
      if (evaluation.improvements?.length) {
        y = paragraph(
          doc,
          `Practice next: ${evaluation.improvements.join(" ")}`,
          MARGIN + 8,
          y,
          PAGE_WIDTH - MARGIN * 2 - 8,
          { fontSize: 8, bold: true }
        ) + 6;
      } else {
        y += 5;
      }
    });

    if (summary.next_difficulty) {
      y = paragraph(doc, `Recommended next difficulty: ${summary.next_difficulty}.`, MARGIN, y, PAGE_WIDTH - MARGIN * 2, {
        fontSize: 9,
        bold: true,
      }) + 8;
    }
  });
}

export function createProgressReport({ user, analyses = [], interviews = [] }) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const sortedAnalyses = [...analyses].sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
  const completedInterviews = interviews.filter((item) => item?.status === "done");
  const latestAnalysis = sortedAnalyses[0];
  const latestInterview = [...completedInterviews].sort((a, b) =>
    String(b.created_at || "").localeCompare(String(a.created_at || ""))
  )[0];
  const latestScore = latestAnalysis?.result?.scores?.overall ?? latestAnalysis?.overall_score;
  const latestInterviewScore = latestInterview?.summary?.avg_score;
  const gapMatrix = latestAnalysis?.result?.gap_matrix || [];
  const gapClosure = gapMatrix.length
    ? Math.round((100 * gapMatrix.filter((item) => item.present).length) / gapMatrix.length)
    : null;
  const readiness =
    latestScore !== undefined || latestInterviewScore !== undefined
      ? Math.round((Number(latestScore) || 0) * 0.6 + (Number(latestInterviewScore) || 0) * 0.4)
      : null;
  const today = new Date().toISOString().slice(0, 10);

  doc.setProperties({
    title: "CareerLens Progress Report",
    subject: "Resume analysis and mock interview improvement report",
    author: "CareerLens",
  });
  doc.setFillColor(...COLORS.indigo);
  doc.rect(0, 0, PAGE_WIDTH, 102, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text("CareerLens Progress Report", MARGIN, 43);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(safeText(`${user?.name || "Your career profile"}  |  Generated ${dateLabel(today)}`), MARGIN, 66);
  doc.setFontSize(8);
  doc.text("Resume diagnostics, mock interview coaching, and progress trends", MARGIN, 84);

  const metricsY = 122;
  const metricGap = 8;
  const metricWidth = (PAGE_WIDTH - MARGIN * 2 - metricGap * 3) / 4;
  [
    ["Career readiness", readiness === null ? "—" : `${readiness}/100`, COLORS.indigo],
    ["Resume score", score(latestScore) === null ? "—" : `${score(latestScore)}/100`, COLORS.indigo],
    ["Interview score", score(latestInterviewScore) === null ? "—" : `${score(latestInterviewScore)}/100`, COLORS.green],
    ["Skill coverage", gapClosure === null ? "—" : `${gapClosure}%`, COLORS.amber],
  ].forEach(([label, value, color], index) => {
    drawMetric(doc, MARGIN + index * (metricWidth + metricGap), metricsY, metricWidth, label, value, color);
  });

  let y = drawLineChart(doc, "Resume score progression", resumeHistory(analyses), COLORS.indigo, 207);
  y = drawLineChart(doc, "Mock interview score progression", interviewHistory(interviews), COLORS.green, y + 4);
  y = sectionTitle(doc, "At a glance", y + 5);
  const resumeTrend = resumeHistory(analyses);
  const interviewTrend = interviewHistory(interviews);
  y = paragraph(
    doc,
    `Resume analyses: ${analyses.length}. ${resumeTrend.length ? `Change: ${improvementLabel(resumeTrend)}.` : "Analyze your resume to begin tracking score changes."}`,
    MARGIN,
    y,
    PAGE_WIDTH - MARGIN * 2,
    { fontSize: 9 }
  ) + 4;
  paragraph(
    doc,
    `Completed interviews: ${completedInterviews.length}. ${interviewTrend.length ? `Change: ${improvementLabel(interviewTrend)}.` : "Complete a mock interview to begin tracking interview progress."}`,
    MARGIN,
    y,
    PAGE_WIDTH - MARGIN * 2,
    { fontSize: 9 }
  );

  drawResumeSection(doc, latestAnalysis, sortedAnalyses);
  drawInterviewSection(doc, interviews);

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(...COLORS.line);
    doc.line(MARGIN, PAGE_HEIGHT - 40, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 40);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    doc.text("CareerLens - Personal progress report", MARGIN, PAGE_HEIGHT - 24);
    doc.text(`${page} / ${pageCount}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 24, { align: "right" });
  }

  return doc;
}

export function downloadProgressReport(reportData) {
  const today = new Date().toISOString().slice(0, 10);
  createProgressReport(reportData).save(`careerlens_progress_report_${today}.pdf`);
}
