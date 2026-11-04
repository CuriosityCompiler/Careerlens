"""Directional India market estimates for CareerLens role families."""

CAREER_MARKET = {
    "frontend": {"demand": "Stable", "availability": "Moderate", "salary_lpa": {"early": "3.5-8", "mid": "8-20", "senior": "20-40"}},
    "backend": {"demand": "Growing", "availability": "High", "salary_lpa": {"early": "4-10", "mid": "10-24", "senior": "24-45"}},
    "fullstack": {"demand": "Growing", "availability": "High", "salary_lpa": {"early": "4-10", "mid": "10-25", "senior": "25-45"}},
    "data_analyst": {"demand": "Growing", "availability": "High", "salary_lpa": {"early": "3.5-8", "mid": "8-18", "senior": "18-35"}},
    "python_developer": {"demand": "Growing", "availability": "High", "salary_lpa": {"early": "4-9", "mid": "9-22", "senior": "22-40"}},
    "java_developer": {"demand": "Stable", "availability": "High", "salary_lpa": {"early": "4-10", "mid": "10-24", "senior": "24-45"}},
    "aiml": {"demand": "Growing", "availability": "Selective", "salary_lpa": {"early": "5-12", "mid": "12-30", "senior": "30-60"}},
    "embedded_systems_engineer": {"demand": "Growing", "availability": "Moderate", "salary_lpa": {"early": "3-8", "mid": "8-18", "senior": "18-32"}},
    "electronics_engineer": {"demand": "Stable", "availability": "Moderate", "salary_lpa": {"early": "3-7", "mid": "7-15", "senior": "15-30"}},
    "electrical_engineer": {"demand": "Stable", "availability": "Moderate", "salary_lpa": {"early": "3.5-8", "mid": "8-18", "senior": "18-32"}},
    "iot_developer": {"demand": "Growing", "availability": "Moderate", "salary_lpa": {"early": "4-9", "mid": "9-20", "senior": "20-38"}},
    "vlsi_engineer": {"demand": "Growing", "availability": "Selective", "salary_lpa": {"early": "4-10", "mid": "10-25", "senior": "25-50"}},
    "instrumentation_engineer": {"demand": "Stable", "availability": "Moderate", "salary_lpa": {"early": "3-7", "mid": "7-16", "senior": "16-30"}},
    "robotics_engineer": {"demand": "Growing", "availability": "Selective", "salary_lpa": {"early": "4-9", "mid": "9-22", "senior": "22-40"}},
    "telecom_engineer": {"demand": "Stable", "availability": "Moderate", "salary_lpa": {"early": "3.5-8", "mid": "8-20", "senior": "20-35"}},
}

