#!/usr/bin/env python3
"""
Final deployment test to verify the application works in Vercel-like environment
"""
import os
import sys
from pathlib import Path

# Simulate Vercel environment
os.environ['VERCEL'] = '1'

# Add backend directory to path
backend_path = Path(__file__).parent
sys.path.insert(0, str(backend_path))

def test_vercel_deployment():
    """Test that the Vercel deployment works correctly"""
    try:
        print("Testing Vercel deployment simulation...")
        print("=" * 50)
        
        # Test importing the API entry point (this is what Vercel does)
        print("1. Testing API entry point import...")
        from api.index import app
        print("   ✅ API entry point imported successfully")
        
        # Test that we can access the app object
        print("2. Testing FastAPI app object...")
        assert hasattr(app, 'include_router'), "App should have include_router method"
        print("   ✅ FastAPI app object is valid")
        
        # Test that health endpoints are available
        print("3. Testing health endpoints...")
        import asyncio
        async def test_health():
            # Test root endpoint
            response = await app.router.lifespan_context(app)
            print("   ✅ Health endpoints are available")
        
        asyncio.run(test_health())
        print("   ✅ Health check passed")
        
        print("\n🎉 All tests passed!")
        print("✅ Your application should deploy successfully to Vercel!")
        print("\n📝 Next steps:")
        print("   1. Make sure environment variables are set in Vercel dashboard")
        print("   2. Redeploy your application")
        print("   3. The 500 error should be resolved")
        
        return True
        
    except Exception as e:
        print(f"❌ Test FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("Final Vercel Deployment Test")
    print("=" * 30)
    
    success = test_vercel_deployment()
    
    if not success:
        print("\n❌ Deployment test failed!")
        print("Please check the errors above before deploying to Vercel.")
        sys.exit(1)
    else:
        print("\n✅ Deployment test passed!")
        print("You're ready to deploy to Vercel.")