from fastapi import APIRouter, Depends, HTTPException, status
from auth_deps import get_current_user
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from config import Config
from database import db
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from urllib.request import Request, urlopen
import json
import jwt

router = APIRouter(prefix="/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=Config.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, Config.SECRET_KEY, algorithm=Config.ALGORITHM)

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Legacy email/password login."""
    user = await db.recruiters.find_one({"email": form_data.username})
    role = "recruiter"
    if not user:
        user = await db.students.find_one({"email": form_data.username})
        role = "student"
        
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    access_token = create_access_token(data={"sub": user["email"], "role": role})
    return {"access_token": access_token, "token_type": "bearer", "role": role}

@router.post("/google")
async def google_auth(payload: dict):
    """
    Unified Google OAuth:
    1. Verify ID Token
    2. Sync user (upsert)
    3. Return System JWT + Role
    """
    token = payload.get("id_token")
    access_token = payload.get("access_token")
    if not token and not access_token:
        raise HTTPException(status_code=400, detail="Missing id_token or access_token")

    try:
        # 1. Verify with Google.
        # Prefer OIDC id_token, but do not hard-fail if it cannot be verified.
        # Some providers/flows may omit or rotate token fields; in that case,
        # fallback to userinfo with access_token.
        idinfo = None
        if token:
            try:
                idinfo = id_token.verify_oauth2_token(
                    token,
                    google_requests.Request(),
                    Config.GOOGLE_CLIENT_ID,
                )
            except Exception as verify_err:
                print(f"Google id_token verify failed; trying access_token fallback: {verify_err}")

        if not idinfo:
            if not access_token:
                raise HTTPException(status_code=401, detail="Invalid Google token payload")
            req = Request(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            with urlopen(req, timeout=10) as response:
                idinfo = json.loads(response.read().decode("utf-8"))

        email = idinfo.get("email")
        name = idinfo.get("name", "")
        picture = idinfo.get("picture", "")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid Google user info")

        # 2. Check/Upsert User + resolve selected role
        student = await db.students.find_one({"email": email})
        recruiter = await db.recruiters.find_one({"email": email})
        role_pref = await db.user_roles.find_one({"email": email})
        preferred_role = role_pref.get("role") if role_pref else None

        user = student or recruiter
        role = None
        if preferred_role in ["student", "recruiter"]:
            role = preferred_role
        elif recruiter:
            role = recruiter.get("role") or "recruiter"
        elif student:
            role = student.get("role") or "student"

        if not user:
            # Create a placeholder user if they don't exist
            # Note: We don't know the role yet, so role=None
            await db.students.update_one(
                {"email": email},
                {"$set": {"name": name, "picture": picture, "created_at": datetime.utcnow()}},
                upsert=True
            )
            role = None # Frontend will catch this and show onboarding

        # 3. Issue System JWT
        access_token = create_access_token(data={"sub": email, "role": role})
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "role": role,
            "user": {"email": email, "name": name, "picture": picture}
        }
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google Token")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Google Token")
@router.post("/set-role")
async def set_role(payload: dict):
    """Updates user role after first login."""
    email = payload.get("email")
    role = payload.get("role") # 'student' or 'recruiter'
    
    if role not in ["student", "recruiter"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    # Persist selected role as single source of truth for next logins.
    await db.user_roles.update_one(
        {"email": email},
        {"$set": {"email": email, "role": role, "updated_at": datetime.utcnow()}},
        upsert=True,
    )

    # Ensure role-specific profile doc exists.
    if role == "student":
        await db.students.update_one({"email": email}, {"$set": {"role": "student"}}, upsert=True)
    else:
        await db.recruiters.update_one({"email": email}, {"$set": {"role": "recruiter"}}, upsert=True)
        
    return {"message": "Role updated successfully"}

@router.get("/session")
async def session(current_user: dict = Depends(get_current_user)):
    """
    Return current authenticated session for frontend session management.
    Requires Authorization: Bearer <token>.
    Defensive: catch unexpected errors to return a clean 500 with a message.
    """
    try:
        return current_user
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Session retrieval failed: {e}")
