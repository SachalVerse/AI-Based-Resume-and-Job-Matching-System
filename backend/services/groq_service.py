import httpx
import json
from config import Config
from typing import Optional, List

class GroqService:
    def __init__(self):
        self.api_key = Config.GROQ_API_KEY
        self.api_url = "https://api.groq.com/openai/v1/chat/completions"
        self.model = "llama-3.3-70b-versatile"
        self.vision_model = "meta-llama/llama-4-scout-17b-16e-instruct"

    async def _call_vision(self, base64_image: str, prompt: str):
        if not self.api_key: return None
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.vision_model,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}
                        }
                    ]
                }
            ],
            "temperature": 0.1
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(self.api_url, headers=headers, json=payload, timeout=30.0)
                data = response.json()
                
                if "choices" in data:
                    return data["choices"][0]["message"]["content"]
                else:
                    print(f"⚠️ Groq Vision Error ({response.status_code}): {json.dumps(data)}")
                    return None
            except Exception as e:
                print(f"❌ Vision API Exception: {e}")
                return None

    async def _call_groq(self, messages: list, json_mode: bool = True):
        if not self.api_key:
            print("Groq API Key missing!")
            return None

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.1,
            "response_format": {"type": "json_object"} if json_mode else None
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(self.api_url, headers=headers, json=payload, timeout=30.0)
                response.raise_for_status()
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                return json.loads(content) if json_mode else content
            except Exception as e:
                print(f"Groq API Error: {e}")
                return None

    def _to_json_safe(self, data):
        from datetime import datetime
        from bson import ObjectId
        if isinstance(data, dict):
            return {k: self._to_json_safe(v) for k, v in data.items()}
        if isinstance(data, list):
            return [self._to_json_safe(i) for i in data]
        if isinstance(data, (datetime, ObjectId)):
            return str(data)
        return data

    async def extract_job_requirements(self, description: str):
        prompt = f"""
        Extract hiring requirements from this job description.
        Return ONLY a JSON object with these keys:
        - tech_stack: list of strings (technologies, languages, frameworks)
        - soft_skills: list of strings
        - experience_level: string (Junior, Mid, Senior, Lead)
        - required_experience_years: integer (best guess)
        - required_skills: list of strings
        - preferred_skills: list of strings
        - education: string

        Job Description:
        {description}
        """
        messages = [{"role": "user", "content": prompt}]
        return await self._call_groq(messages)

    async def get_match_analysis(self, student_profile: dict, job_details: dict, linkedin_posts: List[str] = []):
        prompt = f"""
        Analyze the match between this student and this job.
        Return a JSON object with:
        - score: integer (0-100)
        - reasons: list of strings (reasons for the score)
        - checklist: list of strings (matching criteria found)
        
        Student: {json.dumps(self._to_json_safe(student_profile))}
        Job: {json.dumps(self._to_json_safe(job_details))}
        LinkedIn Posts: {json.dumps(linkedin_posts)}
        """
        messages = [{"role": "user", "content": prompt}]
        return await self._call_groq(messages)

    async def categorize_email(self, email_content: str):
        prompt = f"""
        Categorize this email for a recruiter. 
        If the email is about someone applying for a job, sending a resume, or mentioning a match score, you MUST categorize it as 'Applicant'.
        
        Return a JSON object with:
        - category: one of [Applicant, Collaboration, Other, Spam]
        - intent_summary: short 1-sentence summary of the user's intent
        - urgency: one of [High, Medium, Low]
        - match_score: integer 0-100 (if it's an applicant, use the score mentioned in the email or estimate it)
        - match_reason: short reason (if it's an applicant)
        
        Email Content:
        {email_content}
        """
        messages = [{"role": "user", "content": prompt}]
        return await self._call_groq(messages)

    async def generate_cv_data(self, profile: dict, github_data: Optional[dict] = None):
        prompt = f"""
        Generate a professional structured CV based on this profile and GitHub data.
        Return ONLY a JSON object with the following structure:
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
                  "right": {{ "primary": "Date or Language" }}
                }},
                {{ "id": "f5", "type": "bullet", "value": "Specific achievement..." }}
              ]
            }}
          ],
          "education": "...",
          "experience": "...",
          "skills": ["..."]
        }}
        
        Profile: {json.dumps(self._to_json_safe(profile))}
        GitHub Data: {json.dumps(self._to_json_safe(github_data)) if github_data else "None"}
        """
        messages = [{"role": "user", "content": prompt}]
        return await self._call_groq(messages)

    async def analyze_career_path(self, profile: dict, github_data: Optional[dict] = None, linkedin_posts: List[str] = []):
        prompt = f"""
        Analyze this student's trajectory and determine career interests.
        Return JSON:
        {{
          "interests": ["list", "of", "interests"],
          "recommended_roles": ["role 1", "role 2"],
          "skills_gap": ["skill 1", "skill 2"],
          "summary": "1-2 professional sentences."
        }}
        
        Profile: {json.dumps(self._to_json_safe(profile))}
        GitHub Repos: {json.dumps(self._to_json_safe(github_data.get('repositories', []))) if github_data else "None"}
        LinkedIn Posts (Recent activity): {json.dumps(linkedin_posts)}
        """
        messages = [{"role": "user", "content": prompt}]
        return await self._call_groq(messages)

    async def tailor_resume(self, resume_data: dict, job_description: str):
        prompt = f"""
        Tailor this resume to match the job description.
        Return updated JSON in the SAME format.
        
        Job: {job_description}
        Resume: {json.dumps(resume_data)}
        """
        messages = [{"role": "user", "content": prompt}]
        return await self._call_groq(messages)

    async def extract_opportunity(self, email_text: str):
        prompt = f"""
        Analyze if this is a professional Opportunity (Job/Internship/Scholarship).
        If yes, return JSON with:
        - is_real: true
        - type: string
        - organisation: string
        - deadline: string
        - eligibility: string
        - link: string
        - location: string
        - stipend_or_salary: string
        
        If no, return {{"is_real": false}}.
        
        Email: {email_text}
        """
        messages = [{"role": "user", "content": prompt}]
        return await self._call_groq(messages)

    async def extract_bulk_opportunities(self, emails: List[str]):
        prompt = f"""
        Analyze these {len(emails)} emails and extract professional opportunities.
        Return a JSON list of objects. Irrelevant emails should have {{"is_real": false}}.
        
        Emails: {json.dumps(emails)}
        """
        messages = [{"role": "user", "content": prompt}]
        return await self._call_groq(messages)
    async def batch_match(self, profile: dict, jobs: List[dict]):
        prompt = f"""
        Rank these jobs for this student profile. 
        Return a JSON list of objects, each with:
        - id: the job id
        - score: integer (0-100)
        - reason: short sentence
        
        Profile: {json.dumps(self._to_json_safe(profile))}
        Jobs: {json.dumps(self._to_json_safe(jobs))}
        """
        messages = [{"role": "user", "content": prompt}]
        return await self._call_groq(messages)
    async def verify_candidate_capability(self, profile: dict, github_data: dict, evidence_text: str, linkedin_posts: List[str], job_role: str):
        prompt = f"""
        Act as a Senior Technical Hiring Manager and Forensic Skill Verifier.
        
        Analyze this candidate for the role of: {job_role}
        
        CANDIDATE PROFILE:
        {json.dumps(self._to_json_safe(profile))}

        CANDIDATE GITHUB DATA:
        - Total Repos: {github_data.get('public_repos', 0)}
        - Original (Non-Fork) Repos: {github_data.get('original_repos', 0)}
        - Total Stars: {github_data.get('total_stars', 0)}
        - Languages: {', '.join(github_data.get('languages', []))}
        - Account Age: {github_data.get('account_age', 0)} years
        
        LINKEDIN POSTS (SCRAPED):
        {json.dumps(linkedin_posts)}

        WORK EVIDENCE (Certificates/Project Docs Summary):
        {evidence_text}
        
        GOAL:
        Determine if the candidate's skills are REAL and if they are CAPABLE for this specific role.
        Cross-reference their GitHub activity with their LinkedIn posts and uploaded evidence.
        Identify any "Hiring Risks" (e.g. mismatch between LinkedIn claims and GitHub reality).
        
        Return a JSON object with:
        - verdict: (Hire / Interview / Reject)
        - skill_level: (Junior / Mid / Senior)
        - suitable_for_role: (Yes / No / Partial)
        - hiring_risk: (High / Medium / Low)
        - final_recommendation: (Short 2-sentence summary of capability)
        - analysis_points: list of 3-4 specific observations (e.g. "LinkedIn posts show deep knowledge of React which is backed by original GitHub repos")
        """
        messages = [{"role": "user", "content": prompt}]
        return await self._call_groq(messages)

    async def analyze_linkedin_data(self, structured_data: dict):
        """
        Production-level LinkedIn Data Analysis using the provided master prompt.
        """
        prompt = f"""
You are a senior technical recruiter and talent intelligence analyst with 15+ years of experience evaluating candidates for high-growth companies.

You will receive structured LinkedIn archive data for a candidate.

Your task is to:

1. Analyze professional experience depth.
2. Evaluate career growth trajectory.
3. Identify seniority level.
4. Detect job stability or job hopping.
5. Extract core technical competencies.
6. Evaluate leadership exposure.
7. Analyze communication quality from posts.
8. Identify potential red flags.
9. Assess industry alignment.
10. Generate an overall hire recommendation.

IMPORTANT RULES:
- Do NOT invent missing data.
- Base conclusions only on provided information.
- Be analytical and objective.
- Return ONLY valid JSON.
- No markdown.
- No explanations outside JSON.

Scoring Rules:

Seniority:
- 0-2 years → Junior
- 3-5 years → Mid
- 6-9 years → Senior
- 10+ years → Lead/Principal

Job Stability:
- High → Average tenure ≥ 2 years
- Medium → 1–2 years
- Low → < 1 year

Final Hire Score:
Scale from 1 to 10 based on:
- Experience depth (30%)
- Skill strength (25%)
- Career progression (15%)
- Stability (10%)
- Leadership exposure (10%)
- Communication quality (10%)

From the Shares data:
- Evaluate technical depth.
- Identify industry engagement.
- Detect knowledge sharing.
- Score communication clarity from 1-10.

Also provide:
- Strength summary (max 3 bullet insights)
- Weakness summary (max 3 bullet insights)

Return JSON in this format:

{{
  "experience_analysis": {{
    "total_years": number,
    "seniority_level": "",
    "career_growth_pattern": "",
    "job_stability": ""
  }},
  "skills_analysis": {{
    "core_skills": [],
    "advanced_skills": [],
    "skill_depth_assessment": ""
  }},
  "leadership_analysis": {{
    "has_leadership_experience": true/false,
    "leadership_indicators": []
  }},
  "communication_analysis": {{
    "professional_tone": "",
    "thought_leadership_score": number,
    "consistency_indicator": ""
  }},
  "risk_analysis": {{
    "red_flags": [],
    "employment_gaps_detected": true/false
  }},
  "summary": {{
    "top_strengths": [],
    "improvement_areas": []
  }},
  "final_evaluation": {{
    "final_hire_score": number,
    "recommendation": "Strong Hire | Hire | Consider | Reject",
    "confidence_level": "High | Medium | Low"
  }}
}}

Here is the candidate LinkedIn archive data:

{json.dumps(structured_data, indent=2)}
"""
        messages = [{"role": "user", "content": prompt}]
        return await self._call_groq(messages)
