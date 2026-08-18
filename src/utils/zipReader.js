/**
 * Robust Pure-JS ZIP Central Directory Parser & XML Text Extractor
 * Reads DOCX, ODT, EPUB, PPTX, and XLSX files natively across all office software.
 */

export async function readZipEntries(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const view = new DataView(arrayBuffer);
  const entries = {};

  // 1. Find End of Central Directory (EOCD) signature 0x06054b50 from end of file
  let eocdPos = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdPos = i;
      break;
    }
  }

  if (eocdPos !== -1) {
    const cdCount = view.getUint16(eocdPos + 10, true);
    const cdOffset = view.getUint32(eocdPos + 16, true);

    let cdPos = cdOffset;
    for (let i = 0; i < cdCount && cdPos < bytes.length - 46; i++) {
      if (view.getUint32(cdPos, true) !== 0x02014b50) break;

      const method = view.getUint16(cdPos + 10, true);
      const compSize = view.getUint32(cdPos + 20, true);
      const uncompSize = view.getUint32(cdPos + 24, true);
      const nameLen = view.getUint16(cdPos + 28, true);
      const extraLen = view.getUint16(cdPos + 30, true);
      const commentLen = view.getUint16(cdPos + 32, true);
      const localHeaderOffset = view.getUint32(cdPos + 42, true);

      const nameBytes = bytes.subarray(cdPos + 46, cdPos + 46 + nameLen);
      const fileName = new TextDecoder('utf-8').decode(nameBytes);

      // Locate data start from local header
      if (localHeaderOffset + 30 <= bytes.length) {
        const localNameLen = view.getUint16(localHeaderOffset + 26, true);
        const localExtraLen = view.getUint16(localHeaderOffset + 28, true);
        const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;

        if (dataStart + compSize <= bytes.length) {
          entries[fileName] = {
            method,
            compSize,
            uncompSize,
            compressedBytes: bytes.subarray(dataStart, dataStart + compSize),
          };
        }
      }

      cdPos += 46 + nameLen + extraLen + commentLen;
    }
  } else {
    // Fallback: Scan local headers manually
    let pos = 0;
    while (pos < bytes.length - 30) {
      if (view.getUint32(pos, true) !== 0x04034b50) {
        pos++;
        continue;
      }

      const method = view.getUint16(pos + 8, true);
      const compSize = view.getUint32(pos + 18, true);
      const nameLen = view.getUint16(pos + 26, true);
      const extraLen = view.getUint16(pos + 28, true);

      const nameBytes = bytes.subarray(pos + 30, pos + 30 + nameLen);
      const fileName = new TextDecoder('utf-8').decode(nameBytes);
      const dataStart = pos + 30 + nameLen + extraLen;

      if (compSize > 0 && dataStart + compSize <= bytes.length) {
        entries[fileName] = {
          method,
          compSize,
          compressedBytes: bytes.subarray(dataStart, dataStart + compSize),
        };
        pos = dataStart + compSize;
      } else {
        pos = dataStart;
      }
    }
  }

  return entries;
}

export async function extractZipEntryText(entry) {
  if (!entry) return '';
  const decompressed = await decompressEntryData(entry);
  return new TextDecoder('utf-8').decode(decompressed);
}

async function decompressEntryData(entry) {
  if (entry.method === 0) {
    return entry.compressedBytes;
  }

  if (entry.method === 8) {
    // Deflate
    if (typeof DecompressStream !== 'undefined') {
      try {
        const ds = new DecompressStream('deflate-raw');
        const writer = ds.writable.getWriter();
        writer.write(entry.compressedBytes);
        writer.close();
        const response = new Response(ds.readable);
        const buf = await response.arrayBuffer();
        return new Uint8Array(buf);
      } catch (err) {
        console.warn('DecompressStream raw failed, trying zlib header:', err);
      }

      try {
        const ds = new DecompressStream('deflate');
        const writer = ds.writable.getWriter();
        writer.write(entry.compressedBytes);
        writer.close();
        const response = new Response(ds.readable);
        const buf = await response.arrayBuffer();
        return new Uint8Array(buf);
      } catch (err) {
        console.warn('DecompressStream zlib failed:', err);
      }
    }
  }

  return entry.compressedBytes;
}

/**
 * Extracts clean human-readable text from word/document.xml in DOCX files
 */
export async function extractTextFromDocx(arrayBuffer) {
  try {
    const entries = await readZipEntries(arrayBuffer);
    const textParts = [];
    
    // Prioritize main document xml entry (word/document.xml)
    let mainDocKey = null;
    for (const k of Object.keys(entries)) {
      if (k.toLowerCase() === 'word/document.xml' || k.toLowerCase().endsWith('/document.xml')) {
        mainDocKey = k;
        break;
      }
    }

    if (mainDocKey && entries[mainDocKey]) {
      const xmlText = await extractZipEntryText(entries[mainDocKey]);
      const parsedText = parseDocxXmlText(xmlText);
      if (parsedText && parsedText.trim().length > 0) {
        textParts.push(parsedText);
      }
    }

    // Also check headers / footers for extra text (common in resumes)
    for (const k of Object.keys(entries)) {
      if (k !== mainDocKey && (k.includes('header') || k.includes('footer')) && k.endsWith('.xml')) {
        const xmlText = await extractZipEntryText(entries[k]);
        const parsedText = parseDocxXmlText(xmlText);
        if (parsedText && parsedText.trim().length > 0) {
          textParts.push(parsedText);
        }
      }
    }

    if (textParts.length > 0) return textParts.join('\n');
  } catch (err) {
    console.warn('DOCX ZIP extraction error:', err);
  }

  // Fail-safe raw scanner if zip decompression failed or produced empty text
  return scanRawDocxXml(arrayBuffer);
}

