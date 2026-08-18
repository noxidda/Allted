import os
import io

def convert_image(input_path_or_bytes, file_name, target_ext, options=None):
    if options is None:
        options = {}

    clean_target = target_ext.lower().strip('.')

    if isinstance(input_path_or_bytes, bytes):
        input_bytes = input_path_or_bytes
    else:
        with open(input_path_or_bytes, 'rb') as f:
            input_bytes = f.read()

    try:
        from PIL import Image
        img = Image.open(io.BytesIO(input_bytes))

        # Handle quality parameter (1-100)
        quality = int(options.get('quality', 90))
        quality = max(1, min(100, quality))

        # Handle custom width/height resizing if specified
        width = options.get('width')
        height = options.get('height')
        if width or height:
            orig_w, orig_h = img.size
            new_w = int(width) if width else orig_w
            new_h = int(height) if height else orig_h
            img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)

        out_buffer = io.BytesIO()

        # Handle mode conversions for JPEG/BMP/PDF (remove alpha channel)
        if clean_target in ['jpg', 'jpeg', 'bmp', 'pdf']:
            if img.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if 'A' in img.mode else None)
                img = background

        fmt_map = {
            'jpg': 'JPEG',
            'jpeg': 'JPEG',
            'png': 'PNG',
            'webp': 'WEBP',
            'bmp': 'BMP',
            'gif': 'GIF',
            'ico': 'ICO',
            'pdf': 'PDF',
            'tiff': 'TIFF'
        }

        save_fmt = fmt_map.get(clean_target, 'PNG')

        save_kwargs = {}
        if save_fmt in ['JPEG', 'WEBP']:
            save_kwargs['quality'] = quality
        elif save_fmt == 'PNG':
            save_kwargs['optimize'] = True

        img.save(out_buffer, format=save_fmt, **save_kwargs)
        output_bytes = out_buffer.getvalue()
        mime_type = f"image/{clean_target}" if clean_target != 'pdf' else "application/pdf"

    except Exception as e:
        # Simple fallback
        output_bytes = input_bytes
        mime_type = f"image/{clean_target}"

    base_name = os.path.splitext(file_name)[0]
    out_file_name = f"{base_name}.{clean_target}"

    return {
        "bytes": output_bytes,
        "file_name": out_file_name,
        "mime_type": mime_type
    }
