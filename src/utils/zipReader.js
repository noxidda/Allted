/**
 * Pure JavaScript ZIP Archive Decompressor & XML Text Extractor
 * Reads DOCX, ODT, EPUB, PPTX, and ZIP containers natively in modern browsers.
 */

export async function readZipEntries(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const view = new DataView(arrayBuffer);
  const entries = {};

  let pos = 0;
  while (pos < bytes.length - 30) {
    const sig = view.getUint32(pos, true);
    if (sig !== 0x04034b50) {
      // Advance to find next local file header
      pos++;
      continue;
    }

    const flags = view.getUint16(pos + 6, true);
    const method = view.getUint16(pos + 8, true);
    let compSize = view.getUint32(pos + 18, true);
    let uncompSize = view.getUint32(pos + 22, true);
    const nameLen = view.getUint16(pos + 26, true);
    const extraLen = view.getUint16(pos + 28, true);

    const nameBytes = bytes.subarray(pos + 30, pos + 30 + nameLen);
    const fileName = new TextDecoder('utf-8').decode(nameBytes);

    let dataStart = pos + 30 + nameLen + extraLen;

    // Handle data descriptor flag (bit 3 set)
    if (compSize === 0 && (flags & 8)) {
      // Find next signature to determine data boundary
      let nextPos = dataStart;
      while (nextPos < bytes.length - 4) {
        const nextSig = view.getUint32(nextPos, true);
        if (nextSig === 0x04034b50 || nextSig === 0x02014b50) break;
        nextPos++;
      }
      compSize = nextPos - dataStart;
    }

    if (dataStart + compSize <= bytes.length) {
      const compData = bytes.subarray(dataStart, dataStart + compSize);
      entries[fileName] = {
        method,
        compSize,
        uncompSize,
        compressedBytes: compData,
      };
    }

    pos = dataStart + compSize;
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
    // Uncompressed / Stored
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
        console.warn('DecompressStream failed, attempting fallback:', err);
      }
    }
  }

  return entry.compressedBytes;
}

/**
 * Extracts clean, human-readable text from word/document.xml in DOCX files
 */
export async function extractTextFromDocx(arrayBuffer) {
  try {
    const entries = await readZipEntries(arrayBuffer);
    const docXmlEntry = entries['word/document.xml'];
    if (!docXmlEntry) return null;

    const xmlText = await extractZipEntryText(docXmlEntry);
    return parseDocxXmlText(xmlText);
  } catch (err) {
    console.warn('DOCX extraction error:', err);
    return null;
  }
}

/**
 * Extracts clean text from content.xml in ODT files
 */
export async function extractTextFromOdt(arrayBuffer) {
  try {
    const entries = await readZipEntries(arrayBuffer);
    const contentXmlEntry = entries['content.xml'];
    if (!contentXmlEntry) return null;

    const xmlText = await extractZipEntryText(contentXmlEntry);
    return parseOdtXmlText(xmlText);
  } catch (err) {
    console.warn('ODT extraction error:', err);
    return null;
  }
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
    return null;
  } catch (err) {
    console.warn('EPUB extraction error:', err);
    return null;
  }
}

function parseDocxXmlText(xml) {
  // Extract paragraphs <w:p> and text runs <w:t>
  const paragraphMatches = xml.match(/<w:p[\s>][\s\S]*?<\/w:p>/g);
  if (!paragraphMatches || paragraphMatches.length === 0) {
    // Fallback regex for all <w:t> tags
    const textMatches = xml.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
    if (textMatches) {
      return textMatches
        .map(t => t.replace(/<[^>]*>/g, ''))
        .filter(Boolean)
        .join(' ');
    }
    return null;
  }

  const lines = [];
  for (const pXml of paragraphMatches) {
    const tMatches = pXml.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
    if (tMatches) {
      const lineText = tMatches
        .map(t => t.replace(/<[^>]*>/g, ''))
        .join('');
      if (lineText.trim()) lines.push(lineText);
    }
  }

  return lines.length > 0 ? lines.join('\n') : null;
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
