import { createPdfFromImage } from '../../utils/pdfGenerator';

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

      const pdfBlob = createPdfFromImage(canvas);
      const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;

      resolve({
        blob: pdfBlob,
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
