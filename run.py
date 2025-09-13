#!/usr/bin/env python3
"""
AI Health Assistant Application
A web-based health consultation interface using AI technology
"""

import os
import sys
from app import app

def main():
    """Main function to run the Flask application"""
    print("🏥 Starting AI Doctor Assistant Application...")
    print("👨‍⚕️ Your personal AI doctor for health consultation and guidance")
    print("🌐 The application will be available at: http://localhost:5000")
    print("⚠️  Remember: Your AI doctor provides information only - always consult real healthcare professionals")
    print("🚨 For emergencies, call emergency services immediately")
    print("⚡ Press Ctrl+C to stop the server")
    print("-" * 70)
    
    try:
        app.run(debug=True, host='0.0.0.0', port=5000)
    except KeyboardInterrupt:
        print("\n👋 Shutting down your AI Doctor Assistant...")
        sys.exit(0)
    except Exception as e:
        print(f"❌ Error starting the application: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
