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
        print(f"DEBUG: Validating token: {token[:10]}...")
        payload = jwt.decode(
            token, 
            Config.SECRET_KEY, 
            algorithms=[Config.ALGORITHM],
            options={"leeway": 60}
        )
        email: str = payload.get("sub")
        role: str = payload.get("role")
        if email is None:
            print("DEBUG: Email not found in payload")
            raise credentials_exception
        return {"email": email, "role": role}
    except JWTError as e:
        print(f"DEBUG: JWT Decode Error: {e}")
        # Fallback: accept Google OAuth access token when app JWT is unavailable/expired.
        try:
            print("DEBUG: Attempting Google fallback...")
            info = await asyncio.to_thread(_google_userinfo, token)
            email = info.get("email")
            if not email:
                print("DEBUG: No email from Google userinfo")
                raise credentials_exception
            
            # Check for existing user or create/resolve role
            student = await db.students.find_one({"email": email})
            recruiter = await db.recruiters.find_one({"email": email})
            role = "student" if student else ("recruiter" if recruiter else None)
            return {"email": email, "role": role}
        except Exception as ge:
            print(f"DEBUG: Google Fallback Error: {ge}")
            raise credentials_exception

async def require_role(role: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation not permitted for this role"
        )
    return current_user
