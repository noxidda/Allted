import { createPdfFromText } from '../../utils/pdfGenerator';

export async function convertDocument(file, targetExt) {
  const cleanTarget = targetExt.toLowerCase();
  const sourceExt = file.name.split('.').pop()?.toLowerCase() || '';

  let contentText = '';

  if (sourceExt === 'txt' || sourceExt === 'md' || sourceExt === 'html' || sourceExt === 'rtf' || sourceExt === 'tex') {
    contentText = await file.text();
  } else {
    contentText = await readBinaryDocText(file, sourceExt);
  }

  let outputBlob;
  let mimeType = 'text/plain';

  if (cleanTarget === 'txt') {
    outputBlob = new Blob([stripMarkup(contentText)], { type: 'text/plain;charset=utf-8' });
    mimeType = 'text/plain';
  } else if (cleanTarget === 'html') {
    const htmlOutput = formatToHTML(contentText, sourceExt);
    outputBlob = new Blob([htmlOutput], { type: 'text/html;charset=utf-8' });
    mimeType = 'text/html';
  } else if (cleanTarget === 'md') {
    const mdOutput = formatToMarkdown(contentText, sourceExt);
    outputBlob = new Blob([mdOutput], { type: 'text/markdown;charset=utf-8' });
    mimeType = 'text/markdown';
  } else if (cleanTarget === 'rtf') {
    const rtfOutput = `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Arial;}}\\f0\\fs24 ${pdfEscapeRtf(stripMarkup(contentText)).replace(/\n/g, '\\par\n')}}`;
    outputBlob = new Blob([rtfOutput], { type: 'application/rtf;charset=utf-8' });
    mimeType = 'application/rtf';
  } else if (cleanTarget === 'pdf') {
    outputBlob = createPdfFromText(file.name, stripMarkup(contentText));
    mimeType = 'application/pdf';
  } else if (cleanTarget === 'docx' || cleanTarget === 'doc' || cleanTarget === 'odt' || cleanTarget === 'epub') {
    const wordHtml = formatToWordHTML(contentText, sourceExt, file.name);
    outputBlob = new Blob([wordHtml], { type: 'application/msword;charset=utf-8' });
    mimeType = 'application/msword';
  } else {
    outputBlob = new Blob([stripMarkup(contentText)], { type: 'text/plain;charset=utf-8' });
  }

  const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
  return {
    blob: outputBlob,
    fileName: `${baseName}.${cleanTarget}`,
    mimeType,
  };
}

async function readBinaryDocText(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const decoder = new TextDecoder('utf-8');
    const raw = decoder.decode(arrayBuffer);
    const textMatches = raw.match(/[\x20-\x7E\s]{4,}/g);
    if (textMatches && textMatches.length > 0) {
      const filtered = textMatches.filter(t => !t.startsWith('PK') && !t.startsWith('<<') && t.trim().length > 3);
      if (filtered.length > 0) return filtered.join('\n');
    }
    return `Document content extracted from ${file.name}\nSize: ${file.size} bytes.`;
  } catch {
    return `Extracted document text from ${file.name}`;
  }
}

function stripMarkup(text) {
  if (!text) return '';
  return text
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/#+\s/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/\\(section|title|author|paragraph)\{(.*?)\}/g, '$2');
}

function pdfEscapeRtf(text) {
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}');
}

function formatToWordHTML(text, sourceExt, fileName) {
  const bodyContent = formatToHTML(text, sourceExt);
  return `<html xmlns:o='urn:schemas-microsoft-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>${fileName}</title>
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
    body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; font-size: 11pt; line-height: 1.5; padding: 20pt; color: #000000; }
    h1 { font-size: 20pt; color: #1f4e78; margin-bottom: 10pt; }
    h2 { font-size: 14pt; color: #2e75b6; margin-top: 12pt; margin-bottom: 6pt; }
    p { margin-bottom: 8pt; }
  </style>
</head>
<body>
  ${bodyContent}
</body>
</html>`;
}

function formatToHTML(text, sourceExt) {
  if (sourceExt === 'html') return text;
  
  let bodyContent = text;
  if (sourceExt === 'md') {
    bodyContent = text
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br/>');
    bodyContent = `<p>${bodyContent}</p>`;
  } else {
    bodyContent = `<p>${text.replace(/\n/g, '<br/>')}</p>`;
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Converted Document</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; padding: 2rem; color: #121212; }
    h1, h2, h3 { color: #007acc; }
  </style>
</head>
<body>
  ${bodyContent}
</body>
</html>`;
}

function formatToMarkdown(text, sourceExt) {
  if (sourceExt === 'md') return text;

  let md = text;
  if (sourceExt === 'html') {
    md = text
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]*>/g, '');
  }
  return md;
}
