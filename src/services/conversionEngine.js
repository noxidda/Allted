import { FORMAT_OPTIONS } from '../constants/matrix';
import { convertImage } from './converters/imageConverter';
import { convertData } from './converters/dataConverter';
import { convertDocument } from './converters/documentConverter';
import { convertAudioVideo } from './converters/audioVideoConverter';
import { convertArchive } from './converters/archiveConverter';
import { convert3DModel } from './converters/model3DConverter';
import { convertOcr } from './converters/ocrConverter';

export async function processConversion(file, targetExt, category, onProgress, options = {}) {
  const targetClean = targetExt.toLowerCase().replace('.', '');

  let currentProgress = 15;
  if (onProgress) onProgress(currentProgress);

  const progressInterval = setInterval(() => {
    if (currentProgress < 90) {
      currentProgress += Math.floor(Math.random() * 20) + 10;
      if (currentProgress > 90) currentProgress = 90;
      if (onProgress) onProgress(currentProgress);
    }
  }, 120);

  try {
    let result;
    const targetInfo = FORMAT_OPTIONS[targetClean];
    const categoryToUse = category || targetInfo?.category || 'word';

    if (categoryToUse === 'image' || ['jpg', 'png', 'webp', 'bmp', 'tiff', 'gif', 'svg', 'heic', 'avif'].includes(targetClean)) {
      result = await convertImage(file, targetClean, options);
    } else if (categoryToUse === 'spreadsheet' || ['json', 'csv', 'tsv', 'xml', 'yaml', 'yml', 'toml', 'ini'].includes(targetClean)) {
      result = await convertData(file, targetClean, options);
    } else if (categoryToUse === 'audio' || categoryToUse === 'video' || ['mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg', 'opus', 'mp4', 'mkv', 'mov', 'avi', 'webm', 'srt', 'vtt', 'ass', 'ssa'].includes(targetClean)) {
      result = await convertAudioVideo(file, targetClean, options, onProgress);
    } else if (categoryToUse === 'archive' || ['zip', '7z', 'tar', 'tar.gz', 'tar.xz', 'rar', 'gz'].includes(targetClean)) {
      result = await convertArchive(file, targetClean, options);
    } else if (categoryToUse === 'model3d' || ['obj', 'stl', 'fbx', 'gltf', 'glb', 'ply', 'dwg', 'dxf'].includes(targetClean)) {
      result = await convert3DModel(file, targetClean, options);
    } else if (categoryToUse === 'ocr') {
      result = await convertOcr(file, targetClean, options);
    } else {
      result = await convertDocument(file, targetClean, options);
    }

    clearInterval(progressInterval);
    if (onProgress) onProgress(100);

    return result;
  } catch (err) {
    clearInterval(progressInterval);
    throw err;
  }
}
