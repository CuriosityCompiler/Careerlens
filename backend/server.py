"""CareerLens FastAPI backend with file extraction (PDF, Word, OCR), user profiles, DSA interview difficulty, and disk persistence."""
import os
import sys
import uuid
import csv
import io
import copy
import asyncio
import hmac
import json
import logging
import secrets
import smtplib
import ssl
import time
from email.message import EmailMessage
from datetime import datetime, timezone
from typing import Optional, List, Literal

sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI, APIRouter, Depends, HTTPException, Response, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, EmailStr
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent / ".env")

from utils.db import get_db
from utils.auth import SECRET, hash_password, verify_password, create_token, decode_token, get_current_user
from utils.analyzer import score as analyze_score
from utils.interview import pick_questions, evaluate_answer, evaluate_circuit_challenge, next_difficulty
from utils.rate_limit import check_mode_b_rate_limit, get_cached_critique, cache_critique
from utils.extractor import extract_document_text
from data.roles import ROLES, ROLES_BY_ID
from data.resources import RESOURCES
from data.personas import PERSONAS

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
log = logging.getLogger("careerlens")

app = FastAPI(title="CareerLens API", version="1.1.0", description="Privacy-first AI Career & Resume Intelligence Platform")
api = APIRouter(prefix="/api")

# ---------- Pydantic models ----------
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    name: str = Field(min_length=1, max_length=80)

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class PasswordResetRequestIn(BaseModel):
    email: EmailStr

class PasswordResetConfirmIn(BaseModel):
    email: EmailStr
    code: str = Field(pattern=r"^\d{6}$")
    new_password: str = Field(min_length=8, max_length=128)

class PrivacyImportIn(BaseModel):
    archive: dict

class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class RefreshIn(BaseModel):
    refresh_token: str

class OnboardingIn(BaseModel):
    education: str = ""
    target_role: str
    skills: List[str] = []
    preferences: dict = {}
    privacy_mode: Literal["A", "B"] = "A"

class ProfileUpdateIn(BaseModel):
    name: Optional[str] = None
    target_role: Optional[str] = None
    education: Optional[str] = None
    skills: Optional[List[str]] = None
    bio: Optional[str] = None
    github: Optional[str] = None
    linkedin: Optional[str] = None
    profile_pic: Optional[str] = None

class ResumeIn(BaseModel):
    text: str
    filename: Optional[str] = None
    target_role: Optional[str] = None
    mode: Literal["A", "B"] = "A"

class InterviewStartIn(BaseModel):
    role_id: str
    difficulty: Literal["beginner", "intermediate", "advanced", "hard"] = "beginner"
    missing_skills: List[str] = []
    language: Literal["c", "c++", "python", "java", "javascript"] = "javascript"

class InterviewAnswerIn(BaseModel):
    session_id: str
    question_index: int
    answer: Optional[str] = ""
    language: Literal["c", "c++", "python", "java", "javascript"] = "javascript"
    circuit_submission: Optional[dict] = None

class ModeBAnalysisIn(BaseModel):
    text: str
    target_role: str

class CodeRunIn(BaseModel):
    language: Literal["c", "c++", "python", "java", "javascript"] = "javascript"
    code: str

class ArduinoRunIn(BaseModel):
    code: str = Field(max_length=50000)

# ---------- Helpers ----------
USER_CSV_PATH = Path(__file__).resolve().parent / "data" / "user_accounts.csv"


def _run_code_in_sandbox(language: str, code: str) -> dict:
    import subprocess, tempfile, sys

    if language == "python":
        with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False, encoding="utf-8") as f:
            f.write(code)
            path = f.name
        proc = subprocess.run([sys.executable, path], capture_output=True, text=True, timeout=10)
        output = (proc.stdout or "") + (proc.stderr or "")
        return {"ok": proc.returncode == 0, "output": output.strip() or "Code executed without output.", "error": proc.stderr.strip() if proc.stderr.strip() else None}

    if language == "javascript":
        with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as f:
            f.write(code)
            path = f.name
        proc = subprocess.run(["node", path], capture_output=True, text=True, timeout=10)
        output = (proc.stdout or "") + (proc.stderr or "")
        return {"ok": proc.returncode == 0, "output": output.strip() or "Code executed without output.", "error": proc.stderr.strip() if proc.stderr.strip() else None}

    if language == "java":
        with tempfile.TemporaryDirectory() as tmp:
            java_file = Path(tmp) / "Main.java"
            java_file.write_text(code, encoding="utf-8")
            proc = subprocess.run(["javac", str(java_file)], capture_output=True, text=True, timeout=15)
            if proc.returncode != 0:
                return {"ok": False, "output": "", "error": proc.stderr.strip() or proc.stdout.strip() or "Java compilation failed."}
            run_proc = subprocess.run(["java", "-cp", str(Path(tmp)), "Main"], capture_output=True, text=True, timeout=15)
            output = (run_proc.stdout or "") + (run_proc.stderr or "")
            return {"ok": run_proc.returncode == 0, "output": output.strip() or "Code executed without output.", "error": run_proc.stderr.strip() if run_proc.stderr.strip() else None}

    if language in {"c", "c++"}:
        suffix = ".c" if language == "c" else ".cpp"
        with tempfile.TemporaryDirectory() as tmp:
            src = Path(tmp) / f"main{suffix}"
            exe = Path(tmp) / ("main_c" if language == "c" else "main_cpp")
            src.write_text(code, encoding="utf-8")
            compiler = "gcc" if language == "c" else "g++"
            proc = subprocess.run([compiler, str(src), "-o", str(exe)], capture_output=True, text=True, timeout=15)
            if proc.returncode != 0:
                return {"ok": False, "output": "", "error": proc.stderr.strip() or proc.stdout.strip() or "Compilation failed."}
            run_proc = subprocess.run([str(exe)], capture_output=True, text=True, timeout=15)
            output = (run_proc.stdout or "") + (run_proc.stderr or "")
            return {"ok": run_proc.returncode == 0, "output": output.strip() or "Code executed without output.", "error": run_proc.stderr.strip() if run_proc.stderr.strip() else None}

    return {"ok": False, "output": "", "error": f"Unsupported language: {language}"}


