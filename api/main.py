import os
import json
import secrets
import hashlib
import hmac
import aiofiles
import time
import logging
from datetime import datetime, timedelta, timezone
from contextlib import asynccontextmanager
from collections import defaultdict

import asyncpg
import httpx
import jwt
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("footio")

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://tma:tma@db:5432/footio")
JWT_SECRET = os.environ.get("JWT_SECRET", "")
if not JWT_SECRET or len(JWT_SECRET) < 32:
    raise RuntimeError(
        "JWT_SECRET env var is required and must be at least 32 characters. "
        "Generate one with: openssl rand -hex 32"
    )
JWT_TTL_DAYS = int(os.environ.get("JWT_TTL_DAYS", "30"))
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
RESEND_FROM = os.environ.get("RESEND_FROM", "Footio <noreply@footio.online>")
SITE_URL = os.environ.get("SITE_URL", "https://footio.online")
AVATAR_DIR = os.environ.get("AVATAR_DIR", "/data/avatars")

RATE_WINDOW = 300
RATE_MAX_SEND = 5
RATE_MAX_VERIFY = 10

pool: asyncpg.Pool = None
rate_buckets: dict[str, list[float]] = defaultdict(list)
jwt_blacklist: dict[str, float] = {}
_lb_cache: dict = {"data": None, "ts": 0.0}
_LB_CACHE_TTL = 60  # seconds


def _hash_otp(code: str) -> str:
    return hmac.new(JWT_SECRET.encode(), code.encode(), hashlib.sha256).hexdigest()


def _clean_rate_bucket(key: str):
    cutoff = time.time() - RATE_WINDOW
    rate_buckets[key] = [t for t in rate_buckets[key] if t > cutoff]


def check_rate(key: str, limit: int):
    _clean_rate_bucket(key)
    if len(rate_buckets[key]) >= limit:
        logger.warning("Rate limit hit: %s (%d/%d)", key, len(rate_buckets[key]), limit)
        raise HTTPException(429, "Too many requests. Try again later.")
    rate_buckets[key].append(time.time())


def _clean_blacklist():
    now = time.time()
    expired = [jti for jti, exp in jwt_blacklist.items() if exp < now]
    for jti in expired:
        del jwt_blacklist[jti]


@asynccontextmanager
async def lifespan(app: FastAPI):
    global pool
    pool = await asyncpg.create_pool(DATABASE_URL, min_size=5, max_size=20)
    os.makedirs(AVATAR_DIR, exist_ok=True)
    async with pool.acquire() as conn:
        await conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_ml_token ON magic_links(token)"
        )
        await conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_ml_user_used ON magic_links(user_id, used)"
        )
        await conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_ml_expires ON magic_links(expires_at)"
        )
        await conn.execute(
            "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS played_today JSONB NOT NULL DEFAULT '{}';",
        )
    logger.info("Footio API started, DB pool ready")
    yield
    logger.info("Footio API shutting down")
    if pool:
        await pool.close()


