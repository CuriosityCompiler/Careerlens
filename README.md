# CareerLens: AI-Powered Resume, Interview & Skill Intelligence Platform

CareerLens is a privacy-first career acceleration platform built on the guiding principle:
> **"Diagnose → Explain → Recommend → Practice → Measure → Improve"**

Rather than providing black-box scores or hallucinated advice, CareerLens offers transparent ATS diagnostics, structured What/Why/How/Next recommendations, an adaptive mock interview engine, and 100% on-device Web Worker parsing by default.

---

## 🚀 Key Features

1. **Dual Privacy Architecture (Mode A vs Mode B)**:
   - **Mode A (Default, Local)**: Resume parsing, ATS scoring, and skill extraction execute entirely inside the user's browser using a Web Worker (`resumeParser.worker.js`). Raw resumes never touch an external cloud service.
   - **Mode B (Encrypted Server AI)**: An opt-in toggle allowing server-side synchronization and deep career coaching powered by Google Gemini Flash via the official Google GenAI SDK, protected by sliding-window rate limiting and response caching.
2. **Explainable 6-Dimensional Scoring**:
   - ATS Readiness Assessment
   - Target Role Alignment
   - Technical Skill Coverage
   - Quantified Achievement Strength (Google X-Y-Z formula)
   - Project Depth
   - Resume Completeness
   - Every metric breaks down into **WHAT**, **WHY**, **HOW**, and **NEXT** action steps.
3. **Adaptive Mock Interview Simulator**:
   - Text-based role-specific questions across 7 career paths (Frontend, Backend, Full Stack, Data Analyst, Python Developer, Java Developer, AI/ML).
   - STAR framework (Situation, Task, Action, Result) evaluation for behavioral answers.
   - Instant rubric breakdown: Correctness, Relevance, Completeness, Structure, and Clarity.
   - Dynamic difficulty progression (Beginner ↔ Intermediate ↔ Advanced).
4. **Three Seeded Demo Student Personas**:
   - **Vic** (`vic_frontend`): Frontend Engineer
   - **Travis** (`travis_backend`): Backend Engineer
   - **Cooper** (`cooper_data`): Data Analyst
   - Fast one-click switcher in the top navigation bar for immediate judge evaluation.
5. **Curated & Whitelisted Learning Catalog**:
   - 40 hand-vetted technical resources from authoritative domains (`react.dev`, `freecodecamp.org`, `developer.mozilla.org`, `fastapi.tiangolo.com`, `docker.com`, `kubernetes.io`, `coursera.org`, etc.).
   - Transparent recommendation scoring factoring in role relevance, gap severity, and effort.
6. **Analytics & Progress Reporting**:
   - Interactive trend lines for resume and interview scores via Recharts.
   - 5-axis Radar chart showing balance of competencies.
   - Weekly CSV report export.
7. **Privacy & Data Sovereignty Center**:
   - Argon2 password hashing and secure JWT authentication.
   - Complete JSON data export and account-to-account archive merging.
   - Email OTP password recovery using the configured SMTP server.
   - One-click account and data destruction.

---

## 🛠️ Architecture & Tech Stack

```mermaid
graph TD
    Client["React 18 + Vite (Tailwind CSS, Indigo Branding)"]
    WW["Browser Web Worker (Mode A Local Parser)"]
    API["FastAPI Backend (JWT + Argon2 Auth)"]
    DocStore["MongoDB / Resilient Embedded Document Store"]
    Gemini["Google Gemini Flash (Mode B Server AI)"]

    Client -->|On-device analysis| WW
    Client -->|Authenticated REST API| API
    API -->|Persist state & sessions| DocStore
    API -->|Opt-in critique (Rate Limited)| Gemini
```

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Zustand, Axios, Recharts, Sonner.
- **Backend**: Python 3, FastAPI, Uvicorn, Pydantic, Passlib with Argon2 (`argon2-cffi`), Motor / Local Async Store, Google GenAI SDK.

---

## ⚡ Quick Start

### 1. Launch with One Command (Windows)
Run the bundled batch script:
```bash
scripts\run_dev.bat
```

### 2. Manual Startup

#### Backend:
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```
- API Docs available at: `http://localhost:8000/docs`

Password recovery sends a six-digit, 10-minute OTP through SMTP. Configure these values in `backend/.env` to enable it; CareerLens does not use a paid OTP API:

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USERNAME=your-smtp-username
SMTP_PASSWORD=your-smtp-password
SMTP_FROM_EMAIL=careerlens@example.com
SMTP_STARTTLS=true
SMTP_USE_SSL=false
```

#### Frontend:
```bash
cd frontend
npm install
npm run dev
```
- Web Application available at: `http://localhost:5173`

---

## 🧪 Testing

Run backend automated test suite:
```bash
cd backend
python -m pytest tests/test_api.py -v
```

---

## 🏆 Demo Flow for Hackathon Judges

1. **Sign In**: Navigate to `http://localhost:5173/login` and enter an account's credentials, or create a new account.
2. **Switch Personas**: In the top header bar, click **Vic**, **Travis**, or **Cooper**.
3. **Resume Analysis**: Visit the **Resume** tab. Observe the instant Web Worker pre-check, the 6-dimensional score grid, the WWHN cards, and the interactive Skill Gap Matrix.
4. **Mock Interview**: Go to the **Mock Interview** tab, pick a role & difficulty, and answer questions. Review per-question rubric metrics and STAR structure feedback.
5. **Analytics & Reports**: Go to **Analytics** to view progression charts, the competency radar, and click **Download Progress CSV**.
6. **Privacy Center**: Open **Privacy Center** to toggle between **Mode A (Local)** and **Mode B (Server AI)**, export or merge a full JSON account archive, or test one-click data deletion.
