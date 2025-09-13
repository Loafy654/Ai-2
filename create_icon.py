"""
Optional script to create a simple icon for the application
Run this if you want a custom icon for your .exe file
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_medical_icon():
    """Create a simple medical-themed icon"""
    
    # Create static directory if it doesn't exist
    os.makedirs('static', exist_ok=True)
    
    # Create a 256x256 image with transparent background
    size = 256
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw a medical cross
    # Background circle
    circle_color = (79, 172, 254, 255)  # Blue color
    draw.ellipse([20, 20, size-20, size-20], fill=circle_color)
    
    # White cross
    cross_color = (255, 255, 255, 255)
    cross_width = 40
    
    # Horizontal bar
    draw.rectangle([
        size//2 - cross_width//2 - 30,
        size//2 - cross_width//2,
        size//2 + cross_width//2 + 30,
        size//2 + cross_width//2
    ], fill=cross_color)
    
    # Vertical bar
    draw.rectangle([
        size//2 - cross_width//2,
        size//2 - cross_width//2 - 30,
        size//2 + cross_width//2,
        size//2 + cross_width//2 + 30
    ], fill=cross_color)
    
    # Save as ICO file
    icon_path = os.path.join('static', 'icon.ico')
    
    # Create multiple sizes for the ICO file
    sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    images = []
    
    for size_tuple in sizes:
        resized = img.resize(size_tuple, Image.Resampling.LANCZOS)
        images.append(resized)
    
    # Save as ICO
    images[0].save(icon_path, format='ICO', sizes=[s for s in sizes])
    
    print(f"✅ Icon created successfully: {icon_path}")
    return icon_path

def create_simple_icon_without_pil():
    """Create a very basic icon without PIL dependency"""
    
    # This creates a minimal ICO file programmatically
    # Not as pretty, but works without additional dependencies
    
    icon_path = os.path.join('static', 'icon.ico')
    os.makedirs('static', exist_ok=True)
    
    # Basic ICO file header and data for a 16x16 blue square
    ico_data = bytes([
        # ICO header
        0x00, 0x00,  # Reserved
        0x01, 0x00,  # Type (1 = ICO)
        0x01, 0x00,  # Number of images
        
        # Image directory entry
        0x10,        # Width (16)
        0x10,        # Height (16)
        0x00,        # Color count (0 = >256 colors)
        0x00,        # Reserved
        0x01, 0x00,  # Color planes
        0x20, 0x00,  # Bits per pixel (32)
        0x00, 0x04, 0x00, 0x00,  # Size of image data
        0x16, 0x00, 0x00, 0x00,  # Offset to image data
        
        # Image data (16x16 32-bit RGBA)
    ])
    
    # Add blue pixels (simplified)
    blue_pixel = bytes([0xFF, 0x80, 0x4F, 0xFF])  # BGRA format
    image_data = blue_pixel * (16 * 16)
    
    ico_data += image_data
    
    with open(icon_path, 'wb') as f:
        f.write(ico_data)
    
    print(f"✅ Simple icon created: {icon_path}")
    return icon_path

if __name__ == '__main__':
    print("🎨 Creating icon for AI Doctor Assistant...")
    
    try:
        # Try to use PIL for a nice icon
        from PIL import Image, ImageDraw
        icon_path = create_medical_icon()
    except ImportError:
        print("📝 PIL not available, creating simple icon...")
        print("💡 For a better icon, install Pillow: pip install Pillow")
        icon_path = create_simple_icon_without_pil()
    
    print(f"🎯 Icon ready! Now you can run: python build_exe.py")
