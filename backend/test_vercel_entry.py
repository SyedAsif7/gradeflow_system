#!/usr/bin/env python3
"""
Test script to verify Vercel entry point works correctly
"""

import os
from dotenv import load_dotenv
from pathlib import Path

def test_vercel_entry():
    """Test if vercel entry point works"""
    try:
        print("Testing Vercel entry point...")
        print("=" * 40)
        
        # Load environment variables to simulate Vercel environment
        backend_path = Path(__file__).parent
        env_path = backend_path / '.env'
        if env_path.exists():
            load_dotenv(env_path)
            print(f"✅ Loaded environment variables from {env_path}")
        else:
            print("⚠️  No .env file found, using system environment variables")
        
        # Check if required environment variables are set
        required_vars = ['MONGO_URL', 'DB_NAME', 'JWT_SECRET']
        for var in required_vars:
            if os.environ.get(var):
                print(f"✅ {var} is set")
            else:
                print(f"❌ {var} is not set")
        
        # Test importing the vercel entry
        print("\nImporting vercel_entry module...")
        import vercel_entry
        
        # Check if app is available
        if hasattr(vercel_entry, 'app'):
            print("✅ FastAPI app is available")
        else:
            print("❌ FastAPI app is not available")
            return False
            
        # Check if setup_environment function exists
        if hasattr(vercel_entry, 'setup_environment'):
            print("✅ setup_environment function is available")
        else:
            print("❌ setup_environment function is not available")
            return False
            
        print("\n🎉 Vercel entry point test PASSED!")
        return True
        
    except Exception as e:
        print(f"❌ Vercel entry point test FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("Vercel Entry Point Test")
    print("=" * 40)
    
    success = test_vercel_entry()
    
    if success:
        print("\n✅ Vercel entry point should work correctly!")
        print("The application should deploy properly to Vercel now.")
        print("\n📝 Next steps:")
        print("   1. Make sure environment variables are set in Vercel dashboard")
        print("   2. Redeploy your application")
        print("   3. The 500 error should be resolved")
    else:
        print("\n❌ Vercel entry point has problems!")
        print("Please check the errors above.")