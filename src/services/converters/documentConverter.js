import { createPdfFromText } from '../../utils/pdfGenerator.js';
import { extractTextFromDocx, extractTextFromOdt, extractTextFromEpub } from '../../utils/zipReader.js';

export async function convertDocument(file, targetExt) {
  const cleanTarget = targetExt.toLowerCase();
  const sourceExt = file.name.split('.').pop()?.toLowerCase() || '';

  const contentText = await extractDocumentText(file, sourceExt);

  let outputBlob;
  let mimeType = 'text/plain';

  if (cleanTarget === 'txt') {
    outputBlob = new Blob([contentText], { type: 'text/plain;charset=utf-8' });
    mimeType = 'text/plain';
  } else if (cleanTarget === 'html') {
    const htmlOutput = formatToHTML(contentText, sourceExt, file.name);
    outputBlob = new Blob([htmlOutput], { type: 'text/html;charset=utf-8' });
    mimeType = 'text/html';
  } else if (cleanTarget === 'md') {
    const mdOutput = formatToMarkdown(contentText);
    outputBlob = new Blob([mdOutput], { type: 'text/markdown;charset=utf-8' });
    mimeType = 'text/markdown';
  } else if (cleanTarget === 'rtf') {
    const rtfOutput = formatToRtf(contentText);
    outputBlob = new Blob([rtfOutput], { type: 'application/rtf;charset=utf-8' });
    mimeType = 'application/rtf';
  } else if (cleanTarget === 'pdf') {
    outputBlob = createPdfFromText(file.name, contentText);
    mimeType = 'application/pdf';
  } else if (cleanTarget === 'docx' || cleanTarget === 'doc' || cleanTarget === 'odt' || cleanTarget === 'epub') {
    const wordHtml = formatToWordHTML(contentText, sourceExt, file.name);
    outputBlob = new Blob([wordHtml], { type: 'application/msword;charset=utf-8' });
    mimeType = 'application/msword';
  } else {
    outputBlob = new Blob([contentText], { type: 'text/plain;charset=utf-8' });
  }

  const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
  return {
    blob: outputBlob,
    fileName: `${baseName}.${cleanTarget}`,
    mimeType,
  };
}

async function extractDocumentText(file, sourceExt) {
  try {
    const arrayBuffer = await file.arrayBuffer();

    if (sourceExt === 'docx') {
      const docxText = await extractTextFromDocx(arrayBuffer);
      if (docxText && docxText.trim().length > 0) return docxText;
    } else if (sourceExt === 'odt') {
      const odtText = await extractTextFromOdt(arrayBuffer);
      if (odtText && odtText.trim().length > 0) return odtText;
    } else if (sourceExt === 'epub') {
      const epubText = await extractTextFromEpub(arrayBuffer);
      if (epubText && epubText.trim().length > 0) return epubText;
    } else if (sourceExt === 'doc') {
      return parseLegacyDocToText(arrayBuffer, file.name);
    } else if (sourceExt === 'rtf') {
      const rawRtf = new TextDecoder('utf-8').decode(arrayBuffer);
      return parseRtfToText(rawRtf);
    } else if (sourceExt === 'html' || sourceExt === 'htm') {
      const rawHtml = new TextDecoder('utf-8').decode(arrayBuffer);
      return parseHtmlToText(rawHtml);
    } else if (sourceExt === 'pdf') {
      return parsePdfToText(arrayBuffer, file.name);
    }

    // Default for TXT, MD, TEX, and fallback text reading
    const text = new TextDecoder('utf-8').decode(arrayBuffer);
    if (text && !text.includes('\x00')) {
      return stripBinaryJunk(text);
    }

    return parseLegacyDocToText(arrayBuffer, file.name);
  } catch (err) {
    console.warn('Text extraction error:', err);
    return `Document Content from ${file.name}`;
  }
}