app = FastAPI(docs_url=None, redoc_url=None, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[SITE_URL, "https://www.footio.online"],
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    elapsed = round((time.time() - start) * 1000)
    ip = get_client_ip(request)
    logger.info("%s %s %s %dms %s", request.method, request.url.path, response.status_code, elapsed, ip)
    return response


def make_jwt(user_id: int, email: str) -> str:
    jti = secrets.token_hex(16)
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "email": email,
        "jti": jti,
        "iat": int(now.timestamp()),
        "exp": now + timedelta(days=JWT_TTL_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def decode_jwt(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        if payload.get("jti") in jwt_blacklist:
            raise HTTPException(401, "Token revoked")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")


async def get_current_user(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(401, "Not authenticated")
    return decode_jwt(auth[7:])


def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


async def cleanup_magic_links(conn):
    await conn.execute(
        "DELETE FROM magic_links WHERE expires_at < now() OR used = true"
    )


async def send_otp_email(email: str, code: str):
    digits = "".join(
        f'<span style="display:inline-block;width:44px;height:52px;line-height:52px;'
        f'background:#1a2332;border-radius:8px;font-size:28px;font-weight:700;'
        f'color:#10b981;font-family:monospace;margin:3px;text-align:center">{d}</span>'
        for d in code
    )
    html = (
        f'<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>'
        f'<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;'
        f'padding:32px 24px;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb">'
        f'<h2 style="color:#10b981;margin:0 0 16px 0;letter-spacing:2px">FOOTIO</h2>'
        f'<p style="color:#374151;margin:0 0 8px 0;font-size:15px">Your sign-in code:</p>'
        f'<div style="background:#0a0f1a;border-radius:8px;padding:20px;text-align:center;margin:16px 0">'
        f'{digits}'
        f'</div>'
        f'<p style="color:#6b7280;font-size:13px;margin:0 0 4px 0">Enter this code on the Footio website to sign in.</p>'
        f'<p style="color:#6b7280;font-size:13px;margin:0 0 4px 0">This code expires in 10 minutes.</p>'
        f'<p style="color:#9ca3af;font-size:12px;margin-top:20px">If you didn\'t request this, just ignore this email.</p>'
        f'</div></body></html>'
    )
    text = (
        f"Your Footio sign-in code: {code}\n\n"
        f"Enter this code on the Footio website to sign in.\n"
        f"This code expires in 10 minutes.\n\n"
        f"If you didn't request this, just ignore this email."
    )
    async with httpx.AsyncClient() as client:
        res = await client.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {RESEND_API_KEY}"},
            json={
                "from": RESEND_FROM,
                "to": [email],
                "subject": f"Footio sign-in code: {code}",
                "html": html,
                "text": text,
                "headers": {"X-Entity-Ref-ID": secrets.token_hex(8)},
            },
            timeout=10,
        )
    if res.status_code >= 400:
        raise Exception(f"Resend error {res.status_code}: {res.text}")


class OTPRequest(BaseModel):
    email: str


@app.post("/api/auth/send-code")
async def send_code(body: OTPRequest, request: Request):
    email = body.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(400, "Invalid email")

    ip = get_client_ip(request)
    check_rate(f"send:ip:{ip}", RATE_MAX_SEND)
    check_rate(f"send:email:{email}", RATE_MAX_SEND)

    code = f"{secrets.randbelow(1000000):06d}"
    code_hash = _hash_otp(code)

    async with pool.acquire() as conn:
        async with conn.transaction():
            user_id = await conn.fetchval(
                "INSERT INTO users(email) VALUES($1) "
                "ON CONFLICT(email) DO UPDATE SET email=EXCLUDED.email "
                "RETURNING id",
                email,
            )
            await conn.execute(
                "INSERT INTO profiles(user_id) VALUES($1) ON CONFLICT(user_id) DO NOTHING",
                user_id,
            )
            await conn.execute(
                "UPDATE magic_links SET used=true WHERE user_id=$1 AND used=false",
                user_id,
            )
            await conn.execute(
                "INSERT INTO magic_links(user_id, token, expires_at) VALUES($1,$2,$3)",
                user_id, code_hash,
                datetime.now(timezone.utc) + timedelta(minutes=10),
            )
            await cleanup_magic_links(conn)

    try:
        await send_otp_email(email, code)
        logger.info("OTP sent to %s (user_id=%d)", email, user_id)
    except Exception as e:
        logger.error("Failed to send OTP to %s: %s", email, str(e))
        raise HTTPException(500, f"Failed to send email: {str(e)}")

    return {"ok": True}


class VerifyOTP(BaseModel):
    email: str
    code: str


@app.post("/api/auth/verify-code")
async def verify_code(body: VerifyOTP, request: Request):
    email = body.email.strip().lower()
    code = body.code.strip()
    if len(code) != 6 or not code.isdigit():
        raise HTTPException(400, "Invalid code")

    ip = get_client_ip(request)
    check_rate(f"verify:ip:{ip}", RATE_MAX_VERIFY)
    check_rate(f"verify:email:{email}", RATE_MAX_VERIFY)

    code_hash = _hash_otp(code)

    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT ml.id, ml.user_id, u.email FROM magic_links ml "
            "JOIN users u ON u.id=ml.user_id "
            "WHERE u.email=$1 AND ml.token=$2 AND ml.used=false AND ml.expires_at > now()",
            email, code_hash,
        )
        if not row:
            raise HTTPException(400, "Invalid or expired code")

        await conn.execute(
            "UPDATE magic_links SET used=true WHERE id=$1", row["id"]
        )

    jwt_token = make_jwt(row["user_id"], row["email"])
    logger.info("User verified: %s (user_id=%d)", row["email"], row["user_id"])
    return {"token": jwt_token, "email": row["email"]}


@app.get("/api/auth/me")
async def auth_me(user=Depends(get_current_user)):
    return {"id": user["sub"], "email": user["email"]}


@app.post("/api/auth/logout")
async def logout(request: Request):
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        try:
            payload = jwt.decode(token=auth[7:], key=JWT_SECRET, algorithms=["HS256"])
            jti = payload.get("jti")
            exp = payload.get("exp", 0)
            if jti:
                jwt_blacklist[jti] = exp
        except jwt.InvalidTokenError:
            pass
    _clean_blacklist()
    return {"ok": True}


class ProfileUpdate(BaseModel):
    username: str | None = None


@app.get("/api/profile")
async def get_profile(user=Depends(get_current_user)):
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT username, avatar_url, wins, losses, streak, played_today, updated_at "
            "FROM profiles WHERE user_id=$1",
            user["sub"],
        )
    if not row:
        raise HTTPException(404, "Profile not found")
    d = dict(row)
    d["played_today"] = json.loads(d["played_today"]) if isinstance(d["played_today"], str) else (d["played_today"] or {})
    return d


@app.put("/api/profile")
async def update_profile(body: ProfileUpdate, user=Depends(get_current_user)):
    if body.username is not None:
        name = body.username.strip()[:30] or "Player"
        async with pool.acquire() as conn:
            await conn.execute(
                "UPDATE profiles SET username=$1, updated_at=now() WHERE user_id=$2",
                name, user["sub"],
            )
    return {"ok": True}


@app.post("/api/profile/avatar")
async def upload_avatar(file: UploadFile = File(...), user=Depends(get_current_user)):
    if file.size and file.size > 2 * 1024 * 1024:
        raise HTTPException(400, "File too large (max 2MB)")

    data = await file.read()
    if len(data) > 2 * 1024 * 1024:
        raise HTTPException(400, "File too large (max 2MB)")

    ext = "jpg"
    if file.content_type == "image/png":
        ext = "png"
    elif file.content_type == "image/webp":
        ext = "webp"

    filename = f"{user['sub']}.{ext}"
    filepath = os.path.join(AVATAR_DIR, filename)
    async with aiofiles.open(filepath, "wb") as f:
        await f.write(data)

    avatar_url = f"/avatars/{filename}"
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE profiles SET avatar_url=$1, updated_at=now() WHERE user_id=$2",
            avatar_url, user["sub"],
        )
    return {"avatar_url": avatar_url}


