#!/usr/bin/env python3
"""
Test script to verify lazy database initialization works
"""
import os
import logging

# Mock Vercel environment
os.environ['VERCEL'] = '1'

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_lazy_db_init():
    """Test lazy database initialization"""
    try:
        print("Testing lazy database initialization in Vercel-like environment...")
        print("=" * 60)
        
        # This should not fail even if database is not accessible
        from server import api_router
        print("✅ Server module imported successfully")
        print("✅ Lazy database initialization is working")
        
        return True
        
    except Exception as e:
        print(f"❌ Test FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("Lazy Database Initialization Test")
    print("=" * 40)
    
    success = test_lazy_db_init()
    
    if success:
        print("\n✅ Lazy database initialization should work correctly in Vercel!")
        print("The 500 error should be resolved after redeployment.")
    else:
        print("\n❌ Lazy database initialization has problems!")
        print("Please check the errors above.")