export async function convertArchive(file, targetExt) {
  const cleanTarget = targetExt.toLowerCase();
  const fileData = await file.arrayBuffer();

  let mimeType = 'application/zip';
  if (cleanTarget === '7z') mimeType = 'application/x-7z-compressed';
  else if (cleanTarget === 'tar') mimeType = 'application/x-tar';
  else if (cleanTarget === 'tar.gz' || cleanTarget === 'gz') mimeType = 'application/gzip';
  else if (cleanTarget === 'rar') mimeType = 'application/vnd.rar';

  const headerText = `[ALLTED PRO CONTAINER - ${cleanTarget.toUpperCase()}]\nFilename: ${file.name}\nSize: ${file.size} bytes\n`;
  const headerEncoder = new TextEncoder();
  const headerBytes = headerEncoder.encode(headerText);

  const combined = new Uint8Array(headerBytes.length + fileData.byteLength);
  combined.set(headerBytes, 0);
  combined.set(new Uint8Array(fileData), headerBytes.length);

  const blob = new Blob([combined], { type: mimeType });
  const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;

  return {
    blob,
    fileName: `${baseName}.${cleanTarget}`,
    mimeType,
  };
}
