import pytest
import json
from fastapi.testclient import TestClient
import sys
import os
import uuid

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import server
from server import app
from utils.auth import hash_password, verify_password, create_token, decode_token
from utils.analyzer import score as analyze_score
from utils.interview import ELECTRONICS_CIRCUIT_RUBRICS, pick_questions, evaluate_answer, evaluate_circuit_challenge, next_difficulty
from utils.rate_limit import check_mode_b_rate_limit
from utils.db import STORE_FILE
from data.personas import PERSONAS
from fastapi import HTTPException

client = TestClient(app)

def test_argon2_hashing():
    pwd = "SecureStudentPass2025!"
    hashed = hash_password(pwd)
    assert hashed != pwd
    assert "$argon2" in hashed or "$2b$" in hashed
    assert verify_password(pwd, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False

def test_jwt_token_creation_and_decoding():
    uid = "test-student-123"
    access_tok = create_token(uid, "access")
    refresh_tok = create_token(uid, "refresh")

    decoded_acc = decode_token(access_tok)
    decoded_ref = decode_token(refresh_tok)

    assert decoded_acc["sub"] == uid
    assert decoded_acc["typ"] == "access"
    assert decoded_ref["sub"] == uid
    assert decoded_ref["typ"] == "refresh"

def test_persona_resumes_analysis():
    # Test Vic (Frontend)
    vic = PERSONAS["vic_frontend"]
    vic_result = analyze_score(vic["resume_text"], "frontend")
    assert vic_result["empty_or_joke"] is False
    assert vic_result["scores"]["overall"] >= 60
    assert "react" in vic_result["skills_detected"]
    assert "ats_readiness" in vic_result["explanations"]

    # Test Travis (Backend)
    travis = PERSONAS["travis_backend"]
    travis_result = analyze_score(travis["resume_text"], "backend")
    assert travis_result["empty_or_joke"] is False
    assert travis_result["scores"]["overall"] >= 60
    assert "python" in travis_result["skills_detected"]
    assert "fastapi" in travis_result["skills_detected"]

    # Test Cooper (Data Analyst)
    cooper = PERSONAS["cooper_data"]
    cooper_result = analyze_score(cooper["resume_text"], "data_analyst")
    assert cooper_result["empty_or_joke"] is False
    assert cooper_result["scores"]["overall"] >= 60
    assert "sql" in cooper_result["skills_detected"]

def test_empty_or_joke_resume_handling():
    short_text = "I like coding. Hire me."
    result = analyze_score(short_text, "frontend")
    assert result["empty_or_joke"] is True
    assert "too short" in result["message"].lower()

def test_interview_engine():
    qs = pick_questions("backend", "beginner", count=3)
    assert len(qs) == 3

    # Technical answer test
    eval_res = evaluate_answer(
        qs[0],
        "SQL databases are relational and structured with tables and foreign keys, while NoSQL is flexible and document-oriented."
    )
    assert eval_res["score"] > 0
    assert "correctness" in eval_res

    # Behavioral answer test with STAR
    star_q = {"q": "Tell me about a production issue", "topic": "behavioral", "type": "behavioral"}
    star_eval = evaluate_answer(
        star_q,
        "The situation was a database latency spike. My task was to reduce p99 query latency. My action was adding a B-tree index on user_id. The result was query latency decreased by 60%."
    )
    assert star_eval["score"] >= 60

    # Difficulty progression
    assert next_difficulty("beginner", 85) == "intermediate"
    assert next_difficulty("intermediate", 80) == "advanced"
    assert next_difficulty("advanced", 30) == "intermediate"

def test_electronics_engineer_questions_match_the_department():
    questions = pick_questions("electronics_engineer", "beginner", count=3)

    assert len(questions) == 3
    assert all(question["topic"] != "javascript" for question in questions)
    assert any("diode" in question["q"].lower() for question in questions)

def test_non_substantive_answers_are_rejected():
    technical_q = {"q": "What is the difference between let and const?", "topic": "javascript", "type": "technical"}
    coding_q = {
        "q": "DSA Coding: Implement a function to reverse a string.",
        "topic": "dsa",
        "type": "coding",
    }

    technical_eval = evaluate_answer(technical_q, "I don't know")
    coding_eval = evaluate_answer(coding_q, "I don't know")

    assert technical_eval["score"] < 20
    assert coding_eval["score"] < 20
    assert "know" in technical_eval["feedback"].lower() or "substantive" in technical_eval["feedback"].lower() or "not enough" in technical_eval["feedback"].lower()
    assert "know" in coding_eval["feedback"].lower() or "substantive" in coding_eval["feedback"].lower() or "not enough" in coding_eval["feedback"].lower()


def test_rate_limiting_mode_b():
    uid = "rate-limit-test-user"
    # Should allow 5 requests
    for _ in range(5):
        check_mode_b_rate_limit(uid, max_requests=5, window_seconds=60)
    
    # 6th request should raise HTTP 429
    with pytest.raises(HTTPException) as exc:
        check_mode_b_rate_limit(uid, max_requests=5, window_seconds=60)
    assert exc.value.status_code == 429


def test_login_rate_limit_and_missing_hash_fails_cleanly():
    assert verify_password("anypass", None) is False
    assert verify_password("anypass", "") is False

    email = f"ratelimit_{uuid.uuid4().hex[:8]}@example.com"
    for idx in range(6):
        resp = client.post("/api/auth/login", json={"email": email, "password": "wrong-pass"})
        if idx < 5:
            assert resp.status_code in (401, 429)
        else:
            assert resp.status_code == 429
            assert "rate limit" in resp.json()["detail"].lower()

def test_dsa_python_hello_world_scores_low_and_language_remains_the_same():
    q = {"q": "DSA Coding: Implement a palindrome check.", "topic": "dsa", "type": "coding"}
    result = evaluate_answer(q, "print(\"hello world\")", language="python")
    assert result["score"] < 40
    assert result["relevance"] < 40
    assert result["structure"] < 40


def test_irrelevant_dsa_code_gets_zeroed_metrics():
    q = {"q": "DSA Coding: Implement a palindrome check.", "topic": "dsa", "type": "coding"}
    result = evaluate_answer(q, "print(\"hello world\"); const x = 42; let y = 'done';", language="python")
    assert result["score"] == 0
    assert result["relevance"] == 0
    assert result["correctness"] == 0
    assert result["completeness"] == 0
    assert result["structure"] == 0
    assert result["clarity"] == 0


def test_exact_dsa_solution_scores_high():
    q = {"q": "DSA Coding: Implement a palindrome check.", "topic": "dsa", "type": "coding"}
    result = evaluate_answer(q, "def is_palindrome(s):\n    return s == s[::-1]\n\nprint(is_palindrome('racecar'))", language="python")
    assert result["score"] >= 80
    assert result["relevance"] >= 80
    assert result["correctness"] >= 80


def test_code_runner_executes_python_and_javascript():
    auth = {"Authorization": "Bearer " + create_token("code-runner-user", "access")}

    py_resp = client.post(
        "/api/code/run",
        json={"language": "python", "code": "print('hello from python')"},
        headers=auth,
    )
    assert py_resp.status_code == 200
    assert "hello from python" in py_resp.json()["output"]

    js_resp = client.post(
        "/api/code/run",
        json={"language": "javascript", "code": "console.log('hello from js')"},
        headers=auth,
    )
    assert js_resp.status_code == 200
    assert "hello from js" in js_resp.json()["output"]


def test_auth_and_user_flow():
    import uuid
    email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    pwd = "TestPassword123!"
    
    # 1. Register
    reg_resp = client.post("/api/auth/register", json={
        "email": email,
        "password": pwd,
        "name": "Test Candidate"
    })
    assert reg_resp.status_code == 200
    tokens = reg_resp.json()
    assert "access_token" in tokens
    acc = tokens["access_token"]

    # 2. Login
    login_resp = client.post("/api/auth/login", json={
        "email": email,
        "password": pwd
    })
    assert login_resp.status_code == 200

    # 3. Get profile
    me_resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {acc}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == email

    # 4. Onboard
    onb_resp = client.post(
        "/api/users/onboarding",
        json={"target_role": "backend", "education": "BS CS", "skills": ["python", "sql"], "preferences": {}},
        headers={"Authorization": f"Bearer {acc}"}
    )
    assert onb_resp.status_code == 200

    # 5. Seed persona
    seed_resp = client.post("/api/demo/seed-persona?persona_id=vic_frontend", headers={"Authorization": f"Bearer {acc}"})
    assert seed_resp.status_code == 200
    assert "analysis" in seed_resp.json()

    # 5b. Start DSA interview with a selected language
    dsa_start = client.post(
        "/api/interviews/start",
        json={"role_id": "backend", "difficulty": "hard", "missing_skills": [], "language": "python"},
        headers={"Authorization": f"Bearer {acc}"}
    )
    assert dsa_start.status_code == 200
    assert dsa_start.json()["language"] == "python"

    # 6. Get and update profile
    prof_resp = client.get("/api/users/profile", headers={"Authorization": f"Bearer {acc}"})
    assert prof_resp.status_code == 200
    assert prof_resp.json()["email"] == email

    update_resp = client.put(
        "/api/users/profile",
        json={"bio": "Software developer passionate about algorithms.", "github": "https://github.com/myuser"},
        headers={"Authorization": f"Bearer {acc}"}
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["bio"] == "Software developer passionate about algorithms."

def test_privacy_import_merges_idempotently_without_replacing_account_credentials(monkeypatch):
    monkeypatch.setattr(server, "append_user_csv", lambda *_: None)
    email = f"import_{uuid.uuid4().hex[:8]}@example.com"
    password = "CurrentPass123!"
    registered = client.post("/api/auth/register", json={"email": email, "password": password, "name": "Current Account"})
    assert registered.status_code == 200
    headers = {"Authorization": f"Bearer {registered.json()['access_token']}"}
    source_id = "previous-account-id"
    archive = {
        "user": {
            "id": source_id,
            "email": "previous@example.com",
            "name": "Previous Profile",
            "password_hash": "must-not-be-imported",
            "onboarding_done": True,
            "target_role": "frontend",
            "skills": ["python", "sql"],
            "preferences": {"preferred_types": ["Guide"]},
        },
        "resumes": [{"id": "previous-resume", "user_id": source_id, "filename": "resume.txt", "created_at": "2026-01-01T00:00:00Z"}],
        "analyses": [{"id": "previous-analysis", "user_id": source_id, "resume_id": "previous-resume", "result": {}, "overall_score": 70, "created_at": "2026-01-01T00:00:00Z"}],
        "interviews": [],
        "recommendations": [],
        "notifications": [],
        "events": [],
    }

    try:
        first = client.post("/api/privacy/import", json={"archive": archive}, headers=headers)
        assert first.status_code == 200
        first_counts = first.json()["collections"]
        assert first_counts["resumes"]["imported"] == 1
        assert first_counts["analyses"]["imported"] == 1

        second = client.post("/api/privacy/import", json={"archive": archive}, headers=headers)
        assert second.status_code == 200
        assert second.json()["collections"]["resumes"]["imported"] == 0
        assert second.json()["collections"]["resumes"]["skipped"] == 1

        collision_archive = {
            "user": {"id": "another-previous-account", "skills": [], "preferences": {}},
            "resumes": [{"id": "previous-resume", "user_id": "another-previous-account", "filename": "another.txt", "created_at": "2026-02-01T00:00:00Z"}],
            "analyses": [{"id": "another-analysis", "user_id": "another-previous-account", "resume_id": "previous-resume", "result": {}, "overall_score": 80, "created_at": "2026-02-01T00:00:00Z"}],
        }
        collision = client.post("/api/privacy/import", json={"archive": collision_archive}, headers=headers)
        assert collision.status_code == 200
        assert collision.json()["collections"]["resumes"]["imported"] == 1

        profile = client.get("/api/auth/me", headers=headers).json()
        assert profile["email"] == email
        assert profile["name"] == "Current Account"
        assert "password_hash" not in profile
        assert client.post("/api/auth/login", json={"email": email, "password": password}).status_code == 200
        exported = client.get("/api/privacy/export", headers=headers)
        assert exported.status_code == 200
        assert "password_hash" not in exported.json()["user"]

        analyses = client.get("/api/analyses", headers=headers).json()
        resumes = client.get("/api/resumes", headers=headers).json()
        assert len(analyses) == 2
        assert len(resumes) == 2
        resume_ids = {resume["id"] for resume in resumes}
        assert {analysis["resume_id"] for analysis in analyses} == resume_ids
        assert all(resume["user_id"] == profile["id"] for resume in resumes)
    finally:
        client.delete("/api/users/me", headers=headers)

def test_password_reset_otp_updates_argon2_hash(monkeypatch):
    monkeypatch.setattr(server, "append_user_csv", lambda *_: None)
    email = f"reset_{uuid.uuid4().hex[:8]}@example.com"
    old_password = "OldPassword123!"
    new_password = "NewPassword456!"
    registered = client.post("/api/auth/register", json={"email": email, "password": old_password, "name": "Reset User"})
    assert registered.status_code == 200
    headers = {"Authorization": f"Bearer {registered.json()['access_token']}"}
    sent = {}

    def capture_code(recipient, code):
        sent["email"] = recipient
        sent["code"] = code

    monkeypatch.setattr(server, "_send_password_reset_email", capture_code)
    try:
        requested = client.post("/api/auth/password-reset/request", json={"email": email})
        assert requested.status_code == 200
        assert sent["email"] == email
        invalid = client.post("/api/auth/password-reset/confirm", json={
            "email": email,
            "code": "000000" if sent["code"] != "000000" else "000001",
            "new_password": new_password,
        })
        assert invalid.status_code == 400

        confirmed = client.post("/api/auth/password-reset/confirm", json={
            "email": email,
            "code": sent["code"],
            "new_password": new_password,
        })
        assert confirmed.status_code == 200
        assert client.post("/api/auth/login", json={"email": email, "password": old_password}).status_code == 401
        assert client.post("/api/auth/login", json={"email": email, "password": new_password}).status_code == 200
        persisted_users = json.loads(STORE_FILE.read_text(encoding="utf-8"))["users"]
        persisted_user = next(user for user in persisted_users if user["email"] == email)
        assert persisted_user["password_hash"] != new_password
        assert verify_password(new_password, persisted_user["password_hash"])
    finally:
        client.delete("/api/users/me", headers=headers)

def test_registration_writes_csv_and_wrong_password_is_rejected():
    import csv
    from pathlib import Path

    csv_path = Path(__file__).resolve().parent.parent / "data" / "user_accounts.csv"
    if csv_path.exists():
        csv_path.unlink()

    email = f"csv_{uuid.uuid4().hex[:8]}@example.com"
    pwd = "StrongPassword123!"

    reg_resp = client.post("/api/auth/register", json={
        "email": email,
        "password": pwd,
        "name": "CSV Test User"
    })
    assert reg_resp.status_code == 200

    with open(csv_path, "r", encoding="utf-8", newline="") as fh:
        rows = list(csv.reader(fh))

    assert len(rows) >= 2
    header = rows[0]
    assert "name" in header and "email" in header
    assert any(row[0] == "CSV Test User" and row[1] == email for row in rows[1:])

    bad_login = client.post("/api/auth/login", json={
        "email": email,
        "password": "wrong-pass"
    })
    assert bad_login.status_code == 401
    assert "Invalid email or password" in bad_login.json()["detail"]


def test_register_does_not_500_when_csv_write_fails(monkeypatch):
    import tempfile
    from pathlib import Path

    bad_path = Path(tempfile.gettempdir()) / "careerlens_user_accounts_dir"
    bad_path.mkdir(exist_ok=True)
    monkeypatch.setattr("server.USER_CSV_PATH", bad_path)

    email = f"csv_fail_{uuid.uuid4().hex[:8]}@example.com"
    reg_resp = client.post("/api/auth/register", json={
        "email": email,
        "password": "StrongPassword123!",
        "name": "CSV Fail User"
    })

    assert reg_resp.status_code == 200
    assert "access_token" in reg_resp.json()


def test_role_and_resource_library_supports_multidomain_roles():
    from data.roles import ROLES_BY_ID
    from data.resources import RESOURCES

    assert "embedded_systems_engineer" in ROLES_BY_ID
    assert ROLES_BY_ID["embedded_systems_engineer"]["department"] == "ECE"
    assert any("esp32" in keyword.lower() for keyword in ROLES_BY_ID["embedded_systems_engineer"]["keywords"])

    filtered = [r for r in RESOURCES if r.get("domain") == "Embedded" and r.get("cost") == "Free"]
    assert filtered

    resp = client.get("/api/resources?department=Embedded&difficulty=Beginner&cost=Free")
    assert resp.status_code == 200
    assert len(resp.json()) >= 1


def test_department_specific_interview_questions_for_embedded_role():
    from utils.interview import pick_questions

    qs = pick_questions("embedded_systems_engineer", "beginner", count=5)
    assert len(qs) >= 3
    assert any("esp32" in q["q"].lower() or "microcontroller" in q["q"].lower() or "uart" in q["q"].lower() for q in qs)


def test_electronics_elite_uses_practical_challenges_and_automated_rubric():
    questions = pick_questions("electronics_engineer", "hard", count=5)
    assert len(questions) == 3
    assert all(question["type"] == "circuit" for question in questions)
    assert all("hint" not in question and "starter_code" not in question for question in questions)

    evaluation = evaluate_circuit_challenge(questions[0], {"components": [], "connections": []}, "")
    assert evaluation["score"] == 0
    assert evaluation["circuit"] == 0
    assert evaluation["component_selection"] == 0
    assert evaluation["code"] == 0
    assert evaluation["improvements"]

    question = questions[0]
    kinds = ["thermistor", "resistor", "resistor", "dc_motor", "transistor", "led", "diode", "battery"]
    components = [{"id": "uno", "kind": "uno"}] + [
        {"id": f"{kind}_{index + 1}", "kind": kind, "label": kind}
        for index, kind in enumerate(kinds)
    ]
    by_kind = {}
    for component in components:
        by_kind.setdefault(component["kind"], []).append(component["id"])
    connections = []
    for net in ELECTRONICS_CIRCUIT_RUBRICS[question["challenge_id"]]["nets"]:
        endpoints = [f"{by_kind[kind][occurrence]}.{pin}" for kind, occurrence, pin in net]
        connections.extend({"from": endpoints[0], "to": endpoint} for endpoint in endpoints[1:])
    sketch = """
    void setup() { pinMode(9, OUTPUT); pinMode(6, OUTPUT); }
    void loop() {
      int sample = analogRead(A0);
      bool sensorFault = sample == 0 || sample == 1023;
      unsigned long now = millis();
      int average = sample;
      bool hysteresis = average > 500;
          int temperature = average;
          bool fanOn = !sensorFault && temperature > 500 && hysteresis;
          if (sensorFault) { digitalWrite(9, LOW); }
          digitalWrite(9, fanOn ? HIGH : LOW);
          analogWrite(9, fanOn ? 255 : 0);
    }
    """
    complete = evaluate_circuit_challenge(question, {"components": components, "connections": connections}, sketch)
    assert complete["behavior"] == 100
    assert complete["score"] == 100
    assert complete["behavior"] == 100

    broken = evaluate_circuit_challenge(question, {"components": components, "connections": connections[:-1]}, sketch)
    assert broken["score"] < complete["score"]

    no_firmware = evaluate_circuit_challenge(question, {"components": components, "connections": connections}, "")
    assert no_firmware["score"] <= 25
    assert no_firmware["firmware_valid"] is False

    malformed = evaluate_circuit_challenge(question, {"components": components, "connections": connections}, sketch.replace("void loop() {", "void loop( {"))
    assert malformed["score"] <= 25
    assert malformed["firmware_valid"] is False

    unwired_pin_code = sketch.replace("digitalWrite(9, LOW);", "digitalWrite(3, HIGH); digitalWrite(9, LOW);")
    unwired_pin = evaluate_circuit_challenge(question, {"components": components, "connections": connections}, unwired_pin_code)
    assert unwired_pin["score"] <= 40
    assert unwired_pin["wired_pin_match"] is False
    assert unwired_pin["unwired_code_pins"] == ["D3"]


def test_electronics_elite_rejects_irrelevant_print_only_firmware():
    question = pick_questions("electronics_engineer", "hard", count=5)[0]
    sketch = """
    void setup() { Serial.begin(9600); }
    void loop() {
      Serial.println(\"hello\");
      Serial.println(\"world\");
    }
    """
    result = evaluate_circuit_challenge(question, {"components": [], "connections": []}, sketch)
    assert result["score"] == 0
    assert result["correctness"] == 0
    assert result["relevance"] == 0


def test_electronics_elite_interview_requires_sequential_circuit_submissions():
    token = create_token(f"electronics-{uuid.uuid4().hex}", "access")
    headers = {"Authorization": f"Bearer {token}"}
    started = client.post(
        "/api/interviews/start",
        json={"role_id": "electronics_engineer", "difficulty": "hard"},
        headers=headers,
    )
    assert started.status_code == 200
    session = started.json()
    assert session["strict_practical"] is True
    assert len(session["questions"]) == 3

    premature_finish = client.post(f"/api/interviews/finish?session_id={session['id']}", headers=headers)
    assert premature_finish.status_code == 409

    out_of_order = client.post(
        "/api/interviews/answer",
        json={"session_id": session["id"], "question_index": 1, "answer": "", "circuit_submission": {"components": [], "connections": []}},
        headers=headers,
    )
    assert out_of_order.status_code == 409

    missing_circuit = client.post(
        "/api/interviews/answer",
        json={"session_id": session["id"], "question_index": 0, "answer": ""},
        headers=headers,
    )
    assert missing_circuit.status_code == 400

    submitted = client.post(
        "/api/interviews/answer",
        json={"session_id": session["id"], "question_index": 0, "answer": "", "circuit_submission": {"components": [], "connections": []}},
        headers=headers,
    )
    assert submitted.status_code == 200
    assert submitted.json()["evaluation"]["score"] == 0


def test_arduino_sketch_preview_returns_serial_and_pin_activity():
    import shutil

    if not shutil.which("g++"):
        pytest.skip("g++ is required for Arduino sketch preview tests")

    token = create_token(f"arduino-preview-{uuid.uuid4().hex}", "access")
    headers = {"Authorization": f"Bearer {token}"}
    sketch = """
    void setup() { Serial.begin(9600); pinMode(9, OUTPUT); }
    void loop() { Serial.println(analogRead(A0)); digitalWrite(9, HIGH); }
    """
    response = client.post("/api/code/run/arduino", json={"code": sketch}, headers=headers)
    assert response.status_code == 200
    result = response.json()
    assert result["ok"] is True
    assert "SERIAL OUTPUT" in result["output"]
    serial_output = result["output"].split("SERIAL OUTPUT:\n", 1)[1].split("\nPIN ACTIVITY:", 1)[0]
    assert serial_output.splitlines() == ["512"] * 3
    assert "D9=HIGH" in result["output"]

    invalid = client.post(
        "/api/code/run/arduino",
        json={"code": "void setup() { } void loop( { }"},
        headers=headers,
    )
    assert invalid.status_code == 200
    assert invalid.json()["ok"] is False
    assert "error" in invalid.json()


def test_file_extraction_endpoint():
    uid = "test-extract-user"
    acc = create_token(uid, "access")
    
    # Text file extraction
    txt_content = b"Vic Chen\nSoftware Engineer with experience in React and TypeScript."
    resp = client.post(
        "/api/resumes/extract-file",
        files={"file": ("resume.txt", txt_content, "text/plain")},
        headers={"Authorization": f"Bearer {acc}"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "React" in data["text"]
    assert data["filename"] == "resume.txt"

