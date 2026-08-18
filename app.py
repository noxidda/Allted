import os
import sys
import argparse
from flask import Flask, render_template, request, jsonify, send_file, Response, io

from converters import (
    convert_document,
    convert_image,
    convert_audio_video,
    convert_3d_model,
    convert_archive,
    convert_data,
    convert_ocr
)

app = Flask(__name__, static_folder='static', template_folder='templates')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/convert', methods=['POST'])
def handle_convert():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    uploaded_file = request.files['file']
    target_ext = request.form.get('target', 'pdf').lower()
    category = request.form.get('category', 'word')

    if not uploaded_file or uploaded_file.filename == '':
        return jsonify({"error": "Empty filename"}), 400

    file_bytes = uploaded_file.read()
    file_name = uploaded_file.filename

    options = {
        "quality": request.form.get('quality', 90),
        "width": request.form.get('width'),
        "height": request.form.get('height'),
    }

    try:
        if category in ['word', 'document']:
            result = convert_document(file_bytes, file_name, target_ext)
        elif category in ['image', 'photo']:
            result = convert_image(file_bytes, file_name, target_ext, options)
        elif category in ['audio', 'video']:
            result = convert_audio_video(file_bytes, file_name, target_ext, options)
        elif category in ['3d', 'model']:
            result = convert_3d_model(file_bytes, file_name, target_ext)
        elif category in ['archive', 'zip']:
            result = convert_archive(file_bytes, file_name, target_ext)
        elif category in ['data', 'code']:
            result = convert_data(file_bytes, file_name, target_ext)
        elif category in ['ocr']:
            result = convert_ocr(file_bytes, file_name, target_ext)
        else:
            result = convert_document(file_bytes, file_name, target_ext)

        return send_file(
            io.BytesIO(result['bytes']),
            mimetype=result['mime_type'],
            as_attachment=True,
            download_name=result['file_name']
        )
    except Exception as err:
        return jsonify({"error": str(err)}), 500

@app.route('/api/formats', methods=['GET'])
def list_formats():
    return jsonify({
        "document": ["pdf", "docx", "txt", "html", "md", "rtf", "doc"],
        "image": ["png", "jpg", "webp", "pdf", "bmp", "gif", "ico"],
        "audio": ["mp3", "wav", "ogg", "m4a", "flac"],
        "video": ["mp4", "webm", "mkv", "avi", "mov"],
        "3d": ["stl", "obj", "ply", "gltf", "glb"],
        "archive": ["zip", "7z", "tar", "tar.gz"],
        "data": ["json", "csv", "tsv", "xml", "yaml"]
    })

def cli_main():
    parser = argparse.ArgumentParser(description="Allted Python File Converter CLI")
    parser.add_argument("input_file", help="Path to input file")
    parser.add_argument("target_format", help="Target format extension (e.g. pdf, docx, png, mp3)")
    parser.add_argument("-o", "--output", help="Optional output path")

    args = parser.parse_args()

    if not os.path.exists(args.input_file):
        print(f"Error: File '{args.input_file}' not found.")
        sys.exit(1)

    file_name = os.path.basename(args.input_file)
    ext = args.target_format.lower().strip('.')

    print(f"Converting '{file_name}' to {ext.upper()}...")

    ext_map = {
        'pdf': convert_document, 'docx': convert_document, 'txt': convert_document, 'html': convert_document, 'md': convert_document, 'rtf': convert_document,
        'png': convert_image, 'jpg': convert_image, 'jpeg': convert_image, 'webp': convert_image, 'bmp': convert_image, 'gif': convert_image,
        'mp3': convert_audio_video, 'wav': convert_audio_video, 'ogg': convert_audio_video, 'mp4': convert_audio_video, 'webm': convert_audio_video,
        'stl': convert_3d_model, 'obj': convert_3d_model, 'ply': convert_3d_model,
        'zip': convert_archive, '7z': convert_archive, 'tar': convert_archive,
        'json': convert_data, 'csv': convert_data, 'xml': convert_data, 'yaml': convert_data
    }

    converter_fn = ext_map.get(ext, convert_document)

    with open(args.input_file, 'rb') as f:
        file_bytes = f.read()

    result = converter_fn(file_bytes, file_name, ext)

    out_path = args.output or result['file_name']
    with open(out_path, 'wb') as f:
        f.write(result['bytes'])

    print(f"✔ Successfully saved output to: {os.path.abspath(out_path)}")

if __name__ == '__main__':
    if len(sys.argv) > 1 and not sys.argv[1].startswith('-') and sys.argv[1] != 'run':
        cli_main()
    else:
        print("Starting Allted Python Web Server on http://localhost:5000")
        app.run(host='0.0.0.0', port=5000, debug=True)
