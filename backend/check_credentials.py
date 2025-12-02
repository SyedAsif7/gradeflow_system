"""Script to check all user credentials in the database"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def check_credentials():
    """Check all user accounts in the database"""
    users = await db.users.find({}, {"_id": 0, "email": 1, "role": 1, "name": 1}).to_list(1000)
    
    print("\n" + "=" * 60)
    print("📊 USER ACCOUNTS IN DATABASE")
    print("=" * 60)
    print(f"\nTotal Users: {len(users)}\n")
    
    admins = [u for u in users if u.get('role') == 'admin']
    teachers = [u for u in users if u.get('role') == 'teacher']
    students = [u for u in users if u.get('role') == 'student']
    
    print(f"👔 Admins: {len(admins)}")
    for admin in admins:
        print(f"   - {admin.get('name', 'N/A')} ({admin.get('email', 'N/A')})")
    
    print(f"\n👨‍🏫 Teachers: {len(teachers)}")
    for teacher in teachers:
        print(f"   - {teacher.get('name', 'N/A')} ({teacher.get('email', 'N/A')})")
    
    print(f"\n👨‍🎓 Students: {len(students)}")
    if len(students) > 0:
        print(f"   (Showing first 5)")
        for student in students[:5]:
            print(f"   - {student.get('name', 'N/A')} ({student.get('email', 'N/A')})")
        if len(students) > 5:
            print(f"   ... and {len(students) - 5} more")
    
    print("\n" + "=" * 60)
    print("✅ All accounts are stored in the database!")
    print("=" * 60)
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_credentials())

