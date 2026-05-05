from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel
from database import db
from bson import ObjectId
from datetime import datetime
from services.gemini_service import GeminiService
from services.github_service import GithubService

gemini = GeminiService()
github = GithubService()

router = APIRouter(prefix="/resumes", tags=["resumes"])

class ResumeData(BaseModel):
    name: str
    content: dict
    user_email: str

@router.post("/")
async def save_resume(data: ResumeData):
    resume = data.dict()
    resume["updated_at"] = datetime.utcnow()
    
    # Check if we should update or create
    # For simplicity, we'll assume the frontend sends a unique name/email combo or we use IDs
    # But for now, let's just insert
    result = await db.resumes.insert_one(resume)
    return {"id": str(result.inserted_id), "message": "Resume saved successfully"}

@router.get("/{user_email}")
async def get_user_resumes(user_email: str):
    resumes = []
    async for r in db.resumes.find({"user_email": user_email}):
        r["id"] = str(r["_id"])
        del r["_id"]
        resumes.append(r)
    return resumes

@router.get("/detail/{resume_id}")
async def get_resume_detail(resume_id: str):
    if not ObjectId.is_valid(resume_id):
        # Handle custom string IDs (like tailored resumes)
        r = await db.resumes.find_one({"_id": resume_id})
    else:
        r = await db.resumes.find_one({"_id": ObjectId(resume_id)})
        
    if not r:
        raise HTTPException(status_code=404, detail="Resume not found")
    r["id"] = str(r["_id"])
    del r["_id"]
    return r

@router.delete("/{resume_id}")
async def delete_resume(resume_id: str):
    query = {"_id": ObjectId(resume_id)} if ObjectId.is_valid(resume_id) else {"_id": resume_id}
    await db.resumes.delete_one(query)
    return {"message": "Resume deleted"}

@router.put("/{resume_id}")
async def update_resume(resume_id: str, data: ResumeData):
    update_data = data.dict()
    update_data["updated_at"] = datetime.utcnow()
    query = {"_id": ObjectId(resume_id)} if ObjectId.is_valid(resume_id) else {"_id": resume_id}
    await db.resumes.update_one(
        query,
        {"$set": update_data}
    )
    return {"message": "Resume updated"}

class GithubGenerateRequest(BaseModel):
    user_email: str
    github_username: str

@router.post("/generate-from-github")
async def generate_from_github(req: GithubGenerateRequest):
    # 1. Fetch student profile
    student = await db.students.find_one({"email": req.user_email})
    profile = student.get("profile", {}) if student else {}
    
    # 2. Fetch GitHub data
    github_data = await github.get_user_data(req.github_username)
    
    # 3. Generate CV via AI
    cv_json = await gemini.generate_cv_data(profile, github_data)
    
    if not cv_json:
        raise HTTPException(status_code=500, detail="Failed to generate CV via AI")
        
    # 4. Save to DB
    resume_doc = {
        "name": f"GitHub Resume - {req.github_username}",
        "content": cv_json,
        "user_email": req.user_email,
        "updated_at": datetime.utcnow()
    }
    result = await db.resumes.insert_one(resume_doc)
    
    return {"id": str(result.inserted_id), "message": "Resume generated and saved"}
