"""Local (server-side mirror) resume analyzer. The frontend Web Worker runs the same logic
in the browser; this server copy is used for Demo Student seeding and Mode B."""
import re
from typing import Dict, List
from data.roles import ROLES_BY_ID

SKILL_LEXICON = [
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
    "figma", "node", "webpack", "vite",
]

SECTION_PATTERNS = {
    "contact": r"(email|@|linkedin|github|phone|\+\d)",
    "education": r"(education|b\.?\s?(sc|s|tech|e)|m\.?\s?(sc|s|tech)|gpa|university|college)",
    "experience": r"(experience|intern|engineer|developer|analyst|work history|employment)",
    "skills": r"(skills|technologies|technical|stack)",
    "projects": r"(projects?|portfolio|personal work)",
    "certifications": r"(certification|certificate|coursera|freecodecamp|udemy)",
    "achievements": r"(achievement|award|hackathon|winner|published)",
}

ACHIEVEMENT_VERBS = [
    "led", "built", "designed", "architected", "shipped", "reduced", "improved", "increased",
    "drove", "delivered", "implemented", "optimized", "migrated", "launched", "scaled",
    "mentored", "owned", "developed",
]

def extract_skills(text: str) -> List[str]:
    tl = text.lower()
    found = set()
    for s in SKILL_LEXICON:
        if re.search(r"(?<![a-z0-9])" + re.escape(s) + r"(?![a-z0-9])", tl):
            found.add(s)
    return sorted(found)

def detect_sections(text: str) -> Dict[str, bool]:
    tl = text.lower()
    return {k: bool(re.search(p, tl)) for k, p in SECTION_PATTERNS.items()}

def count_achievement_lines(text: str) -> int:
    lines = [l.strip().lower() for l in text.splitlines() if l.strip()]
    hits = 0
    for l in lines:
        if any(l.startswith(("- ", "* ", "• ")) or (l.split() and l.split()[0] == v) for v in ACHIEVEMENT_VERBS):
            if any(v in l for v in ACHIEVEMENT_VERBS):
                if re.search(r"\d+%|\d+x|\$\d+|\d{2,}", l):
                    hits += 1
    return hits

def count_projects(text: str) -> int:
    m = re.search(r"projects?\s*\n(.*?)(?:\n[A-Z ]{3,}\n|$)", text, re.IGNORECASE | re.DOTALL)
    if not m:
        # Fallback heuristic: lines starting with capital project names followed by dash or colon
        lines = [l.strip() for l in text.splitlines() if l.strip()]
        return min(5, len([l for l in lines if re.match(r"^[A-Z][A-Za-z0-9\s]+(\s*[-—–:]\s*|\s*\|)", l)]))
    block = m.group(1)
    count = len([l for l in block.splitlines() if re.match(r"^\s*[A-Z][A-Za-z0-9\s]+(\s*[-—–:]\s*|\s*\|)", l)])
    return max(1, count)

def is_joke_or_empty(text: str) -> bool:
    t = text.strip()
    if len(t) < 120:
        return True
    if len(t.split()) < 25:
        return True
    return False

