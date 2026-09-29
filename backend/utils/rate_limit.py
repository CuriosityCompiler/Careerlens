import time
import hashlib
from typing import Dict, List
from fastapi import HTTPException

# In-memory sliding window rate limiter
_user_requests: Dict[str, List[float]] = {}

# In-memory critique cache to avoid re-querying Gemini for identical resume text & role
_critique_cache: Dict[str, dict] = {}


def _enforce_rate_limit(key: str, max_requests: int, window_seconds: int, label: str, help_text: str):
    now = time.time()
    timestamps = _user_requests.get(key, [])
    timestamps = [t for t in timestamps if now - t < window_seconds]
    _user_requests[key] = timestamps

    if len(timestamps) >= max_requests:
        oldest = timestamps[0]
        retry_after = max(1, int(window_seconds - (now - oldest)) + 1)
        raise HTTPException(
            status_code=429,
            detail=f"{label} rate limit reached ({max_requests} requests per {window_seconds // 60} minutes). {help_text} Try again in {retry_after}s."
        )

    timestamps.append(now)
    _user_requests[key] = timestamps


def check_mode_b_rate_limit(uid: str, max_requests: int = 5, window_seconds: int = 300):
    """
    Ensures a user does not exceed max_requests within window_seconds.
    Protects free Gemini API keys from quota exhaustion using a local sliding window.
    """
    _enforce_rate_limit(
        uid,
        max_requests=max_requests,
        window_seconds=window_seconds,
        label="Mode B",
        help_text="This preserves free API quota and keeps Mode B cost-free."
    )


def check_login_rate_limit(key: str, max_requests: int = 5, window_seconds: int = 300):
    """Protects login endpoints from brute-force and unauthenticated spam without extra services."""
    _enforce_rate_limit(
        key,
        max_requests=max_requests,
        window_seconds=window_seconds,
        label="Login",
        help_text="This throttles repeated sign-in attempts without any paid API dependency."
    )


def check_password_reset_rate_limit(key: str, max_requests: int = 5, window_seconds: int = 900):
    """Throttles password recovery requests without relying on an external service."""
    _enforce_rate_limit(
        key,
        max_requests=max_requests,
        window_seconds=window_seconds,
        label="Password reset",
        help_text="This protects verification codes from automated abuse."
    )


def get_cached_critique(text: str, role_id: str):
    """Returns cached critique if already generated for identical text and target role."""
    h = hashlib.sha256(f"{role_id}::{text}".encode()).hexdigest()
    return _critique_cache.get(h)


def cache_critique(text: str, role_id: str, result: dict):
    h = hashlib.sha256(f"{role_id}::{text}".encode()).hexdigest()
    _critique_cache[h] = result
