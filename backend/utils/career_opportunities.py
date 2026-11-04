"""Experience-aware job recommendations grounded in a user's saved CareerLens data."""
import re
from typing import Any, Dict, List, Optional

from data.career_market import (
    CAREER_MARKET,
    CAREER_PATHS,
    EXPERIENCE_REQUIREMENTS,
    ROLE_CLUSTERS,
    ROLE_TITLES,
    SOFT_SKILL_EVIDENCE,
)
from data.roles import ROLES

VALID_EXPERIENCE_LEVELS = ("fresher", "entry_level", "junior", "mid_level", "senior")


def _normalize_skill(skill: str) -> str:
    normalized = re.sub(r"\s+", " ", skill.lower().strip().replace(".", ""))
    aliases = {
        "postgresql": "postgres",
        "rest api": "rest",
        "machine-learning": "machine learning",
        "scikit learn": "scikit-learn",
        "next js": "nextjs",
    }
    return aliases.get(normalized, normalized)


def _level_for_years(years: float) -> str:
    if years >= 6:
        return "senior"
    if years >= 3:
        return "mid_level"
    if years >= 1:
        return "junior"
    if years > 0:
        return "entry_level"
    return "fresher"


def _experience_level(user: Dict[str, Any]) -> str:
    years = user.get("experience_years")
    if years is not None:
        return _level_for_years(float(years))
    level = user.get("experience_level", "fresher")
    return level if level in VALID_EXPERIENCE_LEVELS else "fresher"


def build_career_opportunities(
    user: Dict[str, Any],
    latest_analysis: Optional[Dict[str, Any]],
    interviews: List[Dict[str, Any]],
    resume_count: int,
) -> Dict[str, Any]:
    analysis_result = (latest_analysis or {}).get("result")
    result = analysis_result if isinstance(analysis_result, dict) else {}
    raw_profile_skills = user.get("skills", [])
    raw_resume_skills = result.get("skills_detected", [])
    profile_skills = {
        _normalize_skill(skill)
        for skill in (raw_profile_skills if isinstance(raw_profile_skills, list) else [])
        if isinstance(skill, str) and skill.strip()
    }
    resume_skills = {
        _normalize_skill(skill)
        for skill in (raw_resume_skills if isinstance(raw_resume_skills, list) else [])
        if isinstance(skill, str) and skill.strip()
    }
    skills = profile_skills | resume_skills
    soft_skill_evidence = [
        {
            "name": label,
            "listed": any(_normalize_skill(alias) in profile_skills for alias in aliases),
        }
        for label, aliases in SOFT_SKILL_EVIDENCE.items()
    ]
    target_role = user.get("target_role")
    experience_level = _experience_level(user)
    experience_years = user.get("experience_years")

    completed_interviews = [
        item for item in interviews
        if item.get("status") == "done" and isinstance(item.get("summary"), dict)
    ]
    latest_interview_score = (
        completed_interviews[0].get("summary", {}).get("avg_score")
        if completed_interviews else None
    )
    raw_gap_matrix = result.get("gap_matrix", [])
    gap_matrix = raw_gap_matrix if isinstance(raw_gap_matrix, list) else []
    matched_requirements = sum(
        1 for gap in gap_matrix
        if isinstance(gap, dict) and (
            gap.get("present")
            or (
                isinstance(gap.get("skill"), str)
                and _normalize_skill(gap["skill"]) in skills
            )
        )
    )

    role_recommendations = []
    for role in ROLES:
        core_skills = {_normalize_skill(skill) for skill in role["must_have"]}
        nice_skills = {_normalize_skill(skill) for skill in role["nice_to_have"]}
        matched_core = sorted(core_skills & skills)
        missing_core = [skill for skill in role["must_have"] if _normalize_skill(skill) not in skills]
        matched_nice = len(nice_skills & skills)

        match_score = round(
            100 * (0.8 * len(matched_core) / max(len(core_skills), 1) + 0.2 * matched_nice / max(len(nice_skills), 1))
        )
        market = CAREER_MARKET[role["id"]]
        salary_band = "early" if experience_level in ("fresher", "entry_level") else "mid" if experience_level in ("junior", "mid_level") else "senior"
        titles = ROLE_TITLES[role["id"]][experience_level]
        apply_threshold = 40 if experience_level in ("fresher", "entry_level") else 55
        recommendation = {
            "role_id": role["id"],
            "role_family": role["name"],
            "is_interest_role": role["id"] == target_role,
            "titles": list(titles),
            "experience_level": experience_level,
            "current_experience_years": experience_years,
            "required_experience": EXPERIENCE_REQUIREMENTS[experience_level],
            "experience_match": f"Aligned with your {experience_level.replace('_', ' ')} experience band",
            "matched_core_skills": matched_core,
            "matched_core_count": len(matched_core),
            "required_core_count": len(core_skills),
            "skill_match": f"{len(matched_core)} of {len(core_skills)} core skills",
            "skill_gaps": missing_core[:5],
            "soft_skill_evidence": soft_skill_evidence,
            "readiness": (
                "Explore branch" if not matched_core
                else "Apply now" if match_score >= apply_threshold
                else "Build next"
            ),
            "match_score": match_score,
            "demand": market["demand"],
            "availability": market["availability"],
            "salary_lpa": market["salary_lpa"][salary_band],
            "salary_level": salary_band,
            "career_progression": list(CAREER_PATHS[experience_level]),
            "future_outlook": (
                f"{market['demand']} demand direction with {market['availability'].lower()} availability in India. "
                "Competition, location, and employer requirements vary."
            ),
        }
        role_recommendations.append(recommendation)

    role_recommendations.sort(
        key=lambda item: (
            not item["is_interest_role"],
            item["readiness"] != "Apply now",
            -item["match_score"],
        )
    )
    selected_role = next(
        (item for item in role_recommendations if item["is_interest_role"]),
        None,
    )
    related_roles = [
        item for item in role_recommendations
        if (
            not item["is_interest_role"]
            and item["matched_core_count"] > 0
            and (
                target_role not in ROLE_CLUSTERS
                or ROLE_CLUSTERS.get(item["role_id"]) == ROLE_CLUSTERS[target_role]
            )
        )
    ]
    recommendations = ([selected_role] if selected_role else []) + related_roles[:4]

    return {
        "market": "India",
        "market_data_note": "Directional India estimates, not live vacancy counts. Salary ranges are indicative annual CTC in INR lakh (LPA); city, company, domain, and demonstrated experience affect offers.",
        "experience_level": experience_level,
        "experience_years": experience_years,
        "interest_role": target_role,
        "interest_role_name": next((role["name"] for role in ROLES if role["id"] == target_role), None),
        "skills": sorted(skills),
        "learning_progress": {
            "resume_analyses": resume_count,
            "completed_interviews": len(completed_interviews),
            "latest_interview_score": latest_interview_score,
            "matched_requirements": matched_requirements,
            "total_requirements": len(gap_matrix),
            "course_completions_tracked": False,
        },
        "recommendations": recommendations or role_recommendations[:5],
    }
