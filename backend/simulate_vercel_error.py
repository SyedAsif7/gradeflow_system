#!/usr/bin/env python3
"""
Simulate potential Vercel errors to identify the root cause
"""
import os
import sys
from pathlib import Path

# Simulate Vercel environment
os.environ['VERCEL'] = '1'

# Add backend directory to path
backend_path = Path(__file__).parent
sys.path.insert(0, str(backend_path))

def test_import_sequence():
    """Test the exact import sequence that happens in Vercel"""
    try:
        print("Simulating Vercel import sequence...")
        print("=" * 40)
        
        # This is what Vercel does - imports the api/index.py file
        print("1. Importing api.index (Vercel entry point)...")
        import api.index
        print("   ✅ api.index imported successfully")
        
        # Check if app object is available
        print("2. Checking app object...")
        assert hasattr(api.index, 'app'), "app object should be available"
        print("   ✅ app object is available")
        
        # Try to access routes
        print("3. Checking routes...")
        # This is where the issue might occur
        print("   ℹ️  In Vercel, this is where routes get imported")
        
        print("\n🎉 Import sequence test passed!")
        return True
        
    except Exception as e:
        print(f"❌ Import sequence FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_with_broken_db():
    """Test what happens when database connection fails"""
    try:
        print("\n\nTesting with broken database connection...")
        print("=" * 40)
        
        # Temporarily break the database connection
        original_mongo_url = os.environ.get('MONGO_URL')
        os.environ['MONGO_URL'] = 'mongodb://invalid-host:27017/invalid-db'
        
        try:
            # Try to import server module
            print("1. Importing server module with broken DB...")
            import server
            print("   ✅ Server module imported (even with broken DB)")
        except Exception as e:
            print(f"   ⚠️  Server module import failed: {e}")
        
        # Restore original
        if original_mongo_url:
            os.environ['MONGO_URL'] = original_mongo_url
        else:
            os.environ.pop('MONGO_URL', None)
            
        print("\n🎉 Broken DB test completed!")
        return True
        
    except Exception as e:
        print(f"❌ Broken DB test FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("Vercel Error Simulation Test")
    print("=" * 30)
    
    success1 = test_import_sequence()
    success2 = test_with_broken_db()
    
    if success1 and success2:
        print("\n✅ All simulation tests passed!")
        print("The issue might be elsewhere in the Vercel deployment.")
    else:
        print("\n❌ Some simulation tests failed!")
        print("Check the errors above for potential causes.")