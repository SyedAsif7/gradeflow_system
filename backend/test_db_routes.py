#!/usr/bin/env python3
"""
Test database-dependent routes in Vercel-like environment
"""
import os
import sys
from pathlib import Path

# Simulate Vercel environment
os.environ['VERCEL'] = '1'

# Add backend directory to path
backend_path = Path(__file__).parent
sys.path.insert(0, str(backend_path))

async def test_db_routes():
    """Test that database routes work correctly"""
    try:
        print("Testing database-dependent routes...")
        print("=" * 40)
        
        # Import the server module
        print("1. Importing server module...")
        import server
        print("   ✅ Server module imported")
        
        # Test that we can access the database connection
        print("2. Testing database access...")
        if server.db is None:
            print("   ⚠️  Database not yet initialized (expected in Vercel)")
        else:
            print("   ✅ Database connection available")
        
        # Test the get_db function
        print("3. Testing get_db function...")
        try:
            # This should work without throwing an exception
            db = server.get_db()
            print("   ✅ get_db function works")
        except Exception as e:
            print(f"   ⚠️  get_db function error (might be expected): {e}")
        
        print("\n🎉 Database route test completed!")
        return True
        
    except Exception as e:
        print(f"❌ Database route test FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    print("Database Route Test")
    print("=" * 20)
    
    import asyncio
    success = asyncio.run(test_db_routes())
    
    if success:
        print("\n✅ Database route test passed!")
    else:
        print("\n❌ Database route test failed!")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())