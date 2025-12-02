"""
Script to check users in the database
"""
import asyncio
from pathlib import Path
from dotenv import load_dotenv
import os
from motor.motor_asyncio import AsyncIOMotorClient

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def check_users():
    """List all users in the database"""
    try:
        users = await db.users.find({}, {"_id": 0, "email": 1, "role": 1, "name": 1}).to_list(length=100)
        if users:
            print(f"✅ Found {len(users)} user(s) in database:")
            for user in users:
                print(f"   - Email: {user.get('email')}, Role: {user.get('role')}, Name: {user.get('name', 'N/A')}")
        else:
            print("❌ No users found in database!")
    except Exception as e:
        print(f"❌ Error checking users: {e}")

async def main():
    try:
        await check_users()
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(main())

