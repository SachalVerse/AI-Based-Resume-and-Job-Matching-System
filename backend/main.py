from fastapi import FastAPI, Form, Response
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware
from config import Config
from routes import auth_routes, student_routes, recruiter_routes, resume_routes
from services.resume_service import ResumeService
from database import db
import uvicorn
import asyncio

app = FastAPI(
    title="AI Resume & Job Matcher",
    description="Professional SaaS-ready AI recruitment platform",
    version="1.0.0"
)

@app.on_event("startup")
async def startup_db_client():
    await db.ensure_indexes()

# Optimized CORS Configuration
cors_origins = [o.strip() for o in (Config.CORS_ORIGINS or "http://localhost:3000").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins or ["*"],
    allow_credentials=True if cors_origins else False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Route Registration
app.include_router(auth_routes.router)
app.include_router(student_routes.router)
app.include_router(recruiter_routes.router)
app.include_router(resume_routes.router)

@app.get("/")
async def health_check():
    return {"status": "online", "version": "1.0.0"}

@app.post("/generate-pdf", tags=["resumes"])
async def generate_pdf_endpoint(
    name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    education: str = Form(...),
    experience: str = Form(...),
    skills: str = Form(...),
    linkedin: Optional[str] = Form(None),
    github: Optional[str] = Form(None)
):
    """Offloads PDF generation to a threadpool to prevent blocking the event loop."""
    data = {
        "name": name, "email": email, "phone": phone,
        "linkedin": linkedin or "", "github": github or "",
        "education": education, "experience": experience,
        "skills": skills
    }
    pdf_content = await asyncio.to_thread(ResumeService.generate_pdf, data)
    return Response(
        content=pdf_content, 
        media_type="application/pdf", 
        headers={"Content-Disposition": f"attachment; filename={name.replace(' ', '_')}_Resume.pdf"}
    )

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
