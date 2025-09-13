"""
Script to build the AI Doctor Assistant as a standalone executable
Run this script to create the .exe file
"""

import PyInstaller.__main__
import os
import sys

def create_simple_icon():
    """Create a simple icon file if it doesn't exist"""
    icon_path = os.path.join('static', 'icon.ico')
    
    # Check if icon already exists
    if os.path.exists(icon_path):
        return icon_path
    
    # Create static directory if it doesn't exist
    os.makedirs('static', exist_ok=True)
    
    print("📝 Icon file not found. Building without custom icon...")
    return None

def build_executable():
    """Build the executable using PyInstaller"""
    
    # Get the current directory
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Try to create or find icon
    icon_path = create_simple_icon()
    
    # Define the PyInstaller arguments
    args = [
        'app.py',                           # Main Python file
        '--onefile',                        # Create a single executable file
        '--name=AI_Doctor_Assistant',       # Name of the executable
        '--add-data=index.html;.',         # Include HTML file
        '--add-data=static;static',        # Include static folder
        '--hidden-import=openai',          # Ensure OpenAI is included
        '--hidden-import=flask',           # Ensure Flask is included
        '--hidden-import=threading',       # Ensure threading is included
        '--hidden-import=webbrowser',      # Ensure webbrowser is included
        '--hidden-import=requests',        # Ensure requests is included
        '--hidden-import=json',            # Ensure json is included
        '--hidden-import=urllib3',         # Ensure urllib3 is included
        '--hidden-import=certifi',         # Ensure certifi is included
        '--clean',                         # Clean cache before building
        '--noconfirm',                     # Overwrite output without asking
    ]
    
    # Add icon if it exists
    if icon_path and os.path.exists(icon_path):
        args.append(f'--icon={icon_path}')
        print(f"🎨 Using icon: {icon_path}")
    else:
        print("🎨 Building without custom icon (will use default)")
    
    print("🔨 Building AI Doctor Assistant executable...")
    print("📦 This may take a few minutes...")
    print("🔧 Using direct API calls for better compatibility...")
    print("-" * 50)
    
    try:
        # Run PyInstaller
        PyInstaller.__main__.run(args)
        
        print("\n✅ Build completed successfully!")
        print("📁 Your executable is in the 'dist' folder")
        print("🚀 You can now distribute 'AI_Doctor_Assistant.exe'")
        print("\n📋 Files created:")
        print("   - dist/AI_Doctor_Assistant.exe (your main executable)")
        print("   - build/ (temporary build files - can be deleted)")
        print("   - AI_Doctor_Assistant.spec (build configuration)")
        print("\n💡 Tips:")
        print("   - The .exe file is completely standalone")
        print("   - Users don't need Python installed")
        print("   - Double-click the .exe to run the application")
        print("   - The app will open in your default web browser")
        print("   - Fixed compatibility issues with OpenRouter API")
        
    except Exception as e:
        print(f"❌ Build failed: {e}")
        return False
    
    return True

if __name__ == '__main__':
    # Check if PyInstaller is installed
    try:
        import PyInstaller
    except ImportError:
        print("❌ PyInstaller not found!")
        print("📦 Install it with: pip install pyinstaller")
        sys.exit(1)
    
    # Check if required files exist
    required_files = ['app.py', 'index.html', 'static/style.css', 'static/script.js']
    missing_files = [f for f in required_files if not os.path.exists(f)]
    
    if missing_files:
        print("❌ Missing required files:")
        for file in missing_files:
            print(f"   - {file}")
        print("\n💡 Make sure you're running this script in the correct directory")
        sys.exit(1)
    
    # Build the executable
    success = build_executable()
    
    if success:
        print("\n🎉 Build successful! Your AI Doctor Assistant is ready to use.")
        print("🔧 Fixed OpenRouter API compatibility issues")
        input("\nPress Enter to exit...")
    else:
        print("\n❌ Build failed. Check the error messages above.")
        input("\nPress Enter to exit...")
