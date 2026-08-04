/**
 * Pure JavaScript PDF generator for valid, uncorrupted PDF 1.4 files
 * Compatible with Adobe Acrobat Reader, Chrome, Edge, Safari, iOS, and Android PDF viewers.
 */

export function createPdfFromImage(canvas) {
  const width = canvas.width || 800;
  const height = canvas.height || 600;

  const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
  const base64Str = dataUrl.split(',')[1];
  const jpegBytes = base64ToUint8Array(base64Str);

  // PDF Page aspect ratio fitting within points (e.g. 72 dpi)
  const ptWidth = Math.round(width * 0.75);
  const ptHeight = Math.round(height * 0.75);

  const pdfHeader = `%PDF-1.4\n%âãÏÓ\n`;

  // Object 1: Catalog
  const obj1 = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;
  // Object 2: Pages
  const obj2 = `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`;
  // Object 3: Page
  const obj3 = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${ptWidth} ${ptHeight}] /Contents 4 0 R /Resources << /XObject << /Img1 5 0 R >> >> >>\nendobj\n`;
  
  // Object 4: Stream drawing the image stretched to page dimensions
  const streamContent = `q\n${ptWidth} 0 0 ${ptHeight} 0 0 cm\n/Img1 Do\nQ\n`;
  const obj4 = `4 0 obj\n<< /Length ${streamContent.length} >>\nstream\n${streamContent}endstream\nendobj\n`;

  // Object 5: Image XObject with raw binary JPEG payload
  const obj5Head = `5 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`;
  const obj5Tail = `\nendstream\nendobj\n`;

  // Assembly & byte offset computation
  const encoder = new TextEncoder();
  const bHeader = encoder.encode(pdfHeader);
  const bObj1 = encoder.encode(obj1);
  const bObj2 = encoder.encode(obj2);
  const bObj3 = encoder.encode(obj3);
  const bObj4 = encoder.encode(obj4);
  const bObj5Head = encoder.encode(obj5Head);
  const bObj5Tail = encoder.encode(obj5Tail);

  const off1 = bHeader.length;
  const off2 = off1 + bObj1.length;
  const off3 = off2 + bObj2.length;
  const off4 = off3 + bObj3.length;
  const off5 = off4 + bObj4.length;
  const startXref = off5 + bObj5Head.length + jpegBytes.length + bObj5Tail.length;

  const xref = `xref\n0 6\n0000000000 65535 f \n${pad10(off1)} 00000 n \n${pad10(off2)} 00000 n \n${pad10(off3)} 00000 n \n${pad10(off4)} 00000 n \n${pad10(off5)} 00000 n \ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF`;
  const bXref = encoder.encode(xref);

  const totalLength = startXref + bXref.length;
  const resultBuffer = new Uint8Array(totalLength);

  let pos = 0;
  resultBuffer.set(bHeader, pos); pos += bHeader.length;
  resultBuffer.set(bObj1, pos); pos += bObj1.length;
  resultBuffer.set(bObj2, pos); pos += bObj2.length;
  resultBuffer.set(bObj3, pos); pos += bObj3.length;
  resultBuffer.set(bObj4, pos); pos += bObj4.length;
  resultBuffer.set(bObj5Head, pos); pos += bObj5Head.length;
  resultBuffer.set(jpegBytes, pos); pos += jpegBytes.length;
  resultBuffer.set(bObj5Tail, pos); pos += bObj5Tail.length;
  resultBuffer.set(bXref, pos);

  return new Blob([resultBuffer], { type: 'application/pdf' });
}

export function createPdfFromText(title, textContent) {
  const cleanTitle = (title || 'Document').replace(/[^\w\s.-]/g, '');
  const cleanText = textContent || '';

  // Letter page dimensions: 612 x 792 pt
  const pageW = 612;
  const pageH = 792;
  const margin = 54; // 0.75 inch
  const contentW = pageW - margin * 2;
  const lineHeight = 16;
  const startY = pageH - margin - 30;

  // Simple line wrapping algorithm
  const lines = [];
  const rawParagraphs = cleanText.split(/\r\n|\n/);

  for (const para of rawParagraphs) {
    if (!para.trim()) {
      lines.push('');
      continue;
    }

    const words = para.split(' ');
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      // Approx font metrics: 12pt Helvetica ~ 6.5pt width per char
      if (testLine.length * 6.5 > contentW && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
  }

  // Paginate lines
  const linesPerPage = Math.floor((pageH - margin * 2 - 40) / lineHeight);
  const pages = [];
  for (let i = 0; i < lines.length; i += linesPerPage) {
    pages.push(lines.slice(i, i + linesPerPage));
  }
  if (pages.length === 0) pages.push(['(Empty document)']);

  const encoder = new TextEncoder();
  const pdfHeader = `%PDF-1.4\n%âãÏÓ\n`;

  // Standard Objects: 1: Catalog, 2: Pages, 3: Font
  const fontObjNum = 3;
  const fontObj = `${fontObjNum} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`;

  const pageObjNums = [];
  const contentObjNums = [];
  let currentObjNum = 4;

  for (let p = 0; p < pages.length; p++) {
    pageObjNums.push(currentObjNum++);
    contentObjNums.push(currentObjNum++);
  }

  const obj1 = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;
  const obj2 = `2 0 obj\n<< /Type /Pages /Kids [${pageObjNums.map(n => `${n} 0 R`).join(' ')}] /Count ${pages.length} >>\nendobj\n`;

  let pdfBody = pdfHeader + obj1 + obj2 + fontObj;
  const objOffsets = [];

  const bHeader = encoder.encode(pdfHeader);
  const bObj1 = encoder.encode(obj1);
  const bObj2 = encoder.encode(obj2);
  const bObj3 = encoder.encode(fontObj);

  objOffsets[1] = bHeader.length;
  objOffsets[2] = objOffsets[1] + bObj1.length;
  objOffsets[3] = objOffsets[2] + bObj2.length;

  let currentOffset = objOffsets[3] + bObj3.length;

  const pageAndContentStr = [];

  for (let p = 0; p < pages.length; p++) {
    const pageNum = pageObjNums[p];
    const contentNum = contentObjNums[p];
    const pLines = pages[p];

    // Build PDF content stream for this page
    let streamText = `BT\n/F1 14 Tf\n${margin} ${startY + 15} Td\n(${pdfEscape(cleanTitle)}) Tj\nET\n`;
    streamText += `BT\n/F1 10 Tf\n${margin} ${startY - 10} Td\n`;

    let yOffset = 0;
    for (const line of pLines) {
      if (line === '') {
        streamText += `0 -${lineHeight} Td () Tj\n`;
      } else {
        streamText += `0 -${lineHeight} Td (${pdfEscape(line)}) Tj\n`;
      }
      yOffset += lineHeight;
    }
    streamText += `ET\n`;

    const pageStr = `${pageNum} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Contents ${contentNum} 0 R /Resources << /Font << /F1 3 0 R >> >> >>\nendobj\n`;
    const contentStr = `${contentNum} 0 obj\n<< /Length ${streamText.length} >>\nstream\n${streamText}endstream\nendobj\n`;

    objOffsets[pageNum] = currentOffset;
    const bPage = encoder.encode(pageStr);
    currentOffset += bPage.length;

    objOffsets[contentNum] = currentOffset;
    const bContent = encoder.encode(contentStr);
    currentOffset += bContent.length;

    pageAndContentStr.push(pageStr, contentStr);
  }

  pdfBody += pageAndContentStr.join('');

  const totalObjs = currentObjNum - 1;
  let xref = `xref\n0 ${totalObjs + 1}\n0000000000 65535 f \n`;

  for (let i = 1; i <= totalObjs; i++) {
    xref += `${pad10(objOffsets[i])} 00000 n \n`;
  }

  xref += `trailer\n<< /Size ${totalObjs + 1} /Root 1 0 R >>\nstartxref\n${currentOffset}\n%%EOF`;

  const finalPdfStr = pdfBody + xref;
  return new Blob([encoder.encode(finalPdfStr)], { type: 'application/pdf' });
}

function pdfEscape(str) {
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[\r\n]/g, ' ');
}

function pad10(n) {
  return String(n).padStart(10, '0');
}

function base64ToUint8Array(base64) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
