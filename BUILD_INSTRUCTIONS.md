# Building AI Doctor Assistant Executable

## Quick Build (No Icon)

1. **Install requirements**:
   \`\`\`bash
   pip install -r requirements_exe.txt
   \`\`\`

2. **Build the executable**:
   \`\`\`bash
   python build_exe.py
   \`\`\`

3. **Find your .exe** in the `dist/` folder

## Build with Custom Icon (Optional)

1. **Create an icon** (optional):
   \`\`\`bash
   python create_icon.py
   \`\`\`

2. **Build with icon**:
   \`\`\`bash
   python build_exe.py
   \`\`\`

## Troubleshooting

### Missing Icon Error
- The build script now handles missing icons automatically
- It will build without an icon if none is found
- Run `python create_icon.py` to create a medical-themed icon

### Build Fails
- Make sure all files are in the correct directory:
  - `app.py`
  - `index.html`
  - `static/style.css`
  - `static/script.js`

### Dependencies
- Install PyInstaller: `pip install pyinstaller`
- For custom icon: `pip install Pillow`

## File Structure After Build

\`\`\`
your-folder/
├── app.py
├── build_exe.py
├── create_icon.py (optional)
├── index.html
├── static/
│   ├── style.css
│   ├── script.js
│   └── icon.ico (if created)
├── dist/
│   └── AI_Doctor_Assistant.exe  ← Your final executable
├── build/ (temporary files)
└── AI_Doctor_Assistant.spec (build config)
\`\`\`

## Distribution

The `AI_Doctor_Assistant.exe` file in the `dist/` folder is completely standalone:
- No Python installation required
- No additional files needed
- Works on any Windows computer
- Double-click to run

## Usage

1. Double-click `AI_Doctor_Assistant.exe`
2. Wait for the console window to show "Starting AI Doctor Assistant..."
3. Your web browser will open automatically
4. Enter your OpenRouter API key
5. Start chatting with your AI doctor!

To stop the application, close the console window.
