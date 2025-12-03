#!/usr/bin/env python3
"""
Script to list all exams in the database to help identify the correct exam ID.
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

async def list_exams():
    """List all exams in the database"""
    try:
        # Get all exams
        exams = await db.exams.find({}, {"_id": 0}).to_list(1000)
        
        if not exams:
            print("No exams found in the database!")
            return
        
        print(f"Found {len(exams)} exams:")
        print("-" * 80)
        
        for exam in exams:
            print(f"ID: {exam.get('id', 'N/A')}")
            print(f"Subject ID: {exam.get('subject_id', 'N/A')}")
            print(f"Exam Type: {exam.get('exam_type', 'N/A')}")
            print(f"Date: {exam.get('date', 'N/A')}")
            print(f"Total Marks: {exam.get('total_marks', 'N/A')}")
            print(f"Class: {exam.get('class_name', 'N/A')}")
            
            if 'questions' in exam and exam['questions']:
                print("Questions:")
                for q in exam['questions']:
                    print(f"  Q{q.get('question_number', 'N/A')}: {q.get('question_text', 'N/A')} ({q.get('max_marks', 'N/A')} marks)")
            else:
                print("Questions: None")
            
            print("-" * 80)
            
    except Exception as e:
        print(f"Error listing exams: {e}")
    finally:
        client.close()

async def main():
    """Main function to run the exam listing"""
    print("Listing all exams in the database...")
    print()
    await list_exams()

if __name__ == "__main__":
    asyncio.run(main())