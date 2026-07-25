export async function convertImage(file, targetExt, options = {}) {
  const cleanTarget = targetExt.toLowerCase();

  if (cleanTarget === 'pdf') {
    return convertImageToPdf(file, options);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const targetWidth = options.width ? parseInt(options.width, 10) : (img.naturalWidth || 1024);
      const targetHeight = options.height ? parseInt(options.height, 10) : (img.naturalHeight || 768);

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to create canvas context'));
        return;
      }

      if (cleanTarget === 'jpg' || cleanTarget === 'jpeg' || cleanTarget === 'bmp') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      }

      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      let mimeType = 'image/png';
      if (cleanTarget === 'jpg' || cleanTarget === 'jpeg') mimeType = 'image/jpeg';
      else if (cleanTarget === 'webp') mimeType = 'image/webp';
      else if (cleanTarget === 'bmp') mimeType = 'image/bmp';
      else if (cleanTarget === 'gif') mimeType = 'image/gif';
      else if (cleanTarget === 'svg') {
        const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${targetWidth}" height="${targetHeight}"><image href="${canvas.toDataURL()}" width="${targetWidth}" height="${targetHeight}"/></svg>`;
        const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
        const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        resolve({
          blob,
          fileName: `${baseName}.${cleanTarget}`,
          mimeType: 'image/svg+xml',
        });
        return;
      }

      const quality = options.quality !== undefined ? Math.max(0.01, Math.min(1.0, Number(options.quality))) : 0.90;

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Image encoding failed'));
            return;
          }
          const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
          resolve({
            blob,
            fileName: `${baseName}.${cleanTarget}`,
            mimeType,
          });
        },
        mimeType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load input image file'));
    };

    img.src = url;
  });
}

async function convertImageToPdf(file, options = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const targetWidth = options.width ? parseInt(options.width, 10) : (img.naturalWidth || 800);
      const targetHeight = options.height ? parseInt(options.height, 10) : (img.naturalHeight || 600);

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      }

      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      const pdfHeader = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${targetWidth} ${targetHeight}] /Contents 4 0 R /Resources << /XObject << /Im1 5 0 R >> >> >>\nendobj\n4 0 obj\n<< /Length 55 >>\nstream\nq\n${targetWidth} 0 0 ${targetHeight} 0 0 cm\n/Im1 Do\nQ\nendstream\nendobj\n5 0 obj\n<< /Type /XObject /Subtype /Image /Width ${targetWidth} /Height ${targetHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imgData.length} >>\nstream\n`;
      const pdfFooter = `\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000244 00000 n \n0000000350 00000 n \ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n500\n%%EOF`;

      const blob = new Blob([pdfHeader, imgData, pdfFooter], { type: 'application/pdf' });
      const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      resolve({
        blob,
        fileName: `${baseName}.pdf`,
        mimeType: 'application/pdf',
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for PDF export'));
    };

    img.src = url;
  });
}
