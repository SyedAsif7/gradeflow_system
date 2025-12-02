"""
Test script to verify password hashing and verification
"""
import asyncio
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

def verify_password(password: str, hashed: str) -> bool:
    """Verify a password against a hash"""
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    except Exception as e:
        print(f"Error verifying password: {e}")
        return False

async def test_login():
    """Test login with the created user"""
    email = "admin@example.com"
    password = "admin123"
    
    try:
        user = await db.users.find_one({"email": email}, {"_id": 0})
        if not user:
            print(f"❌ User {email} not found!")
            return
        
        print(f"✅ User found: {user.get('email')}")
        print(f"   Role: {user.get('role')}")
        print(f"   Password hash: {user.get('password_hash')[:50]}...")
        
        # Test password verification
        password_hash = user.get('password_hash')
        if verify_password(password, password_hash):
            print(f"✅ Password verification: SUCCESS")
        else:
            print(f"❌ Password verification: FAILED")
            print(f"   Trying to rehash password...")
            
            # Rehash the password
            new_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            await db.users.update_one(
                {"email": email},
                {"$set": {"password_hash": new_hash}}
            )
            print(f"✅ Password rehashed and updated in database")
            print(f"   Try logging in again now!")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

async def main():
    try:
        await test_login()
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(main())

