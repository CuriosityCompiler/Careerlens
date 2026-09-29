# Privacy & Security Model: CareerLens

## Threat Model & Guarantees

CareerLens is architected to exceed OWASP ASVS Level 2 guidelines for career data handling:

1. **Zero Silent Cloud Exfiltration**:
   - The platform never sends resumes, interview responses, or user profiles to third-party AI APIs without explicit user consent.
   - The UI displays an active `ProcessingBadge` ("Processing: Local (Mode A)" vs "Processing: Server (Mode B)").

2. **Credential Safety**:
   - Passwords are encrypted using **Argon2id** (`argon2-cffi`).
   - Access tokens have short lifespans (default: 60 minutes) backed by 7-day refresh tokens.
   - Plaintext passwords and JWTs are never written to server application logs.

3. **Data Retention & Destruction**:
   - Users can review all records stored on the server via `GET /api/privacy/export`. The archive omits password hashes.
   - `POST /api/privacy/import` merges a validated CareerLens archive into the signed-in account, preserves existing records and credentials, remaps conflicting record IDs, and skips records already imported.
   - A single click on `DELETE /api/users/me` permanently purges all records from `users`, `resumes`, `analyses`, `interviews`, `recommendations`, `events`, and `notifications`.

4. **Password Recovery**:
   - The unauthenticated password reset flow sends a random six-digit OTP by SMTP, stores only its HMAC digest, expires it after 10 minutes, and limits verification attempts.
   - SMTP must be configured with `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, and `SMTP_FROM_EMAIL`; TLS behavior is controlled by `SMTP_STARTTLS` and `SMTP_USE_SSL`.

5. **Curated Whitelist Enforcement**:
   - All learning recommendations are filtered against a strict domain whitelist (`react.dev`, `freecodecamp.org`, `developer.mozilla.org`, `fastapi.tiangolo.com`, `docker.com`, etc.).
   - Untrusted or AI-hallucinated URLs are completely prohibited.
