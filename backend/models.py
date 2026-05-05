from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# --- Student Models ---

class StudentProfile(BaseModel):
    name: str
    education: str
    degree: Optional[str] = None
    skills: List[str] = []
    interests: List[str] = []
    github_username: Optional[str] = None
    cgpa: Optional[float] = None
    location: Optional[str] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ResumeData(BaseModel):
    user_email: str
    github_username: str
    content: Dict[str, Any]
    created_at: datetime = Field(default_factory=datetime.utcnow)

# --- Recruiter & Job Models ---

class JobPost(BaseModel):
    recruiter_email: str
    title: str
    company: str
    description: str
    location: str
    type: str = "Full-time"  # Full-time, Internship, etc.
    requirements: List[str] = []
    salary_range: Optional[str] = None
    status: str = "active"  # active, closed
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Application(BaseModel):
    job_id: str
    recruiter_email: str
    student_email: str
    student_name: str
    resume_url: Optional[str] = None
    ai_score: int = 0
    ai_reason: Optional[str] = None
    status: str = "pending"  # pending, shortlisted, rejected
    applied_at: datetime = Field(default_factory=datetime.utcnow)

# --- Feedback & AI Models ---

class JobSuggestion(BaseModel):
    user_email: str
    job_data: Dict[str, Any]
    ai_score: int
    ai_reason: str
    status: str = "new"  # new, viewed, applied
    created_at: datetime = Field(default_factory=datetime.utcnow)

class RlFeedback(BaseModel):
    user_email: str
    entity_id: str  # email_id or job_id
    type: str  # categorization or matching
    is_correct: bool
    correct_value: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
