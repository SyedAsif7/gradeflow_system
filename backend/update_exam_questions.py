#!/usr/bin/env python3
"""
Script to update an existing exam with the correct question structure for Mid Semester exams.
This script updates the exam with ID: 6b6b320b-1afb-4607-86a2-30b040e3e806
to have the proper question distribution:
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

# Exam ID to update (correct ID from the database)
EXAM_ID = "6b6b320b-1afb-4607-86a2-30b040e3e806"

# New question structure
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

async def update_exam_questions():
    """Update the exam with the new question structure"""
    try:
        # Check if exam exists
        exam = await db.exams.find_one({"id": EXAM_ID})
        if not exam:
            print(f"Exam with ID {EXAM_ID} not found!")
            return False
        
        print(f"Found exam: {exam['exam_type']} - {exam.get('subject_id', 'Unknown Subject')}")
        
        # Update the exam with new questions and total marks
        update_data = {
            "questions": NEW_QUESTIONS,
            "total_marks": 20  # Sum of all question marks
        }
        
        result = await db.exams.update_one(
            {"id": EXAM_ID},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            print(f"Successfully updated exam {EXAM_ID}")
            print("New question structure:")
            for q in NEW_QUESTIONS:
                print(f"  Q{q['question_number']}: {q['question_text']} ({q['max_marks']} marks)")
            print(f"Total marks: {sum(q['max_marks'] for q in NEW_QUESTIONS)}")
            return True
        else:
            print(f"No changes made to exam {EXAM_ID}")
            return False
            
    except Exception as e:
        print(f"Error updating exam: {e}")
        return False

async def main():
    """Main function to run the update"""
    print("Updating exam question structure...")
    print(f"Exam ID: {EXAM_ID}")
    print("Target structure:")
    for q in NEW_QUESTIONS:
        print(f"  Q{q['question_number']}: {q['question_text']} ({q['max_marks']} marks)")
    print()
    
    success = await update_exam_questions()
    
    if success:
        print("\n✅ Exam updated successfully!")
    else:
        print("\n❌ Failed to update exam.")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(main())