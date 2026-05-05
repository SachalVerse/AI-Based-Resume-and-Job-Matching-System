from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from config import Config
from database import db
from urllib.request import Request, urlopen
import json
import asyncio

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def _google_userinfo(access_token: str) -> dict:
    req = Request(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    with urlopen(req, timeout=10) as response:
        return json.loads(response.read().decode("utf-8"))

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, Config.SECRET_KEY, algorithms=[Config.ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role")
        if email is None:
            raise credentials_exception
        return {"email": email, "role": role}
    except JWTError:
        # Fallback: accept Google OAuth access token when app JWT is unavailable/expired.
        try:
            info = await asyncio.to_thread(_google_userinfo, token)
            email = info.get("email")
            if not email:
                raise credentials_exception

            student = await db.students.find_one({"email": email})
            recruiter = await db.recruiters.find_one({"email": email})
            role = "student" if student else ("recruiter" if recruiter else None)
            return {"email": email, "role": role}
        except Exception:
            raise credentials_exception

async def require_role(role: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation not permitted for this role"
        )
    return current_user
