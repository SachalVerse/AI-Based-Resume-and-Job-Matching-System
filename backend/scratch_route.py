import os

file_path = r'c:\Users\Sachal\Desktop\AI-Based Resume and Job Matching System\backend\routes\recruiter_routes.py'
with open(file_path, 'a', encoding='utf-8') as f:
    f.write('''

class InterviewEmailRequest(BaseModel):
    student_email: str
    job_title: str
    student_name: str

@router.post("/send-interview-email")
async def send_interview_email(
    req: InterviewEmailRequest,
    access_token: str = Header(..., alias="access-token"),
    current_user: dict = Depends(get_current_user)
):
    from services.email_sender import EmailSender
    subject = f"Interview Request: {req.job_title}"
    body = f"""Hello {req.student_name},

We have reviewed your application and technical insights via our Recruitment Platform.
We are very impressed with your background and would like to invite you for an interview for the {req.job_title} role.

Please let us know your availability for a brief technical discussion this week.

Best regards,
The Recruitment Team
"""
    result = EmailSender.send_application_as_student(
        access_token=access_token,
        to_email=req.student_email,
        subject=subject,
        body=body.strip()
    )
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return {"message": "Interview email sent successfully!"}
''')
print('Added /send-interview-email to recruiter_routes.py')
