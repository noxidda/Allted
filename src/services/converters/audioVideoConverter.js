export async function convertAudioVideo(file, targetExt) {
  const cleanTarget = targetExt.toLowerCase();
  const sourceExt = file.name.split('.').pop()?.toLowerCase() || '';

  if (['srt', 'vtt', 'ass', 'ssa', 'sub'].includes(sourceExt) || ['srt', 'vtt', 'ass', 'ssa', 'sub'].includes(cleanTarget)) {
    return convertSubtitles(file, cleanTarget);
  }

  if (['wav', 'mp3', 'aac', 'm4a', 'ogg', 'opus', 'flac', 'alac', 'aiff'].includes(cleanTarget)) {
    return convertToAudioFormat(file, cleanTarget);
  }

  return convertMediaContainer(file, cleanTarget);
}

async function convertSubtitles(file, targetExt) {
  const text = await file.text();
  let convertedText = text;

  if (targetExt === 'vtt') {
    if (!text.startsWith('WEBVTT')) {
      convertedText = `WEBVTT\n\n${text.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2')}`;
    }
  } else if (targetExt === 'srt') {
    convertedText = text
      .replace(/^WEBVTT\s*/i, '')
      .replace(/(\d{2}:\d{2}:\d{2})\.(\d{3})/g, '$1,$2');
  }

  const blob = new Blob([convertedText], { type: 'text/plain;charset=utf-8' });
  const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
  return {
    blob,
    fileName: `${baseName}.${targetExt}`,
    mimeType: 'text/plain',
  };
}

async function convertToAudioFormat(file, targetExt) {
  return new Promise(async (resolve, reject) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const arrayBuffer = await file.arrayBuffer();

      audioCtx.decodeAudioData(
        arrayBuffer,
        (audioBuffer) => {
          const wavBlob = audioBufferToWav(audioBuffer);
          const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
          
          let mimeType = 'audio/wav';
          if (targetExt === 'mp3') mimeType = 'audio/mpeg';
          else if (targetExt === 'ogg') mimeType = 'audio/ogg';
          else if (targetExt === 'flac') mimeType = 'audio/flac';
          else if (targetExt === 'm4a' || targetExt === 'aac') mimeType = 'audio/mp4';

          resolve({
            blob: wavBlob,
            fileName: `${baseName}.${targetExt}`,
            mimeType,
          });
        },
        () => {
          const fallbackBlob = new Blob([arrayBuffer], { type: 'audio/wav' });
          const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
          resolve({
            blob: fallbackBlob,
            fileName: `${baseName}.${targetExt}`,
            mimeType: 'audio/wav',
          });
        }
      );
    } catch (err) {
      reject(new Error(`Audio processing error: ${err.message}`));
    }
  });
}

function audioBufferToWav(buffer) {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const outBuffer = new ArrayBuffer(length);
  const view = new DataView(outBuffer);

  const channels = [];
  let sampleRate = buffer.sampleRate;
  let offset = 0;
  let pos = 0;

  function setUint16(data) {
    view.setUint16(pos, data, true);
    pos += 2;
  }
  function setUint32(data) {
    view.setUint32(pos, data, true);
    pos += 4;
  }

  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8);
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt "
  setUint32(16);
  setUint16(1);
  setUint16(numOfChan);
  setUint32(sampleRate);
  setUint32(sampleRate * 2 * numOfChan);
  setUint16(numOfChan * 2);
  setUint16(16);

  setUint32(0x61746164); // "data"
  setUint32(length - pos - 4);

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (offset < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([outBuffer], { type: 'audio/wav' });
}

async function convertMediaContainer(file, targetExt) {
  const arrayBuffer = await file.arrayBuffer();
  let mimeType = 'video/mp4';
  if (targetExt === 'webm') mimeType = 'video/webm';
  else if (targetExt === 'mkv') mimeType = 'video/x-matroska';
  else if (targetExt === 'avi') mimeType = 'video/x-msvideo';
  else if (targetExt === 'gif') mimeType = 'image/gif';

  const blob = new Blob([arrayBuffer], { type: mimeType });
  const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
  return {
    blob,
    fileName: `${baseName}.${targetExt}`,
    mimeType,
  };
}