VALID_GAMES = {"legacy", "grid", "wordle", "goltexto", "pyramid", "impostor"}


class StatsSync(BaseModel):
    wins: int
    losses: int
    streak: int
    played_today: dict | None = None


@app.post("/api/stats/sync")
async def sync_stats(body: StatsSync, request: Request, user=Depends(get_current_user)):
    if body.wins < 0 or body.losses < 0 or body.streak < 0:
        raise HTTPException(400, "Invalid stats")

    ip = get_client_ip(request)
    check_rate(f"sync:{user['sub']}", 30)

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    async with pool.acquire() as conn:
        current = await conn.fetchrow(
            "SELECT wins, losses, streak, played_today FROM profiles WHERE user_id=$1",
            user["sub"],
        )
        if not current:
            raise HTTPException(404, "Profile not found")

        new_wins = max(body.wins, current["wins"])
        new_losses = max(body.losses, current["losses"])

        win_diff = new_wins - current["wins"]
        loss_diff = new_losses - current["losses"]
        if win_diff > 6 or loss_diff > 6:
            raise HTTPException(400, "Stats change too large for a single session")

        new_streak = body.streak
        if new_streak > current["streak"] + 6:
            new_streak = current["streak"] + 6

        server_played = current["played_today"] or {}
        if isinstance(server_played, str):
            server_played = json.loads(server_played)

        def _entry_date(v):
            if isinstance(v, str): return v
            if isinstance(v, dict): return v.get("d", "")
            return ""

        # Keep only today's entries from server, merge with client (union)
        merged_played = {g: v for g, v in server_played.items() if _entry_date(v) == today}
        for g, v in (body.played_today or {}).items():
            if g in VALID_GAMES and _entry_date(v) == today:
                # Prefer client entry (it has win/loss info)
                merged_played[g] = v

        await conn.execute(
            "UPDATE profiles SET wins=$1, losses=$2, streak=$3, played_today=$4, updated_at=now() "
            "WHERE user_id=$5",
            new_wins, new_losses, new_streak, json.dumps(merged_played), user["sub"],
        )
    return {"ok": True, "wins": new_wins, "losses": new_losses, "streak": new_streak, "played_today": merged_played}


@app.get("/api/leaderboard")
async def leaderboard(request: Request):
    check_rate(f"lb:{get_client_ip(request)}", 10)
    now = time.time()
    if _lb_cache["data"] is not None and now - _lb_cache["ts"] < _LB_CACHE_TTL:
        return _lb_cache["data"]
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT username, wins, losses, streak, avatar_url "
            "FROM profiles ORDER BY (wins*100 + streak*50) DESC LIMIT 20"
        )
    result = [dict(r) for r in rows]
    _lb_cache["data"] = result
    _lb_cache["ts"] = now
    return result


@app.get("/api/health")
async def health():
    try:
        async with pool.acquire() as conn:
            await conn.fetchval("SELECT 1")
        return {"status": "ok"}
    except Exception:
        raise HTTPException(503, "Database unavailable")
