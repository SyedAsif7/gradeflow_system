"""
Script to create a sample paper check for teacher bpg@college.edu
This will create:
1. An exam with questions
2. A student answer sheet
3. Assign it to the teacher
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
from pathlib import Path
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def create_sample_paper_check():
    """Create sample exam, answer sheet, and assignment for BPG teacher"""
    print("\n" + "=" * 60)
    print("📝 Creating Sample Paper Check for BPG Teacher")
    print("=" * 60)
    
    # Find teacher
    teacher = await db.teachers.find_one({"email": "bpg@college.edu"}, {"_id": 0})
    if not teacher:
        print("❌ Teacher bpg@college.edu not found!")
        print("   Please run import_json_data.py first to import teachers.")
        return
    
    print(f"\n✅ Found teacher: {teacher.get('name')} ({teacher.get('email')})")
    
    # Get teacher's subjects
    subject_ids = teacher.get('subject_ids', [])
    if not subject_ids:
        print("❌ Teacher has no assigned subjects!")
        return
    
    # Get first subject
    subject = await db.subjects.find_one({"id": subject_ids[0]}, {"_id": 0})
    if not subject:
        print("❌ Subject not found!")
        return
    
    print(f"✅ Using subject: {subject.get('name')} ({subject.get('code')})")
    
    # Get a student (preferably from SY since BPG teaches Data Structures)
    student = await db.students.find_one({"class_name": "SY"}, {"_id": 0})
    if not student:
        # Try any student
        student = await db.students.find_one({}, {"_id": 0})
    
    if not student:
        print("❌ No students found! Please import students first.")
        return
    
    print(f"✅ Using student: {student.get('name')} ({student.get('roll_number')})")
    
    # Check if exam already exists
    exam_name = f"{subject.get('code')} - CA-1"
    existing_exam = await db.exams.find_one({"name": exam_name, "subject_id": subject.get('id')}, {"_id": 0})
    
    if existing_exam:
        exam_id = existing_exam.get('id')
        print(f"✅ Using existing exam: {exam_name}")
    else:
        # Create exam with questions
        exam_id = str(uuid.uuid4())
        exam_doc = {
            "id": exam_id,
            "name": exam_name,
            "subject_id": subject.get('id'),
            "exam_type": "CA-1",
            "date": datetime.now(timezone.utc).isoformat(),
            "total_marks": 20,
            "class_name": subject.get('class_name', 'SY-CSE'),
            "questions": [
                {
                    "question_number": 1,
                    "question_text": "What is a data structure? Explain with examples.",
                    "max_marks": 5
                },
                {
                    "question_number": 2,
                    "question_text": "Differentiate between Array and Linked List.",
                    "max_marks": 5
                },
                {
                    "question_number": 3,
                    "question_text": "Explain Stack data structure with its operations.",
                    "max_marks": 5
                },
                {
                    "question_number": 4,
                    "question_text": "What is Queue? Write algorithm for enqueue operation.",
                    "max_marks": 5
                }
            ],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.exams.insert_one(exam_doc)
        print(f"✅ Created exam: {exam_name} with 4 questions (Total: 20 marks)")
    
    # Check if answer sheet already exists for this student and exam
    existing_sheet = await db.answer_sheets.find_one({
        "student_id": student.get('id'),
        "exam_id": exam_id
    }, {"_id": 0})
    
    if existing_sheet:
        print(f"✅ Answer sheet already exists for this student and exam")
        print(f"   Sheet ID: {existing_sheet.get('id')}")
        print(f"   Status: {existing_sheet.get('status', 'pending')}")
        
        # Update assignment if needed
        if existing_sheet.get('assigned_teacher_id') != teacher.get('id'):
            await db.answer_sheets.update_one(
                {"id": existing_sheet.get('id')},
                {"$set": {"assigned_teacher_id": teacher.get('id')}}
            )
            print(f"✅ Updated assignment to BPG teacher")
    else:
        # Create a dummy answer sheet (without actual PDF file)
        # In real scenario, PDF would be uploaded via the upload endpoint
        sheet_id = str(uuid.uuid4())
        sheet_doc = {
            "id": sheet_id,
            "exam_id": exam_id,
            "student_id": student.get('id'),
            "pdf_filename": f"sample_sheet_{sheet_id}.pdf",  # Dummy filename
            "assigned_teacher_id": teacher.get('id'),
            "status": "pending",
            "marks_obtained": None,
            "question_marks": [],
            "remarks": None,
            "checked_at": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.answer_sheets.insert_one(sheet_doc)
        print(f"✅ Created answer sheet (ID: {sheet_id})")
        print(f"   Status: Pending")
        print(f"   Assigned to: {teacher.get('name')}")
    
    print("\n" + "=" * 60)
    print("✅ Sample Paper Check Setup Complete!")
    print("=" * 60)
    print("\n📋 Summary:")
    print(f"   Teacher: {teacher.get('name')} ({teacher.get('email')})")
    print(f"   Subject: {subject.get('name')}")
    print(f"   Exam: {exam_name} ({exam_id})")
    print(f"   Student: {student.get('name')} ({student.get('roll_number')})")
    print(f"   Answer Sheet: {'Already exists' if existing_sheet else 'Created'}")
    print("\n🔐 Login Credentials:")
    print(f"   Email: bpg@college.edu")
    print(f"   Password: bpg123")
    print("\n💡 Note: The answer sheet is ready for grading!")
    print("   The teacher can now login and grade this paper.")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_sample_paper_check())