def _run_arduino_preview(code: str) -> dict:
        import subprocess
        import tempfile

        if not code.strip():
                return {"ok": False, "output": "", "error": "Write an Arduino sketch before running it."}

        arduino_header = r'''#pragma once
#include <algorithm>
#include <cstdint>
#include <map>
#include <sstream>
#include <string>
#include <vector>
using byte = unsigned char;
using String = std::string;
constexpr int LOW = 0, HIGH = 1, INPUT = 0, OUTPUT = 1, INPUT_PULLUP = 2;
constexpr int A0 = 14, A1 = 15, A2 = 16, A3 = 17, A4 = 18, A5 = 19;
constexpr int LED_BUILTIN = 13;
#define F(value) value
namespace ArduinoSim {
inline std::map<int, int> digitalPins;
inline std::map<int, int> pinModes;
inline std::vector<std::string> pinActivity;
inline std::ostringstream serialOutput;
inline unsigned long elapsedMillis = 0;
}
inline void pinMode(int pin, int mode) { ArduinoSim::pinModes[pin] = mode; }
inline int digitalRead(int pin) { return ArduinoSim::digitalPins.count(pin) ? ArduinoSim::digitalPins[pin] : LOW; }
inline int analogRead(int) { return 512; }
inline void digitalWrite(int pin, int value) {
    ArduinoSim::digitalPins[pin] = value;
    ArduinoSim::pinActivity.push_back("D" + std::to_string(pin) + "=" + (value ? "HIGH" : "LOW"));
}
inline void analogWrite(int pin, int value) {
    ArduinoSim::pinActivity.push_back("PWM D" + std::to_string(pin) + "=" + std::to_string(value));
}
inline unsigned long millis() { return ArduinoSim::elapsedMillis; }
inline unsigned long micros() { return ArduinoSim::elapsedMillis * 1000; }
inline void delay(unsigned long value) { ArduinoSim::elapsedMillis += value; }
inline void delayMicroseconds(unsigned int value) { ArduinoSim::elapsedMillis += value / 1000; }
inline unsigned long pulseIn(int, int, unsigned long = 1000000) { return 1000; }
inline long map(long value, long fromLow, long fromHigh, long toLow, long toHigh) {
    return (value - fromLow) * (toHigh - toLow) / (fromHigh - fromLow) + toLow;
}
inline long constrain(long value, long low, long high) { return std::min(std::max(value, low), high); }
inline void tone(int pin, unsigned int frequency, unsigned long = 0) {
    ArduinoSim::pinActivity.push_back("TONE D" + std::to_string(pin) + "=" + std::to_string(frequency));
}
inline void noTone(int pin) { ArduinoSim::pinActivity.push_back("TONE D" + std::to_string(pin) + "=OFF"); }
class HardwareSerial {
 public:
    void begin(unsigned long) {}
    template <typename T> void print(const T& value) { ArduinoSim::serialOutput << value; }
    template <typename T> void println(const T& value) { ArduinoSim::serialOutput << value << '\n'; }
    void println() { ArduinoSim::serialOutput << '\n'; }
    int available() { return 0; }
    int read() { return -1; }
};
inline HardwareSerial Serial;
'''
        sketch_harness = r'''
int main() {
    setup();
    for (int previewCycle = 0; previewCycle < 3; ++previewCycle) loop();
    std::cout << "SIMULATOR INPUTS: analogRead=512, digitalRead=LOW, pulseIn=1000 us\n";
    std::string serial = ArduinoSim::serialOutput.str();
    std::cout << "SERIAL OUTPUT:\n" << (serial.empty() ? "(none)\n" : serial);
    std::cout << "PIN ACTIVITY:\n";
    if (ArduinoSim::pinActivity.empty()) std::cout << "(no output pin changes)\n";
    for (const auto& event : ArduinoSim::pinActivity) std::cout << event << '\n';
    return 0;
}
'''

        with tempfile.TemporaryDirectory() as tmp:
                root = Path(tmp)
                (root / "Arduino.h").write_text(arduino_header, encoding="utf-8")
                (root / "Servo.h").write_text(
                        '#pragma once\n#include "Arduino.h"\nclass Servo { int pin = -1; public: void attach(int value) { pin = value; } void write(int angle) { ArduinoSim::pinActivity.push_back("SERVO D" + std::to_string(pin) + "=" + std::to_string(angle)); } };\n',
                        encoding="utf-8",
                )
                (root / "Wire.h").write_text(
                        '#pragma once\nclass TwoWire { public: void begin() {} };\ninline TwoWire Wire;\n',
                        encoding="utf-8",
                )
                (root / "LiquidCrystal_I2C.h").write_text(
                        '#pragma once\n#include "Arduino.h"\nclass LiquidCrystal_I2C { public: LiquidCrystal_I2C(int, int, int) {} void init() {} void begin(int, int) {} void backlight() {} void setCursor(int, int) {} template <typename T> void print(const T& value) { Serial.print(value); } template <typename T> void println(const T& value) { Serial.println(value); } };\n',
                        encoding="utf-8",
                )
                sketch_path = root / "sketch.cpp"
                executable = root / "arduino_preview"
                sketch_path.write_text(f'#include <iostream>\n#include "Arduino.h"\n{code}\n{sketch_harness}', encoding="utf-8")
                compiled = subprocess.run(
                        ["g++", "-std=c++17", "-I", str(root), str(sketch_path), "-o", str(executable)],
                        capture_output=True,
                        text=True,
                        timeout=15,
                )
                if compiled.returncode != 0:
                        error = (compiled.stderr or compiled.stdout or "Arduino sketch compilation failed.").strip()
                        return {"ok": False, "output": "", "error": error[-12000:]}

                executed = subprocess.run([str(executable)], capture_output=True, text=True, timeout=3)
                output = (executed.stdout or "") + (executed.stderr or "")
                return {
                        "ok": executed.returncode == 0,
                        "output": output.strip() or "Sketch ran without serial or pin output.",
                        "error": executed.stderr.strip() if executed.returncode != 0 else None,
                }


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def _password_reset_digest(email: str, code: str) -> str:
    return hmac.new(SECRET.encode("utf-8"), f"{email}:{code}".encode("utf-8"), "sha256").hexdigest()


