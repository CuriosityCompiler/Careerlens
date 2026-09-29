import os
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

# Use Argon2 password hashing directly from argon2-cffi with graceful passlib fallback
try:
    from argon2 import PasswordHasher
    from argon2.exceptions import VerifyMismatchError, InvalidHash
    _ph = PasswordHasher()
    def hash_password(p: str) -> str:
        return _ph.hash(p)
    def verify_password(p: str, h: str) -> bool:
        if not isinstance(p, str) or not isinstance(h, str) or not h.strip():
            return False
        try:
            return _ph.verify(h, p)
        except (VerifyMismatchError, InvalidHash):
            return False
        except Exception:
            return False
except ImportError:
    from passlib.context import CryptContext
    _pwd_ctx = CryptContext(schemes=["argon2", "bcrypt"], deprecated="auto")
    def hash_password(p: str) -> str:
        return _pwd_ctx.hash(p)
    def verify_password(p: str, h: str) -> bool:
        if not isinstance(p, str) or not isinstance(h, str) or not h.strip():
            return False
        try:
            return _pwd_ctx.verify(p, h)
        except Exception:
            return False

security = HTTPBearer(auto_error=False)

SECRET = os.environ.get("JWT_SECRET", "careerlens-secret-super-secure-key-change-in-production-2025")
ALGO = os.environ.get("JWT_ALGO", "HS256")
ACCESS_MIN = int(os.environ.get("JWT_ACCESS_MIN", "60"))
REFRESH_DAYS = int(os.environ.get("JWT_REFRESH_DAYS", "7"))

def create_token(sub: str, typ: str = "access") -> str:
    now = datetime.now(timezone.utc)
    exp = now + (timedelta(minutes=ACCESS_MIN) if typ == "access" else timedelta(days=REFRESH_DAYS))
    return jwt.encode(
        {"sub": sub, "typ": typ, "iat": int(now.timestamp()), "exp": int(exp.timestamp())},
        SECRET,
        ALGO
    )

def decode_token(tok: str) -> dict:
    try:
        return jwt.decode(tok, SECRET, algorithms=[ALGO])
    except JWTError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid token: {e}")

async def get_current_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> str:
    if not creds:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing auth")
    payload = decode_token(creds.credentials)
    if payload.get("typ") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Wrong token type")
    return payload["sub"]
