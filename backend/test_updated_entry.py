#!/usr/bin/env python3
"""
Test script to verify the updated Vercel entry point works correctly
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

def test_updated_entry():
    """Test if the updated vercel entry point works"""
    try:
        print("Testing Updated Vercel Entry Point...")
        print("=" * 50)
        
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
                print(f"  ✅ {var}: Set (length: {len(value)})")
            else:
                print(f"  ❌ {var}: Not set")
        
        # Test importing the updated vercel entry
        print("\nImporting updated vercel_entry module...")
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
            
        print("\n🎉 Updated Vercel entry point test PASSED!")
        return True
        
    except Exception as e:
        print(f"❌ Updated Vercel entry point test FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("Updated Vercel Entry Point Test")
    print("=" * 50)
    
    success = test_updated_entry()
    
    if success:
        print("\n✅ Updated Vercel entry point should work correctly!")
        print("The application should deploy properly to Vercel now.")
        print("\n📝 Deployment Instructions:")
        print("   1. Commit and push these changes to your repository")
        print("   2. Ensure environment variables are set in Vercel dashboard:")
        print("      - MONGO_URL")
        print("      - DB_NAME") 
        print("      - JWT_SECRET")
        print("      - CORS_ORIGINS")
        print("   3. Redeploy your application on Vercel")
        print("   4. The 500 error should be resolved")
    else:
        print("\n❌ Updated Vercel entry point has problems!")
        print("Please check the errors above.")