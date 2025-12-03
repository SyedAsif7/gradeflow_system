"""
Script to create a sample student login account
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
from pathlib import Path
import uuid
from datetime import datetime, timezone
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

async def create_sample_student_login():
    """Create a user account for a sample student"""
    print("\n" + "=" * 60)
    print("👨‍🎓 Creating Sample Student Login")
    print("=" * 60)
    
    # Get a student (preferably from SY)
    student = await db.students.find_one({"class_name": "SY"}, {"_id": 0})
    if not student:
        # Try any student
        student = await db.students.find_one({}, {"_id": 0})
    
    if not student:
        print("❌ No students found! Please import students first.")
        return
    
    print(f"\n✅ Found student: {student.get('name')}")
    print(f"   Roll Number: {student.get('roll_number')}")
    print(f"   Email: {student.get('email')}")
    print(f"   Class: {student.get('class_name')}")
    
    # Check if user account already exists
    existing_user = await db.users.find_one({"email": student.get('email')}, {"_id": 0})
    
    if existing_user:
        print(f"\n✅ User account already exists!")
        print(f"   Email: {existing_user.get('email')}")
        print(f"   Role: {existing_user.get('role')}")
        print(f"\n💡 To login, use:")
        print(f"   Email: {student.get('email')}")
        print(f"   Password: {student.get('roll_number')} (or the password set during registration)")
    else:
        # Create user account with default password (roll number)
        default_password = student.get('roll_number', 'student123')
        user_doc = {
            "id": str(uuid.uuid4()),
            "name": student.get('name'),
            "email": student.get('email'),
            "role": "student",
            "password_hash": hash_password(default_password),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user_doc)
        print(f"\n✅ Created user account!")
        print(f"\n🔐 Login Credentials:")
        print(f"   Email: {student.get('email')}")
        print(f"   Password: {default_password}")
        print(f"\n💡 Default password is the student's roll number.")
        print(f"   Student can change it after first login.")
    
    # Show student's answer sheets if any
    answer_sheets = await db.answer_sheets.find(
        {"student_id": student.get('id')},
        {"_id": 0, "id": 1, "exam_id": 1, "status": 1, "marks_obtained": 1}
    ).to_list(10)
    
    if answer_sheets:
        print(f"\n📝 Answer Sheets for this student: {len(answer_sheets)}")
        for sheet in answer_sheets:
            exam = await db.exams.find_one({"id": sheet.get('exam_id')}, {"_id": 0, "name": 1, "exam_type": 1, "total_marks": 1})
            exam_name = exam.get('name', 'Unknown') if exam else 'Unknown'
            exam_type = exam.get('exam_type', '') if exam else ''
            total_marks = exam.get('total_marks', 0) if exam else 0
            marks = sheet.get('marks_obtained')
            status = sheet.get('status', 'pending')
            
            print(f"   - {exam_name} ({exam_type})")
            print(f"     Status: {status}")
            if marks is not None:
                print(f"     Marks: {marks}/{total_marks}")
            else:
                print(f"     Marks: Not graded yet")
    else:
        print(f"\n📝 No answer sheets found for this student yet.")
    
    print("\n" + "=" * 60)
    print("✅ Sample Student Login Ready!")
    print("=" * 60)
    print("\n📋 Summary:")
    print(f"   Student: {student.get('name')}")
    print(f"   Roll Number: {student.get('roll_number')}")
    print(f"   Email: {student.get('email')}")
    print(f"   Class: {student.get('class_name')}")
    print(f"   Semester: {student.get('semester', 'N/A')}")
    print(f"\n🔐 Login Credentials:")
    print(f"   Email: {student.get('email')}")
    if existing_user:
        print(f"   Password: Use roll number or previously set password")
    else:
        print(f"   Password: {default_password}")
    print("\n💡 The student can now login to view their results!")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_sample_student_login())

