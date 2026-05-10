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
from services.groq_service import GroqService
from services.gmail_service import GmailService

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

github_service = GithubService()
groq_service = GroqService()

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
        gh_data = await github_service.get_user_data(github_username)
        # Use Groq to generate deep insights
        insights = await groq_service.analyze_career_path(profile, gh_data)
            
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


