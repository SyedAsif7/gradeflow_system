"""
Script to upload DM.pdf and M-III.pdf papers and assign them to teachers
This will:
1. Find or create exams for DM and EM-III subjects
2. Upload the PDF files to GridFS
3. Create answer sheet records assigned to the appropriate teachers
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorGridFSBucket
from dotenv import load_dotenv
import os
from pathlib import Path
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def upload_papers():
    """Upload DM.pdf and M-III.pdf papers and assign to teachers"""
    print("\n" + "=" * 60)
    print("📝 Uploading DM and M-III Papers for Teacher Review")
    print("=" * 60)
    
    # Create MongoDB client inside async function
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    fs_bucket = AsyncIOMotorGridFSBucket(db, bucket_name="answer_sheets")
    
    try:
        # Find teachers
        drs_teacher = await db.teachers.find_one({"email": "drs@college.edu"}, {"_id": 0})
        caa_teacher = await db.teachers.find_one({"email": "caa@college.edu"}, {"_id": 0})
        
        if not drs_teacher:
            print("❌ Teacher drs@college.edu (Devkar R.S.) not found!")
            print("   Please run import_json_data.py first to import teachers.")
            return
        
        if not caa_teacher:
            print("❌ Teacher caa@college.edu (Chidrawar A.A.) not found!")
            print("   Please run import_json_data.py first to import teachers.")
            return
        
        print(f"\n✅ Found teachers:")
        print(f"   - {drs_teacher.get('name')} ({drs_teacher.get('email')})")
        print(f"   - {caa_teacher.get('name')} ({caa_teacher.get('email')})")
        
        # Find subjects
        dm_subject = await db.subjects.find_one({"code": "DM"}, {"_id": 0})
        em3_subject = await db.subjects.find_one({"code": "EM-III"}, {"_id": 0})
        
        if not dm_subject:
            print("❌ Subject DM (Discrete Mathematics) not found!")
            return
        
        if not em3_subject:
            print("❌ Subject EM-III (Engineering Mathematics – III) not found!")
            return
        
        print(f"\n✅ Found subjects:")
        print(f"   - {dm_subject.get('name')} ({dm_subject.get('code')})")
        print(f"   - {em3_subject.get('name')} ({em3_subject.get('code')})")
        
        # Get a student (preferably from SY since these are SY subjects)
        student = await db.students.find_one({"class_name": "SY"}, {"_id": 0})
        if not student:
            student = await db.students.find_one({}, {"_id": 0})
        
        if not student:
            print("❌ No students found! Please import students first.")
            return
        
        print(f"\n✅ Using student: {student.get('name')} ({student.get('roll_number')})")
        
        # Initialize variables for summary
        existing_dm_sheet = None
        existing_em3_sheet = None
        
        # Process DM paper
        print("\n" + "-" * 60)
        print("📄 Processing DM.pdf")
        print("-" * 60)
        
        dm_pdf_path = ROOT_DIR.parent / "DM.pdf"
        if not dm_pdf_path.exists():
            print(f"❌ DM.pdf not found at {dm_pdf_path}")
        else:
            # Find or create exam for DM
            dm_exam = await db.exams.find_one({"subject_id": dm_subject.get('id')}, {"_id": 0})
            if not dm_exam:
                exam_id = str(uuid.uuid4())
                exam_doc = {
                    "id": exam_id,
                    "name": f"{dm_subject.get('code')} - CA-1",
                    "subject_id": dm_subject.get('id'),
                    "exam_type": "CA-1",
                    "date": datetime.now(timezone.utc).isoformat(),
                    "total_marks": 20,
                    "class_name": dm_subject.get('class_name', 'SY-CSE'),
                    "questions": [
                        {"question_number": 1, "question_text": "Question 1", "max_marks": 5},
                        {"question_number": 2, "question_text": "Question 2", "max_marks": 5},
                        {"question_number": 3, "question_text": "Question 3", "max_marks": 5},
                        {"question_number": 4, "question_text": "Question 4", "max_marks": 5},
                    ],
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                await db.exams.insert_one(exam_doc)
                dm_exam = exam_doc
                print(f"✅ Created exam: {dm_exam.get('name')}")
            else:
                print(f"✅ Using existing exam: {dm_exam.get('name')}")
            
            # Check if answer sheet already exists
            existing_dm_sheet = await db.answer_sheets.find_one({
                "exam_id": dm_exam.get('id'),
                "student_id": student.get('id')
            }, {"_id": 0})
            
            if existing_dm_sheet:
                print(f"✅ Answer sheet already exists for DM")
                # Update assignment if needed
                if existing_dm_sheet.get('assigned_teacher_id') != drs_teacher.get('id'):
                    await db.answer_sheets.update_one(
                        {"id": existing_dm_sheet.get('id')},
                        {"$set": {"assigned_teacher_id": drs_teacher.get('id')}}
                    )
                    print(f"✅ Updated assignment to DRS teacher")
            else:
                # Upload PDF to GridFS
                file_id = str(uuid.uuid4())
                with open(dm_pdf_path, 'rb') as pdf_file:
                    metadata = {
                        "original_name": "DM.pdf",
                        "content_type": "application/pdf",
                        "exam_id": dm_exam.get('id'),
                        "student_id": student.get('id'),
                        "assigned_teacher_id": drs_teacher.get('id'),
                    }
                    gridfs_id = await fs_bucket.upload_from_stream(file_id, pdf_file, metadata=metadata)
                    
                    # Create answer sheet record
                    sheet_id = str(uuid.uuid4())
                    sheet_doc = {
                        "id": sheet_id,
                        "exam_id": dm_exam.get('id'),
                        "student_id": student.get('id'),
                        "pdf_filename": str(gridfs_id),
                        "assigned_teacher_id": drs_teacher.get('id'),
                        "status": "pending",
                        "marks_obtained": None,
                        "question_marks": [],
                        "remarks": None,
                        "checked_at": None,
                        "created_at": datetime.now(timezone.utc).isoformat()
                    }
                    await db.answer_sheets.insert_one(sheet_doc)
                    print(f"✅ Uploaded DM.pdf and created answer sheet (ID: {sheet_id})")
                    print(f"   Assigned to: {drs_teacher.get('name')}")
        
        # Process M-III paper
        print("\n" + "-" * 60)
        print("📄 Processing M-III.pdf")
        print("-" * 60)
        
        m3_pdf_path = ROOT_DIR.parent / "M-III.pdf"
        if not m3_pdf_path.exists():
            print(f"❌ M-III.pdf not found at {m3_pdf_path}")
        else:
            # Find or create exam for EM-III
            em3_exam = await db.exams.find_one({"subject_id": em3_subject.get('id')}, {"_id": 0})
            if not em3_exam:
                exam_id = str(uuid.uuid4())
                exam_doc = {
                    "id": exam_id,
                    "name": f"{em3_subject.get('code')} - CA-1",
                    "subject_id": em3_subject.get('id'),
                    "exam_type": "CA-1",
                    "date": datetime.now(timezone.utc).isoformat(),
                    "total_marks": 20,
                    "class_name": em3_subject.get('class_name', 'SY-CSE'),
                    "questions": [
                        {"question_number": 1, "question_text": "Question 1", "max_marks": 5},
                        {"question_number": 2, "question_text": "Question 2", "max_marks": 5},
                        {"question_number": 3, "question_text": "Question 3", "max_marks": 5},
                        {"question_number": 4, "question_text": "Question 4", "max_marks": 5},
                    ],
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                await db.exams.insert_one(exam_doc)
                em3_exam = exam_doc
                print(f"✅ Created exam: {em3_exam.get('name')}")
            else:
                print(f"✅ Using existing exam: {em3_exam.get('name')}")
            
            # Check if answer sheet already exists
            existing_em3_sheet = await db.answer_sheets.find_one({
                "exam_id": em3_exam.get('id'),
                "student_id": student.get('id')
            }, {"_id": 0})
            
            if existing_em3_sheet:
                print(f"✅ Answer sheet already exists for EM-III")
                # Update assignment if needed
                if existing_em3_sheet.get('assigned_teacher_id') != caa_teacher.get('id'):
                    await db.answer_sheets.update_one(
                        {"id": existing_em3_sheet.get('id')},
                        {"$set": {"assigned_teacher_id": caa_teacher.get('id')}}
                    )
                    print(f"✅ Updated assignment to CAA teacher")
            else:
                # Upload PDF to GridFS
                file_id = str(uuid.uuid4())
                with open(m3_pdf_path, 'rb') as pdf_file:
                    metadata = {
                        "original_name": "M-III.pdf",
                        "content_type": "application/pdf",
                        "exam_id": em3_exam.get('id'),
                        "student_id": student.get('id'),
                        "assigned_teacher_id": caa_teacher.get('id'),
                    }
                    gridfs_id = await fs_bucket.upload_from_stream(file_id, pdf_file, metadata=metadata)
                    
                    # Create answer sheet record
                    sheet_id = str(uuid.uuid4())
                    sheet_doc = {
                        "id": sheet_id,
                        "exam_id": em3_exam.get('id'),
                        "student_id": student.get('id'),
                        "pdf_filename": str(gridfs_id),
                        "assigned_teacher_id": caa_teacher.get('id'),
                        "status": "pending",
                        "marks_obtained": None,
                        "question_marks": [],
                        "remarks": None,
                        "checked_at": None,
                        "created_at": datetime.now(timezone.utc).isoformat()
                    }
                    await db.answer_sheets.insert_one(sheet_doc)
                    print(f"✅ Uploaded M-III.pdf and created answer sheet (ID: {sheet_id})")
                    print(f"   Assigned to: {caa_teacher.get('name')}")
        
        print("\n" + "=" * 60)
        print("✅ Paper Upload Complete!")
        print("=" * 60)
        print("\n📋 Summary:")
        print(f"   DM Paper:")
        print(f"     - Subject: {dm_subject.get('name')}")
        print(f"     - Teacher: {drs_teacher.get('name')} ({drs_teacher.get('email')})")
        print(f"     - Status: {'Already exists' if existing_dm_sheet else 'Uploaded'}")
        print(f"\n   M-III Paper:")
        print(f"     - Subject: {em3_subject.get('name')}")
        print(f"     - Teacher: {caa_teacher.get('name')} ({caa_teacher.get('email')})")
        print(f"     - Status: {'Already exists' if existing_em3_sheet else 'Uploaded'}")
        print("\n🔐 Teacher Login Credentials:")
        print(f"   DRS (DM): drs@college.edu / drs123")
        print(f"   CAA (M-III): caa@college.edu / caa123")
        print("\n💡 Teachers can now login and view/grade these papers!")
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        if 'client' in locals():
            client.close()

if __name__ == "__main__":
    try:
        asyncio.run(upload_papers())
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