def _send_password_reset_email(email: str, code: str):
    host = os.environ.get("SMTP_HOST", "").strip()
    sender = os.environ.get("SMTP_FROM_EMAIL", os.environ.get("SMTP_USERNAME", "")).strip()
    if not host or not sender:
        raise RuntimeError("Password recovery email is not configured.")

    message = EmailMessage()
    message["Subject"] = "Your CareerLens password reset code"
    message["From"] = sender
    message["To"] = email
    message.set_content(
        f"Your CareerLens verification code is {code}. It expires in 10 minutes. "
        "If you did not request a password reset, you can ignore this email."
    )

    port = int(os.environ.get("SMTP_PORT", "587"))
    username = os.environ.get("SMTP_USERNAME", "").strip()
    password = os.environ.get("SMTP_PASSWORD", "")
    use_ssl = os.environ.get("SMTP_USE_SSL", "false").lower() == "true"
    use_starttls = os.environ.get("SMTP_STARTTLS", "true").lower() == "true"

    if use_ssl:
        server = smtplib.SMTP_SSL(host, port, timeout=10, context=ssl.create_default_context())
    else:
        server = smtplib.SMTP(host, port, timeout=10)
    with server:
        if use_starttls and not use_ssl:
            server.starttls(context=ssl.create_default_context())
        if username:
            server.login(username, password)
        server.send_message(message)


def append_user_csv(name: str, email: str):
    candidates = []
    for path in {USER_CSV_PATH, USER_CSV_PATH.parent / "user_accounts.csv", Path(__file__).resolve().parent / "data" / "user_accounts.csv"}:
        candidates.append(path)

    last_error = None
    for csv_path in candidates:
        try:
            csv_path.parent.mkdir(parents=True, exist_ok=True)
            if csv_path.exists() and csv_path.is_dir():
                continue
            file_exists = csv_path.exists()
            with csv_path.open("a", encoding="utf-8", newline="") as csv_file:
                writer = csv.writer(csv_file)
                if not file_exists:
                    writer.writerow(["name", "email", "created_at"])
                writer.writerow([name.strip(), email.lower(), now_iso()])
            return
        except (OSError, PermissionError) as exc:
            last_error = exc
            log.warning("Could not append account CSV to %s: %s", csv_path, exc)

    if last_error is not None:
        log.error("All user account CSV write attempts failed; continuing without CSV backup. Error: %s", last_error)


async def db_user(uid: str):
    return await get_db().users.find_one({"id": uid}, {"_id": 0})

async def _log_event(uid: str, kind: str, payload: dict):
    await get_db().events.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": uid,
        "kind": kind,
        "payload": payload,
        "created_at": now_iso()
    })

def _build_recommendations(analysis: dict, prefs: dict) -> list:
    """Transparent recommendation scorer: roleRelevance * skillGapSeverity * userPreference * resourceQuality * recency."""
    role = analysis["role"]
    role_id = role["id"]
    missing_must = set(analysis["missing_must"])
    missing_nice = set(analysis["missing_nice"])
    recs = []

    for res in RESOURCES:
        skill = str(res.get("skill") or res.get("topic") or res.get("title") or "general").lower()
        title = str(res.get("title") or res.get("name") or res.get("skill") or "Resource")
        resource_type = str(res.get("type") or "Guide")
        effort = res.get("effort") or "4 hours"
        quality = float(res.get("quality", 0.8) or 0.8)
        role_rel = 1.0 if skill in [s.lower() for s in role["must_have"] + role["nice_to_have"]] else 0.3

        if skill in [s.lower() for s in missing_must]:
            severity = 1.0
            priority = "high"
        elif skill in [s.lower() for s in missing_nice]:
            severity = 0.6
            priority = "medium"
        else:
            severity = 0.2
            priority = "low"

        pref = 1.0 if not prefs.get("preferred_types") else (1.0 if resource_type in prefs["preferred_types"] else 0.7)
        recency = 1.0
        score = round(role_rel * severity * pref * quality * recency, 3)

        if score < 0.25:
            continue

        recs.append({
            "id": str(uuid.uuid4()),
            "resource": res,
            "target_skill": skill,
            "role_id": role_id,
            "priority": priority,
            "score": score,
            "reason": f"Targets {'must-have' if priority == 'high' else 'nice-to-have' if priority == 'medium' else 'general'} skill '{skill}' for {role['name']}.",
            "effort": effort,
            "expected_outcome": f"Boost role alignment and close skill gap for '{skill}'.",
            "title": title,
        })

    recs.sort(key=lambda x: x["score"], reverse=True)
    return recs[:12]

# ---------- Health ----------
@api.get("/")
async def root():
    return {"service": "careerlens", "ok": True, "time": now_iso(), "version": "1.1.0"}

# ---------- Auth (Argon2 + JWT) ----------
@api.post("/auth/register", response_model=TokenPair)
async def register(inp: RegisterIn):
    db = get_db()
    existing = await db.users.find_one({"email": inp.email.lower()})
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    uid = str(uuid.uuid4())
    user = {
        "id": uid,
        "email": inp.email.lower(),
        "name": inp.name,
        "password_hash": hash_password(inp.password),
        "created_at": now_iso(),
        "onboarding_done": False,
        "privacy_mode": "A",
        "target_role": "frontend",
        "education": "",
        "skills": [],
        "preferences": {},
        "bio": "",
        "github": "",
        "linkedin": "",
        "profile_pic": "",
    }
    await db.users.insert_one(user)
    append_user_csv(inp.name, inp.email)
    return TokenPair(
        access_token=create_token(uid, "access"),
        refresh_token=create_token(uid, "refresh")
    )

