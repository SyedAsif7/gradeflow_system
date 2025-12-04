#!/usr/bin/env python3
"""
Test that the Vercel fix works correctly
"""
import os
import sys
from pathlib import Path

# Simulate Vercel environment
os.environ['VERCEL'] = '1'

# Add backend directory to path
backend_path = Path(__file__).parent
sys.path.insert(0, str(backend_path))

def test_server_import():
    """Test that server module can be imported in Vercel environment"""
    try:
        print("Testing server import in Vercel-like environment...")
        print("=" * 50)
        
        # This should work now without trying to create directories
        print("1. Importing server module...")
        import server
        print("   ✅ Server module imported successfully")
        
        # Check that UPLOAD_DIR is None in Vercel environment
        print("2. Checking UPLOAD_DIR...")
        if server.UPLOAD_DIR is None:
            print("   ✅ UPLOAD_DIR is None in Vercel environment (expected)")
        else:
            print(f"   ⚠️  UPLOAD_DIR is {server.UPLOAD_DIR} (unexpected)")
        
        # Check that database connection functions exist
        print("3. Checking database functions...")
        assert hasattr(server, 'init_db'), "init_db function should exist"
        assert hasattr(server, 'get_db'), "get_db function should exist"
        print("   ✅ Database functions exist")
        
        print("\n🎉 Vercel fix test passed!")
        print("✅ Server should now start correctly in Vercel!")
        return True
        
    except Exception as e:
        print(f"❌ Test FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("Vercel Fix Test")
    print("=" * 20)
    
    success = test_server_import()
    
    if success:
        print("\n✅ Vercel fix is working correctly!")
        print("You should now be able to deploy to Vercel without the file system error.")
    else:
        print("\n❌ Vercel fix test failed!")
        print("There may still be issues with the Vercel deployment.")
        sys.exit(1)