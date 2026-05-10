from fastapi import APIRouter, HTTPException, Depends
from auth_deps import get_current_user
from database import db
from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel
import hashlib

router = APIRouter(prefix="/linkedin", tags=["linkedin"])


# ── Pydantic Models ──────────────────────────────────────────────────────────

class ScrapedPost(BaseModel):
    id: Optional[int] = None
    text: str


class SavePostsPayload(BaseModel):
    user_email: str          # The website account email, stored by the extension
    posts: List[ScrapedPost]
    source: Optional[str] = "extension"
    url: Optional[str] = None


# ── Helper ───────────────────────────────────────────────────────────────────

def _make_post_id(user_email: str, text: str) -> str:
    """Deterministic ID so we can upsert without duplicates."""
    return hashlib.sha1(f"{user_email}::{text[:200]}".encode()).hexdigest()


# ── Routes ───────────────────────────────────────────────────────────────────

@router.post("/save-posts")
async def save_posts(payload: SavePostsPayload):
    """
    Called by the Chrome extension (no JWT required).
    Saves scraped LinkedIn posts into MongoDB under the user's email.
    The extension must know the user's website email (stored during "Link Account" step).
    """
    if not payload.user_email or "@" not in payload.user_email:
        raise HTTPException(status_code=400, detail="A valid user_email is required")

    if not payload.posts:
        return {"message": "No posts to save", "saved": 0}

    saved = 0
    skipped = 0
    now = datetime.utcnow()

    for post in payload.posts:
        text = (post.text or "").strip()
        if not text:
            continue

        post_id = _make_post_id(payload.user_email, text)

        # Upsert — only insert if this exact text hasn't been stored yet
        result = await db.linkedin_posts.update_one(
            {"post_id": post_id},
            {
                "$setOnInsert": {
                    "post_id": post_id,
                    "user_email": payload.user_email.lower().strip(),
                    "text": text,
                    "source_url": payload.url,
                    "source": payload.source or "extension",
                    "saved_at": now,
                }
            },
            upsert=True
        )

        if result.upserted_id:
            saved += 1
        else:
            skipped += 1

    print(f"[LinkedIn Extension] {payload.user_email} — saved {saved}, skipped {skipped} duplicate(s)")

    return {
        "success": True,
        "saved": saved,
        "skipped": skipped,
        "message": f"Saved {saved} new post(s). {skipped} duplicate(s) ignored."
    }


@router.get("/my-posts")
async def get_my_posts(
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """
    Returns the logged-in user's scraped LinkedIn posts (newest first).
    Requires a valid website JWT.
    """
    email = current_user["email"].lower().strip()

    cursor = db.linkedin_posts.find(
        {"user_email": email},
        {"_id": 0, "post_id": 1, "text": 1, "source_url": 1, "saved_at": 1}
    ).sort("saved_at", -1).limit(limit)

    posts = []
    async for doc in cursor:
        doc["saved_at"] = doc["saved_at"].isoformat() if isinstance(doc.get("saved_at"), datetime) else doc.get("saved_at")
        posts.append(doc)

    return {"posts": posts, "count": len(posts), "user_email": email}


@router.delete("/my-posts/clear")
async def clear_my_posts(current_user: dict = Depends(get_current_user)):
    """Clears all scraped LinkedIn posts for the current user."""
    email = current_user["email"].lower().strip()
    result = await db.linkedin_posts.delete_many({"user_email": email})
    return {"message": f"Deleted {result.deleted_count} post(s)", "deleted": result.deleted_count}
