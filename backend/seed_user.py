"""
Script to create a test admin user in the database
Run this once to create an initial admin account
"""
import asyncio
import sys
from pathlib import Path
from dotenv import load_dotenv
import os
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def create_admin_user():
    """Create a test admin user"""
    email = "admin@example.com"
    password = "admin123"  # Change this to a secure password
    
    # Check if user already exists
    existing = await db.users.find_one({"email": email})
    if existing:
        print(f"User {email} already exists!")
        return
    
    # Hash password
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # Create user document
    user_doc = {
        "email": email,
        "password_hash": password_hash,
        "role": "admin",
        "name": "Admin User"
    }
    
    # Insert user
    await db.users.insert_one(user_doc)
    print(f"✅ Created admin user:")
    print(f"   Email: {email}")
    print(f"   Password: {password}")
    print(f"   Role: admin")
    print(f"\n⚠️  Remember to change the password after first login!")

async def main():
    try:
        await create_admin_user()
        print("\n✅ User creation complete!")
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(main())