ROLE_TITLES = {
    "frontend": {"fresher": ("Frontend Developer Intern", "Junior Frontend Developer"), "entry_level": ("Entry-Level Frontend Developer", "Associate Frontend Engineer"), "junior": ("Junior Frontend Engineer", "Frontend Developer"), "mid_level": ("Frontend Engineer", "Mid-Level Frontend Engineer"), "senior": ("Senior Frontend Engineer", "Frontend Tech Lead")},
    "backend": {"fresher": ("Backend Developer Intern", "Junior Backend Developer"), "entry_level": ("Entry-Level Backend Developer", "Associate Backend Engineer"), "junior": ("Junior Backend Engineer", "Backend Developer"), "mid_level": ("Backend Engineer", "Mid-Level Backend Engineer"), "senior": ("Senior Backend Engineer", "Backend Tech Lead")},
    "fullstack": {"fresher": ("Full Stack Developer Intern", "Junior Full Stack Developer"), "entry_level": ("Entry-Level Full Stack Developer", "Associate Full Stack Engineer"), "junior": ("Junior Full Stack Engineer", "Full Stack Developer"), "mid_level": ("Full Stack Engineer", "Mid-Level Full Stack Engineer"), "senior": ("Senior Full Stack Engineer", "Full Stack Tech Lead")},
    "data_analyst": {"fresher": ("Data Analyst Intern", "Junior Data Analyst"), "entry_level": ("Entry-Level Data Analyst", "Associate Data Analyst"), "junior": ("Junior Data Analyst", "Data Analyst"), "mid_level": ("Data Analyst", "Mid-Level Data Analyst"), "senior": ("Senior Data Analyst", "Analytics Lead")},
    "python_developer": {"fresher": ("Python Developer Intern", "Junior Python Developer"), "entry_level": ("Entry-Level Python Developer", "Associate Python Developer"), "junior": ("Junior Python Developer", "Python Developer"), "mid_level": ("Python Developer", "Mid-Level Python Developer"), "senior": ("Senior Python Developer", "Python Tech Lead")},
    "java_developer": {"fresher": ("Java Developer Intern", "Junior Java Developer"), "entry_level": ("Entry-Level Java Developer", "Associate Java Developer"), "junior": ("Junior Java Developer", "Java Developer"), "mid_level": ("Java Developer", "Mid-Level Java Developer"), "senior": ("Senior Java Developer", "Java Tech Lead")},
    "aiml": {"fresher": ("AI Intern", "Machine Learning Intern"), "entry_level": ("Entry-Level AI Developer", "Junior Machine Learning Engineer"), "junior": ("Junior AI Engineer", "Junior Machine Learning Engineer"), "mid_level": ("AI / ML Engineer", "Machine Learning Engineer"), "senior": ("Senior AI Engineer", "Senior Machine Learning Engineer")},
    "embedded_systems_engineer": {"fresher": ("Embedded Systems Intern", "Junior Embedded Developer"), "entry_level": ("Entry-Level Embedded Developer", "Associate Embedded Engineer"), "junior": ("Junior Embedded Engineer", "Embedded Developer"), "mid_level": ("Embedded Systems Engineer", "Mid-Level Embedded Engineer"), "senior": ("Senior Embedded Engineer", "Embedded Systems Lead")},
    "electronics_engineer": {"fresher": ("Electronics Engineering Intern", "Junior Electronics Engineer"), "entry_level": ("Entry-Level Electronics Engineer", "Graduate Electronics Engineer"), "junior": ("Junior Electronics Engineer", "Electronics Engineer"), "mid_level": ("Electronics Engineer", "Mid-Level Electronics Engineer"), "senior": ("Senior Electronics Engineer", "Electronics Engineering Lead")},
    "electrical_engineer": {"fresher": ("Electrical Engineering Intern", "Graduate Electrical Engineer"), "entry_level": ("Entry-Level Electrical Engineer", "Associate Electrical Engineer"), "junior": ("Junior Electrical Engineer", "Electrical Engineer"), "mid_level": ("Electrical Engineer", "Mid-Level Electrical Engineer"), "senior": ("Senior Electrical Engineer", "Electrical Engineering Lead")},
    "iot_developer": {"fresher": ("IoT Developer Intern", "Junior IoT Developer"), "entry_level": ("Entry-Level IoT Developer", "Associate IoT Engineer"), "junior": ("Junior IoT Engineer", "IoT Developer"), "mid_level": ("IoT Developer", "Mid-Level IoT Engineer"), "senior": ("Senior IoT Engineer", "IoT Solutions Lead")},
    "vlsi_engineer": {"fresher": ("VLSI Design Intern", "Junior RTL Engineer"), "entry_level": ("Entry-Level VLSI Engineer", "Graduate RTL Engineer"), "junior": ("Junior VLSI Engineer", "RTL Design Engineer"), "mid_level": ("VLSI Design Engineer", "Mid-Level RTL Engineer"), "senior": ("Senior VLSI Engineer", "VLSI Design Lead")},
    "instrumentation_engineer": {"fresher": ("Instrumentation Intern", "Graduate Instrumentation Engineer"), "entry_level": ("Entry-Level Instrumentation Engineer", "Associate Instrumentation Engineer"), "junior": ("Junior Instrumentation Engineer", "Instrumentation Engineer"), "mid_level": ("Instrumentation Engineer", "Mid-Level Instrumentation Engineer"), "senior": ("Senior Instrumentation Engineer", "Instrumentation Lead")},
    "robotics_engineer": {"fresher": ("Robotics Intern", "Junior Robotics Developer"), "entry_level": ("Entry-Level Robotics Engineer", "Graduate Robotics Engineer"), "junior": ("Junior Robotics Engineer", "Robotics Developer"), "mid_level": ("Robotics Engineer", "Mid-Level Robotics Engineer"), "senior": ("Senior Robotics Engineer", "Robotics Lead")},
    "telecom_engineer": {"fresher": ("Telecom Engineering Intern", "Graduate Telecom Engineer"), "entry_level": ("Entry-Level Telecom Engineer", "Associate Telecom Engineer"), "junior": ("Junior Telecom Engineer", "Telecom Engineer"), "mid_level": ("Telecom Engineer", "Mid-Level Telecom Engineer"), "senior": ("Senior Telecom Engineer", "Telecom Engineering Lead")},
}

EXPERIENCE_REQUIREMENTS = {
    "fresher": "Internships or projects; no full-time experience required",
    "entry_level": "0-1 years; internships or relevant projects accepted",
    "junior": "1-3 years of relevant experience",
    "mid_level": "3-6 years of relevant experience",
    "senior": "6+ years with ownership and mentoring experience",
}

CAREER_PATHS = {
    "fresher": ("Intern / Trainee", "Junior Engineer", "Engineer", "Senior Engineer"),
    "entry_level": ("Associate Engineer", "Junior Engineer", "Engineer", "Senior Engineer"),
    "junior": ("Junior Engineer", "Engineer", "Senior Engineer", "Lead / Specialist"),
    "mid_level": ("Engineer", "Senior Engineer", "Lead / Specialist", "Engineering Manager / Architect"),
    "senior": ("Senior Engineer", "Lead / Principal", "Engineering Manager / Architect", "Director"),
}

ROLE_CLUSTERS = {
    "frontend": "software",
    "backend": "software",
    "fullstack": "software",
    "data_analyst": "software",
    "python_developer": "software",
    "java_developer": "software",
    "aiml": "software",
    "embedded_systems_engineer": "electronics",
    "electronics_engineer": "electronics",
    "electrical_engineer": "electronics",
    "iot_developer": "electronics",
    "vlsi_engineer": "electronics",
    "instrumentation_engineer": "electronics",
    "robotics_engineer": "electronics",
    "telecom_engineer": "electronics",
}

SOFT_SKILL_EVIDENCE = {
    "Communication": ("communication", "communication skills", "written communication", "verbal communication", "presentation", "public speaking"),
    "Structured problem-solving": ("problem solving", "problem-solving", "analytical thinking", "critical thinking"),
    "Collaboration": ("collaboration", "teamwork", "team work", "cross-functional"),
}
