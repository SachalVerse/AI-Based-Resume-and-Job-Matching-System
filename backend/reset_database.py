import asyncio
import sys
from database import db

async def reset_database():
    print("!!! WARNING: THIS WILL PERMANENTLY DELETE ALL COLLECTIONS !!!")
    confirm = input("Are you absolutely sure you want to reset the database? (type 'RESET'): ")
    
    if confirm != "RESET":
        print("Database reset aborted.")
        return

    print("\nResetting database...")
    
    collections = [
        "users", "students", "recruiters", "jobs", 
        "applications", "resumes", "job_suggestions", 
        "rl_feedback", "emails"
    ]
    
    for coll in collections:
        print(f" - Dropping {coll}...")
        await db.db[coll].drop()
        
    print("\nRe-initializing indexes...")
    await db.ensure_indexes()
    
    print("\nDatabase Reset Successfully Completed.")

if __name__ == "__main__":
    asyncio.run(reset_database())
