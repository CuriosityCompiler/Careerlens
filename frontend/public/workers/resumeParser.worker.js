/* eslint-disable no-restricted-globals */
// CareerLens Local Resume Parser Web Worker (Mode A)
const SKILL_LEXICON = [
  "javascript", "typescript", "react", "nextjs", "next.js", "html", "css", "tailwind", "redux",
  "python", "django", "flask", "fastapi", "asyncio", "celery", "pandas", "numpy", "pytorch",
  "tensorflow", "scikit-learn", "machine learning", "llm", "transformers",
  "java", "spring", "kotlin", "go", "rust", "c++", "c#", ".net",
  "sql", "postgres", "postgresql", "mysql", "sqlite", "mongodb", "redis", "cassandra",
  "docker", "kubernetes", "aws", "gcp", "azure", "terraform", "ansible",
  "kafka", "rabbitmq", "airflow", "spark", "pyspark", "dbt", "snowflake",
  "graphql", "rest", "grpc", "websocket",
  "git", "linux", "bash", "ci/cd", "jenkins", "github actions",
  "testing", "jest", "pytest", "cypress", "playwright",
  "excel", "tableau", "powerbi", "looker", "statistics",
  "system design", "microservices", "distributed systems", "performance", "accessibility",
  "figma", "node", "webpack", "vite"
];

const SECTION_PATTERNS = {
  contact: /(email|@|linkedin|github|phone|\+\d)/i,
  education: /(education|b\.?\s?(sc|s|tech|e)|m\.?\s?(sc|s|tech)|gpa|university|college)/i,
  experience: /(experience|intern|engineer|developer|analyst|work history|employment)/i,
  skills: /(skills|technologies|technical|stack)/i,
  projects: /(projects?|portfolio|personal work)/i,
  certifications: /(certification|certificate|coursera|freecodecamp|udemy)/i,
  achievements: /(achievement|award|hackathon|winner|published)/i
};

function extractSkills(text) {
  const t = text.toLowerCase();
  const found = new Set();
  for (const s of SKILL_LEXICON) {
    const re = new RegExp("(?:^|[^a-z0-9])" + s.replace(/[.+*?^${}()|[\]\\]/g, "\\$&") + "(?:[^a-z0-9]|$)");
    if (re.test(t)) found.add(s);
  }
  return Array.from(found).sort();
}

function detectSections(text) {
  const out = {};
  for (const [k, re] of Object.entries(SECTION_PATTERNS)) {
    out[k] = re.test(text);
  }
  return out;
}

function scoreLocal(text) {
  const trimmed = (text || "").trim();
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
  if (trimmed.length < 120 || wordCount < 25) {
    return {
      empty_or_joke: true,
      message: "Resume too short. Add education, experience, skills, and 1-2 projects with measurable impact."
    };
  }

  const sections = detectSections(text);
  const skills = extractSkills(text);
  const bulletFmt = /(^|\n)\s*[-*•]\s+/.test(text);
  const longLines = text.split("\n").every(l => l.length < 220);
  const achievementRe = /(reduced|improved|increased|drove|delivered|shipped|scaled|built|led|architected|migrated|launched|mentored|owned|developed)/gi;
  const achievements = (text.match(achievementRe) || []).length;

  const atsChecks = [
    ["Contact block detected", sections.contact, 15],
    ["Skills section detected", sections.skills, 15],
    ["Experience section detected", sections.experience, 20],
    ["Education section detected", sections.education, 10],
    ["Uses standard bullet formatting", bulletFmt, 10],
    ["No overly long lines", longLines, 10],
    ["Reasonable length (150+ words)", wordCount >= 150, 10],
    ["Has at least 3 quantified achievements", achievements >= 3, 10]
  ];

  const atsScore = atsChecks.filter(c => c[1]).reduce((a, c) => a + c[2], 0);
  const skillCoverage = Math.min(100, Math.round(100 * skills.length / 25));
  const achievementStrength = Math.min(100, achievements * 20);
  const completeness = Math.round(100 * Object.values(sections).filter(Boolean).length / Object.keys(sections).length);

  return {
    empty_or_joke: false,
    skills_detected: skills,
    sections,
    achievements,
    ats_checklist: atsChecks.map(([name, pass, weight]) => ({ name, pass, weight })),
    local_scores: {
      ats_readiness: atsScore,
      skill_coverage: skillCoverage,
      achievement_strength: achievementStrength,
      completeness
    }
  };
}

self.onmessage = (e) => {
  const { type, text } = e.data || {};
  if (type === "parse") {
    try {
      const result = scoreLocal(text || "");
      self.postMessage({ type: "result", result });
    } catch (err) {
      self.postMessage({ type: "error", error: String(err) });
    }
  }
};
