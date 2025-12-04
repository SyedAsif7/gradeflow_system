#!/usr/bin/env python3
"""
Check if VERCEL environment variable is being detected properly
"""
import os

def check_vercel_env():
    """Check Vercel environment detection"""
    print("Checking Vercel environment detection...")
    print("=" * 40)
    
    vercel_env = os.environ.get('VERCEL')
    print(f"VERCEL environment variable: {vercel_env}")
    
    if vercel_env:
        print("✅ Running in Vercel environment")
    else:
        print("❌ Not running in Vercel environment")
        
    # Test with simulated Vercel environment
    print("\nTesting with simulated Vercel environment...")
    os.environ['VERCEL'] = '1'
    vercel_env = os.environ.get('VERCEL')
    print(f"Simulated VERCEL environment variable: {vercel_env}")
    
    if vercel_env:
        print("✅ Simulated Vercel environment detected correctly")

if __name__ == "__main__":
    check_vercel_env()