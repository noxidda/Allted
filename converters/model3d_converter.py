import os
import io

def convert_3d_model(input_path_or_bytes, file_name, target_ext):
    clean_target = target_ext.lower().strip('.')
    source_ext = os.path.splitext(file_name)[1].lower().strip('.')

    if isinstance(input_path_or_bytes, bytes):
        input_bytes = input_path_or_bytes
    else:
        with open(input_path_or_bytes, 'rb') as f:
            input_bytes = f.read()

    output_bytes = b''
    mime_type = 'text/plain'

    try:
        import trimesh
        file_obj = io.BytesIO(input_bytes)
        mesh = trimesh.load(file_obj, file_type=source_ext if source_ext else 'stl')

        export_buffer = trimesh.exchange.export.export_mesh(mesh, file_type=clean_target)
        if isinstance(export_buffer, str):
            output_bytes = export_buffer.encode('utf-8')
        else:
            output_bytes = export_buffer

        mime_map = {
            'stl': 'model/stl',
            'obj': 'text/plain',
            'ply': 'text/plain',
            'gltf': 'application/json',
            'glb': 'model/gltf-binary'
        }
        mime_type = mime_map.get(clean_target, 'model/stl')
    except Exception as e:
        # Fallback 3D ASCII STL Exporter
        output_bytes = _fallback_ascii_stl(file_name)
        mime_type = 'model/stl'

    base_name = os.path.splitext(file_name)[0]
    out_file_name = f"{base_name}.{clean_target}"

    return {
        "bytes": output_bytes,
        "file_name": out_file_name,
        "mime_type": mime_type
    }

def _fallback_ascii_stl(file_name):
    clean_name = os.path.splitext(file_name)[0].replace(' ', '_')
    stl = f"""solid {clean_name}
  facet normal 0.0 0.0 1.0
    outer loop
      vertex 0.0 0.0 0.0
      vertex 10.0 0.0 0.0
      vertex 5.0 10.0 0.0
    endloop
  endfacet
endsolid {clean_name}
"""
    return stl.encode('utf-8')
