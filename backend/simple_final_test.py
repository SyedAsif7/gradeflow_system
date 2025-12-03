#!/usr/bin/env python3
"""
Simple final test to verify deployment readiness
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

def simple_test():
    """Simple test without async issues"""
    try:
        print("Simple Final Test for Vercel Deployment")
        print("=" * 50)
        
        # Add backend directory to path
        backend_path = Path(__file__).parent
        sys.path.insert(0, str(backend_path))
        
        # Test environment variables
        print("1. Checking Environment Variables...")
        env_path = backend_path / '.env'
        if env_path.exists():
            load_dotenv(env_path)
            print(f"   ✅ Loaded environment variables")
        
        required_vars = ['MONGO_URL', 'DB_NAME', 'JWT_SECRET']
        all_set = True
        for var in required_vars:
            if os.environ.get(var):
                print(f"   ✅ {var}: Set")
            else:
                print(f"   ❌ {var}: Not set")
                all_set = False
        
        # Test imports
        print("\n2. Testing Imports...")
        try:
            import vercel_wrapper
            print("   ✅ Vercel wrapper imported successfully")
        except Exception as e:
            print(f"   ❌ Vercel wrapper import failed: {e}")
            return False
            
        try:
            from server import app
            print("   ✅ Server module imported successfully")
        except Exception as e:
            print(f"   ❌ Server module import failed: {e}")
            return False
        
        # Check app availability
        print("\n3. Checking App Availability...")
        if hasattr(vercel_wrapper, 'app'):
            print("   ✅ FastAPI app is available in vercel_wrapper")
        else:
            print("   ❌ FastAPI app is not available in vercel_wrapper")
            return False
            
        # Summary
        print("\n" + "=" * 50)
        if all_set:
            print("🎉 ENVIRONMENT TEST PASSED!")
        else:
            print("⚠️  ENVIRONMENT TEST FAILED!")
            
        print("✅ IMPORT TEST PASSED!")
        print("✅ APP AVAILABILITY TEST PASSED!")
        
        if all_set:
            print("\n🚀 YOUR APPLICATION IS READY FOR VERCEL DEPLOYMENT!")
            print("\n📝 Deployment Checklist:")
            print("   ✅ Environment variables configured")
            print("   ✅ Vercel wrapper ready")
            print("   ✅ Server initialization working")
            print("   ✅ App objects available")
            print("\nNext steps:")
            print("   1. Commit and push changes")
            print("   2. Set environment variables in Vercel dashboard")
            print("   3. Redeploy on Vercel")
            return True
        else:
            print("\n❌ APPLICATION NOT READY FOR DEPLOYMENT!")
            print("Please set the required environment variables.")
            return False
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = simple_test()
    if success:
        print("\n🎉 DEPLOYMENT READY!")
    else:
        print("\n❌ DEPLOYMENT NOT READY!")