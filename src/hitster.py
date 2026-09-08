import qrcode
import pandas as pd
from pathlib import Path
import os
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from textwrap import wrap
import numpy as np
from PIL import Image

######
NAME = 'NimmasPrinsessen'
################################

tracks_df = pd.read_csv(f'{NAME}/{NAME}.csv', index_col = 0)
qr_folder = Path(f'{NAME}/qrs')
if not qr_folder.is_dir():
    qr_folder.mkdir(parents=True, exist_ok=True)

for i, row in tracks_df.iterrows():
    print(i)
    #initialize qrcode
    # Create QR code
    qr = qrcode.QRCode(
        version=1,  # Controls the size of the QR Code (1 is the smallest, 40 is the largest)
        error_correction=qrcode.constants.ERROR_CORRECT_L,  # Error correction level
        box_size=1,  # Size of each box in the QR Code
        border=1,  # Border size in boxes
        
    )

    # Add data
    qr.add_data(row.url)
    qr.make(fit=True)
    
    # Create the image
    qr_img = qr.make_image(fill_color="black", back_color='white').convert("RGBA")
    
    # # Step 3: Make the white background transparent
    # pixel_array = np.array(qr_img)   
    # pixel_array[pixel_array[:,:,:3].sum(2)==765, -1] = 0
    
    # qr_shp = pixel_array.shape[:2]
    # qr_img.putdata([tuple(t) for t in pixel_array.reshape(qr_shp[0]*qr_shp[1],4)])
    
    # Save the image
    qr_img.save(qr_folder / f'{i}.png', transparent=True)
    
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

#%% make pdf
# Constants
FOLDER_X = Path(f"{NAME}\qrs")  # Folder containing QR codes
OUTPUT_PDF = f"{NAME}\output.pdf"  # Output PDF file
QR_CODE_SIZE = 50 * mm  # Size of each QR code
PAGE_WIDTH, PAGE_HEIGHT = A4
MARGIN = 10 * mm
TEXT_FONT_SIZE = 12

tracks_df = pd.read_csv(f'{NAME}/{NAME}.csv', index_col = 0)

#do track selection to get as many different unique years
total_cards = 60
unique_years, counts = np.unique(tracks_df.jaar, return_counts = True)
leftover = total_cards - unique_years.size
double_years = np.random.choice(unique_years[counts>1], leftover, replace = False)
years = np.r_[unique_years, double_years]
draw_n = pd.Series(*np.unique(years, return_counts = True)[::-1]).sort_index()

selection = pd.DataFrame()
for year, year_tracks in tracks_df.groupby('jaar'):
    year_select = year_tracks.loc[np.random.choice(year_tracks.index, 
                                                   size = draw_n[year],
                                                   replace = False)]
    selection = pd.concat([selection, year_select])


pdf = canvas.Canvas(OUTPUT_PDF, pagesize=A4)

# Get the QR code filenames (assuming they're ordered correctly)
#qr_filenames = np.arraysorted([f for f in os.listdir(FOLDER_X) if f.endswith(".png")])
#if not qr_filenames:
#    raise ValueError("No QR codes found in the folder!")

# Layout: 3x4 grid for QR codes
cols, rows = 3, 4
x_spacing = (PAGE_WIDTH - 2 * MARGIN) / cols 
y_spacing = (PAGE_HEIGHT - 2 * MARGIN) / rows
codes_per_page = cols * rows

# Generate gradient and PDF
gradient_img = create_gradient_image(int(x_spacing)*10, int(y_spacing)*10, start_color, end_color)  # A4 size in points (72 DPI)   

# Process QR codes in chunks for multiple pages
for page_start in range(0, total_cards, codes_per_page):
    
    # Get the QR codes for the current page
    page_tracks = selection[page_start:page_start + codes_per_page]
    
    # Create the first page with the QR code raster
    for idx, qr_filename in enumerate(page_tracks.index):
        row, col = divmod(idx, cols)

        # Calculate position for the QR code
        x = MARGIN + col * x_spacing + (x_spacing - QR_CODE_SIZE) / 2
        y = PAGE_HEIGHT - MARGIN - (row + 1) * y_spacing + (y_spacing - QR_CODE_SIZE) / 2
        
        x_rect = MARGIN + col * x_spacing #+ (x_spacing - QR_CODE_SIZE) / 2
        y_rect = PAGE_HEIGHT - MARGIN - (row + 1) * y_spacing
        
        # Draw the QR code on the page
        qr_path = os.path.join(FOLDER_X, f'{qr_filename}.png')
        pdf.drawImage(gradient_img, x_rect, y_rect, x_spacing, y_spacing)
        pdf.drawImage(qr_path, x, y, QR_CODE_SIZE, QR_CODE_SIZE)

    # Finalize the QR code page
    pdf.showPage()

    # Create the second page with text boxes
    pdf.setFont("Helvetica", TEXT_FONT_SIZE)
    for idx, (track_idx, track) in enumerate(page_tracks.iterrows()):
        row, col = divmod(idx, cols)
        col = cols-col-1
        # Calculate position for the text box (same as QR code positions)
        x = MARGIN + col * x_spacing #+ (x_spacing - QR_CODE_SIZE) / 2
        y = PAGE_HEIGHT - MARGIN - (row + 1) * y_spacing #+ (y_spacing - QR_CODE_SIZE) / 2

        # Draw a rectangle for the text box
        pdf.drawImage(gradient_img, x, y, x_spacing, y_spacing)
        pdf.rect(x, y, x_spacing, y_spacing)

        # Add corresponding text inside the text box
        text_lines = track[['titel', 'artiest', 'jaar']].values.astype(str)

        # Font size and line height
        line_height = 12  # Adjust line height based on font size
        max_chars_per_line = 20  # Number of characters per line for wrapping

        # Wrap the text for each line
        wrapped_text = []
        for line in text_lines:
            wrapped_text.extend(wrap(line, max_chars_per_line))
            wrapped_text.append('')  # Add blank line for spacing

        # Calculate total text height for vertical centering
        total_text_height = len(wrapped_text) * line_height

        # Calculate the starting Y position for vertical centering
        current_y = y + (y_spacing + total_text_height) / 2 - line_height

        # Draw each line, horizontally centered
        for line in wrapped_text:
            # Calculate text width for horizontal centering
            text_width = pdf.stringWidth(line, "Helvetica", TEXT_FONT_SIZE)
            x_centered = x + (x_spacing - text_width) / 2

            # Draw the line of text
            pdf.setFillColor('white')
            for dx in [-1, 0, 1]:
                for dy in [-1, 0, 1]:
                    if dx != 0 or dy != 0:  # Avoid drawing the center text here
                        pdf.drawString(x_centered + dx, current_y + dy, line)

            # Draw the main text on top in black (or any desired color)
            pdf.setFillColor('black')
            
            pdf.drawString(x_centered, current_y, line)
            
            current_y -= line_height

    # Finalize the text box page
    pdf.showPage()

# Save the PDF
pdf.save()
print(f"PDF saved as {OUTPUT_PDF}")