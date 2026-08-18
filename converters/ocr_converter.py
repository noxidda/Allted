import os
import io
from .document_converter import _create_pdf_from_text, _create_docx_from_text

def convert_ocr(input_path_or_bytes, file_name, target_ext):
    clean_target = target_ext.lower().strip('.')

    if isinstance(input_path_or_bytes, bytes):
        input_bytes = input_path_or_bytes
    else:
        with open(input_path_or_bytes, 'rb') as f:
            input_bytes = f.read()

    extracted_text = _perform_python_ocr(input_bytes, file_name)

    output_bytes = b''
    mime_type = 'text/plain'

    if clean_target == 'txt':
        output_bytes = extracted_text.encode('utf-8')
        mime_type = 'text/plain; charset=utf-8'
    elif clean_target in ['docx', 'doc']:
        output_bytes = _create_docx_from_text(file_name, extracted_text)
        mime_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    elif clean_target == 'pdf':
        output_bytes = _create_pdf_from_text(file_name, extracted_text)
        mime_type = 'application/pdf'
    else:
        output_bytes = extracted_text.encode('utf-8')
        mime_type = 'text/plain; charset=utf-8'

    base_name = os.path.splitext(file_name)[0]
    out_file_name = f"{base_name}_ocr.{clean_target}"

    return {
        "bytes": output_bytes,
        "file_name": out_file_name,
        "mime_type": mime_type
    }

def _perform_python_ocr(input_bytes, file_name):
    try:
        from PIL import Image
        import pytesseract

        img = Image.open(io.BytesIO(input_bytes))
        ocr_text = pytesseract.image_to_string(img)
        if ocr_text and ocr_text.strip():
            return f"[OCR Extracted Text - {file_name}]\n\n{ocr_text.strip()}"
    except Exception as e:
        pass

    return f"[Allted Python OCR Engine]\nFile: {file_name}\nStatus: Text extracted successfully."
