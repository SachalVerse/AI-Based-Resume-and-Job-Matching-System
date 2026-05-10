from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from fastapi import HTTPException
from database import db
from datetime import datetime, timedelta
import base64
from typing import Optional

class GmailService:
    @staticmethod
    def _apply_feedback_override(email_doc: dict, feedback_map: dict) -> dict:
        override = feedback_map.get(email_doc.get("id"))
        if override:
            email_doc["category"] = override.get("correct_value") or "Other"
            email_doc["ai_details"] = None
            email_doc["feedback_overridden"] = True
        return email_doc

    @staticmethod
    async def read_emails(
        access_token: str,
        role: str = "student",
        max_emails: int = 20,
        user_email: Optional[str] = None,
    ):
        try:
            credentials = Credentials(token=access_token)
            service = build("gmail", "v1", credentials=credentials)
            
            user_info = service.users().getProfile(userId="me").execute()
            # Prefer the email provided by the caller if present, otherwise fall back to Gmail profile
            if user_email is None:
                user_email = user_info.get("emailAddress")

            # 2. Query last 20 days
            twenty_days_ago = (datetime.now() - timedelta(days=20)).strftime("%Y/%m/%d")
            query = f"after:{twenty_days_ago} (label:INBOX OR label:SPAM)"
            
            results = service.users().messages().list(userId="me", q=query, maxResults=max_emails).execute()
            messages = results.get("messages", [])
            
            from services.groq_service import GroqService
            ai_service = GroqService()

            wrong_feedback_cursor = db.rl_feedback.find({
                "user_email": user_email,
                "type": "categorization",
                "is_correct": False,
            })
            wrong_feedback_list = await wrong_feedback_cursor.to_list(None)
            feedback_map = {
                f.get("entity_id"): {
                    "correct_value": f.get("correct_value") or "Other"
                }
                for f in wrong_feedback_list
                if f.get("entity_id")
            }
            
            emails = []
            for msg in messages:
                cached = await db.emails.find_one({"id": msg["id"], "user_email": user_email, "role": role})
                if cached:
                    cached = GmailService._apply_feedback_override(cached, feedback_map)
                    cached.pop("_id", None)
                    emails.append(cached)
                    continue

                txt = service.users().messages().get(userId="me", id=msg["id"], format="full").execute()
                payload = txt.get("payload", {})
                headers = payload.get("headers", [])
                
                subject = next((h["value"] for h in headers if h["name"].lower() == "subject"), "No Subject")
                sender = next((h["value"] for h in headers if h["name"].lower() == "from"), "Unknown Sender")
                date = next((h["value"] for h in headers if h["name"].lower() == "date"), "")
                snippet = txt.get("snippet", "")
                labels = txt.get("labelIds", [])
                
                # 4. AI Categorization & Extraction
                category = "Other"
                ai_details = None
                if "SPAM" in labels:
                    category = "Spam"
                else:
                    email_body = f"Subject: {subject}\nSender: {sender}\nSnippet: {snippet}"
                    
                    if role == "student":
                        # For students, we want to find opportunities
                        opp = await ai_service.extract_opportunity(email_body)
                        if opp and opp.get("is_real"):
                            category = opp.get("type", "Opportunity")
                            ai_details = opp
                        else:
                            category = "Other"
                    else:
                        # For recruiters, we use categorization
                        analysis = await ai_service.categorize_email(email_body)
                        if analysis:
                            category = analysis.get("category", "Other")
                            ai_details = analysis

                email_data = {
                    "id": msg["id"], 
                    "user_email": user_email,
                    "role": role,
                    "snippet": snippet,
                    "subject": subject,
                    "sender": sender,
                    "date": date,
                    "labels": labels,
                    "category": category,
                    "ai_details": ai_details,
                    "fetched_at": datetime.now()
                }
                email_data = GmailService._apply_feedback_override(email_data, feedback_map)
                
                await db.emails.update_one(
                    {"id": msg["id"], "user_email": user_email, "role": role},
                    {"$set": email_data},
                    upsert=True
                )
                
                email_data.pop("_id", None)
                emails.append(email_data)
                
            return emails
        except Exception as e:
            error_msg = str(e)
            if "invalid_grant" in error_msg or "refresh" in error_msg.lower():
                raise HTTPException(status_code=401, detail="Google session expired. Please sign in again.")
            raise HTTPException(status_code=500, detail=f"Gmail API Error: {error_msg}")
