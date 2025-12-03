#!/usr/bin/env python3
"""
Verification script to ensure the project is ready for Vercel deployment.
"""

import os
from pathlib import Path

def verify_deployment_setup():
    """Verify that all necessary files for Vercel deployment are in place"""
    print("🔍 Verifying deployment setup...")
    print("=" * 50)
    
    # Check project structure
    root_dir = Path(__file__).parent
    required_files = [
        "vercel.json",
        "README.md",
        "requirements.txt",
        ".vercelignore",
        "backend/",
        "frontend/",
    ]
    
    missing_files = []
    for file_path in required_files:
        full_path = root_dir / file_path
        if not full_path.exists():
            missing_files.append(file_path)
    
    if missing_files:
        print("❌ Missing required files/directories:")
        for file in missing_files:
            print(f"   - {file}")
        return False
    else:
        print("✅ All required files/directories present")
    
    # Check vercel.json configuration
    vercel_config = root_dir / "vercel.json"
    if vercel_config.exists():
        print("✅ Root vercel.json found")
        # Read and verify basic structure
        with open(vercel_config, 'r') as f:
            content = f.read()
            if "builds" in content and "routes" in content:
                print("✅ vercel.json has proper structure")
            else:
                print("❌ vercel.json missing builds or routes configuration")
                return False
    else:
        print("❌ Root vercel.json not found")
        return False
    
    # Check backend configuration
    backend_dir = root_dir / "backend"
    if backend_dir.exists():
        print("✅ Backend directory found")
        
        backend_vercel = backend_dir / "vercel.json"
        if backend_vercel.exists():
            print("✅ Backend vercel.json found")
        else:
            print("ℹ️  Backend vercel.json not found (using root config)")
        
        backend_env = backend_dir / ".env"
        if backend_env.exists():
            print("✅ Backend .env found (remember to add as secrets in Vercel)")
        else:
            print("ℹ️  Backend .env not found (create in Vercel dashboard)")
        
        requirements = backend_dir / "requirements.txt"
        if requirements.exists():
            print("✅ Backend requirements.txt found")
        else:
            print("❌ Backend requirements.txt not found")
            return False
    else:
        print("❌ Backend directory not found")
        return False
    
    # Check frontend configuration
    frontend_dir = root_dir / "frontend"
    if frontend_dir.exists():
        print("✅ Frontend directory found")
        
        frontend_package = frontend_dir / "package.json"
        if frontend_package.exists():
            print("✅ Frontend package.json found")
        else:
            print("❌ Frontend package.json not found")
            return False
        
        frontend_vercel = frontend_dir / "vercel.json"
        if frontend_vercel.exists():
            print("✅ Frontend vercel.json found")
        else:
            print("ℹ️  Frontend vercel.json not found (using root config)")
        
        frontend_env = frontend_dir / ".env"
        if frontend_env.exists():
            print("✅ Frontend .env found (remember to update for production)")
            # Check if it has the right format
            with open(frontend_env, 'r') as f:
                content = f.read()
                if "REACT_APP_BACKEND_URL" in content:
                    print("✅ Frontend .env has backend URL configuration")
                else:
                    print("❌ Frontend .env missing REACT_APP_BACKEND_URL")
        else:
            print("ℹ️  Frontend .env not found")
    else:
        print("❌ Frontend directory not found")
        return False
    
    # Check ignore file
    vercelignore = root_dir / ".vercelignore"
    if vercelignore.exists():
        print("✅ .vercelignore found")
    else:
        print("❌ .vercelignore not found")
        return False
    
    print("\n🎉 VERIFICATION COMPLETE")
    print("\n📋 NEXT STEPS FOR DEPLOYMENT:")
    print("   1. Create a Vercel account at https://vercel.com/")
    print("   2. Install Vercel CLI: npm install -g vercel")
    print("   3. Run: vercel login")
    print("   4. Run: vercel")
    print("   5. Add environment variables in Vercel dashboard:")
    print("      - MONGO_URL (your MongoDB connection string)")
    print("      - DB_NAME (your database name)")
    print("      - JWT_SECRET (your JWT secret)")
    print("      - CORS_ORIGINS (your frontend URL)")
    print("\n📝 NOTES:")
    print("   - Update REACT_APP_BACKEND_URL in frontend/.env for production")
    print("   - Make sure your MongoDB is accessible from Vercel")
    print("   - The backend API will be available at /api/ when deployed")
    
    return True

if __name__ == "__main__":
    print("Vercel Deployment Setup Verification")
    print("=" * 50)
    
    success = verify_deployment_setup()
    
    if success:
        print(f"\n✅ PROJECT IS READY FOR DEPLOYMENT TO VERCEL!")
        print("All necessary configuration files are in place.")
    else:
        print(f"\n❌ ISSUES FOUND - Please fix before deploying")