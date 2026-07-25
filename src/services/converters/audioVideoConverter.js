export async function convertAudioVideo(file, targetExt, options = {}, onProgress) {
  const cleanTarget = targetExt.toLowerCase();
  const sourceExt = file.name.split('.').pop()?.toLowerCase() || '';

  if (['srt', 'vtt', 'ass', 'ssa', 'sub'].includes(sourceExt) || ['srt', 'vtt', 'ass', 'ssa', 'sub'].includes(cleanTarget)) {
    return convertSubtitles(file, cleanTarget);
  }

  if (['wav', 'mp3', 'aac', 'm4a', 'ogg', 'opus', 'flac', 'alac', 'aiff'].includes(cleanTarget)) {
    return convertToAudioFormat(file, cleanTarget);
  }

  return convertMediaContainer(file, cleanTarget, options, onProgress);
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

async function convertMediaContainer(file, targetExt, options = {}, onProgress) {
  const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
  let mimeType = 'video/mp4';
  if (targetExt === 'webm') mimeType = 'video/webm';
  else if (targetExt === 'mkv') mimeType = 'video/x-matroska';
  else if (targetExt === 'avi') mimeType = 'video/x-msvideo';
  else if (targetExt === 'gif') mimeType = 'image/gif';

  if (typeof document !== 'undefined' && typeof MediaRecorder !== 'undefined') {
    try {
      const processedBlob = await reencodeVideo(file, targetExt, options, onProgress);
      if (processedBlob) {
        return {
          blob: processedBlob,
          fileName: `${baseName}.${targetExt}`,
          mimeType: processedBlob.type || mimeType,
        };
      }
    } catch (err) {
      console.warn('Video re-encoding error, falling back to direct container wrap:', err);
    }
  }

  const arrayBuffer = await file.arrayBuffer();
  const blob = new Blob([arrayBuffer], { type: mimeType });
  return {
    blob,
    fileName: `${baseName}.${targetExt}`,
    mimeType,
  };
}

function reencodeVideo(file, targetExt, options = {}, onProgress) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    video.src = url;
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = async () => {
      try {
        const srcWidth = video.videoWidth || 1280;
        const srcHeight = video.videoHeight || 720;
        const targetWidth = options.width ? parseInt(options.width, 10) : srcWidth;
        const targetHeight = options.height ? parseInt(options.height, 10) : srcHeight;

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          URL.revokeObjectURL(url);
          return resolve(null);
        }

        const totalPixels = targetWidth * targetHeight;
        let videoBitsPerSecond = Math.max(400000, Math.min(30000000, Math.round(totalPixels * 2.5)));

        let recMime = 'video/webm;codecs=vp9';
        if (!MediaRecorder.isTypeSupported(recMime)) recMime = 'video/webm;codecs=vp8';
        if (!MediaRecorder.isTypeSupported(recMime)) recMime = 'video/webm';
        if (!MediaRecorder.isTypeSupported(recMime)) recMime = 'video/mp4';

        const canvasStream = canvas.captureStream(30);

        try {
          if (typeof video.captureStream === 'function') {
            const videoStream = video.captureStream();
            videoStream.getAudioTracks().forEach((track) => canvasStream.addTrack(track));
          } else if (typeof video.mozCaptureStream === 'function') {
            const videoStream = video.mozCaptureStream();
            videoStream.getAudioTracks().forEach((track) => canvasStream.addTrack(track));
          }
        } catch (e) {
          // Audio track extraction optional
        }

        const recorderOptions = { videoBitsPerSecond };
        if (MediaRecorder.isTypeSupported(recMime)) {
          recorderOptions.mimeType = recMime;
        }

        const mediaRecorder = new MediaRecorder(canvasStream, recorderOptions);
        const chunks = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
          URL.revokeObjectURL(url);
          const finalMime = recorderOptions.mimeType || 'video/webm';
          const blob = new Blob(chunks, { type: finalMime });
          resolve(blob);
        };

        mediaRecorder.onerror = (err) => {
          URL.revokeObjectURL(url);
          reject(err);
        };

        mediaRecorder.start(100);
        await video.play();

        let animId;
        const renderFrame = () => {
          if (video.paused || video.ended) return;
          ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
          if (onProgress && video.duration) {
            const pct = Math.min(95, Math.round((video.currentTime / video.duration) * 100));
            onProgress(pct);
          }
          animId = requestAnimationFrame(renderFrame);
        };

        renderFrame();

        video.onended = () => {
          cancelAnimationFrame(animId);
          if (mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
          }
        };

        const durationMs = (video.duration || 10) * 1000 + 2000;
        setTimeout(() => {
          cancelAnimationFrame(animId);
          if (mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
          }
        }, durationMs);
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };

    video.onerror = (err) => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
  });
}
