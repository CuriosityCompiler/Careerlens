"""Three demo student personas with synthetic resume text (Vic, Travis, Cooper)."""

PERSONAS = {
    "vic_frontend": {
        "id": "vic_frontend",
        "name": "Vic Chen",
        "role_target": "frontend",
        "education": "B.S. Computer Science, State University, 2024",
        "resume_text": """Vic Chen
vic.chen@example.com | github.com/vicchen | linkedin.com/in/vicchen

EDUCATION
State University -> B.S. Computer Science (GPA 3.7), 2024

SKILLS
JavaScript, TypeScript, React, HTML, CSS, Tailwind, Git, Redux, Jest, REST APIs, Figma

EXPERIENCE
Frontend Intern - Acme Web Labs (2023)
- Built responsive dashboard components in React and TypeScript used by 12k monthly users.
- Reduced page load time by 34% by code-splitting and image optimization.
- Wrote 60+ unit tests using Jest and Testing Library.

Teaching Assistant - State University (2022-2023)
- Mentored 40 students in intro web development, HTML/CSS/JS.

PROJECTS
Portfolio Site - Personal Next.js + Tailwind portfolio with dark mode, deployed on Vercel.
Task Tracker - React + Redux app with drag-drop, offline persistence (IndexedDB).

CERTIFICATIONS
freeCodeCamp Responsive Web Design (2022)
""",
    },
    "travis_backend": {
        "id": "travis_backend",
        "name": "Travis Patel",
        "role_target": "backend",
        "education": "B.Tech Information Technology, NIT, 2024",
        "resume_text": """Travis Patel
travis.patel@example.com | github.com/travispatel

EDUCATION
National Institute of Technology -> B.Tech Information Technology, 2024

SKILLS
Python, Go, SQL, PostgreSQL, REST, Git, Linux, Docker, FastAPI, Redis

EXPERIENCE
Backend Developer Intern - CloudScale Inc. (2023-2024)
- Designed REST APIs in FastAPI serving 200 QPS with p95 latency under 120ms.
- Migrated legacy MySQL schema to PostgreSQL, cut query latency 45%.
- Wrote unit and integration tests using pytest, coverage above 85%.

Open Source Contributor - httpx (2023)
- Contributed 3 merged PRs improving retry logic and docs.

PROJECTS
URL Shortener - Go + Redis, handles 5k RPM behind Nginx.
Order Service - Python microservice with async workers and PostgreSQL.

CERTIFICATIONS
MongoDB M001 (2023)
""",
    },
    "cooper_data": {
        "id": "cooper_data",
        "name": "Cooper Vance",
        "role_target": "data_analyst",
        "education": "B.S. Statistics, City University, 2024",
        "resume_text": """Cooper Vance
cooper.vance@example.com | github.com/cooperv

EDUCATION
City University -> B.S. Statistics, 2024

SKILLS
Python, SQL, Excel, Pandas, Tableau, Statistics, Git, Jupyter

EXPERIENCE
Data Analyst Intern - RetailIQ (2023)
- Delivered weekly KPI dashboards in Tableau used by leadership team.
- Ran A/B test analysis for pricing experiment, drove 3% conversion lift.
- Built SQL models on Snowflake for cohort retention insights.

Research Assistant - City University (2022-2023)
- Cleaned and analyzed survey data with pandas, produced summary reports.

PROJECTS
COVID Trends Notebook - Jupyter analysis of public health data, deployed on GitHub.
Sales Forecast - Time series model with statsmodels, forecast MAPE 6.2%.

CERTIFICATIONS
Google Data Analytics (2023)
""",
    },
}
