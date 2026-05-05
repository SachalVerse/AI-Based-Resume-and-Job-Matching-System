import google.generativeai as genai
import json
from typing import Optional, List
from config import Config

class GeminiService:
    def __init__(self): 
        if Config.GEMINI_API_KEY:
            genai.configure(api_key=Config.GEMINI_API_KEY)
            # Use stable 2.5 flash for production
            self.model = genai.GenerativeModel('gemini-2.5-flash') 
        else:
            self.model = None 

    def _clean_json_response(self, text: str) -> str:
        """Removes markdown code blocks from AI response."""
        text = text.strip()
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        return text

    def _is_non_job_product_email(self, email_text: str) -> bool:
        """
        Deterministic guardrail for product/tutorial/onboarding mails that are
        frequently misclassified as opportunities by LLMs.
        """
        t = (email_text or "").lower()
        block_terms = [
            "onboarding",
            "milestone",
            "getting started",
            "quickstart",
            "tutorial",
            "docs",
            "documentation",
            "product update",
            "release notes",
            "changelog",
            "verify your email",
            "welcome to",
            "mapbox onboarding",
            "render a map",
            "custom data tileset",
        ]
        return any(term in t for term in block_terms)

    async def extract_opportunity(self, email_text: str, user_email: Optional[str] = None):
        if not self.model: return None
        if self._is_non_job_product_email(email_text):
            return {"is_real": False, "reason": "non_job_product_or_onboarding_email"}
        
        # RL Enhancement: Fetch recent corrections to 'train' the prompt dynamically
        from database import db
        rl_context = ""
        if user_email:
            recent_feedback = await db.rl_feedback.find(
                {"user_email": user_email, "is_correct": False}
            ).sort("timestamp", -1).limit(5).to_list(None)
            
            if recent_feedback:
                rl_context = "\nPAST CORRECTIONS (Learn from these mistakes):\n"
                for fb in recent_feedback:
                    rl_context += (
                        f"- Email ID {fb.get('entity_id', 'unknown')} was wrongly categorized as "
                        f"{fb.get('predicted_category', 'unknown')}. "
                        f"Correct category: {fb.get('correct_value', 'Other')}.\n"
                    )

        prompt = f"""
        Analyze the following email and decide if it's a REAL EXTERNAL professional job, internship, or scholarship opportunity. 
        {rl_context}
        
        CRITICAL REJECTION CRITERIA:
        - REJECT all academic content: student assignments, homework, university coursework, quiz reminders, exam notifications, grading alerts, lab reports, or class project submissions. 
        - REJECT all system emails: "Mail Delivery Subsystem", "mailer-daemon", "Undelivered Mail", "Security Alert", "Verification Code", "Subscription Confirmed".
        - REJECT emails from learning platforms like Canvas, Moodle, Google Classroom, or university portals.
        - Even if it says "New Project" or "Submission", if it's for a class, it is NOT an opportunity.
        - REJECT product onboarding/tutorial/docs emails, including milestone/checklist/getting-started messages (example: "Mapbox Onboarding: Display a map", "Add data tileset").
        - DO NOT treat generic "onboarding" wording as hiring onboarding unless the email clearly contains job-application context (role, hiring team/recruiter, interview/apply link).
        
        If it's a real external professional opportunity, extract these 9 fields in JSON format:
        1. type (Job/Scholarship/Fellowship/Internship)
        2. organisation
        3. deadline
        4. eligibility
        5. documents_required
        6. link
        7. contact_email
        8. location
        9. stipend_or_salary
        
        If it is academic, SPAM, product/tutorial onboarding, or not a professional opportunity, return {{ "is_real": false }}.
        
        Email: {email_text}
        """
        try:
            import asyncio
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, lambda: self.model.generate_content(prompt))
            return json.loads(self._clean_json_response(response.text))
        except Exception as e:
            print(f"Gemini Extraction Error: {e}")
            return None

    async def extract_bulk_opportunities(self, emails: List[str]):
        if not self.model or not emails: return []
        
        prompt = f"""
        Analyze these {len(emails)} emails. For each, decide if it's a real professional opportunity (Job/Internship/Scholarship).
        
        Return a JSON list of objects. If an email is academic, spam, or irrelevant, its object should be {{ "is_real": false }}.
        Otherwise, extract: type, organisation, deadline, eligibility, documents_required, link, contact_email, location, stipend_or_salary.
        
        Emails:
        {json.dumps(emails)}
        """
        try:
            import asyncio
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, lambda: self.model.generate_content(prompt))
            return json.loads(self._clean_json_response(response.text))
        except Exception as e:
            print(f"Gemini Bulk Extraction Error: {e}")
            return [{"is_real": False}] * len(emails)

    async def extract_recruiter_opportunity(self, email_text: str, criteria: str = ""):
        if not self.model: return None
        
        prompt = f"""
        Analyze the following email from a Recruiter's perspective. 
        
        RECRUITER'S HIRING CRITERIA:
        "{criteria}"
        
        CATEGORIES:
        1. "Applicant": Someone sending a resume, CV, or applying for a job.
        2. "Collaboration": Business partnerships, vendor offers, or other company-to-company requests.
        
        If it's an Applicant, evaluate them against the RECRUITER'S HIRING CRITERIA and provide a match_score (0-100).
        
        Extract these fields in JSON format:
        - type (Applicant/Collaboration)
        - sender_name
        - intent_summary (1 short sentence)
        - contact_info
        - match_score (Number 0-100, set to 0 for Collaboration)
        - match_reason (Why did they get this score?)
        
        If it is SPAM or irrelevant, return {{ "is_real": false }}.
        
        Email: {email_text}
        """
        try:
            import asyncio
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, lambda: self.model.generate_content(prompt))
            return json.loads(self._clean_json_response(response.text))
        except Exception as e:
            print(f"Gemini Recruiter Extraction Error: {e}")
            return None

    async def get_match_analysis(self, student_profile: dict, job_details: dict):
        if not self.model: return {"score": 0, "feedback": "AI Not Configured"}
        
        prompt = f"""
        Compare this student profile with the job details. 
        Calculate a match score out of 100 based on these criteria:
        1. CGPA (20 pts): Does student CGPA meet job requirement?
        2. Degree (15 pts): Match between {student_profile.get('degree')} and {job_details.get('eligibility')}
        3. Skills (25 pts): Match between {student_profile.get('skills')} and job needs.
        4. Location (10 pts): {student_profile.get('location_pref')} vs {job_details.get('location')}
        5. Type (10 pts): {student_profile.get('pref_types')} vs {job_details.get('type')}
        6. Stipend (10 pts): Does it meet financial need {student_profile.get('financial_need')}?
        7. Experience (10 pts): {student_profile.get('experience')} vs job requirements.

        Return JSON: {{"score": 85, "reasons": ["Met CGPA", "Skill match"], "checklist": ["Prepare CV", "Check deadline"]}}
        
        Student Profile: {student_profile}
        Opportunity Details: {job_details}
        """
        try:
            import asyncio
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, lambda: self.model.generate_content(prompt))
            return json.loads(self._clean_json_response(response.text))
        except Exception as e:
            print(f"Gemini Match Analysis Error: {e}")
            return {"score": 50, "reasons": ["Error parsing AI response"], "checklist": []}
            
    async def filter_candidates(self, candidates: list, job_requirements: str):
        if not self.model: return "AI Not Configured"
        prompt = f"Filter these candidates for the job: {job_requirements}. Return only those who meet 70% of requirements. Candidates: {candidates}"
        import asyncio
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(None, lambda: self.model.generate_content(prompt))
        return response.text

    async def tailor_resume(self, resume_data: dict, job_description: str):
        if not self.model: return resume_data
        
        prompt = f"""
        Tailor the following resume data to match this job description. Optimize 'experience' and 'skills'.
        Return the updated resume data in the EXACT SAME JSON format as the input.
        
        Job Description: {job_description}
        Resume Data: {json.dumps(resume_data)}
        """
        try:
            import asyncio
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, lambda: self.model.generate_content(prompt))
            return json.loads(self._clean_json_response(response.text))
        except Exception as e:
            print(f"Gemini Tailor Error: {e}")
            return resume_data

    async def generate_cv_data(self, profile: dict, github_data: Optional[dict] = None):
        if not self.model: return None
        
        prompt = f"""
        Act as an expert Technical Recruiter and Resume Writer. 
        Create a high-impact, professional resume in JSON format for the following user.
        
        CRITICAL INSTRUCTIONS:
        1. NAME: Use the name provided in GitHub Data (or the GitHub username if name is not set) as the primary "name".
        2. PROJECTS: Every project MUST be based on the provided GitHub repositories. 
           - Use repository READMEs, descriptions, and primary languages.
           - DO NOT invent projects or generic bullet points. 
           - For each project, write 2-3 technical bullet points describing what the code actually does.
           - Use the "right.primary" field for the primary language.
           - Use the "subtitle" field for the full tech stack (e.g., "React, Node.js, AWS").
        3. EXPERIENCE: If the user has professional experience in their profile, include it.
        4. SKILLS: Group skills logically (Languages, Frameworks, Tools).
        
        The JSON structure MUST follow this exactly:
        {{
          "name": "Full Name",
          "contact": [
            {{ "id": "1", "value": "{profile.get('email', 'email@example.com')}", "url": "mailto:{profile.get('email', '')}" }},
            {{ "id": "2", "value": "github.com/{github_data.get('login') if github_data else 'username'}", "url": "{github_data.get('html_url') if github_data else 'https://github.com'}" }}
          ],
          "sections": [
            {{
              "id": "sec1",
              "title": "Professional Summary",
              "fields": [
                {{ "id": "f1", "type": "text", "value": "Summary text..." }}
              ]
            }},
            {{
              "id": "sec2",
              "title": "Technical Skills",
              "fields": [
                {{ "id": "f2", "type": "bullet", "value": "Languages: Python, JS..." }}
              ]
            }},
            {{
              "id": "sec3",
              "title": "Key Projects & Contributions",
              "fields": [
                {{ 
                  "id": "f4", 
                  "type": "heading", 
                  "value": "Project Name",
                  "subtitle": "Tech Stack used",
                  "right": {{
                    "primary": "Date or Primary Language"
                  }}
                }},
                {{ "id": "f5", "type": "bullet", "value": "Specific achievement based on repo data..." }}
              ]
            }}
          ]
        }}

        Profile Data: {json.dumps(profile)}
        GitHub Data: {json.dumps(github_data) if github_data else "No GitHub data available"}
        
        Tone: Professional, ambitious, and technically accurate.
        Return ONLY the JSON.
        """
        try:
            import asyncio
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, lambda: self.model.generate_content(prompt))
            return json.loads(self._clean_json_response(response.text))
        except Exception as e:
            print(f"Gemini CV Generation Error: {e}")
            return None

    async def analyze_career_path(self, profile: dict, github_data: Optional[dict] = None):
        if not self.model: return None
        
        prompt = f"""
        Analyze this student's GitHub repositories and profile.
        Determine:
        1. Primary Technical Interests (e.g. AI, Backend, Web)
        2. Recommended Job Roles (e.g. Junior Python Developer, Cloud Engineer)
        3. Skills GAP (What they should learn next)
        
        Return JSON:
        {{
          "interests": ["list", "of", "interests"],
          "recommended_roles": ["role 1", "role 2"],
          "skills_gap": ["skill 1", "skill 2"],
          "summary": "1-2 professional sentences about their trajectory."
        }}
        
        Profile: {json.dumps(profile)}
        GitHub Repos: {json.dumps(github_data.get('repositories', [])) if github_data else "None"}
        """
        try:
            import asyncio
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, lambda: self.model.generate_content(prompt))
            return json.loads(self._clean_json_response(response.text))
        except Exception as e:
            print(f"Gemini Career Analysis Error: {e}")
            return {"interests": [], "recommended_roles": ["Software Developer"], "skills_gap": [], "summary": "Start your career journey today."}
