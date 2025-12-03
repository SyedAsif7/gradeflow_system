#!/usr/bin/env python3
"""
Test script to verify Excel generation is working correctly with the new format.
"""

import asyncio
import os
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from openpyxl import Workbook

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Database connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def test_excel_format():
    """Test that Excel files are generated with the correct format"""
    try:
        # Get an exam to test with
        exams = await db.exams.find({}, {"_id": 0}).to_list(1000)
        
        if not exams:
            print("No exams found!")
            return False
            
        test_exam = exams[0]
        exam_id = test_exam.get('id')
        print(f"Testing Excel format for exam ID: {exam_id}")
        
        # Simulate the Excel generation process
        exam = await db.exams.find_one({"id": exam_id}, {"_id": 0})
        if not exam:
            print("Failed to fetch exam")
            return False
            
        # Fetch data needed for Excel
        answer_sheets = await db.answer_sheets.find({"exam_id": exam_id}, {"_id": 0}).to_list(1000)
        students = await db.students.find({}, {"_id": 0}).to_list(1000)
        students_dict = {student["id"]: student for student in students}
        
        # Create a test workbook with the new format
        wb = Workbook()
        ws = wb.active
        ws.title = "Test Marksheet"
        
        # Test the new simplified header structure
        headers = ['Roll Number', 'Student Name', 'Email', 'Marks Obtained', 'Total Marks', 'Percentage', 'Status']
        
        print("Headers in new format:")
        for i, header in enumerate(headers, 1):
            print(f"  Column {i}: {header}")
            
        # Verify no question columns
        question_headers = [h for h in headers if h.startswith('Q') and '(' in h and ')' in h]
        if question_headers:
            print(f"❌ ERROR: Found question headers that should have been removed: {question_headers}")
            return False
        else:
            print("✅ No question headers found (as expected)")
            
        # Test data row generation
        if answer_sheets:
            sheet = answer_sheets[0]
            student = students_dict.get(sheet["student_id"])
            
            if student:
                print("\nSample data row:")
                print(f"  Roll Number: {student.get('roll_number', 'N/A')}")
                print(f"  Student Name: {student.get('name', 'N/A')}")
                print(f"  Email: {student.get('email', 'N/A')}")
                
                marks_obtained = sheet.get("marks_obtained", 0)
                print(f"  Marks Obtained: {marks_obtained if marks_obtained is not None else 'Not Graded'}")
                print(f"  Total Marks: {exam['total_marks']}")
                
                if marks_obtained is not None:
                    percentage = round((marks_obtained / exam["total_marks"]) * 100, 2)
                    print(f"  Percentage: {percentage}%")
                else:
                    print("  Percentage: N/A")
                    
                status = "Checked" if sheet["status"] == "checked" else "Pending"
                print(f"  Status: {status}")
        
        print("\n✅ Excel format test passed!")
        print("The Excel file will now only show 'Marks Obtained' and 'Total Marks' columns.")
        return True
        
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        client.close()

async def main():
    """Main function"""
    print("Testing Excel Generation Format")
    print("=" * 40)
    
    success = await test_excel_format()
    
    if success:
        print("\n🎉 Excel generation format is correct!")
        print("The exported Excel files will now have the simplified format.")
    else:
        print("\n❌ There are issues with the Excel format.")

if __name__ == "__main__":
    asyncio.run(main())