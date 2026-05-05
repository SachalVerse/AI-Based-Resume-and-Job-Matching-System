from database import db
import asyncio

async def clear_emails():
    try:
        result = await db.emails.delete_many({})
        print(f"Cleared {result.deleted_count} emails.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(clear_emails())
