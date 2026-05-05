from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional

class StudentModel(BaseModel):
    name: str
    email: EmailStr
    password: str
    degree: Optional[str] = None
    semester: Optional[int] = None
    cgpa: Optional[float] = None
    skills: List[str] = []
    location: Optional[str] = None
    github_username: Optional[str] = None
    github_skills: List[str] = []
    email_accounts: List[str] = []
    preferences: dict = {}

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    degree: Optional[str] = None
    cgpa: Optional[float] = None
    skills: Optional[List[str]] = None
