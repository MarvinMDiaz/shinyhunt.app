#!/usr/bin/env python3
"""
Script to remove white background from logo and convert to PNG with transparency.
Requires: pip install Pillow
"""

from PIL import Image
import sys
import os

def remove_white_background(input_path, output_path, threshold=240):
    """
    Remove white/light background from image and make it transparent.
    threshold: RGB values above this will be made transparent (0-255)
    """
    # Open the image
    img = Image.open(input_path)
    
    # Convert to RGBA if not already
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    # Get image data
    data = img.getdata()
    
    # Create new image data with transparency
    new_data = []
    for item in data:
        # If pixel is white/light (all RGB values above threshold), make transparent
        if item[0] > threshold and item[1] > threshold and item[2] > threshold:
            new_data.append((255, 255, 255, 0))  # Transparent
        else:
            new_data.append(item)  # Keep original
    
    # Update image with new data
    img.putdata(new_data)
    
    # Save as PNG with transparency
    img.save(output_path, 'PNG')
    print(f"✅ Saved transparent logo to: {output_path}")

if __name__ == "__main__":
    input_file = "/Users/diazm/.cursor/projects/Users-diazm-Desktop-DiazDevelopment-Shinny-Tracker/assets/ChatGPT_Image_Mar_5__2026__10_15_28_AM-0dc69ca4-b508-420e-a0e6-28d5dfb273fd.png"
    output_file = "public/logo.png"
    
    if os.path.exists(input_file):
        remove_white_background(input_file, output_file, threshold=240)
    else:
        print(f"❌ Input file not found: {input_file}")
        sys.exit(1)
