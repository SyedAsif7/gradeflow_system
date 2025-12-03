#!/usr/bin/env python3
"""
Test script to verify the Vercel wrapper works correctly
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

def test_wrapper():
    """Test if the Vercel wrapper works"""
    try:
        print("Testing Vercel Wrapper...")
        print("=" * 40)
        
        # Add backend directory to path
        backend_path = Path(__file__).parent
        sys.path.insert(0, str(backend_path))
        
        # Load environment variables
        env_path = backend_path / '.env'
        if env_path.exists():
            load_dotenv(env_path)
            print(f"✅ Loaded environment variables from {env_path}")
        else:
            print("⚠️  No .env file found")
        
        # Check environment variables
        print("\nChecking environment variables:")
        required_vars = ['MONGO_URL', 'DB_NAME', 'JWT_SECRET']
        for var in required_vars:
            value = os.environ.get(var)
            if value:
                print(f"  ✅ {var}: Set")
            else:
                print(f"  ❌ {var}: Not set")
        
        # Test importing the wrapper
        print("\nImporting vercel_wrapper module...")
        import vercel_wrapper
        
        # Check if app is available in different forms
        app_vars = ['app', 'handler', 'application', 'asgi_app']
        found_vars = []
        for var in app_vars:
            if hasattr(vercel_wrapper, var):
                found_vars.append(var)
                print(f"✅ {var}: Available")
            else:
                print(f"❌ {var}: Not available")
        
        if not found_vars:
            print("❌ No app variables found!")
            return False
            
        print(f"\n🎉 Found app variables: {found_vars}")
        
        print("\n🎉 Vercel wrapper test PASSED!")
        return True
        
    except Exception as e:
        print(f"❌ Vercel wrapper test FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("Vercel Wrapper Test")
    print("=" * 40)
    
    success = test_wrapper()
    
    if success:
        print("\n✅ Vercel wrapper should work correctly!")
        print("The application should deploy properly to Vercel now.")
    else:
        print("\n❌ Vercel wrapper has problems!")
        print("Please check the errors above.")