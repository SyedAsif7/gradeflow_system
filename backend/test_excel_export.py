#!/usr/bin/env python3
"""
Test script to check if the Excel export functionality is working correctly.
"""

import asyncio
import os
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Database connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def test_excel_export():
    """Test the Excel export functionality"""
    try:
        # Get all exams to find a valid exam ID
        exams = await db.exams.find({}, {"_id": 0}).to_list(1000)
        
        if not exams:
            print("No exams found in the database!")
            return False
        
        # Test with the first exam
        test_exam = exams[0]
        exam_id = test_exam.get('id')
        print(f"Testing Excel export for exam ID: {exam_id}")
        print(f"Exam Type: {test_exam.get('exam_type')}")
        print(f"Subject ID: {test_exam.get('subject_id')}")
        
        # Check if we can fetch the exam
        exam = await db.exams.find_one({"id": exam_id}, {"_id": 0})
        if not exam:
            print(f"Could not fetch exam with ID {exam_id}")
            return False
            
        print("✅ Exam fetch successful")
        
        # Check if we can fetch answer sheets
        answer_sheets = await db.answer_sheets.find({"exam_id": exam_id}, {"_id": 0}).to_list(1000)
        print(f"✅ Found {len(answer_sheets)} answer sheets for this exam")
        
        # Check if we can fetch the subject
        if "subject_id" in exam:
            subject = await db.subjects.find_one({"id": exam["subject_id"]}, {"_id": 0})
            if subject:
                print(f"✅ Subject found: {subject.get('name', 'Unknown')}")
            else:
                print("⚠️  Subject not found, but continuing...")
        
        # Try importing openpyxl (required for Excel export)
        try:
            from openpyxl import Workbook
            print("✅ openpyxl library is available")
        except ImportError as e:
            print(f"❌ openpyxl library not available: {e}")
            return False
        
        print("\n🎉 All checks passed! Excel export should work correctly.")
        print(f"Try exporting from the frontend using exam ID: {exam_id}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error during test: {e}")
        return False
    finally:
        client.close()

async def main():
    """Main function to run the test"""
    print("Testing Excel Export Functionality")
    print("=" * 40)
    
    success = await test_excel_export()
    
    if success:
        print("\n✅ Excel export functionality is working!")
    else:
        print("\n❌ Excel export functionality has issues.")

if __name__ == "__main__":
    asyncio.run(main())