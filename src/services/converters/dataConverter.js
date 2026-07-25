export async function convertData(file, targetExt) {
  const content = await file.text();
  const sourceExt = file.name.split('.').pop()?.toLowerCase() || '';
  const cleanTarget = targetExt.toLowerCase();

  let parsedObject = null;

  try {
    if (sourceExt === 'json') {
      parsedObject = JSON.parse(content);
    } else if (sourceExt === 'csv') {
      parsedObject = parseCSV(content, ',');
    } else if (sourceExt === 'tsv') {
      parsedObject = parseCSV(content, '\t');
    } else if (sourceExt === 'xml') {
      parsedObject = parseSimpleXML(content);
    } else if (sourceExt === 'yaml' || sourceExt === 'yml') {
      parsedObject = parseSimpleYAML(content);
    } else if (sourceExt === 'ini' || sourceExt === 'toml') {
      parsedObject = parseSimpleINI(content);
    } else {
      parsedObject = JSON.parse(content);
    }
  } catch (err) {
    throw new Error(`Failed to parse source ${sourceExt.toUpperCase()} file: ${err.message}`);
  }

  let outputText = '';
  let mimeType = 'text/plain';

  if (cleanTarget === 'json') {
    outputText = JSON.stringify(parsedObject, null, 2);
    mimeType = 'application/json';
  } else if (cleanTarget === 'csv') {
    outputText = convertToCSV(parsedObject, ',');
    mimeType = 'text/csv';
  } else if (cleanTarget === 'tsv') {
    outputText = convertToCSV(parsedObject, '\t');
    mimeType = 'text/tab-separated-values';
  } else if (cleanTarget === 'xml') {
    outputText = convertToXML(parsedObject);
    mimeType = 'application/xml';
  } else if (cleanTarget === 'yaml' || cleanTarget === 'yml') {
    outputText = convertToYAML(parsedObject);
    mimeType = 'text/yaml';
  } else if (cleanTarget === 'toml' || cleanTarget === 'ini') {
    outputText = convertToINI(parsedObject);
    mimeType = 'text/plain';
  } else {
    outputText = convertToCSV(parsedObject, ',');
    mimeType = 'text/csv';
  }

  const blob = new Blob([outputText], { type: `${mimeType};charset=utf-8` });
  const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;

  return {
    blob,
    fileName: `${baseName}.${cleanTarget}`,
    mimeType,
  };
}

function parseCSV(text, delimiter = ',') {
  const lines = text.trim().split(/\r\n|\n/);
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^"(.*)"$/, '$1'));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = lines[i].split(delimiter).map(v => v.trim().replace(/^"(.*)"$/, '$1'));
    const rowObj = {};
    headers.forEach((h, idx) => {
      rowObj[h] = values[idx] || '';
    });
    rows.push(rowObj);
  }
  return rows;
}

function convertToCSV(data, delimiter = ',') {
  if (!data) return '';
  const rows = Array.isArray(data) ? data : [data];
  if (rows.length === 0) return '';

  const headers = Array.from(
    new Set(rows.flatMap(row => (typeof row === 'object' && row !== null ? Object.keys(row) : ['value'])))
  );

  const headerLine = headers.map(h => `"${h}"`).join(delimiter);
  const dataLines = rows.map(row => {
    if (typeof row !== 'object' || row === null) {
      return `"${row}"`;
    }
    return headers.map(h => {
      const val = row[h] !== undefined && row[h] !== null ? String(row[h]) : '';
      return `"${val.replace(/"/g, '""')}"`;
    }).join(delimiter);
  });

  return [headerLine, ...dataLines].join('\n');
}

function parseSimpleXML(xmlText) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
  return nodeToObj(xmlDoc.documentElement);

  function nodeToObj(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.nodeValue?.trim() || '';
    }
    const obj = {};
    if (node.hasChildNodes()) {
      for (let i = 0; i < node.childNodes.length; i++) {
        const child = node.childNodes[i];
        if (child.nodeType === Node.TEXT_NODE) {
          const val = child.nodeValue?.trim();
          if (val) return val;
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          const childName = child.nodeName;
          const childVal = nodeToObj(child);
          if (obj[childName]) {
            if (!Array.isArray(obj[childName])) {
              obj[childName] = [obj[childName]];
            }
            obj[childName].push(childVal);
          } else {
            obj[childName] = childVal;
          }
        }
      }
    }
    return obj;
  }
}

function convertToXML(obj, rootName = 'root') {
  function toXML(val, name) {
    if (val === null || val === undefined) return `<${name}/>`;
    if (Array.isArray(val)) {
      return val.map(item => toXML(item, name)).join('\n');
    }
    if (typeof val === 'object') {
      const children = Object.keys(val).map(k => toXML(val[k], k)).join('\n');
      return `<${name}>\n${children}\n</${name}>`;
    }
    return `<${name}>${String(val).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</${name}>`;
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n${toXML(obj, rootName)}`;
}

function parseSimpleYAML(text) {
  const lines = text.split('\n');
  const result = {};
  for (const line of lines) {
    const parts = line.split(':');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join(':').trim().replace(/^['"](.*)['"]$/, '$1');
      if (key && !key.startsWith('#')) {
        result[key] = val;
      }
    }
  }
  return result;
}

function convertToYAML(obj) {
  if (Array.isArray(obj)) {
    return obj.map(item => `- ${typeof item === 'object' ? JSON.stringify(item) : item}`).join('\n');
  }
  if (typeof obj === 'object' && obj !== null) {
    return Object.keys(obj)
      .map(k => `${k}: ${typeof obj[k] === 'object' ? JSON.stringify(obj[k]) : obj[k]}`)
      .join('\n');
  }
  return String(obj);
}

function parseSimpleINI(text) {
  const lines = text.split('\n');
  const result = {};
  let currentSection = result;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('#')) continue;
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      const secName = trimmed.substring(1, trimmed.length - 1);
      result[secName] = {};
      currentSection = result[secName];
    } else {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.substring(0, idx).trim();
        const val = trimmed.substring(idx + 1).trim().replace(/^['"](.*)['"]$/, '$1');
        currentSection[key] = val;
      }
    }
  }
  return result;
}

function convertToINI(obj) {
  const lines = [];
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      lines.push(`\n[${key}]`);
      for (const subKey of Object.keys(val)) {
        lines.push(`${subKey} = ${val[subKey]}`);
      }
    } else {
      lines.push(`${key} = ${val}`);
    }
  }
  return lines.join('\n');
}