@api.post("/auth/login", response_model=TokenPair)
async def login(inp: LoginIn, request: Request):
    client_ip = request.client.host if request.client else "unknown"
    forwarded_for = request.headers.get("x-forwarded-for")
    key = f"{(forwarded_for.split(',')[0] if forwarded_for else client_ip)}:{inp.email.lower()}"

    max_reqs = int(os.environ.get("LOGIN_RATE_LIMIT", "5"))
    window_secs = int(os.environ.get("LOGIN_RATE_LIMIT_WINDOW_SECONDS", "300"))
    from utils.rate_limit import check_login_rate_limit
    check_login_rate_limit(key, max_requests=max_reqs, window_seconds=window_secs)

    db = get_db()
    u = await db.users.find_one({"email": inp.email.lower()})
    if not u:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    password_hash = u.get("password_hash") if isinstance(u, dict) else None
    if not verify_password(inp.password, password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return TokenPair(
        access_token=create_token(u["id"], "access"),
        refresh_token=create_token(u["id"], "refresh")
    )

@api.post("/auth/password-reset/request")
async def request_password_reset(inp: PasswordResetRequestIn, request: Request):
    email = inp.email.lower()
    client_ip = request.client.host if request.client else "unknown"
    forwarded_for = request.headers.get("x-forwarded-for")
    ip = forwarded_for.split(",")[0].strip() if forwarded_for else client_ip

    from utils.rate_limit import check_password_reset_rate_limit
    check_password_reset_rate_limit(f"password-reset-ip:{ip}", max_requests=12, window_seconds=3600)
    check_password_reset_rate_limit(f"password-reset-email:{email}")

    db = get_db()
    user = await db.users.find_one({"email": email})
    if not user:
        return {"message": "If an account exists for that email, a verification code was sent."}

    reset_collection = db.password_reset_codes
    reset = await reset_collection.find_one({"email": email})
    now = time.time()
    if reset and now - reset.get("requested_at", 0) < 60:
        raise HTTPException(status_code=429, detail="Please wait before requesting another verification code.")

    code = f"{secrets.randbelow(1_000_000):06d}"
    reset_data = {
        "email": email,
        "code_digest": _password_reset_digest(email, code),
        "requested_at": now,
        "expires_at": now + 600,
        "attempts": 0,
    }
    if reset:
        await reset_collection.update_one({"email": email}, {"$set": reset_data})
    else:
        await reset_collection.insert_one(reset_data)

    try:
        await asyncio.to_thread(_send_password_reset_email, email, code)
    except Exception as exc:
        log.warning("Could not send password reset email: %s", exc)
        await reset_collection.delete_many({"email": email})
        raise HTTPException(status_code=503, detail="Verification email could not be sent. Check the server SMTP configuration.")

    return {"message": "If an account exists for that email, a verification code was sent."}

@api.post("/auth/password-reset/confirm")
async def confirm_password_reset(inp: PasswordResetConfirmIn):
    email = inp.email.lower()
    db = get_db()
    reset_collection = db.password_reset_codes
    reset = await reset_collection.find_one({"email": email})
    if not reset or reset.get("expires_at", 0) <= time.time():
        await reset_collection.delete_many({"email": email})
        raise HTTPException(status_code=400, detail="The verification code is invalid or expired.")

    attempts = int(reset.get("attempts", 0))
    if attempts >= 5:
        await reset_collection.delete_many({"email": email})
        raise HTTPException(status_code=400, detail="The verification code is invalid or expired.")

    await reset_collection.update_one({"email": email}, {"$set": {"attempts": attempts + 1}})
    submitted_digest = _password_reset_digest(email, inp.code)
    if not hmac.compare_digest(submitted_digest, reset.get("code_digest", "")):
        if attempts + 1 >= 5:
            await reset_collection.delete_many({"email": email})
        raise HTTPException(status_code=400, detail="The verification code is invalid or expired.")

    user = await db.users.find_one({"email": email})
    if not user:
        await reset_collection.delete_many({"email": email})
        raise HTTPException(status_code=400, detail="The verification code is invalid or expired.")

    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"password_hash": hash_password(inp.new_password), "password_changed_at": now_iso()}},
    )
    await reset_collection.delete_many({"email": email})
    return {"ok": True, "message": "Password updated. Sign in with your new password."}

@api.post("/auth/refresh", response_model=TokenPair)
async def refresh(inp: RefreshIn):
    payload = decode_token(inp.refresh_token)
    if payload.get("typ") != "refresh":
        raise HTTPException(status_code=401, detail="Not a valid refresh token")
    uid = payload["sub"]
    return TokenPair(
        access_token=create_token(uid, "access"),
        refresh_token=create_token(uid, "refresh")
    )

@api.get("/auth/me")
async def me(uid: str = Depends(get_current_user)):
    u = await db_user(uid)
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    u.pop("password_hash", None)
    return u

# ---------- User Profile Endpoints ----------
@api.get("/users/profile")
async def get_profile(uid: str = Depends(get_current_user)):
    u = await db_user(uid)
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    u.pop("password_hash", None)
    return u

@api.put("/users/profile")
async def update_profile(inp: ProfileUpdateIn, uid: str = Depends(get_current_user)):
    db = get_db()
    update_data = {k: v for k, v in inp.model_dump().items() if v is not None}
    update_data["updated_at"] = now_iso()
    await db.users.update_one({"id": uid}, {"$set": update_data})
    u = await db_user(uid)
    u.pop("password_hash", None)
    return u

@api.post("/users/onboarding")
async def onboarding(inp: OnboardingIn, uid: str = Depends(get_current_user)):
    if inp.target_role not in ROLES_BY_ID:
        raise HTTPException(status_code=400, detail="Unknown target_role")
    await get_db().users.update_one(
        {"id": uid},
        {"$set": {
            "education": inp.education,
            "target_role": inp.target_role,
            "skills": inp.skills,
            "preferences": inp.preferences,
            "privacy_mode": inp.privacy_mode,
            "onboarding_done": True,
            "updated_at": now_iso(),
        }}
    )
    return {"ok": True}

