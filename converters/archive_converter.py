import os
import io
import zipfile
import tarfile

def convert_archive(input_path_or_bytes, file_name, target_ext):
    clean_target = target_ext.lower().strip('.')

    if isinstance(input_path_or_bytes, bytes):
        input_bytes = input_path_or_bytes
    else:
        with open(input_path_or_bytes, 'rb') as f:
            input_bytes = f.read()

    output_bytes = b''
    mime_type = 'application/zip'

    if clean_target == '7z':
        output_bytes = _create_7z_archive(file_name, input_bytes)
        mime_type = 'application/x-7z-compressed'
    elif clean_target in ['tar', 'tar.gz', 'tgz', 'gz']:
        output_bytes = _create_tar_archive(file_name, input_bytes, clean_target)
        mime_type = 'application/x-tar' if clean_target == 'tar' else 'application/gzip'
    else:
        output_bytes = _create_zip_archive(file_name, input_bytes)
        mime_type = 'application/zip'

    base_name = os.path.splitext(file_name)[0]
    out_file_name = f"{base_name}.{clean_target}"

    return {
        "bytes": output_bytes,
        "file_name": out_file_name,
        "mime_type": mime_type
    }

def _create_zip_archive(file_name, input_bytes):
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
        zf.writestr(file_name, input_bytes)
    return buffer.getvalue()

def _create_tar_archive(file_name, input_bytes, target_ext):
    buffer = io.BytesIO()
    mode = 'w:gz' if 'gz' in target_ext or 'tgz' in target_ext else 'w'
    with tarfile.open(fileobj=buffer, mode=mode) as tf:
        ti = tarfile.TarInfo(name=file_name)
        ti.size = len(input_bytes)
        tf.addfile(ti, io.BytesIO(input_bytes))
    return buffer.getvalue()

def _create_7z_archive(file_name, input_bytes):
    try:
        import py7zr
        buffer = io.BytesIO()
        with py7zr.SevenZipFile(buffer, 'w') as szf:
            szf.writestr(input_bytes, file_name)
        return buffer.getvalue()
    except Exception:
        # Fallback to standard ZIP archive format
        return _create_zip_archive(file_name, input_bytes)
