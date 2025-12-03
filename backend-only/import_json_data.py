"""
Script to import JSON data for Second Year, Third Year, and Final Year students
Also imports subjects and teachers from teachers.json
"""
import asyncio
import json
import sys
import uuid
from pathlib import Path
from dotenv import load_dotenv
import os
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JSON files path
JSON_DIR = ROOT_DIR.parent / 'json'

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

async def import_students_from_json(file_path: Path, class_name: str, semester: str):
    """Import students from a JSON file"""
    print(f"\n📚 Importing {class_name} students from {file_path.name}...")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    students_data = data.get('Students', [])
    imported = 0
    skipped = 0
    
    for student in students_data:
        # Handle different JSON structures (BE doesn't have RollNo)
        roll_number = student.get('RollNo') or f"PRN-{student.get('PRN', 'N/A')}"
        prn = student.get('PRN')
        name = student.get('Name', '').strip()
        
        if not name:
            skipped += 1
            continue
        
        # Generate email from name and roll number
        email = f"{roll_number.lower().replace(' ', '')}@college.edu"
        
        # Check if student already exists
        existing = await db.students.find_one({
            "$or": [
                {"roll_number": roll_number},
                {"email": email},
                {"prn": prn} if prn else {}
            ]
        })
        
        if existing:
            skipped += 1
            continue
        
        # Create student document
        student_doc = {
            "id": str(uuid.uuid4()),
            "name": name,
            "email": email,
            "roll_number": roll_number,
            "prn": prn,
            "class_name": class_name,
            "semester": semester,
            "academic_year": data.get('AcademicYear', '2025-26'),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.students.insert_one(student_doc)
        imported += 1
    
    print(f"  ✅ Imported: {imported}, Skipped: {skipped}")
    return imported

async def create_user_account(name: str, email: str, password: str, role: str):
    """Create a user account in the users collection"""
    existing_user = await db.users.find_one({"email": email})
    if existing_user:
        return existing_user
    
    user_doc = {
        "id": str(uuid.uuid4()),
        "name": name,
        "email": email,
        "role": role,
        "password_hash": hash_password(password),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    return user_doc

async def create_hod_account():
    """Create HOD (Head of Department) admin account"""
    print(f"\n👔 Creating HOD/Admin account...")
    
    hod_name = "Vinod Pawar"
    hod_email = "hod@college.edu"
    hod_password = "hod123"
    
    existing = await db.users.find_one({"email": hod_email})
    if existing:
        print(f"  ✅ HOD account already exists: {hod_email}")
        return existing
    
    hod_user = await create_user_account(hod_name, hod_email, hod_password, "admin")
    print(f"  ✅ Created HOD account:")
    print(f"     Email: {hod_email}")
    print(f"     Password: {hod_password}")
    return hod_user

async def import_teachers_and_subjects():
    """Import teachers and subjects from teachers.json"""
    print(f"\n👨‍🏫 Importing teachers and subjects...")
    
    teachers_file = JSON_DIR / 'teachers.json'
    if not teachers_file.exists():
        print(f"  ❌ {teachers_file} not found!")
        return
    
    with open(teachers_file, 'r', encoding='utf-8') as f:
        content = f.read()
        # Remove comments
        lines = content.split('\n')
        clean_lines = [line for line in lines if not line.strip().startswith('//')]
        content = '\n'.join(clean_lines)
        
        # Handle multiple JSON objects - split by '}' followed by newline and '{'
        # Find all JSON objects in the file
        json_objects = []
        brace_count = 0
        current_obj = []
        in_string = False
        escape_next = False
        
        for char in content:
            if escape_next:
                escape_next = False
                current_obj.append(char)
                continue
            
            if char == '\\':
                escape_next = True
                current_obj.append(char)
                continue
            
            if char == '"' and not escape_next:
                in_string = not in_string
            
            if not in_string:
                if char == '{':
                    if brace_count == 0:
                        current_obj = []
                    brace_count += 1
                    current_obj.append(char)
                elif char == '}':
                    current_obj.append(char)
                    brace_count -= 1
                    if brace_count == 0:
                        json_objects.append(''.join(current_obj))
                        current_obj = []
                else:
                    if brace_count > 0:
                        current_obj.append(char)
            else:
                current_obj.append(char)
        
        # Parse each JSON object and merge
        merged_data = {}
        for json_str in json_objects:
            try:
                part_data = json.loads(json_str)
                merged_data.update(part_data)
            except json.JSONDecodeError as e:
                print(f"  ⚠️  Warning: Could not parse JSON object: {e}")
                continue
        
        data = merged_data
    
    subjects_imported = 0
    teachers_imported = 0
    
    # Process each year (SY-CSE, TY-CSE, BTech-CSE)
    for year_key, year_data in data.items():
        class_name = year_key  # SY-CSE, TY-CSE, BTech-CSE
        subjects_data = year_data.get('subjects', {})
        
        print(f"\n  Processing {class_name}...")
        
        for subject_code, subject_info in subjects_data.items():
            subject_name = subject_info.get('name', '')
            faculty_name = subject_info.get('faculty', '')
            
            if not subject_name:
                continue
            
            # Create or get subject
            existing_subject = await db.subjects.find_one({"code": subject_code})
            if not existing_subject:
                subject_doc = {
                    "id": str(uuid.uuid4()),
                    "name": subject_name,
                    "code": subject_code,
                    "class_name": class_name,
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                await db.subjects.insert_one(subject_doc)
                subjects_imported += 1
                subject_id = subject_doc["id"]
            else:
                subject_id = existing_subject["id"]
            
            # Create or get teacher
            if faculty_name:
                # Extract teacher name and email
                teacher_name = faculty_name.split('(')[0].strip().replace('Prof. ', '').replace('Prof ', '')
                teacher_initials = faculty_name.split('(')[1].replace(')', '').strip() if '(' in faculty_name else ''
                
                # Generate email from initials or name
                if teacher_initials:
                    teacher_email = f"{teacher_initials.lower()}@college.edu"
                else:
                    # Use first name and last name for email
                    name_parts = teacher_name.split()
                    if len(name_parts) >= 2:
                        teacher_email = f"{name_parts[0].lower()}.{name_parts[-1].lower()}@college.edu"
                    else:
                        teacher_email = f"{teacher_name.lower().replace(' ', '.')}@college.edu"
                
                # Default password: initials or firstname.lastname
                if teacher_initials:
                    teacher_password = f"{teacher_initials.lower()}123"
                else:
                    name_parts = teacher_name.split()
                    if len(name_parts) >= 2:
                        teacher_password = f"{name_parts[0].lower()}.{name_parts[-1].lower()}123"
                    else:
                        teacher_password = "teacher123"
                
                existing_teacher = await db.teachers.find_one({"email": teacher_email})
                if not existing_teacher:
                    # Create teacher record
                    teacher_doc = {
                        "id": str(uuid.uuid4()),
                        "name": teacher_name,
                        "email": teacher_email,
                        "subject_ids": [subject_id],
                        "created_at": datetime.now(timezone.utc).isoformat()
                    }
                    await db.teachers.insert_one(teacher_doc)
                    teachers_imported += 1
                    
                    # Create user account for teacher login
                    await create_user_account(teacher_name, teacher_email, teacher_password, "teacher")
                    print(f"    ✅ Created teacher: {teacher_name} ({teacher_email}) - Password: {teacher_password}")
                else:
                    # Add subject to existing teacher if not already there
                    if subject_id not in existing_teacher.get("subject_ids", []):
                        await db.teachers.update_one(
                            {"id": existing_teacher["id"]},
                            {"$push": {"subject_ids": subject_id}}
                        )
                    
                    # Ensure user account exists
                    existing_user = await db.users.find_one({"email": teacher_email})
                    if not existing_user:
                        # Generate password for existing teacher
                        if teacher_initials:
                            teacher_password = f"{teacher_initials.lower()}123"
                        else:
                            name_parts = teacher_name.split()
                            if len(name_parts) >= 2:
                                teacher_password = f"{name_parts[0].lower()}.{name_parts[-1].lower()}123"
                            else:
                                teacher_password = "teacher123"
                        await create_user_account(teacher_name, teacher_email, teacher_password, "teacher")
                        print(f"    ✅ Created user account for existing teacher: {teacher_name} ({teacher_email}) - Password: {teacher_password}")
    
    print(f"\n  ✅ Subjects imported: {subjects_imported}")
    print(f"  ✅ Teachers imported/updated: {teachers_imported}")

async def main():
    import uuid
    from datetime import datetime, timezone
    
    try:
        print("=" * 60)
        print("📦 Importing JSON Data for GradeFlow System")
        print("=" * 60)
        
        # Import students from each year
        se_file = JSON_DIR / 'SE.json'
        te_file = JSON_DIR / 'TE.json'
        be_file = JSON_DIR / 'BE.json'
        
        total_imported = 0
        
        if se_file.exists():
            with open(se_file, 'r', encoding='utf-8') as f:
                se_data = json.load(f)
            imported = await import_students_from_json(
                se_file, 
                se_data.get('Class', 'SY'),
                se_data.get('Semester', 'SEM-3')
            )
            total_imported += imported
        else:
            print(f"  ⚠️  {se_file.name} not found")
        
        if te_file.exists():
            with open(te_file, 'r', encoding='utf-8') as f:
                te_data = json.load(f)
            imported = await import_students_from_json(
                te_file,
                te_data.get('Class', 'TY'),
                te_data.get('Semester', 'SEM-5')
            )
            total_imported += imported
        else:
            print(f"  ⚠️  {te_file.name} not found")
        
        if be_file.exists():
            with open(be_file, 'r', encoding='utf-8') as f:
                be_data = json.load(f)
            imported = await import_students_from_json(
                be_file,
                be_data.get('Class', 'BE'),
                be_data.get('Semester', 'SEM-I')
            )
            total_imported += imported
        else:
            print(f"  ⚠️  {be_file.name} not found")
        
        # Import teachers and subjects
        await import_teachers_and_subjects()
        
        # Create HOD/Admin account
        await create_hod_account()
        
        print("\n" + "=" * 60)
        print(f"✅ Import complete! Total students imported: {total_imported}")
        print("=" * 60)
        print("\n📋 Summary:")
        print("  - Second Year (SY) students imported")
        print("  - Third Year (TY) students imported")
        print("  - Final Year (BE) students imported")
        print("  - Subjects and teachers imported")
        print("  - HOD/Admin account created")
        print("\n🔐 Login Credentials:")
        print("\n  👔 HOD/Admin:")
        print("     Email: hod@college.edu")
        print("     Password: hod123")
        print("\n  👨‍🏫 Teachers:")
        print("     Email format: [initials]@college.edu")
        print("     Password format: [initials]123")
        print("     Examples:")
        print("       - drs@college.edu / drs123 (Devkar R.S.)")
        print("       - bpg@college.edu / bpg123 (Bais P.G.)")
        print("       - pvk@college.edu / pvk123 (Pawar V.K.)")
        print("\n  👨‍🎓 Students:")
        print("     Email: [rollnumber]@college.edu")
        print("     Password: Use roll number or set via registration")
        print("\n💡 Note: All teachers have been assigned login credentials.")
        print("   Check the import output above for specific teacher credentials.")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(main())