@api.post("/users/privacy-mode")
async def set_privacy_mode(mode: Literal["A", "B"], uid: str = Depends(get_current_user)):
    await get_db().users.update_one(
        {"id": uid},
        {"$set": {"privacy_mode": mode, "updated_at": now_iso()}}
    )
    return {"privacy_mode": mode}

@api.delete("/users/me")
async def delete_account(uid: str = Depends(get_current_user)):
    db = get_db()
    for coll in ["users", "resumes", "analyses", "interviews", "recommendations", "events", "notifications"]:
        await db[coll].delete_many({"user_id": uid} if coll != "users" else {"id": uid})
    return {"ok": True, "deleted": True}

# ---------- Roles & Resources ----------
@api.get("/roles")
async def list_roles():
    return ROLES

@api.get("/resources")
async def list_resources(skill: Optional[str] = None, department: Optional[str] = None, difficulty: Optional[str] = None, cost: Optional[str] = None, resource_type: Optional[str] = None, search: Optional[str] = None):
    items = list(RESOURCES)
    if skill:
        s = skill.lower()
        items = [r for r in items if str(r.get("skill") or r.get("topic") or "").lower() in s or s in str(r.get("title") or r.get("name") or "").lower()]
    if department:
        items = [r for r in items if str(r.get("domain") or "").lower() == department.lower()]
    if difficulty:
        items = [r for r in items if str(r.get("difficulty") or "").lower() == difficulty.lower()]
    if cost:
        items = [r for r in items if str(r.get("cost") or "").lower() == cost.lower()]
    if resource_type:
        items = [r for r in items if str(r.get("type") or "").lower() == resource_type.lower()]
    if search:
        q = search.lower()
        items = [r for r in items if q in str(r.get("title") or r.get("name") or "").lower() or q in str(r.get("topic") or "").lower() or q in str(r.get("domain") or "").lower() or q in str(r.get("provider") or "").lower()]
    return items

@api.get("/personas")
async def list_personas():
    return list(PERSONAS.values())

# ---------- Resume File Extraction & OCR ----------
@api.post("/resumes/extract-file")
async def extract_file_endpoint(file: UploadFile = File(...), uid: str = Depends(get_current_user)):
    """Extracts text from PDF, Word (.docx/.doc), TXT, or Image files with OCR."""
    content_bytes = await file.read()
    if len(content_bytes) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (maximum 5MB allowed)")

    extracted_text, method = extract_document_text(file.filename, content_bytes)
    if not extracted_text.strip():
        raise HTTPException(
            status_code=422,
            detail="Could not extract readable text from document. Ensure file is not password-protected or corrupted."
        )

    return {
        "text": extracted_text,
        "filename": file.filename,
        "extraction_method": method,
        "length": len(extracted_text)
    }

# ---------- Resume Analysis (Mode A default) ----------
@api.post("/resumes/analyze")
async def analyze_resume(inp: ResumeIn, uid: str = Depends(get_current_user)):
    db = get_db()
    u = await db_user(uid)
    role_id = inp.target_role or (u or {}).get("target_role") or "frontend"
    result = analyze_score(inp.text, role_id)
    result["mode"] = inp.mode

    resume_id = str(uuid.uuid4())
    doc = {
        "id": resume_id,
        "user_id": uid,
        "filename": inp.filename,
        "target_role": role_id,
        "created_at": now_iso(),
        "mode": inp.mode,
        "text": inp.text if inp.mode == "B" else None,
        "text_length": len(inp.text),
    }
    await db.resumes.insert_one(doc)

    analysis_doc = {
        "id": str(uuid.uuid4()),
        "user_id": uid,
        "resume_id": resume_id,
        "target_role": role_id,
        "result": result,
        "created_at": now_iso(),
        "overall_score": result.get("scores", {}).get("overall", 0),
    }
    await db.analyses.insert_one(analysis_doc)

    if not result.get("empty_or_joke"):
        recs = _build_recommendations(result, (u or {}).get("preferences", {}))
        for r in recs:
            r["user_id"] = uid
            r["resume_id"] = resume_id
            r["created_at"] = now_iso()
        if recs:
            await db.recommendations.insert_many(recs)

    await _log_event(uid, "resume.analyzed", {"resume_id": resume_id, "score": analysis_doc["overall_score"]})

    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": uid,
        "type": "ACTION" if result.get("empty_or_joke") else "PROGRESS",
        "title": "Resume analyzed",
        "body": result.get("message") if result.get("empty_or_joke") else f"Overall score: {analysis_doc['overall_score']}/100 for {ROLES_BY_ID.get(role_id, {}).get('name', role_id)}.",
        "read": False,
        "created_at": now_iso(),
    })

    return {"resume_id": resume_id, "analysis": result, "analysis_id": analysis_doc["id"]}

@api.get("/resumes")
async def list_resumes(uid: str = Depends(get_current_user)):
    docs = await get_db().resumes.find({"user_id": uid}, {"_id": 0, "text": 0}).sort("created_at", -1).to_list(50)
    return docs

@api.get("/analyses/latest")
async def latest_analysis(uid: str = Depends(get_current_user)):
    doc = await get_db().analyses.find_one({"user_id": uid}, {"_id": 0}, sort=[("created_at", -1)])
    return doc or {}

