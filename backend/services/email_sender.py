import base64
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials

class EmailSender:
    @staticmethod
    def send_application_as_student(access_token: str, to_email: str, subject: str, body: str, pdf_content: bytes = None):
        try:
            credentials = Credentials(token=access_token)
            service = build("gmail", "v1", credentials=credentials)
            
            msg = MIMEMultipart()
            msg["To"] = to_email
            msg["Subject"] = subject
            msg.attach(MIMEText(body, "plain"))
            
            if pdf_content:
                part = MIMEBase("application", "octet-stream")
                part.set_payload(pdf_content)
                encoders.encode_base64(part)
                part.add_header("Content-Disposition", "attachment; filename=Resume.pdf")
                msg.attach(part)
                
            raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()
            service.users().messages().send(userId="me", body={"raw": raw}).execute()
            
            return {"success": True}
        except Exception as e:
            return {"error": str(e)}
