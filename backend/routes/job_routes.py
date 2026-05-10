from fastapi import APIRouter, HTTPException, Depends, Header
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase
from routes.auth_routes import get_current_user
from database import get_db
from services.groq_service import GroqService

router = APIRouter(prefix="/jobs", tags=["Jobs"])
ai_service = GroqService()

class JobBase(BaseModel):
    title: str
    company: str
    location: Optional[str] = "Remote"
    salary_range: Optional[str] = None
    description: str

class JobCreate(JobBase):
    pass

class JobResponse(JobBase):
    id: str
    recruiter_email: str
    structured_requirements: dict
    created_at: datetime

@router.post("/", response_model=JobResponse)
async def create_job(payload: JobCreate, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    """
    Creates a new job posting and uses AI to extract structured requirements.
    """
    if current_user.get("role") != "recruiter":
        raise HTTPException(status_code=403, detail="Only recruiters can post jobs")

    # 1. AI Extraction of requirements
    try:
        structured_data = await ai_service.extract_job_requirements(payload.description)
    except Exception as e:
        print(f"AI Extraction Error: {e}")
        structured_data = {} # Fallback

    # 2. Save to DB
    job_doc = {
        "title": payload.title,
        "company": payload.company,
        "location": payload.location,
        "salary_range": payload.salary_range,
        "description": payload.description,
        "recruiter_email": current_user["email"],
        "structured_requirements": structured_data,
        "created_at": datetime.utcnow()
    }
    
    result = await db.jobs.insert_one(job_doc)
    job_doc["id"] = str(result.inserted_id)
    
    return job_doc

@router.get("/", response_model=List[JobResponse])
async def list_jobs(db: AsyncIOMotorDatabase = Depends(get_db)):
    """Lists all available jobs."""
    cursor = db.jobs.find().sort("created_at", -1)
    jobs = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        jobs.append(doc)
    return jobs

@router.get("/my-jobs", response_model=List[JobResponse])
async def list_my_jobs(current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    """Lists jobs posted by the current recruiter."""
    if current_user.get("role") != "recruiter":
        raise HTTPException(status_code=403, detail="Only recruiters can view their jobs")

    cursor = db.jobs.find({"recruiter_email": current_user["email"]}).sort("created_at", -1)
    jobs = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        jobs.append(doc)
    return jobs

@router.get("/{job_id}/match")
async def match_candidates(job_id: str, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    """
    AI-driven matching of all students against a specific job.
    """
    from bson import ObjectId
    
    # 1. Get Job
    job = await db.jobs.find_one({"_id": ObjectId(job_id)})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    # 2. Get Students
    cursor = db.students.find()
    students = await cursor.to_list(length=5) # Strictly limited to 5 for Free Tier API safety
    
    matches = []
    for student in students:
        # 3. AI Match Analysis
        # Note: In production, we'd cache this or run it in background
        analysis = await ai_service.get_match_analysis(student, job)
        
        matches.append({
            "student_email": student["email"],
            "student_name": student.get("name", "Unknown"),
            "score": analysis.get("score", 0),
            "reasons": analysis.get("reasons", []),
            "checklist": analysis.get("checklist", [])
        })
    
    # 4. Sort by score
    matches.sort(key=lambda x: x["score"], reverse=True)
    return matches
from fastapi import APIRouter, HTTPException, Depends, Header, File, UploadFile
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

class ApplyRequest(BaseModel):
    evidence_text: Optional[str] = ""

@router.post("/{job_id}/apply")
async def apply_for_job(
    job_id: str, 
    cv: UploadFile = File(...),
    certificates: List[UploadFile] = File([]),
    current_user: dict = Depends(get_current_user), 
    db: AsyncIOMotorDatabase = Depends(get_db),
    access_token: Optional[str] = Header(None, alias="access-token")
):
    """
    Records a student application with CV, Certificates, GitHub, and LinkedIn Post analysis.
    """
    from bson import ObjectId
    from services.email_sender import EmailSender
    from services.github_service import GithubService
    
    import base64
    import io
    import PyPDF2
    import asyncio
    
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Only students can apply for jobs")

    # 1. Get Job & Student
    job = await db.jobs.find_one({"_id": ObjectId(job_id)})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    student = await db.students.find_one({"email": current_user["email"]})
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    # 2. Process CV (Required)
    cv_content = await cv.read()
    cv_text = ""
    if cv.content_type == "application/pdf":
        try:
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(cv_content))
            for page in pdf_reader.pages[:3]: # Read first 3 pages
                cv_text += page.extract_text()
        except Exception as e:
            print(f"CV Processing Error: {e}")
            cv_text = "CV uploaded but text extraction failed."
    
    # 3. Process Certificates (Optional)
    evidence_summary = ""
    for cert in certificates:
        content = await cert.read()
        if cert.content_type == "application/pdf":
            try:
                pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
                text = ""
                for page in pdf_reader.pages[:1]:
                    text += page.extract_text()
                
                if len(text.strip()) < 50:
                    import pdfplumber
                    with pdfplumber.open(io.BytesIO(content)) as pdf:
                        page = pdf.pages[0]
                        img = page.to_image(resolution=150)
                        img_buffer = io.BytesIO()
                        img.original.save(img_buffer, format="JPEG", quality=85)
                        b64_pdf_img = base64.b64encode(img_buffer.getvalue()).decode("utf-8")
                        cert_summary = await ai_service._call_vision(b64_pdf_img, "Read this certificate and summarize its achievement.")
                else:
                    summary_prompt = f"Summarize this certificate: {text[:500]}"
                    cert_summary = await ai_service._call_groq([{"role": "user", "content": summary_prompt}], json_mode=False)
                
                evidence_summary += f"\n- {cert.filename}: {cert_summary}"
            except:
                evidence_summary += f"\n- {cert.filename}: Certificate document."
        elif cert.content_type.startswith("image/"):
            try:
                b64 = base64.b64encode(content).decode("utf-8")
                vision_desc = await ai_service._call_vision(b64, "Describe what this certificate proves.")
                evidence_summary += f"\n- {cert.filename}: {vision_desc}"
            except:
                evidence_summary += f"\n- {cert.filename}: Image evidence."

    # 4. Fetch LinkedIn Posts
    linkedin_cursor = db.linkedin_posts.find({"user_email": current_user["email"]}).sort("saved_at", -1).limit(10)
    linkedin_posts = [p["text"] async for p in linkedin_cursor]
    
    if linkedin_posts:
        evidence_summary += "\n\nLINKEDIN POSTS EXTRACTED:"
        for idx, post in enumerate(linkedin_posts):
            post_snippet = post if len(post) < 200 else post[:197] + "..."
            evidence_summary += f"\n- Post {idx+1}: {post_snippet}"

    # 5. GitHub Audit
    github_username = student.get("profile", {}).get("github_username")
    github_audit = {}
    if github_username:
        try:
            github_audit = await GithubService().get_user_data(github_username)
        except Exception as e:
            print(f"GitHub Audit Error: {e}")

    # 6. Comprehensive AI Verification
    verification_report = {}
    try:
        verification_report = await ai_service.verify_candidate_capability(
            profile=student.get("profile", {}),
            github_data=github_audit,
            evidence_text=f"CV CONTENT:\n{cv_text}\n\nCERTIFICATES:\n{evidence_summary}",
            linkedin_posts=linkedin_posts,
            job_role=job["title"]
        )
    except Exception as e:
        print(f"Verification Error: {e}")
        verification_report = {"verdict": "Check Manually", "hiring_risk": "Medium"}

    # 7. AI Match Score
    try:
        analysis = await ai_service.get_match_analysis(student, job)
        score = analysis.get("score", 0)
    except:
        score = 0

    # 8. Send Email to Recruiter
    email_status = "not_sent"
    if access_token:
        try:
            github_summary = "No GitHub profile provided."
            if github_audit and "error" not in github_audit:
                github_prompt = f"Summarize this GitHub profile: {github_audit}"
                github_summary = await ai_service._call_groq([{"role": "user", "content": github_prompt}], json_mode=False)

            subject = f"APPLICATION: {job['title']} - {student.get('name')} [{verification_report.get('verdict')}]"
            
            observations = chr(10).join(['- ' + p for p in verification_report.get('analysis_points', [])])
            
            body = f"""
            Hello {job['company']} Team,
            
            New Applicant: {student.get('name')} ({current_user['email']})
            AI Match Score: {score}%
            AI Verdict: {verification_report.get('verdict')}
            Risk Level: {verification_report.get('hiring_risk')}
            
            TECHNICAL SUMMARY:
            {verification_report.get('final_recommendation')}
            
            OBSERVATIONS:
            {observations}

            --------------------------------------------------
            EVIDENCE & CERTIFICATES EXTRACTED:
            --------------------------------------------------
            {evidence_summary if evidence_summary.strip() else 'No extra certificates uploaded.'}
            
            GITHUB INSIGHTS:
            {github_summary}
            
            The applicant's CV is attached.
            """
            
            email_result = EmailSender.send_application_as_student(
                access_token=access_token,
                to_email=job["recruiter_email"],
                subject=subject,
                body=body,
                pdf_content=cv_content # Attach the uploaded CV
            )
            email_status = "sent" if "success" in email_result else "failed"
        except Exception as e:
            print(f"Email Error: {e}")
            email_status = "error"

    # 9. Record Application
    application = {
        "job_id": job_id,
        "job_title": job["title"],
        "company": job["company"],
        "recruiter_email": job.get("recruiter_email"),
        "student_email": current_user["email"],
        "student_name": student.get("name", "Applicant"),
        "status": "pending",
        "ai_score": score,
        "verification_report": verification_report,
        "github_audit": github_audit,
        "linkedin_posts_count": len(linkedin_posts),
        "extracted_evidence": evidence_summary,
        "email_status": email_status,
        "applied_at": datetime.utcnow()
    }
    await db.applications.insert_one(application)
    
    return {
        "message": "Application submitted successfully!", 
        "score": score,
        "verdict": verification_report.get("verdict"),
        "email_status": email_status
    }
