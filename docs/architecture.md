# Architecture Documentation: CareerLens

## System Overview

CareerLens is architected to eliminate the black-box nature of current AI career tools while maintaining strict user data sovereignty through a dual-mode privacy model.

```mermaid
flowchart TB
    subgraph ClientBrowser ["Client Browser Environment"]
        UI["React SPA (Vite + Tailwind CSS)"]
        WW["Web Worker (resumeParser.worker.js)"]
        Zustand["Zustand Auth Store (localStorage / memory)"]
        UI <-->|PostMessage (Zero Network)| WW
        UI <--> Zustand
    end

    subgraph BackendGateway ["FastAPI Gateway (Port 8000)"]
        Router["APIRouter (/api)"]
        AuthMid["JWT + Argon2 Auth Verification"]
        RateLimiter["Mode B Sliding-Window Rate Limiter"]
        AnalyzerSvc["Deterministic Resume Analyzer Mirror"]
        InterviewSvc["Adaptive Interview Engine"]
        RecSvc["Transparent Recommendation Scorer"]
        Router --> AuthMid
        Router --> RateLimiter
        Router --> AnalyzerSvc
        Router --> InterviewSvc
        Router --> RecSvc
    end

    subgraph StorageLayer ["Persistence Layer"]
        DB[("MongoDB / Resilient Local Async Store")]
        BackendGateway <--> DB
    end

    subgraph CloudAI ["Opt-in Server AI (Mode B)"]
        GeminiFlash["Google Gemini Flash (via google-genai SDK)"]
        RateLimiter --> GeminiFlash
    end

    UI -->|HTTPS / REST API| Router
```

## Key Architectural Decisions

1. **Client-Side Web Worker (Mode A)**:
   - Resumes contain PII (names, phone numbers, addresses, employment history).
   - In Mode A, regex tokenization, section segmentation, achievement parsing, and ATS rule checks execute inside an isolated Web Worker.
   - Result: 0 bytes of raw resume text leave the browser when Mode A is active.

2. **Argon2 Password Hashing**:
   - Modern replacement for legacy bcrypt with superior resistance against GPU/ASIC brute-force cracking.
   - Implemented via `argon2-cffi` with stateless JWT token pairs and refresh rotation.

3. **Transparent Rules & WWHN Scoring**:
   - Scores are computed through explicit deterministic rules:
     - ATS Readiness (100-pt checklist)
     - Role Alignment (Must-have 60% + Nice-to-have 40%)
     - Skill Coverage (normalized against 25 skill baseline)
     - Quantified Impact (Google X-Y-Z formula counter)
     - Project Depth
     - Completeness
   - Every metric translates into:
     - **WHAT**: Concrete finding
     - **WHY**: Recruiting consequence
     - **HOW**: Phrasing guideline
     - **NEXT**: Prescribed learning or practice item

4. **Mode B Rate-Limiting & Quota Conservation**:
   - Protects free-tier Gemini API keys from quota burnout.
   - Sliding-window limiter allows a configured maximum (default: 5 requests / 5 minutes per user).
   - SHA-256 hash caching ensures identical resume text and role combinations never hit external LLM APIs repeatedly.
