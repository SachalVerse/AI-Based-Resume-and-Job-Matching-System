from fastapi import APIRouter, Header, HTTPException, Depends
from bson import ObjectId
from auth_deps import get_current_user, require_role
from database import db
from models import StudentProfile, JobSuggestion, RlFeedback
from typing import List, Optional
from datetime import datetime
import json
import asyncio
from services.github_service import GithubService
from services.gemini_service import GeminiService
from services.gmail_service import GmailService
from services.jsearch_service import JSearchService

router = APIRouter(prefix="/student", tags=["student"])

def _infer_country_from_text(text: Optional[str]) -> str:
    t = (text or "").lower()
    if any(k in t for k in ["pakistan", "lahore", "karachi", "islamabad", "rawalpindi", "faisalabad"]):
        return "pk"
    if any(k in t for k in ["united kingdom", "uk", "london", "manchester", "birmingham"]):
        return "gb"
    if any(k in t for k in ["canada", "toronto", "vancouver", "montreal"]):
        return "ca"
    return "us"
def _serialize_mongo(obj):
    # Recursively convert MongoDB/PyMongo types to JSON-friendly types
    if isinstance(obj, dict):
        return {k: _serialize_mongo(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_serialize_mongo(i) for i in obj]
    try:
        from bson import ObjectId
        if isinstance(obj, ObjectId):
            return str(obj)
    except Exception:
        pass
    if isinstance(obj, datetime):
        return obj.isoformat()
    return obj

def _to_jsonable_suggestion(sugg: dict) -> dict:
    # Deeply convert a suggestion dict to JSON-friendly types
    from bson import ObjectId  # local import to avoid top-level dependency if not used
    res = dict(sugg)
    # Normalize top-level ObjectId if any
    if "_id" in res:
        try:
            res["_id"] = str(res["_id"])
        except Exception:
            pass
    # Normalize datetime fields
    for k, v in list(res.items()):
        if isinstance(v, datetime):
            res[k] = v.isoformat()
        if isinstance(v, ObjectId):
            res[k] = str(v)
        if isinstance(v, dict):
            # Recursive sanitize
            res[k] = _to_jsonable_suggestion(v)  # type: ignore
        if isinstance(v, list):
            new_list = []
            for item in v:
                if isinstance(item, datetime):
                    new_list.append(item.isoformat())
                elif isinstance(item, ObjectId):
                    new_list.append(str(item))
                elif isinstance(item, dict):
                    new_list.append(_to_jsonable_suggestion(item))
                else:
                    new_list.append(item)
            res[k] = new_list
    return res

def _dedupe_jobs(jobs: List[dict]) -> List[dict]:
    seen = set()
    unique = []
    for j in jobs:
        key = (
            str(j.get("id") or "").strip().lower(),
            str(j.get("job_title") or "").strip().lower(),
            str(j.get("employer_name") or "").strip().lower(),
            str(j.get("job_city") or "").strip().lower(),
        )
        if key in seen:
            continue
        seen.add(key)
        unique.append(j)
    return unique

def _fallback_rank_jobs(profile: dict, jobs: List[dict]) -> List[dict]:
    """Fast local scoring when AI ranking is slow/unavailable."""
    skills = [str(s).lower() for s in profile.get("skills", [])]
    interests = [str(i).lower() for i in profile.get("interests", [])]
    scored = []
    for j in jobs:
        text = f"{j.get('job_title', '')} {j.get('job_description', '')}".lower()
        skill_hits = sum(1 for s in skills if s and s in text)
        interest_hits = sum(1 for i in interests if i and i in text)
        score = min(95, 40 + skill_hits * 8 + interest_hits * 6)
        reason = "Quick score from skills/interests while AI ranking finalizes."
        scored.append({
            "user_email": profile.get("email"),
            "job_data": j,
            "ai_score": int(score),
            "ai_reason": reason,
            "created_at": datetime.utcnow(),
            "status": "new",
        })
    return scored
github_service = GithubService()
gemini_service = GeminiService()

# --- Profile Management (Onboarding Guard) ---

@router.get("/check-onboarding")
async def check_onboarding(current_user: dict = Depends(get_current_user)):
    email = current_user["email"]
    student = await db.students.find_one({"email": email})
    if not student or "profile" not in student:
        return {"onboarded": False}
    return {"onboarded": True}

@router.post("/profile")
async def save_profile(profile: StudentProfile, current_user: dict = Depends(get_current_user)):
    email = current_user["email"]
    await db.students.update_one(
        {"email": email},
        {"$set": {"profile": profile.dict(), "updated_at": datetime.utcnow()}},
        upsert=True
    )
    return {"message": "Profile updated successfully"}

@router.get("/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    student = await db.students.find_one({"email": current_user["email"]})
    if not student or "profile" not in student:
        raise HTTPException(status_code=404, detail="Profile incomplete")
    return student["profile"]

# --- Job Suggestions (Part 5) ---

@router.get("/suggestions")
async def get_job_suggestions(refresh: bool = False, current_user: dict = Depends(get_current_user)):
    email = current_user["email"]

    # 1. Try to fetch existing suggestions from MongoDB (ignore legacy adzuna docs)
    if not refresh:
        cursor = db.job_suggestions.find({
            "user_email": email,
            "$or": [
                {"job_data.source": {"$exists": False}},
                {"job_data.source": {"$ne": "adzuna"}},
            ],
        }).sort("created_at", -1).limit(10)
        existing = await cursor.to_list(None)
        if existing:
            return [_to_jsonable_suggestion(ex) for ex in existing]

    # 2. If refresh or no suggestions, generate new ones via AI
    student = await db.students.find_one({"email": email})
    if not student or "profile" not in student:
        raise HTTPException(status_code=400, detail="Complete profile first")
    
    profile = student["profile"]
    # Fetch remote jobs using RapidAPI JSearch only.
    preferred_query = profile.get("interests", ["Software"])[0]
    profile_location = profile.get("location")
    country = _infer_country_from_text(profile_location)
    raw_jobs = await JSearchService.search_jobs(
        query=preferred_query,
        country=country,
        location=profile_location,
        page=1,
        num_pages=1,
    )
    raw_jobs = _dedupe_jobs(raw_jobs)
    raw_jobs = [j for j in raw_jobs if str(j.get("source", "")).lower() != "adzuna"]
    if not raw_jobs:
        return []
    
    # AI Ranking
    prompt = f"Rank these jobs for this student. Student: {profile}. Jobs: {json.dumps(raw_jobs[:10])}. Return JSON list of {{id, score, reason}}"
    try:
        if not gemini_service.model:
            raise Exception("Gemini model unavailable")
        response = await asyncio.wait_for(
            asyncio.to_thread(lambda: gemini_service.model.generate_content(prompt)),
            timeout=12.0
        )
        rankings = json.loads(gemini_service._clean_json_response(response.text))
        
        suggestions = []
        for rank in rankings:
            job_data = next((j for j in raw_jobs if j.get("id") == rank["id"]), None)
            if job_data:
                suggestion = {
                    "user_email": email,
                    "job_data": job_data,
                    "ai_score": rank["score"],
                    "ai_reason": rank["reason"],
                    "created_at": datetime.utcnow(),
                    "status": "new"
                }
                suggestions.append(suggestion)
        if not suggestions:
            suggestions = _fallback_rank_jobs({**profile, "email": email}, raw_jobs[:10])
        
        if suggestions:
            # Clear old and insert new
            await db.job_suggestions.delete_many({"user_email": email})
            await db.job_suggestions.insert_many(suggestions)
            
        return [_to_jsonable_suggestion(s) for s in suggestions]
    except Exception as e:
        print(f"Suggestion Error: {e}")
        suggestions = _fallback_rank_jobs({**profile, "email": email}, raw_jobs[:10])
        if suggestions:
            await db.job_suggestions.delete_many({"user_email": email})
            await db.job_suggestions.insert_many(suggestions)
        return [_to_jsonable_suggestion(s) for s in suggestions]

# --- Standard Features ---

@router.get("/fetch-emails")
async def fetch_emails(access_token: str = Header(..., alias="access-token"), current_user: dict = Depends(get_current_user)):
    return await GmailService.read_emails(access_token, role="student", user_email=current_user["email"])

@router.post("/feedback/categorization")
async def feedback_categorization(
    email_id: str,
    is_correct: bool,
    correct_value: Optional[str] = None,
    predicted_category: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """Record feedback on a retrieved email categorization decision."""
    user_email = current_user["email"]
    fb = {
        "user_email": user_email,
        "entity_id": email_id,
        "type": "categorization",
        "is_correct": is_correct,
        "correct_value": correct_value or ("Other" if not is_correct else None),
        "predicted_category": predicted_category,
        "timestamp": datetime.utcnow()
    }
    # Upsert into an RL feedback collection (creates collection if needed)
    await db.rl_feedback.update_one(
        {"user_email": user_email, "entity_id": email_id, "type": "categorization"},
        {"$set": fb},
        upsert=True
    )
    return {"message": "Feedback recorded", "feedback": fb}

@router.post("/batch-match")
async def batch_match(payload: dict, current_user: dict = Depends(get_current_user)):
    """
    Rank a list of jobs against the current student's profile.
    Expects payload: { jobs: [{ id, title, description }, ...] }
    """
    jobs = payload.get("jobs") if isinstance(payload, dict) else None
    if not isinstance(jobs, list):
        raise HTTPException(status_code=400, detail="Invalid jobs payload")

    student = await db.students.find_one({"email": current_user["email"]})
    profile = (student or {}).get("profile", {})
    skills = [str(s).lower() for s in profile.get("skills", [])]
    interests = [str(i).lower() for i in profile.get("interests", [])]

    # Fast deterministic fallback scoring.
    fallback = []
    for j in jobs:
        jid = j.get("id")
        text = f"{j.get('title', '')} {j.get('description', '')}".lower()
        skill_hits = sum(1 for s in skills if s and s in text)
        interest_hits = sum(1 for i in interests if i and i in text)
        score = max(1, min(95, 35 + skill_hits * 10 + interest_hits * 8))
        fallback.append({
            "id": jid,
            "score": int(score),
            "reason": "Matched against your saved skills and interests.",
        })

    # If AI model unavailable, return fallback immediately.
    if not gemini_service.model:
        return fallback

    try:
        prompt = (
            "Rank these jobs for this student profile and return JSON array only. "
            "Each item must be {id, score, reason} with score 0-100.\n"
            f"Student profile: {json.dumps(profile)}\n"
            f"Jobs: {json.dumps(jobs[:20])}"
        )
        response = await asyncio.wait_for(
            asyncio.to_thread(lambda: gemini_service.model.generate_content(prompt)),
            timeout=10.0,
        )
        ranked = json.loads(gemini_service._clean_json_response(response.text))
        if not isinstance(ranked, list):
            return fallback
        valid_ids = {j.get("id") for j in jobs}
        cleaned = []
        for item in ranked:
            if not isinstance(item, dict):
                continue
            if item.get("id") not in valid_ids:
                continue
            cleaned.append({
                "id": item.get("id"),
                "score": int(item.get("score", 0)),
                "reason": str(item.get("reason", "AI-ranked based on profile-job fit.")),
            })
        return cleaned or fallback
    except Exception:
        return fallback

@router.get("/jobs-search")
async def search_jobs(query: str = "Jobs", country: str = "pk", location: Optional[str] = None):
    # RapidAPI JSearch only.
    jobs = await JSearchService.search_jobs(
        query=query,
        country=country,
        location=location,
        page=1,
        num_pages=1,
    )
    return jobs

@router.get("/career-analysis")
async def get_career_analysis(current_user: dict = Depends(get_current_user)):
    student = await db.students.find_one({"email": current_user["email"]})
    if not student or "profile" not in student:
        raise HTTPException(status_code=400, detail="Profile incomplete")
        
    profile = student["profile"]
    github_username = profile.get("github_username")
    
    if not github_username:
        # Default analysis if no github
        return {
            "github_stats": None,
            "ai_insights": {
                "interests": profile.get("interests", []),
                "recommended_roles": ["Junior Developer", "Software Engineer Intern"],
                "skills_gap": ["Build GitHub portfolio projects", "Strengthen system design basics"],
                "summary": f"Path towards {profile.get('interests', ['Tech'])[0]}. Add GitHub projects to unlock deeper AI insights."
            }
        }
        
    try:
        # Fetch GitHub data
        gh_data = await github_service.analyze_user(github_username)
        # Use Gemini to generate deep insights
        insights = await gemini_service.analyze_career_path(profile, gh_data)
        if not isinstance(insights, dict):
            insights = {}
        insights = {
            "interests": insights.get("interests", profile.get("interests", [])),
            "recommended_roles": insights.get("recommended_roles", ["Software Developer"]),
            "skills_gap": insights.get("skills_gap", []),
            "summary": insights.get("summary", "Your profile shows steady momentum toward software roles."),
        }
        return {
            "github_stats": gh_data,
            "ai_insights": insights
        }
    except Exception as e:
        print(f"Career analysis error: {e}")
        return {
            "github_stats": None,
            "ai_insights": {
                "interests": profile.get("interests", []),
                "recommended_roles": ["Software Developer"],
                "skills_gap": [],
                "summary": "We could not load AI insights right now. Please try again shortly."
            }
        }
