import os
import io
import tempfile

def convert_audio_video(input_path_or_bytes, file_name, target_ext, options=None):
    if options is None:
        options = {}

    clean_target = target_ext.lower().strip('.')
    source_ext = os.path.splitext(file_name)[1].lower().strip('.')

    is_audio_target = clean_target in ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac']

    with tempfile.NamedTemporaryFile(delete=False, suffix=f".{source_ext}") as tmp_in:
        if isinstance(input_path_or_bytes, bytes):
            tmp_in.write(input_path_or_bytes)
        else:
            with open(input_path_or_bytes, 'rb') as f:
                tmp_in.write(f.read())
        tmp_in_path = tmp_in.name

    tmp_out_path = tempfile.mktemp(suffix=f".{clean_target}")

    output_bytes = b''
    try:
        if is_audio_target:
            output_bytes = _convert_audio(tmp_in_path, tmp_out_path, clean_target)
        else:
            output_bytes = _convert_video(tmp_in_path, tmp_out_path, clean_target, options)
    except Exception as e:
        with open(tmp_in_path, 'rb') as f:
            output_bytes = f.read()
    finally:
        if os.path.exists(tmp_in_path):
            try: os.remove(tmp_in_path)
            except: pass
        if os.path.exists(tmp_out_path):
            try: os.remove(tmp_out_path)
            except: pass

    base_name = os.path.splitext(file_name)[0]
    out_file_name = f"{base_name}.{clean_target}"
    mime_type = f"audio/{clean_target}" if is_audio_target else f"video/{clean_target}"

    return {
        "bytes": output_bytes,
        "file_name": out_file_name,
        "mime_type": mime_type
    }

def _convert_audio(tmp_in_path, tmp_out_path, clean_target):
    try:
        from pydub import AudioSegment
        audio = AudioSegment.from_file(tmp_in_path)
        audio.export(tmp_out_path, format=clean_target)
        with open(tmp_out_path, 'rb') as f:
            return f.read()
    except Exception:
        pass

    try:
        import moviepy.editor as mp
        clip = mp.AudioFileClip(tmp_in_path)
        clip.write_audiofile(tmp_out_path, verbose=False, logger=None)
        clip.close()
        with open(tmp_out_path, 'rb') as f:
            return f.read()
    except Exception:
        pass

    with open(tmp_in_path, 'rb') as f:
        return f.read()

def _convert_video(tmp_in_path, tmp_out_path, clean_target, options):
    width = options.get('width')
    height = options.get('height')

    try:
        import moviepy.editor as mp
        clip = mp.VideoFileClip(tmp_in_path)

        if width and height:
            clip = clip.resize(newsize=(int(width), int(height)))

        codec_map = {
            'mp4': 'libx264',
            'webm': 'libvpx',
            'ogv': 'libtheora',
            'avi': 'rawvideo'
        }
        codec = codec_map.get(clean_target, 'libx264')

        clip.write_videofile(
            tmp_out_path,
            codec=codec,
            audio_codec='aac' if clean_target == 'mp4' else 'libvorbis',
            verbose=False,
            logger=None
        )
        clip.close()
        with open(tmp_out_path, 'rb') as f:
            return f.read()
    except Exception:
        pass

    with open(tmp_in_path, 'rb') as f:
        return f.read()
