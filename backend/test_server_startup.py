#!/usr/bin/env python3
"""
Test script to verify server startup without actually starting the server
"""

import os
import sys
from pathlib import Path

def test_server_startup():
    """Test if server can import and initialize correctly"""
    try:
        print("Testing server startup...")
        print("=" * 40)
        
        # Add backend directory to path
        backend_path = Path(__file__).parent
        sys.path.insert(0, str(backend_path))
        
        # Test importing the server module
        print("Importing server module...")
        import server
        
        # Check if required attributes exist
        required_attrs = ['app', 'db', 'client']
        for attr in required_attrs:
            if hasattr(server, attr):
                print(f"✅ Found {attr}")
            else:
                print(f"❌ Missing {attr}")
                return False
        
        # Check environment variables
        required_env_vars = ['MONGO_URL', 'DB_NAME']
        for var in required_env_vars:
            value = os.environ.get(var)
            if value:
                print(f"✅ {var} is set")
            else:
                print(f"❌ {var} is not set")
                return False
        
        print("\n🎉 Server startup test PASSED!")
        return True
        
    except Exception as e:
        print(f"❌ Server startup test FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("Server Startup Test")
    print("=" * 40)
    
    success = test_server_startup()
    
    if success:
        print("\n✅ Server should start correctly!")
        print("No import or initialization errors detected.")
    else:
        print("\n❌ Server startup has problems!")
        print("Please check the errors above.")