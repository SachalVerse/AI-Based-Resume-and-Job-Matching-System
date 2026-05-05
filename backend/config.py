import os
from pathlib import Path
from dotenv import load_dotenv

# Load from the local .env in the backend directory
load_dotenv(dotenv_path=Path(__file__).parent / ".env")


class Config:
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
    MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    DB_NAME = os.getenv("DB_NAME", "ai_job_matcher")
    SECRET_KEY = os.getenv("SECRET_KEY", "replace_this_with_a_secure_key_in_production")
    # RapidAPI key for JSearch (Jobs API). Subscribe at RapidAPI → JSearch → copy key.
    RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 30
    # Comma-separated origins, e.g. "http://localhost:3000,https://app.example.com"
    # Use "*" only for quick local tests (disables allow_credentials in main.py).
    CORS_ORIGINS = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    )
    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
