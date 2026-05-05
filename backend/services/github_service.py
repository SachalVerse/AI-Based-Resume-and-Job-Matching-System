from github import Github
from config import Config

class GithubService:
    def __init__(self):
        self.g = Github(Config.GITHUB_TOKEN) if Config.GITHUB_TOKEN else None

    async def get_user_data(self, username: str):
        if not self.g:
            return {"error": "GitHub token not configured"}
        
        try:
            user = self.g.get_user(username)
            repos = user.get_repos()
            languages = set()
            repo_list = []
            
            for repo in repos[:20]: # Fetch more for better context
                repo_list.append({
                    "name": repo.name,
                    "stars": repo.stargazers_count,
                    "language": repo.language,
                    "description": repo.description or ""
                })
                if repo.language:
                    languages.add(repo.language)
            
            return {
                "name": user.name,
                "bio": user.bio,
                "public_repos": user.public_repos,
                "languages": list(languages),
                "top_repos": repo_list
            }
        except Exception as e:
            return {"error": str(e)}
