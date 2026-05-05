"""
JSearch via RapidAPI (https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch).
Set RAPIDAPI_KEY in the project root .env — never commit real keys.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

import httpx

from config import Config

JSEARCH_HOST = "jsearch.p.rapidapi.com"
SEARCH_URL = f"https://{JSEARCH_HOST}/search"


class JSearchService:
    @staticmethod
    def _headers() -> Optional[Dict[str, str]]:
        key = Config.RAPIDAPI_KEY
        if not key:
            return None
        return {
            "X-RapidAPI-Key": key.strip(),
            "X-RapidAPI-Host": JSEARCH_HOST,
        }

    @staticmethod
    def normalize_job(raw: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "id": raw.get("job_id"),
            "employer_name": raw.get("employer_name"),
            "employer_logo": raw.get("employer_logo"),
            "job_title": raw.get("job_title"),
            "job_description": raw.get("job_description"),
            "job_city": raw.get("job_city"),
            "job_country": raw.get("job_country"),
            "job_min_salary": raw.get("job_min_salary"),
            "job_max_salary": raw.get("job_max_salary"),
            "job_salary_currency": raw.get("job_salary_currency"),
            "job_employment_type": raw.get("job_employment_type"),
            "job_apply_link": raw.get("job_apply_link"),
            "source": "jsearch",
        }

    @staticmethod
    async def search_jobs(
        query: str = "software developer",
        country: str = "us",
        location: Optional[str] = None,
        page: int = 1,
        num_pages: int = 1,
        language: str = "en",
    ) -> List[Dict[str, Any]]:
        headers = JSearchService._headers()
        if not headers:
            return []

        params: Dict[str, Any] = {
            "query": query.strip() or "Jobs",
            "country": country.lower().strip(),
            "page": max(1, page),
            "num_pages": max(1, min(num_pages, 5)),
            "language": language,
        }
        if location and str(location).strip():
            params["location"] = str(location).strip()

        async with httpx.AsyncClient(timeout=45.0) as client:
            try:
                r = await client.get(SEARCH_URL, headers=headers, params=params)
                if r.status_code != 200:
                    print(f"JSearch HTTP {r.status_code}: {r.text[:300]}")
                    return []
                body = r.json()
                data = body.get("data") or []
                return [JSearchService.normalize_job(j) for j in data if isinstance(j, dict)]
            except Exception as e:
                print(f"JSearch Error: {e}")
                return []

    @staticmethod
    async def job_details(
        job_id: str,
        country: str = "us",
        language: str = "en",
    ) -> Optional[Dict[str, Any]]:
        """GET /job-details — same host, RapidAPI JSearch."""
        headers = JSearchService._headers()
        if not headers or not job_id:
            return None
        url = f"https://{JSEARCH_HOST}/job-details"
        params = {
            "job_id": job_id,
            "country": country.lower().strip(),
            "language": language,
        }
        async with httpx.AsyncClient(timeout=45.0) as client:
            try:
                r = await client.get(url, headers=headers, params=params)
                if r.status_code != 200:
                    return None
                body = r.json()
                data = body.get("data")
                if isinstance(data, list) and data:
                    return JSearchService.normalize_job(data[0])
                if isinstance(data, dict):
                    return JSearchService.normalize_job(data)
                return None
            except Exception as e:
                print(f"JSearch job-details error: {e}")
                return None
