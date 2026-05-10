import zipfile
import io
import pandas as pd
import json
from typing import Dict, List, Any, Optional
from datetime import datetime

class LinkedInService:
    @staticmethod
    def parse_linkedin_zip(zip_bytes: bytes) -> Dict[str, Any]:
        """
        Parses a LinkedIn data export ZIP file and extracts relevant CSV data.
        """
        data = {
            "positions": [],
            "skills": [],
            "education": [],
            "shares": [],
            "certifications": [],
            "pre_calculations": {}
        }
        
        try:
            with zipfile.ZipFile(io.BytesIO(zip_bytes)) as z:
                # Map expected files in the ZIP to our data keys
                file_map = {
                    "Positions.csv": "positions",
                    "Skills.csv": "skills",
                    "Education.csv": "education",
                    "Shares.csv": "shares",
                    "Certifications.csv": "certifications"
                }
                
                for zip_info in z.infolist():
                    filename = zip_info.filename.split('/')[-1] # Handle nested folders
                    if filename in file_map:
                        with z.open(zip_info) as f:
                            df = pd.read_csv(f)
                            data[file_map[filename]] = df.to_dict(orient="records")

            # Perform Pre-Calculations
            data["pre_calculations"] = LinkedInService._calculate_metrics(data)
            
            return data
        except Exception as e:
            print(f"Error parsing LinkedIn ZIP: {e}")
            return data

    @staticmethod
    def _calculate_metrics(data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculates metrics as recommended:
        - Total years of experience
        - Average tenure
        - Number of promotions
        - Number of roles
        - Number of posts
        - Skills count
        """
        metrics = {
            "total_years_experience": 0,
            "average_tenure_years": 0,
            "num_promotions": 0,
            "num_roles": len(data["positions"]),
            "num_posts": len(data["shares"]),
            "skills_count": len(data["skills"])
        }
        
        if not data["positions"]:
            return metrics

        # Total years and tenure
        total_days = 0
        roles_by_company = {}
        
        for pos in data["positions"]:
            start_str = pos.get("Started On")
            end_str = pos.get("Finished On")
            company = pos.get("Company Name")
            
            # Simple promotion detection: same company, different role
            if company:
                roles_by_company[company] = roles_by_company.get(company, 0) + 1
            
            try:
                # Format is usually 'Month Year' like 'Jan 2020' or '2020-01'
                # LinkedIn exports can vary, but pandas usually handles it well
                start_date = pd.to_datetime(start_str)
                if pd.isna(end_str) or str(end_str).lower() == 'present':
                    end_date = pd.Timestamp.now()
                else:
                    end_date = pd.to_datetime(end_str)
                
                days = (end_date - start_date).days
                if days > 0:
                    total_days += days
            except:
                continue

        metrics["total_years_experience"] = round(total_days / 365.25, 1)
        if metrics["num_roles"] > 0:
            metrics["average_tenure_years"] = round(metrics["total_years_experience"] / metrics["num_roles"], 1)
        
        # Promotions: Number of companies where user had > 1 role
        metrics["num_promotions"] = sum(1 for count in roles_by_company.values() if count > 1)
        
        return metrics
