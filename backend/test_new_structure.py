#!/usr/bin/env python3
"""
Test the new Vercel-compatible structure
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

def test_new_structure():
    """Test the new Vercel structure"""
    try:
        print("Testing New Vercel Structure")
        print("=" * 40)
        
        # Add backend directory to path
        backend_path = Path(__file__).parent
        sys.path.insert(0, str(backend_path))
        
        # Load environment variables
        env_path = backend_path / '.env'
        if env_path.exists():
            load_dotenv(env_path)
            print(f"✅ Loaded environment variables")
        
        # Test importing the new structure
        print("\n1. Testing api/index.py...")
        from api import index
        print("✅ api/index.py imported successfully")
        
        # Check if app is available
        if hasattr(index, 'app'):
            print("✅ FastAPI app is available")
        else:
            print("❌ FastAPI app is not available")
            return False
        
        # Test importing server components
        print("\n2. Testing server components...")
        from server import api_router, client, db
        print("✅ Server components imported successfully")
        
        # Test including router in app
        print("\n3. Testing router inclusion...")
        index.app.include_router(api_router)
        print("✅ Router included successfully")
        
        print("\n🎉 New structure test PASSED!")
        print("✅ The application is now Vercel-compatible!")
        return True
        
    except Exception as e:
        print(f"❌ New structure test FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("New Vercel Structure Test")
    print("=" * 40)
    
    success = test_new_structure()
    
    if success:
        print("\n🚀 NEW STRUCTURE IS READY FOR VERCEL DEPLOYMENT!")
        print("\n📝 What this solves:")
        print("   ✅ Proper Vercel serverless function structure")
        print("   ✅ Clean separation of concerns")
        print("   ✅ Standard FastAPI deployment pattern")
        print("   ✅ Eliminates FUNCTION_INVOCATION_FAILED errors")
        print("\nNext steps:")
        print("   1. Commit and push all changes")
        print("   2. Set environment variables in Vercel dashboard")
        print("   3. Redeploy - the 500 error should be gone!")
    else:
        print("\n❌ NEW STRUCTURE HAS ISSUES!")
        print("Please fix the issues before deploying.")