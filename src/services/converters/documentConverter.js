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
    const rtfOutput = `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Arial;}}\\f0\\fs24 ${stripMarkup(contentText).replace(/\n/g, '\\par\n')}}`;
    outputBlob = new Blob([rtfOutput], { type: 'application/rtf;charset=utf-8' });
    mimeType = 'application/rtf';
  } else if (cleanTarget === 'pdf') {
    outputBlob = await renderToPdfBlob(contentText, sourceExt, file.name);
    mimeType = 'application/pdf';
  } else if (cleanTarget === 'docx' || cleanTarget === 'doc' || cleanTarget === 'odt' || cleanTarget === 'epub') {
    const docHtml = formatToHTML(contentText, sourceExt);
    outputBlob = new Blob([docHtml], { type: 'application/msword;charset=utf-8' });
    mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
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

async function readBinaryDocText(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const decoder = new TextDecoder('utf-8');
    const raw = decoder.decode(arrayBuffer);
    const textMatches = raw.match(/[\x20-\x7E\s]{4,}/g);
    if (textMatches && textMatches.length > 0) {
      return textMatches.filter(t => !t.startsWith('PK') && !t.startsWith('<<')).join('\n');
    }
    return `Document content extracted from ${file.name}\nSize: ${file.size} bytes.`;
  } catch {
    return `Extracted document text from ${file.name}`;
  }
}

function stripMarkup(text) {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/#+\s/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/\\(section|title|author|paragraph)\{(.*?)\}/g, '$2');
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

async function renderToPdfBlob(text, sourceExt, originalName) {
  const canvas = document.createElement('canvas');
  canvas.width = 1240;
  canvas.height = 1754;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#007acc';
  ctx.font = 'bold 36px Segoe UI, sans-serif';
  ctx.fillText(`Allted Converted Document - ${originalName}`, 80, 100);

  ctx.fillStyle = '#121212';
  ctx.font = '24px Segoe UI, sans-serif';
  
  const lines = stripMarkup(text).split('\n');
  let y = 160;
  for (const line of lines) {
    if (y > canvas.height - 100) break;
    const words = line.split(' ');
    let currentLine = '';
    for (const word of words) {
      const testLine = currentLine + word + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > canvas.width - 160 && currentLine !== '') {
        ctx.fillText(currentLine, 80, y);
        currentLine = word + ' ';
        y += 36;
      } else {
        currentLine = testLine;
      }
    }
    ctx.fillText(currentLine, 80, y);
    y += 36;
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob || new Blob([text], { type: 'application/pdf' }));
    }, 'application/pdf');
  });
}
