#!/usr/bin/env python3
"""
Test script to verify MongoDB connection
"""

import asyncio
import os
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def test_db_connection():
    """Test MongoDB connection"""
    try:
        print("Testing MongoDB connection...")
        print("=" * 40)
        
        # Get environment variables
        mongo_url = os.environ.get('MONGO_URL')
        db_name = os.environ.get('DB_NAME')
        
        print(f"MONGO_URL: {mongo_url}")
        print(f"DB_NAME: {db_name}")
        
        if not mongo_url:
            print("❌ MONGO_URL not found in environment variables!")
            return False
            
        if not db_name:
            print("❌ DB_NAME not found in environment variables!")
            return False
        
        # Test connection
        print("\nConnecting to MongoDB...")
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        
        # Test a simple query
        print("Testing database connection with a simple query...")
        collections = await db.list_collection_names()
        print(f"✅ Connected successfully! Collections found: {len(collections)}")
        
        if collections:
            print("Collections:")
            for collection in collections:
                print(f"  - {collection}")
        
        # Test a specific collection query
        try:
            # Try to count documents in exams collection
            exams_count = await db.exams.count_documents({})
            print(f"✅ Exams collection has {exams_count} documents")
        except Exception as e:
            print(f"⚠️  Could not query exams collection: {e}")
        
        # Close connection
        client.close()
        
        print("\n🎉 MongoDB connection test PASSED!")
        return True
        
    except Exception as e:
        print(f"❌ MongoDB connection test FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("MongoDB Connection Test")
    print("=" * 40)
    
    success = asyncio.run(test_db_connection())
    
    if success:
        print("\n✅ Database connection is working correctly!")
        print("The server should start without database connection issues.")
    else:
        print("\n❌ Database connection has problems!")
        print("Please check your MONGO_URL and DB_NAME in the .env file.")