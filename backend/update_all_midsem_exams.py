#!/usr/bin/env python3
"""
Script to update all Mid Semester exams with the correct question structure.
This script updates all exams with exam_type: "Mid Semester" to have the proper 
question distribution:
- Question 1: 6 marks
- Question 2: 6 marks
- Question 3: 8 marks
Total: 20 marks
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

# New question structure for all Mid Semester exams
NEW_QUESTIONS = [
    {
        "question_number": 1,
        "question_text": "Question 1",
        "max_marks": 6
    },
    {
        "question_number": 2,
        "question_text": "Question 2",
        "max_marks": 6
    },
    {
        "question_number": 3,
        "question_text": "Question 3",
        "max_marks": 8
    }
]

async def update_all_midsem_exams():
    """Update all Mid Semester exams with the new question structure"""
    try:
        # Find all Mid Semester exams
        midsem_exams = await db.exams.find({"exam_type": "Mid Semester"}, {"_id": 0}).to_list(1000)
        
        if not midsem_exams:
            print("No Mid Semester exams found in the database!")
            return False
        
        print(f"Found {len(midsem_exams)} Mid Semester exams to update:")
        
        updated_count = 0
        
        for exam in midsem_exams:
            exam_id = exam.get('id')
            subject_id = exam.get('subject_id', 'Unknown')
            
            print(f"\nProcessing exam ID: {exam_id}")
            print(f"Subject ID: {subject_id}")
            print(f"Current questions: {len(exam.get('questions', []))} questions")
            
            # Update the exam with new questions and total marks
            update_data = {
                "questions": NEW_QUESTIONS,
                "total_marks": 20  # Sum of all question marks
            }
            
            result = await db.exams.update_one(
                {"id": exam_id},
                {"$set": update_data}
            )
            
            if result.modified_count > 0:
                print(f"  ✅ Successfully updated exam {exam_id}")
                updated_count += 1
            else:
                print(f"  ℹ️  No changes made to exam {exam_id}")
                
        print(f"\n📊 Summary: {updated_count} out of {len(midsem_exams)} exams were updated")
        
        # Show the new structure for confirmation
        print("\n📋 New question structure applied to all Mid Semester exams:")
        for q in NEW_QUESTIONS:
            print(f"  Q{q['question_number']}: {q['question_text']} ({q['max_marks']} marks)")
        print(f"  Total marks: {sum(q['max_marks'] for q in NEW_QUESTIONS)}")
        
        return True
            
    except Exception as e:
        print(f"Error updating exams: {e}")
        return False
    finally:
        client.close()

async def main():
    """Main function to run the update"""
    print("Updating all Mid Semester exams with standardized question structure...")
    print("=" * 70)
    
    success = await update_all_midsem_exams()
    
    if success:
        print("\n🎉 All Mid Semester exams updated successfully!")
    else:
        print("\n❌ Failed to update exams.")
    
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(main())