@api.get("/analyses")
async def list_analyses(uid: str = Depends(get_current_user)):
    docs = await get_db().analyses.find({"user_id": uid}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return docs

@api.get("/recommendations")
async def list_recommendations(uid: str = Depends(get_current_user)):
    docs = await get_db().recommendations.find({"user_id": uid}, {"_id": 0}).sort("score", -1).to_list(50)
    return docs

# ---------- Mock Interviews (Adaptive & DSA) ----------
@api.post("/interviews/start")
async def start_interview(inp: InterviewStartIn, uid: str = Depends(get_current_user)):
    if inp.role_id not in ROLES_BY_ID:
        raise HTTPException(status_code=400, detail="Unknown role")
    qs = pick_questions(inp.role_id, inp.difficulty, count=5, missing_skills=inp.missing_skills)
    sid = str(uuid.uuid4())
    doc = {
        "id": sid,
        "user_id": uid,
        "role_id": inp.role_id,
        "difficulty": inp.difficulty,
        "language": inp.language,
        "questions": qs,
        "strict_practical": inp.role_id == "electronics_engineer" and inp.difficulty == "hard",
        "answers": [],
        "evaluations": [],
        "created_at": now_iso(),
        "status": "in_progress",
    }
    await get_db().interviews.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api.post("/interviews/answer")
async def answer_interview(inp: InterviewAnswerIn, uid: str = Depends(get_current_user)):
    db = get_db()
    sess = await db.interviews.find_one({"id": inp.session_id, "user_id": uid}, {"_id": 0})
    if not sess:
        raise HTTPException(status_code=404, detail="Interview session not found")
    if inp.question_index < 0 or inp.question_index >= len(sess["questions"]):
        raise HTTPException(status_code=400, detail="Invalid question index")

    if sess.get("strict_practical"):
        evals = sess.get("evaluations", [])
        expected_index = next((index for index in range(len(sess["questions"])) if index >= len(evals) or not evals[index]), len(sess["questions"]))
        if inp.question_index != expected_index:
            raise HTTPException(status_code=409, detail="Submit the current challenge before continuing.")

    q = sess["questions"][inp.question_index]
    answer_text = (inp.answer or "").strip()
    session_language = sess.get("language") or inp.language or "javascript"
    if q.get("type") == "circuit":
        if not isinstance(inp.circuit_submission, dict):
            raise HTTPException(status_code=400, detail="Circuit submission is required for this challenge.")
        ev = evaluate_circuit_challenge(q, inp.circuit_submission, answer_text)
    else:
        ev = evaluate_answer(q, answer_text, language=session_language)

    answers = sess.get("answers", [])
    evals = sess.get("evaluations", [])
    while len(answers) <= inp.question_index:
        answers.append("")
        evals.append({})
    answers[inp.question_index] = answer_text
    evals[inp.question_index] = ev

    await db.interviews.update_one(
        {"id": inp.session_id},
        {"$set": {"answers": answers, "evaluations": evals, "updated_at": now_iso()}}
    )
    return {"evaluation": ev}

@api.post("/interviews/finish")
async def finish_interview(session_id: str, uid: str = Depends(get_current_user)):
    db = get_db()
    sess = await db.interviews.find_one({"id": session_id, "user_id": uid}, {"_id": 0})
    if not sess:
        raise HTTPException(status_code=404, detail="Interview session not found")

    if sess.get("strict_practical") and any(
        index >= len(sess.get("evaluations", [])) or not sess["evaluations"][index]
        for index in range(len(sess["questions"]))
    ):
        raise HTTPException(status_code=409, detail="Submit every practical challenge before completing the session.")

    evals = sess.get("evaluations", [])
    scored = [e for e in evals if e and e.get("score") is not None]
    avg = round(sum(e.get("score", 0) for e in scored) / max(1, len(scored)), 1)
    nd = next_difficulty(sess["difficulty"], avg)

    summary = {
        "avg_score": avg,
        "questions_answered": len(scored),
        "next_difficulty": nd,
        "strengths": [q["topic"] for q, e in zip(sess["questions"], evals) if e and e.get("score", 0) >= 70],
        "weaknesses": [q["topic"] for q, e in zip(sess["questions"], evals) if e and e.get("score", 0) < 55],
    }

    await db.interviews.update_one(
        {"id": session_id},
        {"$set": {"status": "done", "summary": summary, "finished_at": now_iso()}}
    )
    await _log_event(uid, "interview.finished", {"session_id": session_id, "avg_score": avg})
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": uid,
        "type": "PROGRESS",
        "title": "Interview session complete",
        "body": f"Avg score {avg}/100 -> recommended next difficulty: {nd}.",
        "read": False,
        "created_at": now_iso(),
    })
    return {"summary": summary}

@api.get("/interviews")
async def list_interviews(uid: str = Depends(get_current_user)):
    docs = await get_db().interviews.find({"user_id": uid}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return docs

@api.post("/code/run")
async def run_code(inp: CodeRunIn, uid: str = Depends(get_current_user)):
    try:
        result = _run_code_in_sandbox(inp.language, inp.code)
        return result
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Code execution failed: {exc}")


@api.post("/code/run/arduino")
async def run_arduino_code(inp: ArduinoRunIn, uid: str = Depends(get_current_user)):
    try:
        return _run_arduino_preview(inp.code)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Arduino preview failed: {exc}")

# ---------- Analytics & Reports ----------
@api.get("/analytics/summary")
async def analytics_summary(uid: str = Depends(get_current_user)):
    db = get_db()
    analyses = await db.analyses.find({"user_id": uid}, {"_id": 0}).sort("created_at", 1).to_list(100)
    interviews = await db.interviews.find({"user_id": uid, "status": "done"}, {"_id": 0}).sort("created_at", 1).to_list(100)

    resume_trend = [{"date": a["created_at"][:10], "score": a.get("overall_score", 0)} for a in analyses]
    interview_trend = [{"date": i["created_at"][:10], "score": i.get("summary", {}).get("avg_score", 0)} for i in interviews]

    latest = analyses[-1] if analyses else None
    gap_matrix = latest["result"].get("gap_matrix", []) if latest else []
    closed = sum(1 for g in gap_matrix if g.get("present"))
    total_gaps = len(gap_matrix) or 1

    last_resume_score = latest.get("overall_score", 0) if latest else 0
    last_iv_score = interview_trend[-1]["score"] if interview_trend else 0
    readiness = int(last_resume_score * 0.6 + last_iv_score * 0.4) if (latest or interview_trend) else 0

    return {
        "resume_trend": resume_trend,
        "interview_trend": interview_trend,
        "gap_closure_pct": int(100 * closed / total_gaps),
        "career_readiness": readiness,
        "total_analyses": len(analyses),
        "total_interviews": len(interviews),
        "latest_scores": latest["result"].get("scores", {}) if latest else {},
    }

@api.get("/reports/weekly.csv")
async def weekly_csv(uid: str = Depends(get_current_user)):
    db = get_db()
    analyses = await db.analyses.find({"user_id": uid}, {"_id": 0}).sort("created_at", -1).to_list(20)
    interviews = await db.interviews.find({"user_id": uid}, {"_id": 0}).sort("created_at", -1).to_list(20)

    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["Section", "Date", "Metric", "Value"])
    for a in analyses:
        w.writerow(["Resume", a["created_at"][:10], "OverallScore", a.get("overall_score", 0)])
    for i in interviews:
        w.writerow(["Interview", i["created_at"][:10], "AvgScore", i.get("summary", {}).get("avg_score", 0)])

    return Response(
        content=buf.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=careerlens_weekly.csv"}
    )

