import os
import json
import copy
import logging
import socket
from pathlib import Path
from urllib.parse import urlparse

log = logging.getLogger("careerlens.db")

STORE_FILE = Path(__file__).resolve().parent.parent / "data" / "careerlens_store.json"

class AsyncCursor:
    def __init__(self, items):
        self._items = items

    def sort(self, key, direction=1):
        if isinstance(key, list):
            for k, d in reversed(key):
                self._items.sort(key=lambda x: x.get(k, 0) or 0, reverse=(d == -1))
        else:
            self._items.sort(key=lambda x: x.get(key, 0) or 0, reverse=(direction == -1))
        return self

    async def to_list(self, length=None):
        res = [copy.deepcopy(x) for x in self._items]
        if length is not None:
            return res[:length]
        return res

class LocalAsyncCollection:
    def __init__(self, name: str, parent_db):
        self.name = name
        self.parent_db = parent_db
        self._docs = []

    def _matches(self, doc, query):
        if not query:
            return True
        for k, v in query.items():
            if k == "$or" and isinstance(v, list):
                if not any(self._matches(doc, q) for q in v):
                    return False
            elif doc.get(k) != v:
                return False
        return True

    def _project(self, doc, projection):
        if not projection:
            return copy.deepcopy(doc)
        res = copy.deepcopy(doc)
        for k, v in projection.items():
            if v == 0 and k in res:
                del res[k]
        return res

    async def find_one(self, query=None, projection=None, sort=None):
        query = query or {}
        matches = [d for d in self._docs if self._matches(d, query)]
        if sort:
            for k, d in reversed(sort):
                matches.sort(key=lambda x: x.get(k, 0) or 0, reverse=(d == -1))
        if matches:
            return self._project(matches[0], projection)
        return None

    def find(self, query=None, projection=None):
        query = query or {}
        matched = [self._project(d, projection) for d in self._docs if self._matches(d, query)]
        return AsyncCursor(matched)

    async def insert_one(self, doc):
        doc_copy = copy.deepcopy(doc)
        if "_id" not in doc_copy:
            doc_copy["_id"] = str(len(self._docs) + 1)
        self._docs.append(doc_copy)
        self.parent_db.save_to_disk()
        return doc_copy

    async def insert_many(self, docs):
        res = []
        for d in docs:
            doc_copy = copy.deepcopy(d)
            if "_id" not in doc_copy:
                doc_copy["_id"] = str(len(self._docs) + 1)
            self._docs.append(doc_copy)
            res.append(doc_copy)
        self.parent_db.save_to_disk()
        return res

    async def update_one(self, query, update):
        target = None
        for d in self._docs:
            if self._matches(d, query):
                target = d
                break
        if target is not None:
            if "$set" in update:
                for k, v in update["$set"].items():
                    target[k] = copy.deepcopy(v)
            self.parent_db.save_to_disk()
            return True
        return False

    async def update_many(self, query, update):
        count = 0
        for d in self._docs:
            if self._matches(d, query):
                if "$set" in update:
                    for k, v in update["$set"].items():
                        d[k] = copy.deepcopy(v)
                count += 1
        if count > 0:
            self.parent_db.save_to_disk()
        return count

    async def delete_many(self, query):
        initial = len(self._docs)
        self._docs = [d for d in self._docs if not self._matches(d, query)]
        if len(self._docs) != initial:
            self.parent_db.save_to_disk()
        return initial - len(self._docs)

class LocalDatabase:
    def __init__(self):
        self._collections = {}
        self.load_from_disk()

    def __getattr__(self, name: str):
        if name not in self._collections:
            self._collections[name] = LocalAsyncCollection(name, self)
        return self._collections[name]

    def __getitem__(self, name: str):
        return getattr(self, name)

    def load_from_disk(self):
        if STORE_FILE.exists():
            try:
                with open(STORE_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for col_name, docs in data.items():
                        col = LocalAsyncCollection(col_name, self)
                        col._docs = docs
                        self._collections[col_name] = col
                log.info(f"Loaded database from {STORE_FILE}")
                return
            except Exception as e:
                log.warning(f"Could not load {STORE_FILE}: {e}")

        # Seed initial demo user if not present
        from utils.auth import hash_password
        users_col = LocalAsyncCollection("users", self)
        demo_user = {
            "id": "demo-student-id-001",
            "email": "demo@careerlens.ai",
            "name": "Demo Student",
            "password_hash": hash_password("demo1234"),
            "created_at": "2026-09-24T00:00:00Z",
            "onboarding_done": True,
            "privacy_mode": "A",
            "target_role": "frontend",
            "education": "B.S. Computer Science, 2024",
            "skills": ["javascript", "react", "html", "css", "git"],
            "preferences": {},
            "bio": "Aspiring software engineer passionate about clean code, high performance web applications, and intuitive UI.",
            "github": "https://github.com/demostudent",
            "linkedin": "https://linkedin.com/in/demostudent",
            "profile_pic": "",
        }
        users_col._docs.append(demo_user)
        self._collections["users"] = users_col
        self.save_to_disk()

    def save_to_disk(self):
        try:
            STORE_FILE.parent.mkdir(parents=True, exist_ok=True)
            data = {}
            for col_name, col in self._collections.items():
                data[col_name] = col._docs
            with open(STORE_FILE, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            log.warning(f"Failed to persist database to {STORE_FILE}: {e}")

_client = None
_db = None

def _is_host_reachable(url: str, timeout: float = 0.5) -> bool:
    try:
        parsed = urlparse(url)
        host = parsed.hostname or "localhost"
        port = parsed.port or 27017
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except Exception:
        return False

def get_db():
    global _client, _db
    if _db is not None:
        return _db

    mongo_url = os.environ.get("MONGO_URL", "").strip()
    db_name = os.environ.get("DB_NAME", "careerlens")

    if mongo_url and not mongo_url.startswith("memory") and _is_host_reachable(mongo_url):
        try:
            from motor.motor_asyncio import AsyncIOMotorClient
            _client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=1000)
            _db = _client[db_name]
            log.info(f"Connected to MongoDB at {mongo_url} [{db_name}]")
            return _db
        except Exception as e:
            log.warning(f"Could not initialize Motor ({e}); falling back to local database.")

    log.info("Using embedded disk-backed document store for CareerLens.")
    _db = LocalDatabase()
    return _db
