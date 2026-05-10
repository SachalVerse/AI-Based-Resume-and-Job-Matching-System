from github import Github
from config import Config

class GithubService:
    def __init__(self):
        self.g = Github(Config.GITHUB_TOKEN) if Config.GITHUB_TOKEN else None

    async def get_user_data(self, username: str):
        print(f"DEBUG: Attempting GitHub Audit for user: {username}")
        if not self.g:
            print("❌ ERROR: GitHub Token missing in GithubService!")
            return {"error": "GitHub token not configured"}
        
        try:
            from datetime import datetime
            user = self.g.get_user(username)
            repos = user.get_repos()
            
            languages = set()
            repo_list = []
            total_stars = 0
            original_repos = 0
            
            for repo in repos:
                total_stars += repo.stargazers_count
                if not repo.fork:
                    original_repos += 1
                
                if len(repo_list) < 20:
                    repo_list.append({
                        "name": repo.name,
                        "stars": repo.stargazers_count,
                        "language": repo.language,
                        "description": repo.description or "",
                        "is_fork": repo.fork
                    })
                
                if repo.language:
                    languages.add(repo.language)
            
            # Calculate account age
            from datetime import datetime, timezone
            created_at = user.created_at # PyGithub returns aware UTC
            now = datetime.now(timezone.utc)
            account_age = round((now - created_at).days / 365.1, 1)
            
            return {
                "login": user.login,
                "name": user.name,
                "bio": user.bio,
                "public_repos": user.public_repos,
                "original_repos": original_repos,
                "total_stars": total_stars,
                "account_age": account_age,
                "created_at": created_at.isoformat(),
                "languages": list(languages),
                "top_repos": repo_list
            }
        except Exception as e:
            print(f"❌ GitHub Audit Failed for {username}: {e}")
            return {"error": str(e)}
