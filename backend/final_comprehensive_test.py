#!/usr/bin/env python3
"""
Final comprehensive test to verify all components work together for Vercel deployment
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

def test_everything():
    """Comprehensive test of all components"""
    try:
        print("Final Comprehensive Test for Vercel Deployment")
        print("=" * 60)
        
        # Add backend directory to path
        backend_path = Path(__file__).parent
        sys.path.insert(0, str(backend_path))
        
        # 1. Test environment variables
        print("1. Testing Environment Variables...")
        env_path = backend_path / '.env'
        if env_path.exists():
            load_dotenv(env_path)
            print(f"   ✅ Loaded environment variables from {env_path}")
        else:
            print("   ⚠️  No .env file found (this is OK for Vercel)")
        
        required_vars = ['MONGO_URL', 'DB_NAME', 'JWT_SECRET']
        env_status = {}
        for var in required_vars:
            value = os.environ.get(var)
            env_status[var] = bool(value)
            if value:
                print(f"   ✅ {var}: Set")
            else:
                print(f"   ❌ {var}: Not set")
        
        if all(env_status.values()):
            print("   🎉 All environment variables are set")
        else:
            missing = [k for k, v in env_status.items() if not v]
            print(f"   ⚠️  Missing environment variables: {missing}")
        
        # 2. Test vercel_wrapper
        print("\n2. Testing Vercel Wrapper...")
        import vercel_wrapper
        wrapper_attrs = ['app', 'handler', 'application', 'asgi_app']
        wrapper_status = {}
        for attr in wrapper_attrs:
            wrapper_status[attr] = hasattr(vercel_wrapper, attr)
            if wrapper_status[attr]:
                print(f"   ✅ {attr}: Available")
            else:
                print(f"   ❌ {attr}: Not available")
        
        if all(wrapper_status.values()):
            print("   🎉 Vercel wrapper is properly configured")
        else:
            print("   ⚠️  Some wrapper attributes are missing")
        
        # 3. Test server initialization
        print("\n3. Testing Server Initialization...")
        from server import app, client, db
        print("   ✅ FastAPI app imported successfully")
        print("   ✅ MongoDB client imported successfully")
        print("   ✅ Database instance imported successfully")
        
        # 4. Test database connection
        print("\n4. Testing Database Connection...")
        try:
            # Test a simple database operation
            import asyncio
            async def test_db():
                try:
                    collections = await db.list_collection_names()
                    print(f"   ✅ Database connection successful - {len(collections)} collections found")
                    return True
                except Exception as e:
                    print(f"   ❌ Database connection failed: {e}")
                    return False
            
            # Run the async test
            result = asyncio.run(test_db())
            if result:
                print("   🎉 Database connectivity test passed")
            else:
                print("   ❌ Database connectivity test failed")
        except Exception as e:
            print(f"   ❌ Database test error: {e}")
        
        # 5. Summary
        print("\n" + "=" * 60)
        print("FINAL TEST RESULTS:")
        print("=" * 60)
        
        tests = [
            ("Environment Variables", all(env_status.values())),
            ("Vercel Wrapper", all(wrapper_status.values())),
            ("Server Initialization", True),  # We got this far, so it worked
            ("Database Connectivity", result if 'result' in locals() else False)
        ]
        
        all_passed = True
        for test_name, passed in tests:
            status = "✅ PASS" if passed else "❌ FAIL"
            print(f"  {status} {test_name}")
            if not passed:
                all_passed = False
        
        print("=" * 60)
        if all_passed:
            print("🎉 ALL TESTS PASSED!")
            print("✅ Your application is ready for Vercel deployment!")
            return True
        else:
            print("❌ SOME TESTS FAILED!")
            print("⚠️  Please check the failed tests above before deploying.")
            return False
        
    except Exception as e:
        print(f"❌ Comprehensive test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_everything()
    
    if success:
        print("\n🚀 DEPLOYMENT READY!")
        print("\n📝 To deploy to Vercel:")
        print("   1. Commit and push all changes to your repository")
        print("   2. Ensure these environment variables are set in Vercel:")
        print("      • MONGO_URL")
        print("      • DB_NAME") 
        print("      • JWT_SECRET")
        print("      • CORS_ORIGINS")
        print("   3. Redeploy your application on Vercel")
        print("   4. The 500 error should be resolved!")
    else:
        print("\n❌ DEPLOYMENT NOT READY!")
        print("Please fix the issues before deploying to Vercel.")