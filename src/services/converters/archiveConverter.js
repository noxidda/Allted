import { createZipArchive } from '../../utils/zipGenerator';

export async function convertArchive(file, targetExt) {
  const cleanTarget = targetExt.toLowerCase();
  const fileData = await file.arrayBuffer();

  const zipBlob = createZipArchive(file.name, fileData);
  const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;

  let mimeType = 'application/zip';
  if (cleanTarget === '7z') mimeType = 'application/x-7z-compressed';
  else if (cleanTarget === 'tar') mimeType = 'application/x-tar';
  else if (cleanTarget === 'tar.gz' || cleanTarget === 'gz') mimeType = 'application/gzip';
  else if (cleanTarget === 'rar') mimeType = 'application/vnd.rar';

  return {
    blob: zipBlob,
    fileName: `${baseName}.${cleanTarget}`,
    mimeType,
  };
}
