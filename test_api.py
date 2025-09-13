"""
Test script to verify OpenRouter API connectivity
Run this to test your API key before building the executable
"""

import requests
import json

def test_openrouter_api():
    """Test the OpenRouter API connection"""
    
    api_key = input("Enter your OpenRouter API key: ").strip()
    
    if not api_key:
        print("❌ No API key provided")
        return False
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "HTTP-Referer": "http://localhost:5000",
        "X-Title": "AI Doctor Assistant Test",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "deepseek/deepseek-r1-0528:free",
        "messages": [
            {
                "role": "system",
                "content": "You are a helpful AI assistant."
            },
            {
                "role": "user",
                "content": "Hello, can you respond with a simple greeting?"
            }
        ],
        "stream": False
    }
    
    print("🔄 Testing OpenRouter API connection...")
    
    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=30
        )
        
        print(f"📡 Response Status: {response.status_code}")
        
        if response.ok:
            data = response.json()
            if 'choices' in data and data['choices']:
                message = data['choices'][0]['message']['content']
                print("✅ API Test Successful!")
                print(f"🤖 AI Response: {message}")
                return True
            else:
                print("❌ Invalid response format")
                print(f"Response: {data}")
                return False
        else:
            print(f"❌ API Error: {response.status_code}")
            print(f"Error details: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print("❌ Request timeout - check your internet connection")
        return False
    except requests.exceptions.ConnectionError:
        print("❌ Connection error - check your internet connection")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

if __name__ == '__main__':
    print("🧪 OpenRouter API Test")
    print("=" * 30)
    
    success = test_openrouter_api()
    
    if success:
        print("\n🎉 Your API key works! You can now build the executable.")
    else:
        print("\n❌ API test failed. Please check:")
        print("   - Your API key is correct")
        print("   - You have internet connection")
        print("   - Your OpenRouter account has credits")
    
    input("\nPress Enter to exit...")