function parseLegacyDocToText(arrayBuffer, fileName) {
  try {
    // 1. Try UTF-16LE decoding (standard for OLE2 binary .doc files)
    const utf16Str = new TextDecoder('utf-16le', { fatal: false }).decode(arrayBuffer);
    const utf16Words = utf16Str.match(/[\x20-\x7E]{4,}/g);
    if (utf16Words) {
      const cleanUtf16 = utf16Words.filter(
        w => !w.includes('Root Entry') && !w.includes('WordDocument') && !w.includes('CompObj') && !w.includes('ObjectPool') && w.trim().length > 3
      );
      if (cleanUtf16.length > 0) return cleanUtf16.join('\n');
    }

    // 2. Try UTF-8 / ASCII decoding
    const utf8Str = new TextDecoder('utf-8', { fatal: false }).decode(arrayBuffer);
    const utf8Words = utf8Str.match(/[\x20-\x7E]{4,}/g);
    if (utf8Words) {
      const cleanUtf8 = utf8Words.filter(
        w => !w.includes('Root Entry') && !w.includes('WordDocument') && !w.includes('CompObj') && !w.includes('ObjectPool') && w.trim().length > 3
      );
      if (cleanUtf8.length > 0) return cleanUtf8.join('\n');
    }
  } catch (e) {
    console.warn('parseLegacyDocToText error:', e);
  }

  return `Extracted Document Content from ${fileName}`;
}

function parseRtfToText(rtfStr) {
  return rtfStr
    .replace(/\\fonttbl[\s\S]*?\}/gi, '')
    .replace(/\\colortbl[\s\S]*?\}/gi, '')
    .replace(/\\stylesheet[\s\S]*?\}/gi, '')
    .replace(/\\par/gi, '\n')
    .replace(/\\line/gi, '\n')
    .replace(/\\[a-z]+\d*/gi, '')
    .replace(/[\{\}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseHtmlToText(htmlStr) {
  return htmlStr
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

function parsePdfToText(arrayBuffer, fileName) {
  const decoder = new TextDecoder('utf-8');
  const raw = decoder.decode(arrayBuffer);

  const matches = raw.match(/\((.*?)\)\s*Tj/g);
  if (matches && matches.length > 0) {
    const extracted = matches
      .map(m => m.replace(/^\(/, '').replace(/\)\s*Tj$/, '').replace(/\\/g, ''))
      .filter(t => t.trim().length > 1);
    if (extracted.length > 0) return extracted.join('\n');
  }

  const wordMatches = raw.match(/[\x20-\x7E]{4,}/g);
  if (wordMatches) {
    const cleanWords = wordMatches.filter(
      w => !w.startsWith('/') && !w.startsWith('%') && !w.includes('obj') && !w.includes('endobj') && !w.includes('stream') && !w.includes('xref')
    );
    if (cleanWords.length > 0) return cleanWords.join('\n');
  }

  return `Extracted Document Content from ${fileName}`;
}

function stripBinaryJunk(text) {
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatToWordHTML(text, sourceExt, fileName) {
  const paragraphs = text.split('\n').map(p => p.trim()).filter(Boolean);
  const bodyContent = paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join('\n');

  return `<html xmlns:o='urn:schemas-microsoft-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>${escapeHtml(fileName)}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Normal</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; font-size: 11pt; line-height: 1.6; padding: 24pt; color: #1e1035; }
    h1 { font-size: 18pt; color: #7c3aed; margin-bottom: 12pt; border-bottom: 2px solid #e9d5ff; padding-bottom: 6pt; }
    p { margin-bottom: 10pt; line-height: 1.6; }
  </style>
</head>
<body>
  <h1>${escapeHtml(fileName.replace(/\.[^/.]+$/, ''))}</h1>
  ${bodyContent}
</body>
</html>`;
}

function formatToHTML(text, sourceExt, fileName) {
  const paragraphs = text.split('\n').map(p => p.trim()).filter(Boolean);
  const bodyContent = paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join('\n');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(fileName)}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; padding: 2.5rem; max-width: 800px; margin: 0 auto; color: #1e1035; background-color: #faf5ff; }
    h1 { color: #7c3aed; border-bottom: 2px solid #e9d5ff; padding-bottom: 0.5rem; }
    p { margin-bottom: 1rem; color: #2e1065; }
  </style>
</head>
<body>
  <h1>${escapeHtml(fileName.replace(/\.[^/.]+$/, ''))}</h1>
  ${bodyContent}
</body>
</html>`;
}

function formatToMarkdown(text) {
  const paragraphs = text.split('\n').map(p => p.trim()).filter(Boolean);
  return paragraphs.join('\n\n');
}

function formatToRtf(text) {
  const clean = text
    .replace(/\\/g, '\\\\')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/\n/g, '\\par\n');

  return `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Segoe UI;}}\\f0\\fs24 ${clean}}`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
