# Allted Python Suite

Allted is an offline, multi-format file conversion engine built in Python with zero external cloud dependencies. Convert images, documents, audio/video streams, 3D mesh models, archive packages, data files, and OCR text locally on your device.

## Features

- **100% Python Native Conversion Engine**: Convert documents, images, audio, video, 3D models, archives, and data locally.
- **Document Suite**: Extract text from `.docx`, `.odt`, `.epub`, `.pdf`, `.rtf`, `.html`, and `.txt` files and convert to PDF 1.4, Word, Markdown, RTF, and HTML.
- **Image Converter**: Quality control sliders, custom resolution scaling, and conversion across PNG, JPG, WEBP, BMP, GIF, ICO, and PDF.
- **Audio & Video Converter**: Media transcoding with resolution presets (SD, HD, FHD, 2K, 4K, 8K) and format conversion (MP4, WEBM, MKV, MP3, WAV, OGG).
- **3D Mesh Engine**: Parse and export STL, OBJ, PLY, GLTF, and GLB 3D models.
- **Archive Engine**: Create PK ZIP, 7Z, TAR, and TAR.GZ archives.
- **Data & OCR**: Convert between CSV, JSON, XML, YAML, TSV, and run local OCR text extraction.
- **Dual Mode**: Run as an interactive Web Application server (Flask) or as a Command-Line Tool (CLI).
- **Theme**: Modern Purple, Lavender, and White UI with Dark Mode toggle and state persistence.

## Tech Stack

- **Backend & Core Engine**: Python 3.10+, Flask, Pillow, python-docx, PyPDF, ReportLab, MoviePy, PyDub, Trimesh, PyYAML, Pandas, Py7zr, PyTesseract
- **Frontend**: HTML5, Tailwind CSS, JavaScript (Vanilla ES6+)

## Quick Installation

### Windows
Double-click `install.bat` or run:
```cmd
pip install -r requirements.txt
```

### Linux / macOS
```bash
chmod +x install.sh
./install.sh
```

## How to Run

### 1. Launch Web Application Server
Run the Flask server:
```bash
python app.py
```
Open your browser at `http://localhost:5000` to access the interactive web interface.

### 2. Command Line Interface (CLI)
Convert any file directly from your terminal:
```bash
# Convert DOCX to PDF
python app.py resume.docx pdf

# Convert PNG to WEBP
python app.py photo.png webp

# Convert JSON to CSV
python app.py data.json csv
```

## Project Architecture

```
Allted/
├── app.py                     # Main Flask Web Server & CLI Command Entrypoint
├── requirements.txt           # Python Package Dependencies
├── install.bat / install.sh   # One-click installation scripts
├── converters/
│   ├── __init__.py
│   ├── document_converter.py  # DOCX, PDF, RTF, HTML, TXT, MD, EPUB, ODT
│   ├── image_converter.py     # JPG, PNG, WEBP, BMP, GIF, ICO, PDF
│   ├── audio_video_converter.py # MP4, WEBM, MKV, AVI, MOV, MP3, WAV, OGG
│   ├── model3d_converter.py   # STL, OBJ, PLY, GLTF, GLB
│   ├── archive_converter.py   # ZIP, 7Z, TAR, GZ
│   ├── data_converter.py      # CSV, JSON, XML, YAML, INI, TOML
│   └── ocr_converter.py       # Image/PDF OCR -> TXT, DOCX, PDF
├── templates/
│   └── index.html             # Purple, Lavender & White Web UI
└── static/
```

## License

MIT