def score(text: str, role_id: str) -> dict:
    role = ROLES_BY_ID.get(role_id) or ROLES_BY_ID["frontend"]
    if is_joke_or_empty(text):
        return {
            "empty_or_joke": True,
            "message": "Resume too short or empty. Add sections for education, experience, skills, and 1-2 projects with measurable impact.",
        }

    sections = detect_sections(text)
    skills = extract_skills(text)
    achievements = count_achievement_lines(text)
    projects = count_projects(text)

    # ATS readiness — transparent rules
    ats_checks = []
    ats_checks.append(("Contact block detected", sections["contact"], 15))
    ats_checks.append(("Skills section detected", sections["skills"], 15))
    ats_checks.append(("Experience section detected", sections["experience"], 20))
    ats_checks.append(("Education section detected", sections["education"], 10))
    ats_checks.append(("Uses standard bullet formatting", ("- " in text or "• " in text or "* " in text), 10))
    ats_checks.append(("No overly long lines", all(len(l) < 220 for l in text.splitlines()), 10))
    ats_checks.append(("Reasonable length (150+ words)", len(text.split()) >= 150, 10))
    ats_checks.append(("Has at least 3 quantified achievements", achievements >= 3, 10))
    ats_score = sum(w for _, ok, w in ats_checks if ok)

    # Role alignment
    must = [s for s in role["must_have"] if s in [x.replace(".", "") for x in skills] or s in skills]
    nice = [s for s in role["nice_to_have"] if s in skills]
    missing_must = [s for s in role["must_have"] if s not in skills]
    missing_nice = [s for s in role["nice_to_have"] if s not in skills]
    role_score = int(60 * len(must) / max(1, len(role["must_have"])) + 40 * len(nice) / max(1, len(role["nice_to_have"])))

    skill_coverage = int(100 * len(skills) / 25) if skills else 0
    skill_coverage = min(100, skill_coverage)
    achievement_strength = min(100, achievements * 20)
    project_strength = min(100, projects * 34)
    completeness = int(100 * sum(1 for v in sections.values() if v) / len(sections))

    overall = int(0.25 * ats_score + 0.25 * role_score + 0.15 * skill_coverage + 0.15 * achievement_strength + 0.10 * project_strength + 0.10 * completeness)

    gap_matrix = []
    for s in role["must_have"]:
        present = s in skills
        gap_matrix.append({"skill": s, "level": "must", "present": present, "severity": "high" if not present else "none"})
    for s in role["nice_to_have"]:
        present = s in skills
        gap_matrix.append({"skill": s, "level": "nice", "present": present, "severity": "medium" if not present else "none"})

    scores = {
        "overall": overall,
        "ats_readiness": ats_score,
        "role_alignment": role_score,
        "skill_coverage": skill_coverage,
        "achievement_strength": achievement_strength,
        "project_strength": project_strength,
        "completeness": completeness,
    }

    explanations = {
        "ats_readiness": {
            "what": f"ATS Readiness scored {ats_score}/100 across {len(ats_checks)} transparent rules.",
            "why": "ATS engines reject or downrank resumes missing standard sections, bullets, and quantifiable claims.",
            "how": "Checklist: " + "; ".join(f"{'✓' if ok else '✗'} {name}" for name, ok, _ in ats_checks),
            "next": "Fix any ✗ items. Aim for at least 3 bullets with numbers or % impact.",
        },
        "role_alignment": {
            "what": f"Role Alignment for {role['name']}: {role_score}/100.",
            "why": "Recruiters filter by must-have keywords first; alignment predicts callback rate.",
            "how": f"Must-have hit: {len(must)}/{len(role['must_have'])}. Nice-to-have hit: {len(nice)}/{len(role['nice_to_have'])}.",
            "next": "Add missing must-have skills with concrete usage: " + (", ".join(missing_must[:5]) or "none -> great coverage!"),
        },
        "skill_coverage": {
            "what": f"Detected {len(skills)} distinct skills across your resume.",
            "why": "Breadth signals versatility; recruiters skim for domain vocabulary.",
            "how": "Sample detected: " + ", ".join(skills[:8]),
            "next": "Group skills into buckets (Languages / Frameworks / Tools) for scannability.",
        },
        "achievement_strength": {
            "what": f"Found {achievements} quantified achievement bullets.",
            "why": "Bullets with numbers get 40% more recruiter attention than duty descriptions.",
            "how": "Verb + number + outcome pattern: 'Reduced load time 34% via code-splitting.'",
            "next": "Rewrite duty-style bullets into result-style using verb + metric + outcome.",
        },
        "project_strength": {
            "what": f"Detected roughly {projects} projects.",
            "why": "Projects are the primary evidence of ability for early-career candidates.",
            "how": "State stack, your role, one metric, and a live link where possible.",
            "next": "Add a second project targeting your role with a measurable result.",
        },
        "completeness": {
            "what": f"{sum(1 for v in sections.values() if v)}/{len(sections)} standard sections detected.",
            "why": "Missing sections cause recruiter confusion and ATS parsing gaps.",
            "how": "Detected: " + ", ".join(k for k, v in sections.items() if v) + ". Missing: " + (", ".join(k for k, v in sections.items() if not v) or "None"),
            "next": "Add missing sections to lift completeness to 100.",
        },
    }

    return {
        "empty_or_joke": False,
        "scores": scores,
        "explanations": explanations,
        "skills_detected": skills,
        "sections": sections,
        "gap_matrix": gap_matrix,
        "missing_must": missing_must,
        "missing_nice": missing_nice,
        "role": role,
        "ats_checklist": [{"name": n, "pass": ok, "weight": w} for n, ok, w in ats_checks],
    }