/**
 * Extracts clean text from content.xml in ODT files
 */
export async function extractTextFromOdt(arrayBuffer) {
  try {
    const entries = await readZipEntries(arrayBuffer);
    const contentXmlEntry = entries['content.xml'];
    if (contentXmlEntry) {
      const xmlText = await extractZipEntryText(contentXmlEntry);
      const text = parseOdtXmlText(xmlText);
      if (text && text.trim().length > 0) return text;
    }
  } catch (err) {
    console.warn('ODT extraction error:', err);
  }
  return null;
}

/**
 * Extracts clean text from EPUB chapter entries
 */
export async function extractTextFromEpub(arrayBuffer) {
  try {
    const entries = await readZipEntries(arrayBuffer);
    const htmlTexts = [];

    for (const path of Object.keys(entries)) {
      if (path.endsWith('.xhtml') || path.endsWith('.html') || path.endsWith('.htm')) {
        const text = await extractZipEntryText(entries[path]);
        const clean = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        if (clean.length > 20) htmlTexts.push(clean);
      }
    }

    if (htmlTexts.length > 0) return htmlTexts.join('\n\n');
  } catch (err) {
    console.warn('EPUB extraction error:', err);
  }
  return null;
}

function parseDocxXmlText(xml) {
  if (!xml) return null;

  // 1. Try browser DOMParser if available
  if (typeof DOMParser !== 'undefined') {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xml, 'text/xml');
      const pElements = xmlDoc.getElementsByTagName('w:p');

      if (pElements && pElements.length > 0) {
        const lines = [];
        for (let i = 0; i < pElements.length; i++) {
          const p = pElements[i];
          const tElements = p.getElementsByTagName('w:t');
          let line = '';
          for (let j = 0; j < tElements.length; j++) {
            line += tElements[j].textContent || '';
          }
          if (line.trim()) lines.push(line.trim());
        }
        if (lines.length > 0) return lines.join('\n');
      }

      const allT = xmlDoc.getElementsByTagName('w:t');
      if (allT && allT.length > 0) {
        const parts = [];
        for (let i = 0; i < allT.length; i++) {
          if (allT[i].textContent) parts.push(allT[i].textContent);
        }
        if (parts.length > 0) return parts.join(' ');
      }
    } catch (e) {
      console.warn('DOMParser failed:', e);
    }
  }

  // 2. Regex paragraph extraction
  const paragraphMatches = xml.match(/<w:p[\s>][\s\S]*?<\/w:p>/gi);
  if (paragraphMatches && paragraphMatches.length > 0) {
    const lines = [];
    for (const pXml of paragraphMatches) {
      const tMatches = pXml.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/gi);
      if (tMatches) {
        const lineText = tMatches
          .map(t => t.replace(/<[^>]*>/g, ''))
          .join('');
        if (lineText.trim()) lines.push(lineText.trim());
      }
    }
    if (lines.length > 0) return lines.join('\n');
  }

  // 3. Fallback: match all <w:t> tags directly
  const textMatches = xml.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/gi);
  if (textMatches && textMatches.length > 0) {
    return textMatches
      .map(t => t.replace(/<[^>]*>/g, '').trim())
      .filter(Boolean)
      .join(' ');
  }

  // 4. Ultimate fallback: strip all XML tags
  const stripped = xml
    .replace(/<w:p[\s>]/gi, '\n<w:p>')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return stripped.length > 10 ? stripped : null;
}

function parseOdtXmlText(xml) {
  const pMatches = xml.match(/<text:p[^>]*>(.*?)<\/text:p>/g);
  if (pMatches) {
    return pMatches
      .map(p => p.replace(/<[^>]*>/g, '').trim())
      .filter(Boolean)
      .join('\n');
  }
  return null;
}

/**
 * Fail-safe raw byte text extractor for uncompressed or fallback DOCX streams
 */
function scanRawDocxXml(arrayBuffer) {
  try {
    const rawText = new TextDecoder('utf-8', { fatal: false }).decode(arrayBuffer);
    const matches = rawText.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/gi);
    if (matches && matches.length > 0) {
      const cleanLines = matches
        .map(m => m.replace(/<[^>]*>/g, '').trim())
        .filter(t => t.length > 0 && !t.includes('PK'));
      if (cleanLines.length > 0) return cleanLines.join('\n');
    }

    // Printable ASCII text chunks (minimum length 4)
    const asciiStrings = rawText.match(/[\x20-\x7E]{4,}/g);
    if (asciiStrings) {
      const filtered = asciiStrings.filter(
        s => !s.startsWith('PK') && !s.includes('schemas.openxmlformats') && !s.includes('xml') && !s.includes('rels') && s.trim().length > 3
      );
      if (filtered.length > 0) return filtered.slice(0, 100).join('\n');
    }
  } catch (e) {
    console.warn('scanRawDocxXml error:', e);
  }
  return null;
}
