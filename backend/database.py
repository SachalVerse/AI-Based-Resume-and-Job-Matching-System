import motor.motor_asyncio
from config import Config

class Database:
    def __init__(self):
        self.client = motor.motor_asyncio.AsyncIOMotorClient(Config.MONGODB_URL)
        self.db = self.client[Config.DB_NAME]
        
        # Primary Collections
        self.users = self.db.users
        self.students = self.db.students
        self.recruiters = self.db.recruiters
        self.user_roles = self.db.user_roles
        self.jobs = self.db.jobs
        self.applications = self.db.applications
        self.resumes = self.db.resumes
        self.job_suggestions = self.db.job_suggestions
        self.rl_feedback = self.db.rl_feedback
        self.emails = self.db.emails

    async def ensure_indexes(self):
        # User & Profile Indexes
        await self.users.create_index("email", unique=True)
        await self.students.create_index("email", unique=True)
        await self.recruiters.create_index("email", unique=True)
        await self.user_roles.create_index("email", unique=True)
        
        # Operational Indexes
        await self.jobs.create_index([("recruiter_email", 1), ("status", 1)])
        await self.applications.create_index([("job_id", 1), ("status", 1)])
        await self.applications.create_index([("student_email", 1), ("job_id", 1)], unique=True)
        
        # AI & Suggestions
        await self.job_suggestions.create_index([("user_email", 1), ("created_at", -1)])
        await self.rl_feedback.create_index("user_email")
        await self.emails.create_index([("id", 1), ("user_email", 1), ("role", 1)], unique=True)
        await self.emails.create_index([("user_email", 1), ("role", 1), ("category", 1)])
        
        print("SaaS Database indexes ensured.")

db = Database()