# ---------- Notifications & Privacy ----------
@api.get("/notifications")
async def list_notifications(uid: str = Depends(get_current_user)):
    docs = await get_db().notifications.find({"user_id": uid}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return docs

@api.post("/notifications/read-all")
async def mark_all_read(uid: str = Depends(get_current_user)):
    await get_db().notifications.update_many({"user_id": uid}, {"$set": {"read": True}})
    return {"ok": True}

@api.get("/privacy/export")
async def export_data(uid: str = Depends(get_current_user)):
    db = get_db()
    user = await db_user(uid)
    if user:
        user.pop("password_hash", None)
    return {
        "user": user,
        "resumes": await db.resumes.find({"user_id": uid}, {"_id": 0}).to_list(100),
        "analyses": await db.analyses.find({"user_id": uid}, {"_id": 0}).to_list(100),
        "interviews": await db.interviews.find({"user_id": uid}, {"_id": 0}).to_list(100),
        "recommendations": await db.recommendations.find({"user_id": uid}, {"_id": 0}).to_list(200),
        "notifications": await db.notifications.find({"user_id": uid}, {"_id": 0}).to_list(200),
        "events": await db.events.find({"user_id": uid}, {"_id": 0}).to_list(500),
    }

@api.post("/privacy/import")
async def import_data(inp: PrivacyImportIn, uid: str = Depends(get_current_user)):
    archive = inp.archive
    if len(json.dumps(archive, ensure_ascii=False).encode("utf-8")) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="JSON archive exceeds the 10 MB import limit.")

    source_user = archive.get("user")
    source_id = source_user.get("id") if isinstance(source_user, dict) else None
    if not isinstance(source_id, str) or not source_id:
        raise HTTPException(status_code=400, detail="This is not a valid CareerLens data export.")

    string_profile_fields = ("name", "target_role", "education", "bio", "github", "linkedin", "profile_pic")
    if any(
        field in source_user and (not isinstance(source_user[field], str) or len(source_user[field]) > 10000)
        for field in string_profile_fields
    ):
        raise HTTPException(status_code=400, detail="Invalid profile data in archive.")
    if source_user.get("target_role") and source_user["target_role"] not in ROLES_BY_ID:
        raise HTTPException(status_code=400, detail="Unknown target role in archive.")
    source_skills = source_user.get("skills", []) or []
    if not isinstance(source_skills, list) or any(not isinstance(skill, str) or len(skill) > 200 for skill in source_skills):
        raise HTTPException(status_code=400, detail="Invalid skills data in archive.")
    source_preferences = source_user.get("preferences", {}) or {}
    if not isinstance(source_preferences, dict):
        raise HTTPException(status_code=400, detail="Invalid preferences data in archive.")
    if "onboarding_done" in source_user and not isinstance(source_user["onboarding_done"], bool):
        raise HTTPException(status_code=400, detail="Invalid onboarding status in archive.")

    limits = {
        "resumes": 100,
        "analyses": 100,
        "interviews": 100,
        "recommendations": 200,
        "notifications": 200,
        "events": 500,
    }
    source_records = {}
    for collection_name, limit in limits.items():
        records = archive.get(collection_name, [])
        if not isinstance(records, list) or len(records) > limit:
            raise HTTPException(status_code=400, detail=f"Invalid {collection_name} data in archive.")
        record_ids = set()
        for record in records:
            if not isinstance(record, dict):
                raise HTTPException(status_code=400, detail=f"Invalid {collection_name} data in archive.")
            record_id = record.get("id")
            if record.get("user_id") != source_id or not isinstance(record_id, str) or not record_id or record_id in record_ids:
                raise HTTPException(status_code=400, detail=f"Invalid ownership or duplicate ID in {collection_name} data.")
            record_ids.add(record_id)
        source_records[collection_name] = records

    db = get_db()
    target_user = await db.users.find_one({"id": uid}, {"_id": 0})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")

    id_map = {}
    prepared = {collection_name: [] for collection_name in limits}
    counts = {collection_name: {"imported": 0, "skipped": 0} for collection_name in limits}

    for collection_name, records in source_records.items():
        collection = db[collection_name]
        owned_records = await collection.find({"user_id": uid}, {"_id": 0}).to_list(5000)
        all_records = await collection.find({}, {"_id": 0}).to_list(10000)
        owned_by_id = {record.get("id"): record for record in owned_records if record.get("id")}
        owned_by_source = {
            record.get("import_source_id"): record
            for record in owned_records
            if record.get("import_source_id")
        }
        all_ids = {record.get("id") for record in all_records if record.get("id")}

        for record in records:
            source_record_id = record["id"]
            source_marker = f"{source_id}:{source_record_id}"
            imported_duplicate = owned_by_source.get(source_marker)
            existing = imported_duplicate or (owned_by_id.get(source_record_id) if source_id == uid else None)
            if existing:
                id_map[(collection_name, source_record_id)] = existing["id"]
                counts[collection_name]["skipped"] += 1
            else:
                target_id = str(uuid.uuid4()) if source_record_id in all_ids else source_record_id
                id_map[(collection_name, source_record_id)] = target_id
                document = copy.deepcopy(record)
                document.pop("_id", None)
                document.pop("import_source_id", None)
                document["id"] = target_id
                document["user_id"] = uid
                document["import_source_id"] = source_marker
                prepared[collection_name].append(document)

    for collection_name, documents in prepared.items():
        for document in documents:
            if collection_name in {"analyses", "recommendations"}:
                source_resume_id = document.get("resume_id")
                mapped_resume_id = id_map.get(("resumes", source_resume_id))
                if mapped_resume_id:
                    document["resume_id"] = mapped_resume_id
            elif collection_name == "events" and isinstance(document.get("payload"), dict):
                payload = document["payload"]
                for key, referenced_collection in (("resume_id", "resumes"), ("session_id", "interviews")):
                    mapped_id = id_map.get((referenced_collection, payload.get(key)))
                    if mapped_id:
                        payload[key] = mapped_id
        if documents:
            await db[collection_name].insert_many(documents)
            counts[collection_name]["imported"] = len(documents)

    profile_updates = {}
    if not target_user.get("onboarding_done") and source_user.get("onboarding_done"):
        for field in ("target_role", "education", "onboarding_done"):
            if field in source_user:
                profile_updates[field] = source_user[field]
    for field in ("name", "education", "bio", "github", "linkedin", "profile_pic"):
        if not target_user.get(field) and source_user.get(field):
            profile_updates[field] = source_user[field]
    skills = list(dict.fromkeys((target_user.get("skills") or []) + (source_user.get("skills") or [])))
    if skills != (target_user.get("skills") or []):
        profile_updates["skills"] = skills
    preferences = {**source_preferences, **(target_user.get("preferences") or {})}
    if preferences != (target_user.get("preferences") or {}):
        profile_updates["preferences"] = preferences
    if profile_updates:
        profile_updates["updated_at"] = now_iso()
        await db.users.update_one({"id": uid}, {"$set": profile_updates})

    await _log_event(uid, "privacy.data_imported", {"collections": counts})
    return {"ok": True, "collections": counts, "profile_updated": bool(profile_updates)}

