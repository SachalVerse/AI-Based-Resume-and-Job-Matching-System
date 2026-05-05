import numpy as np
from database import db
from datetime import datetime
from typing import List, Optional

class MLService:
    _instance = None
    _model = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MLService, cls).__new__(cls)
        return cls._instance

    @property
    def model(self):
        if self._model is None:
            # Lazy load for production performance and error isolation
            try:
                from sentence_transformers import SentenceTransformer
                self._model = SentenceTransformer('all-MiniLM-L6-v2')
            except ImportError:
                print("⚠️ ML: sentence_transformers not installed. Semantic matching disabled.")
                self._model = False # Sentinel for failure
            except Exception as e:
                print(f"⚠️ ML: Failed to load model (DLL/Torch issue): {e}")
                self._model = False # Sentinel for failure
        return self._model if self._model is not False else None

    def get_embedding(self, text: str) -> List[float]:
        """Generate a vector for semantic matching."""
        if not self.model or not text:
            return []
        return self.model.encode(text, convert_to_numpy=True).tolist()

    def get_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """Optimized batch encoding for high-performance ranking."""
        if not self.model or not texts:
            return []
        return self.model.encode(texts, convert_to_numpy=True, batch_size=32).tolist()

    async def log_feedback(self, recruiter_email: str, job_id: str, candidate_id: str, action: str):
        """
        Logs feedback for Reinforcement Learning.
        Actions: 'shortlist' (+1.0 reward), 'reject' (-0.5 reward)
        """
        reward = 1.0 if action == "shortlist" else -0.5
        
        feedback_entry = {
            "recruiter_email": recruiter_email,
            "job_id": job_id,
            "candidate_id": candidate_id,
            "action": action,
            "reward": reward,
            "timestamp": datetime.utcnow()
        }
        await db.rl_feedback.insert_one(feedback_entry)
        return {"status": "feedback_logged", "reward": reward}

    @staticmethod
    def calculate_cosine_similarity(vec1, vec2):
        """Manual cosine similarity calculation."""
        if not vec1 or not vec2:
            return 0.0
        a = np.array(vec1)
        b = np.array(vec2)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return float(np.dot(a, b) / (norm_a * norm_b))
