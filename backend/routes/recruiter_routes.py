from fastapi import APIRouter, HTTPException, Depends, Header
from auth_deps import get_current_user
from database import db
from models import JobPost
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from pydantic import BaseModel
from services.gmail_service import GmailService

router = APIRouter(prefix="/recruiter", tags=["recruiter"])

class StatusUpdate(BaseModel):
    status: str

class CriteriaUpdate(BaseModel):
    criteria: str


@router.get("/fetch-emails")
async def fetch_recruiter_emails(
    access_token: str = Header(..., alias="access-token"),
    current_user: dict = Depends(get_current_user),
):
    return await GmailService.read_emails(
        access_token,
        role="recruiter",
        user_email=current_user["email"],
    )


@router.post("/feedback/categorization")
async def recruiter_feedback_categorization(
    email_id: str,
    is_correct: bool,
    correct_value: Optional[str] = None,
    predicted_category: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    fb = {
        "user_email": current_user["email"],
        "entity_id": email_id,
        "type": "categorization",
        "is_correct": is_correct,
        "correct_value": correct_value or ("Other" if not is_correct else None),
        "predicted_category": predicted_category,
        "timestamp": datetime.utcnow(),
    }
    await db.rl_feedback.update_one(
        {"user_email": current_user["email"], "entity_id": email_id, "type": "categorization"},
        {"$set": fb},
        upsert=True,
    )
    return {"message": "Feedback recorded", "feedback": fb}


@router.get("/applicant-matches")
async def get_applicant_matches(
    min_score: int = 0,
    current_user: dict = Depends(get_current_user),
):
    """
    Return recruiter inbox emails categorized as Applicant, sorted by AI match score.
    This supports a mail-driven recruiter workflow without job posting dependency.
    """
    query = {
        "user_email": current_user["email"],
        "role": "recruiter",
        "category": "Applicant",
    }
    cursor = db.emails.find(query).sort("fetched_at", -1)
    rows = await cursor.to_list(None)
    items = []
    for r in rows:
        r["_id"] = str(r["_id"])
        score = int((r.get("ai_details") or {}).get("match_score") or 0)
        if score < min_score:
            continue
        r["match_score"] = score
        items.append(r)
    items.sort(key=lambda x: x.get("match_score", 0), reverse=True)
    return items

# --- Recruiter Profile / Criteria ---

@router.get("/profile")
async def get_recruiter_profile(current_user: dict = Depends(get_current_user)):
    recruiter = await db.recruiters.find_one({"email": current_user["email"]})
    if not recruiter:
        return {"criteria": ""}
    recruiter["_id"] = str(recruiter["_id"])
    return recruiter

@router.post("/profile")
async def save_recruiter_profile(data: CriteriaUpdate, current_user: dict = Depends(get_current_user)):
    await db.recruiters.update_one(
        {"email": current_user["email"]},
        {"$set": {"criteria": data.criteria, "updated_at": datetime.utcnow()}},
        upsert=True
    )
    return {"message": "Profile saved"}

# --- Job Management ---

@router.post("/jobs")
async def post_job(job: JobPost, current_user: dict = Depends(get_current_user)):
    job_data = job.dict()
    job_data["recruiter_email"] = current_user["email"]
    result = await db.jobs.insert_one(job_data)
    return {"id": str(result.inserted_id), "message": "Job posted successfully"}

@router.get("/jobs")
async def get_my_jobs(current_user: dict = Depends(get_current_user)):
    cursor = db.jobs.find({"recruiter_email": current_user["email"]}).sort("created_at", -1)
    jobs = await cursor.to_list(None)
    for job in jobs:
        job["_id"] = str(job["_id"])
        # Attach candidate count
        job["candidate_count"] = await db.applications.count_documents({"job_id": str(job["_id"])})
    return jobs

@router.patch("/jobs/{job_id}/status")
async def update_job_status(job_id: str, data: StatusUpdate, current_user: dict = Depends(get_current_user)):
    if data.status not in ["active", "closed"]:
        raise HTTPException(status_code=400, detail="Invalid status. Must be 'active' or 'closed'.")
    result = await db.jobs.update_one(
        {"_id": ObjectId(job_id), "recruiter_email": current_user["email"]},
        {"$set": {"status": data.status, "updated_at": datetime.utcnow()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Job not found or unauthorized")
    return {"message": f"Job status updated to {data.status}"}

# --- Candidate / Application Management ---

@router.get("/jobs/{job_id}/candidates")
async def get_job_candidates(job_id: str, current_user: dict = Depends(get_current_user)):
    # Verify job belongs to this recruiter
    job = await db.jobs.find_one({"_id": ObjectId(job_id), "recruiter_email": current_user["email"]})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or access denied")

    cursor = db.applications.find({"job_id": job_id}).sort("ai_score", -1)
    candidates = await cursor.to_list(None)
    for c in candidates:
        c["_id"] = str(c["_id"])
    return candidates

@router.post("/applications/{app_id}/status")
async def update_application_status(
    app_id: str,
    status: str,
    current_user: dict = Depends(get_current_user)
):
    if status not in ["shortlisted", "rejected", "pending"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    result = await db.applications.update_one(
        {"_id": ObjectId(app_id), "recruiter_email": current_user["email"]},
        {"$set": {"status": status, "updated_at": datetime.utcnow()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Application not found or unauthorized")
    return {"message": f"Candidate {status}"}

@router.get("/shortlisted")
async def get_all_shortlisted(current_user: dict = Depends(get_current_user)):
    cursor = db.applications.find({
        "recruiter_email": current_user["email"],
        "status": "shortlisted"
    }).sort("applied_at", -1)
    shortlisted = await cursor.to_list(None)
    for s in shortlisted:
        s["_id"] = str(s["_id"])
    return shortlisted

# Legacy alias used by old dashboard
@router.get("/candidates")
async def get_all_candidates(current_user: dict = Depends(get_current_user)):
    cursor = db.applications.find({"recruiter_email": current_user["email"]}).sort("ai_score", -1)
    candidates = await cursor.to_list(None)
    for c in candidates:
        c["_id"] = str(c["_id"])
    return candidates