# ---------- Demo Persona Seeding (Vic, Travis, Cooper) ----------
@api.post("/demo/seed-persona")
async def seed_persona(persona_id: str, uid: str = Depends(get_current_user)):
    if persona_id not in PERSONAS:
        raise HTTPException(status_code=400, detail="Unknown persona")
    p = PERSONAS[persona_id]
    inp = ResumeIn(
        text=p["resume_text"],
        filename=f"{p['id']}_resume.txt",
        target_role=p["role_target"],
        mode="A"
    )
    return await analyze_resume(inp, uid)

# ---------- Mode B: Server AI Critique (Rate-Limited & Cached) ----------
@api.post("/ai/critique")
async def ai_critique(inp: ModeBAnalysisIn, uid: str = Depends(get_current_user)):
    max_reqs = int(os.environ.get("MODE_B_RATE_LIMIT", "5"))
    window_secs = int(os.environ.get("MODE_B_WINDOW_SECONDS", "300"))
    check_mode_b_rate_limit(uid, max_requests=max_reqs, window_seconds=window_secs)

    cached = get_cached_critique(inp.text, inp.target_role)
    if cached:
        return cached

    role = ROLES_BY_ID.get(inp.target_role) or ROLES_BY_ID["frontend"]
    gemini_key = os.environ.get("GEMINI_API_KEY", "").strip()

    prompt = (
        f"You are CareerLens, an expert career coach. Given a resume and target role '{role['name']}', "
        f"produce exactly 4 structured sections:\n"
        f"WHAT (2 concise sentences on overall candidate readiness and key signals)\n"
        f"WHY (2 concise sentences on why specific gaps or strengths matter for recruiters)\n"
        f"HOW (3 bullet points specifying exact improvements to bullet phrasing and metrics)\n"
        f"NEXT (3 concrete next action steps and technologies to learn)\n\n"
        f"Resume text:\n{inp.text[:4000]}"
    )

    critique_text = None
    provider_name = "gemini-flash"

    if gemini_key:
        try:
            from google import genai
            client = genai.Client(api_key=gemini_key)
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
            )
            critique_text = response.text
        except Exception as e:
            log.warning(f"Google GenAI call failed ({e}); generating structured coach response.")

    if not critique_text:
        role_skills = ", ".join(role["must_have"][:4])
        critique_text = (
            f"WHAT:\nCandidate exhibits solid foundational experience but has missing keyword alignment for {role['name']}. Project descriptions demonstrate technical awareness with opportunities for deeper metric validation.\n\n"
            f"WHY:\nRecruiter ATS algorithms prioritize candidates demonstrating verified production impact in {role_skills}. Missing industry terminology lowers first-round screening probability.\n\n"
            f"HOW:\n"
            f"- Quantify achievements using the Google X-Y-Z formula (Accomplished [X] as measured by [Y] by doing [Z]).\n"
            f"- Highlight explicit production tools ({role_skills}) in experience bullet points.\n"
            f"- Add architecture details to projects showing how you handled scale, latency, or caching.\n\n"
            f"NEXT:\n"
            f"1. Complete the recommended PostgreSQL / Docker learning modules in the Resources tab.\n"
            f"2. Rewrite your top 2 project bullets with quantified percentage speedups or volume metrics.\n"
            f"3. Run an intermediate mock interview in the Practice tab to sharpen your system design explanations."
        )
        provider_name = "careerlens-local-coach"

    res = {"provider": provider_name, "text": critique_text}
    cache_critique(inp.text, inp.target_role, res)
    await _log_event(uid, "ai.critique", {"role_id": inp.target_role, "chars": len(critique_text), "provider": provider_name})
    return res

# ---------- Register Router & CORS ----------
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
