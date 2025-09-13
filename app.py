from flask import Flask, request, jsonify, send_from_directory, Response
import os
import sys
import webbrowser
import threading
from datetime import datetime
import uuid
import requests
import json
import time

# Get the directory where the script is located
if getattr(sys, 'frozen', False):
    # If running as compiled executable
    application_path = sys._MEIPASS
else:
    # If running as script
    application_path = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__, static_folder=os.path.join(application_path, 'static'))
app.secret_key = os.urandom(24)

@app.route('/')
def index():
    return send_from_directory(application_path, 'index.html')

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        api_key = data.get('api_key')
        message = data.get('message')
        chat_history = data.get('chat_history', [])
        
        if not api_key:
            return jsonify({'error': 'API key is required'}), 400
        
        if not message:
            return jsonify({'error': 'Message is required'}), 400
        
        # Prepare messages for the API with health context
        system_message = {
            "role": "system",
            "content": """You are a helpful AI doctor and medical information provider. You can help users understand symptoms, provide general health information, and suggest when to seek professional medical care.

IMPORTANT DISCLAIMERS:
- You are not a replacement for professional medical advice, diagnosis, or treatment
- Always recommend consulting with qualified healthcare professionals for serious concerns
- In emergencies, advise users to call emergency services immediately
- Provide educational information while emphasizing the importance of professional medical consultation

Be empathetic, informative, and always prioritize user safety by recommending professional medical care when appropriate."""
        }
        
        messages = [system_message]
        for msg in chat_history:
            messages.append({
                "role": msg['role'],
                "content": msg['content']
            })
        
        # Add the new user message
        messages.append({
            "role": "user",
            "content": message
        })
        
        # Make direct API call using requests with streaming
        headers = {
            "Authorization": f"Bearer {api_key}",
            "HTTP-Referer": "http://localhost:5000",
            "X-Title": "AI Doctor Assistant",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "deepseek/deepseek-r1-0528:free",
            "messages": messages,
            "stream": True  # Enable streaming
        }
        
        print(f"Making streaming API request to OpenRouter...")
        
        def generate_response():
            try:
                response = requests.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers=headers,
                    json=payload,
                    timeout=60,
                    stream=True
                )
                
                if not response.ok:
                    error_data = {
                        'error': f'API request failed: {response.status_code} - {response.text}'
                    }
                    yield f"data: {json.dumps(error_data)}\n\n"
                    return
                
                full_content = ""
                
                for line in response.iter_lines():
                    if line:
                        line = line.decode('utf-8')
                        if line.startswith('data: '):
                            data_str = line[6:]  # Remove 'data: ' prefix
                            
                            if data_str.strip() == '[DONE]':
                                # Send final complete message
                                final_data = {
                                    'content': full_content,
                                    'timestamp': datetime.now().isoformat(),
                                    'done': True
                                }
                                yield f"data: {json.dumps(final_data)}\n\n"
                                break
                            
                            try:
                                chunk_data = json.loads(data_str)
                                if 'choices' in chunk_data and chunk_data['choices']:
                                    delta = chunk_data['choices'][0].get('delta', {})
                                    if 'content' in delta:
                                        content_chunk = delta['content']
                                        full_content += content_chunk
                                        
                                        # Send the chunk to frontend
                                        chunk_response = {
                                            'chunk': content_chunk,
                                            'full_content': full_content,
                                            'timestamp': datetime.now().isoformat(),
                                            'done': False
                                        }
                                        yield f"data: {json.dumps(chunk_response)}\n\n"
                                        
                            except json.JSONDecodeError:
                                continue
                                
            except requests.exceptions.Timeout:
                error_data = {'error': 'Request timeout - please try again'}
                yield f"data: {json.dumps(error_data)}\n\n"
            except requests.exceptions.ConnectionError:
                error_data = {'error': 'Connection error - please check your internet connection'}
                yield f"data: {json.dumps(error_data)}\n\n"
            except Exception as e:
                error_data = {'error': f'Unexpected error: {str(e)}'}
                yield f"data: {json.dumps(error_data)}\n\n"
        
        return Response(
            generate_response(),
            mimetype='text/event-stream',
            headers={
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*'
            }
        )
        
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return jsonify({'error': f'Unexpected error: {str(e)}'}), 500

@app.route('/health')
def health():
    return jsonify({'status': 'healthy'})

def open_browser():
    """Open the web browser after a short delay"""
    import time
    time.sleep(1.5)  # Wait for Flask to start
    webbrowser.open('http://localhost:5000')

def main():
    """Main function to run the Flask application"""
    print("🏥 Starting AI Doctor Assistant...")
    print("👨‍⚕️ Your personal AI doctor application with real-time streaming")
    print("🌐 Opening in your web browser...")
    print("⚠️  Remember: This provides information only - always consult real healthcare professionals")
    print("🚨 For emergencies, call emergency services immediately")
    print("⚡ Close this window to stop the application")
    print("-" * 70)
    
    # Start browser in a separate thread
    threading.Thread(target=open_browser, daemon=True).start()
    
    try:
        app.run(debug=False, host='127.0.0.1', port=5000, use_reloader=False, threaded=True)
    except KeyboardInterrupt:
        print("\n👋 Shutting down AI Doctor Assistant...")
    except Exception as e:
        print(f"❌ Error: {e}")
        input("Press Enter to exit...")

if __name__ == '__main__':
    main()
