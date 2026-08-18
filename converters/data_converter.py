import os
import io
import json
import csv

def convert_data(input_path_or_bytes, file_name, target_ext):
    clean_target = target_ext.lower().strip('.')
    source_ext = os.path.splitext(file_name)[1].lower().strip('.')

    if isinstance(input_path_or_bytes, bytes):
        input_bytes = input_path_or_bytes
    else:
        with open(input_path_or_bytes, 'rb') as f:
            input_bytes = f.read()

    data_obj = _parse_input_data(input_bytes, source_ext)

    output_bytes = b''
    mime_type = 'application/json'

    if clean_target == 'json':
        output_bytes = json.dumps(data_obj, indent=2).encode('utf-8')
        mime_type = 'application/json'
    elif clean_target == 'csv':
        output_bytes = _to_csv(data_obj).encode('utf-8')
        mime_type = 'text/csv'
    elif clean_target == 'tsv':
        output_bytes = _to_csv(data_obj, delimiter='\t').encode('utf-8')
        mime_type = 'text/tab-separated-values'
    elif clean_target in ['yaml', 'yml']:
        output_bytes = _to_yaml(data_obj).encode('utf-8')
        mime_type = 'text/yaml'
    elif clean_target == 'xml':
        output_bytes = _to_xml(data_obj, file_name).encode('utf-8')
        mime_type = 'application/xml'
    else:
        output_bytes = json.dumps(data_obj, indent=2).encode('utf-8')

    base_name = os.path.splitext(file_name)[0]
    out_file_name = f"{base_name}.{clean_target}"

    return {
        "bytes": output_bytes,
        "file_name": out_file_name,
        "mime_type": mime_type
    }

def _parse_input_data(input_bytes, source_ext):
    text = input_bytes.decode('utf-8', errors='ignore').strip()

    if source_ext == 'json':
        try: return json.loads(text)
        except: pass

    if source_ext in ['yaml', 'yml']:
        try:
            import yaml
            return yaml.safe_load(text)
        except: pass

    if source_ext in ['csv', 'tsv']:
        try:
            delimiter = '\t' if source_ext == 'tsv' else ','
            reader = csv.DictReader(io.StringIO(text), delimiter=delimiter)
            return list(reader)
        except: pass

    # Default dictionary object if unparseable
    return [{"file": source_ext, "content": text[:1000]}]

def _to_csv(data_obj, delimiter=','):
    output = io.StringIO()
    if isinstance(data_obj, list) and len(data_obj) > 0 and isinstance(data_obj[0], dict):
        fieldnames = list(data_obj[0].keys())
        writer = csv.DictWriter(output, fieldnames=fieldnames, delimiter=delimiter)
        writer.writeheader()
        writer.writerows(data_obj)
    else:
        writer = csv.writer(output, delimiter=delimiter)
        writer.writerow(["data"])
        writer.writerow([json.dumps(data_obj)])
    return output.getvalue()

def _to_yaml(data_obj):
    try:
        import yaml
        return yaml.dump(data_obj, sort_keys=False)
    except Exception:
        return json.dumps(data_obj, indent=2)

def _to_xml(data_obj, file_name):
    clean_name = os.path.splitext(file_name)[0].replace(' ', '_')
    xml = f'<?xml version="1.0" encoding="UTF-8"?>\n<{clean_name}>\n'
    if isinstance(data_obj, list):
        for item in data_obj:
            xml += '  <item>\n'
            if isinstance(item, dict):
                for k, v in item.items():
                    xml += f'    <{k}>{v}</{k}>\n'
            else:
                xml += f'    <value>{item}</value>\n'
            xml += '  </item>\n'
    elif isinstance(data_obj, dict):
        for k, v in data_obj.items():
            xml += f'  <{k}>{v}</{k}>\n'
    xml += f'</{clean_name}>'
    return xml
