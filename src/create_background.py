# -*- coding: utf-8 -*-
"""
Created on Sun Feb 23 22:14:18 2025

@author: woerkom
"""

from PIL import Image

def hex_to_rgb(hex_color):
    """Convert hex to RGB tuple."""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def create_gradient_image(width, height, start_hex, end_hex, filename='gradient.png'):
    """Create a gradient image from top-left to bottom-right."""
    start_rgb = hex_to_rgb(start_hex)
    end_rgb = hex_to_rgb(end_hex)
    
    img = Image.new("RGB", (width, height), start_rgb)
    pixels = img.load()

    for x in range(width):
        for y in range(height):
            ratio = ((x + y) / (width + height - 2))  # Gradient from top-left to bottom-right
            r = int(start_rgb[0] + ratio * (end_rgb[0] - start_rgb[0]))
            g = int(start_rgb[1] + ratio * (end_rgb[1] - start_rgb[1]))
            b = int(start_rgb[2] + ratio * (end_rgb[2] - start_rgb[2]))
            pixels[x, y] = (r, g, b)
    
    img.save(filename)
    print(f"Gradient image saved as {filename}")
    return filename

# Parameters
start_color = "#4B0082"  # Indigo
end_color = "#4CAF50"    # Green

# Generate gradient and PDF
gradient_img = create_gradient_image(595, 842, start_color, end_color)  # A4 size in points (72 DPI)
