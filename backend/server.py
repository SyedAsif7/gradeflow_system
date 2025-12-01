from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import bcrypt
import shutil

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create upload directory
UPLOAD_DIR = ROOT_DIR / 'uploads' / 'answer_sheets'
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    role: str  # admin, teacher, student
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str

class LoginRequest(BaseModel):
    email: str
    password: str

class Student(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    roll_number: str
    class_name: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class StudentCreate(BaseModel):
    name: str
    email: str
    roll_number: str
    class_name: str
    password: str

class Teacher(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    subject_ids: List[str] = []
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class TeacherCreate(BaseModel):
    name: str
    email: str
    subject_ids: List[str] = []
    password: str

class Subject(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    code: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class SubjectCreate(BaseModel):
    name: str
    code: str

class Question(BaseModel):
    question_number: int
    question_text: str
    max_marks: int

class Exam(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    subject_id: str
    exam_type: str  # Class Test, Mid-Sem
    date: str
    total_marks: int
    class_name: str
    questions: List[Question] = []
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ExamCreate(BaseModel):
    name: str
    subject_id: str
    exam_type: str
    date: str
    total_marks: int
    class_name: str
    questions: List[Question] = []

class QuestionMark(BaseModel):
    question_number: int
    marks_obtained: int
    max_marks: int

class AnswerSheet(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    exam_id: str
    student_id: str
    pdf_filename: str
    assigned_teacher_id: Optional[str] = None
    status: str = "pending"  # pending, checked
    marks_obtained: Optional[int] = None
    question_marks: List[QuestionMark] = []
    remarks: Optional[str] = None
    checked_at: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class MarkSubmission(BaseModel):
    question_marks: List[QuestionMark]
    remarks: Optional[str] = None

# Helper functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

# Auth routes
@api_router.post("/auth/register", response_model=User)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_dict = user_data.model_dump()
    hashed_pwd = hash_password(user_dict.pop('password'))
    user_dict['password_hash'] = hashed_pwd
    
    user_obj = User(**{k: v for k, v in user_dict.items() if k != 'password_hash'})
    doc = user_obj.model_dump()
    doc['password_hash'] = hashed_pwd
    
    await db.users.insert_one(doc)
    return user_obj

@api_router.post("/auth/login")
async def login(login_data: LoginRequest):
    user = await db.users.find_one({"email": login_data.email}, {"_id": 0})
    if not user or not verify_password(login_data.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user.pop('password_hash', None)
    return {"user": user, "message": "Login successful"}

# Student routes
@api_router.post("/students", response_model=Student)
async def create_student(student_data: StudentCreate):
    existing = await db.students.find_one({"email": student_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    student_dict = student_data.model_dump()
    password = student_dict.pop('password')
    
    student_obj = Student(**student_dict)
    doc = student_obj.model_dump()
    
    await db.students.insert_one(doc)
    
    # Also create user account
    user_data = UserCreate(
        name=student_data.name,
        email=student_data.email,
        password=password,
        role="student"
    )
    await register(user_data)
    
    return student_obj

@api_router.get("/students", response_model=List[Student])
async def get_students():
    students = await db.students.find({}, {"_id": 0}).to_list(1000)
    return students

@api_router.get("/students/{student_id}", response_model=Student)
async def get_student(student_id: str):
    student = await db.students.find_one({"id": student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

@api_router.put("/students/{student_id}", response_model=Student)
async def update_student(student_id: str, student_data: StudentCreate):
    existing = await db.students.find_one({"id": student_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Student not found")
    
    update_dict = student_data.model_dump(exclude={'password'})
    await db.students.update_one({"id": student_id}, {"$set": update_dict})
    
    updated = await db.students.find_one({"id": student_id}, {"_id": 0})
    return updated

@api_router.delete("/students/{student_id}")
async def delete_student(student_id: str):
    result = await db.students.delete_one({"id": student_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Student not found")
    
    student = await db.students.find_one({"id": student_id}, {"_id": 0})
    if student:
        await db.users.delete_one({"email": student.get('email')})
    
    return {"message": "Student deleted successfully"}

# Teacher routes
@api_router.post("/teachers", response_model=Teacher)
async def create_teacher(teacher_data: TeacherCreate):
    existing = await db.teachers.find_one({"email": teacher_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    teacher_dict = teacher_data.model_dump()
    password = teacher_dict.pop('password')
    
    teacher_obj = Teacher(**teacher_dict)
    doc = teacher_obj.model_dump()
    
    await db.teachers.insert_one(doc)
    
    user_data = UserCreate(
        name=teacher_data.name,
        email=teacher_data.email,
        password=password,
        role="teacher"
    )
    await register(user_data)
    
    return teacher_obj

@api_router.get("/teachers", response_model=List[Teacher])
async def get_teachers():
    teachers = await db.teachers.find({}, {"_id": 0}).to_list(1000)
    return teachers

@api_router.get("/teachers/{teacher_id}", response_model=Teacher)
async def get_teacher(teacher_id: str):
    teacher = await db.teachers.find_one({"id": teacher_id}, {"_id": 0})
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return teacher

@api_router.put("/teachers/{teacher_id}", response_model=Teacher)
async def update_teacher(teacher_id: str, teacher_data: TeacherCreate):
    existing = await db.teachers.find_one({"id": teacher_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    update_dict = teacher_data.model_dump(exclude={'password'})
    await db.teachers.update_one({"id": teacher_id}, {"$set": update_dict})
    
    updated = await db.teachers.find_one({"id": teacher_id}, {"_id": 0})
    return updated

@api_router.delete("/teachers/{teacher_id}")
async def delete_teacher(teacher_id: str):
    result = await db.teachers.delete_one({"id": teacher_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    teacher = await db.teachers.find_one({"id": teacher_id}, {"_id": 0})
    if teacher:
        await db.users.delete_one({"email": teacher.get('email')})
    
    return {"message": "Teacher deleted successfully"}

# Subject routes
@api_router.post("/subjects", response_model=Subject)
async def create_subject(subject_data: SubjectCreate):
    subject_obj = Subject(**subject_data.model_dump())
    doc = subject_obj.model_dump()
    await db.subjects.insert_one(doc)
    return subject_obj

@api_router.get("/subjects", response_model=List[Subject])
async def get_subjects():
    subjects = await db.subjects.find({}, {"_id": 0}).to_list(1000)
    return subjects

@api_router.get("/subjects/{subject_id}", response_model=Subject)
async def get_subject(subject_id: str):
    subject = await db.subjects.find_one({"id": subject_id}, {"_id": 0})
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    return subject

@api_router.put("/subjects/{subject_id}", response_model=Subject)
async def update_subject(subject_id: str, subject_data: SubjectCreate):
    update_dict = subject_data.model_dump()
    result = await db.subjects.update_one({"id": subject_id}, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    updated = await db.subjects.find_one({"id": subject_id}, {"_id": 0})
    return updated

@api_router.delete("/subjects/{subject_id}")
async def delete_subject(subject_id: str):
    result = await db.subjects.delete_one({"id": subject_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Subject not found")
    return {"message": "Subject deleted successfully"}

# Exam routes
@api_router.post("/exams", response_model=Exam)
async def create_exam(exam_data: ExamCreate):
    exam_obj = Exam(**exam_data.model_dump())
    doc = exam_obj.model_dump()
    await db.exams.insert_one(doc)
    return exam_obj

@api_router.get("/exams", response_model=List[Exam])
async def get_exams():
    exams = await db.exams.find({}, {"_id": 0}).to_list(1000)
    return exams

@api_router.get("/exams/{exam_id}", response_model=Exam)
async def get_exam(exam_id: str):
    exam = await db.exams.find_one({"id": exam_id}, {"_id": 0})
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    return exam

@api_router.put("/exams/{exam_id}", response_model=Exam)
async def update_exam(exam_id: str, exam_data: ExamCreate):
    update_dict = exam_data.model_dump()
    result = await db.exams.update_one({"id": exam_id}, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    updated = await db.exams.find_one({"id": exam_id}, {"_id": 0})
    return updated

@api_router.delete("/exams/{exam_id}")
async def delete_exam(exam_id: str):
    result = await db.exams.delete_one({"id": exam_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Exam not found")
    return {"message": "Exam deleted successfully"}

# Answer Sheet routes
@api_router.post("/answer-sheets/upload")
async def upload_answer_sheet(
    exam_id: str = Form(...),
    student_id: str = Form(...),
    assigned_teacher_id: str = Form(None),
    file: UploadFile = File(...)
):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    file_id = str(uuid.uuid4())
    file_ext = Path(file.filename).suffix
    filename = f"{file_id}{file_ext}"
    file_path = UPLOAD_DIR / filename
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    answer_sheet = AnswerSheet(
        exam_id=exam_id,
        student_id=student_id,
        pdf_filename=filename,
        assigned_teacher_id=assigned_teacher_id
    )
    doc = answer_sheet.model_dump()
    await db.answer_sheets.insert_one(doc)
    
    return answer_sheet

@api_router.get("/answer-sheets", response_model=List[AnswerSheet])
async def get_answer_sheets(teacher_id: Optional[str] = None, student_id: Optional[str] = None):
    query = {}
    if teacher_id:
        query["assigned_teacher_id"] = teacher_id
    if student_id:
        query["student_id"] = student_id
    
    answer_sheets = await db.answer_sheets.find(query, {"_id": 0}).to_list(1000)
    return answer_sheets

@api_router.get("/answer-sheets/{sheet_id}", response_model=AnswerSheet)
async def get_answer_sheet(sheet_id: str):
    sheet = await db.answer_sheets.find_one({"id": sheet_id}, {"_id": 0})
    if not sheet:
        raise HTTPException(status_code=404, detail="Answer sheet not found")
    return sheet

@api_router.get("/answer-sheets/{sheet_id}/download")
async def download_answer_sheet(sheet_id: str):
    sheet = await db.answer_sheets.find_one({"id": sheet_id}, {"_id": 0})
    if not sheet:
        raise HTTPException(status_code=404, detail="Answer sheet not found")
    
    file_path = UPLOAD_DIR / sheet['pdf_filename']
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(file_path, media_type='application/pdf', filename=sheet['pdf_filename'])

@api_router.put("/answer-sheets/{sheet_id}/assign")
async def assign_answer_sheet(sheet_id: str, teacher_id: str = Form(...)):
    result = await db.answer_sheets.update_one(
        {"id": sheet_id},
        {"$set": {"assigned_teacher_id": teacher_id}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Answer sheet not found")
    
    updated = await db.answer_sheets.find_one({"id": sheet_id}, {"_id": 0})
    return updated

@api_router.put("/answer-sheets/{sheet_id}/grade", response_model=AnswerSheet)
async def grade_answer_sheet(sheet_id: str, marks_data: MarkSubmission):
    # Calculate total marks from question-wise marks
    total_marks = sum(qm.marks_obtained for qm in marks_data.question_marks)
    
    update_data = {
        "marks_obtained": total_marks,
        "question_marks": [qm.model_dump() for qm in marks_data.question_marks],
        "remarks": marks_data.remarks,
        "status": "checked",
        "checked_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = await db.answer_sheets.update_one(
        {"id": sheet_id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Answer sheet not found")
    
    updated = await db.answer_sheets.find_one({"id": sheet_id}, {"_id": 0})
    return updated

@api_router.delete("/answer-sheets/{sheet_id}")
async def delete_answer_sheet(sheet_id: str):
    sheet = await db.answer_sheets.find_one({"id": sheet_id}, {"_id": 0})
    if not sheet:
        raise HTTPException(status_code=404, detail="Answer sheet not found")
    
    file_path = UPLOAD_DIR / sheet['pdf_filename']
    if file_path.exists():
        file_path.unlink()
    
    await db.answer_sheets.delete_one({"id": sheet_id})
    return {"message": "Answer sheet deleted successfully"}

# Dashboard stats
@api_router.get("/dashboard/stats")
async def get_dashboard_stats():
    students_count = await db.students.count_documents({})
    teachers_count = await db.teachers.count_documents({})
    subjects_count = await db.subjects.count_documents({})
    exams_count = await db.exams.count_documents({})
    answer_sheets_count = await db.answer_sheets.count_documents({})
    pending_sheets = await db.answer_sheets.count_documents({"status": "pending"})
    
    return {
        "students": students_count,
        "teachers": teachers_count,
        "subjects": subjects_count,
        "exams": exams_count,
        "answer_sheets": answer_sheets_count,
        "pending_sheets": pending_sheets
    }

# Excel Export
@api_router.get("/exams/{exam_id}/export-marksheet")
async def export_marksheet(exam_id: str):
    from openpyxl import Workbook
    from openpyxl.styles import Font, Alignment, PatternFill
    from io import BytesIO
    from fastapi.responses import StreamingResponse
    
    # Fetch exam details
    exam = await db.exams.find_one({"id": exam_id}, {"_id": 0})
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Fetch subject
    subject = await db.subjects.find_one({"id": exam["subject_id"]}, {"_id": 0})
    subject_name = subject["name"] if subject else "Unknown"
    
    # Fetch all answer sheets for this exam
    answer_sheets = await db.answer_sheets.find({"exam_id": exam_id}, {"_id": 0}).to_list(1000)
    
    # Fetch all students
    students_dict = {}
    students = await db.students.find({}, {"_id": 0}).to_list(1000)
    for student in students:
        students_dict[student["id"]] = student
    
    # Create workbook
    wb = Workbook()
    ws = wb.active
    ws.title = "Marksheet"
    
    # Header styling
    header_fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
    header_font = Font(bold=True, color="FFFFFF", size=12)
    
    # Title
    ws.merge_cells('A1:F1')
    title_cell = ws['A1']
    title_cell.value = f"{exam['name']} - Marksheet"
    title_cell.font = Font(bold=True, size=14)
    title_cell.alignment = Alignment(horizontal='center')
    
    # Exam details
    ws['A2'] = f"Subject: {subject_name}"
    ws['A3'] = f"Exam Type: {exam['exam_type']}"
    ws['A4'] = f"Date: {exam['date']}"
    ws['A5'] = f"Class: {exam['class_name']}"
    ws['A6'] = f"Total Marks: {exam['total_marks']}"
    
    # Column headers
    header_row = 8
    headers = ['Roll Number', 'Student Name', 'Email', 'Marks Obtained', 'Total Marks', 'Percentage', 'Status']
    
    # Add question-wise columns if questions exist
    questions = exam.get('questions', [])
    if questions:
        for q in questions:
            headers.insert(-3, f"Q{q['question_number']} ({q['max_marks']})")
    
    for col_num, header in enumerate(headers, 1):
        cell = ws.cell(row=header_row, column=col_num, value=header)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal='center')
    
    # Data rows
    row_num = header_row + 1
    for sheet in answer_sheets:
        student = students_dict.get(sheet["student_id"])
        if not student:
            continue
        
        col = 1
        ws.cell(row=row_num, column=col, value=student.get("roll_number", "N/A"))
        col += 1
        ws.cell(row=row_num, column=col, value=student.get("name", "N/A"))
        col += 1
        ws.cell(row=row_num, column=col, value=student.get("email", "N/A"))
        col += 1
        
        # Question-wise marks
        if questions and sheet.get("question_marks"):
            question_marks_dict = {qm["question_number"]: qm["marks_obtained"] for qm in sheet["question_marks"]}
            for q in questions:
                marks = question_marks_dict.get(q["question_number"], 0)
                ws.cell(row=row_num, column=col, value=marks)
                col += 1
        
        # Total marks
        marks_obtained = sheet.get("marks_obtained", 0)
        ws.cell(row=row_num, column=col, value=marks_obtained if marks_obtained is not None else "Not Graded")
        col += 1
        
        ws.cell(row=row_num, column=col, value=exam["total_marks"])
        col += 1
        
        # Percentage
        if marks_obtained is not None:
            percentage = round((marks_obtained / exam["total_marks"]) * 100, 2)
            ws.cell(row=row_num, column=col, value=f"{percentage}%")
        else:
            ws.cell(row=row_num, column=col, value="N/A")
        col += 1
        
        # Status
        status = "Checked" if sheet["status"] == "checked" else "Pending"
        ws.cell(row=row_num, column=col, value=status)
        
        row_num += 1
    
    # Adjust column widths
    for column in ws.columns:
        max_length = 0
        column_letter = column[0].column_letter
        for cell in column:
            try:
                if len(str(cell.value)) > max_length:
                    max_length = len(str(cell.value))
            except:
                pass
        adjusted_width = min(max_length + 2, 50)
        ws.column_dimensions[column_letter].width = adjusted_width
    
    # Save to BytesIO
    output = BytesIO()
    wb.save(output)
    output.seek(0)
    
    filename = f"{exam['name'].replace(' ', '_')}_Marksheet.xlsx"
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()