from google import genai
from google.genai import types
import json
import time
import asyncio
from typing import Optional, List
from config import Config

class GeminiService:
    def __init__(self): 
        if Config.GEMINI_API_KEY:
            self.client = genai.Client(api_key=Config.GEMINI_API_KEY)
            self.model_name = 'gemini-2.5-flash' # Using the latest 2.5 Flash
        else:
            self.client = None 

    def _clean_json_response(self, text: str) -> str:
        """Removes markdown code blocks from AI response."""
        text = text.strip()
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        return text

    async def _safe_call(self, prompt: str, image_bytes: Optional[bytes] = None, json_mode: bool = True, mime_type: str = "image/jpeg"):
        """
        Executes a Gemini call with Exponential Backoff for 429 Quota errors.
        """
        if not self.client: return None
        
        for attempt in range(3):
            try:
                # Prepare contents
                contents = [prompt]
                if image_bytes:
                    contents.append(types.Part.from_bytes(data=image_bytes, mime_type=mime_type))

                # Use run_in_executor for blocking SDK call
                loop = asyncio.get_event_loop()
                response = await loop.run_in_executor(
                    None,
                    lambda: self.client.models.generate_content(
                        model=self.model_name,
                        contents=contents
                    )
                )
                
                text = response.text
                if json_mode:
                    return json.loads(self._clean_json_response(text))
                return text.strip()

            except Exception as e:
                err_str = str(e).lower()
                if "429" in err_str or "quota" in err_str:
                    wait_time = (attempt + 1) * 10
                    print(f"⚠️ Gemini Quota Hit (429). Attempt {attempt+1}/3. Waiting {wait_time}s...")
                    await asyncio.sleep(wait_time)
                    continue
                print(f"❌ Gemini Service Error: {e}")
                break
        return None

    async def analyze_image(self, image_bytes: bytes, prompt: str, mime_type: str = "image/jpeg") -> Optional[str]:
        """
        Uses Gemini Vision to analyze an image or PDF concisely.
        """
        return await self._safe_call(prompt, image_bytes=image_bytes, json_mode=False, mime_type=mime_type)

    async def extract_opportunity(self, email_text: str):
        prompt = f"Analyze if this is a real job/internship opportunity. Return JSON: {{'is_real': bool, 'type': str, ...}}. Email: {email_text}"
        return await self._safe_call(prompt)

    async def get_match_analysis(self, student_profile: dict, job_details: dict):
        prompt = f"Analyze match between student and job. Return JSON with score and reasons. Profile: {student_profile}, Job: {job_details}"
        return await self._safe_call(prompt)

    async def generate_cv_data(self, profile: dict, github_data: Optional[dict] = None):
        prompt = f"Generate professional CV data based on profile and github. Profile: {profile}, Github: {github_data}"
        return await self._safe_call(prompt)

    async def extract_job_requirements(self, description: str) -> dict:
        prompt = f"Extract requirements from job description. Return JSON. Job: {description}"
        return await self._safe_call(prompt)
