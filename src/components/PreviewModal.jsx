import React, { useEffect, useState } from 'react';

export const PreviewModal = ({ item, onClose }) => {
  const [textPreview, setTextPreview] = useState('');
  const [objectUrl, setObjectUrl] = useState('');

  useEffect(() => {
    if (!item || !item.convertedBlob) {
      setObjectUrl('');
      setTextPreview('');
      return;
    }

    const url = URL.createObjectURL(item.convertedBlob);
    setObjectUrl(url);

    if (
      item.convertedBlob.type.includes('text') ||
      item.convertedBlob.type.includes('json') ||
      item.convertedBlob.type.includes('xml') ||
      ['txt', 'md', 'html', 'json', 'csv', 'tsv', 'xml', 'yaml', 'ini', 'srt', 'vtt'].includes(item.toExt)
    ) {
      item.convertedBlob.text().then((txt) => setTextPreview(txt.slice(0, 15000)));
    }

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [item]);

  if (!item || !item.convertedBlob) return null;

  const handleDownload = () => {
    if (!objectUrl || !item.convertedFileName) return;
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = item.convertedFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const isImage = item.convertedBlob.type.includes('image') || ['jpg', 'png', 'webp', 'gif', 'bmp', 'svg'].includes(item.toExt);
  const isAudio = item.convertedBlob.type.includes('audio') || ['mp3', 'wav', 'ogg', 'm4a'].includes(item.toExt);
  const isVideo = item.convertedBlob.type.includes('video') || ['mp4', 'webm'].includes(item.toExt);
  const isPdf = item.toExt === 'pdf';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/85 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl max-h-[90vh] panel-3d rounded-2xl flex flex-col overflow-hidden">
        {/* Title Bar */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-sm font-normal text-white uppercase truncate max-w-lg">
            PREVIEW: {item.convertedFileName}
          </h3>

          <button
            onClick={onClose}
            className="btn-3d-secondary text-xs px-3 py-1 font-semibold"
          >
            X
          </button>
        </div>

        {/* Viewport */}
        <div className="flex-1 overflow-auto p-8 input-3d-recessed">
          {isImage && (
            <div className="flex justify-center items-center">
              <img
                src={objectUrl}
                alt="Preview"
                className="max-h-[60vh] max-w-full rounded border border-white/20 object-contain shadow-xl"
              />
            </div>
          )}

          {isAudio && (
            <div className="flex flex-col items-center justify-center p-10 panel-3d rounded-2xl max-w-lg mx-auto my-10 space-y-6">
              <audio controls src={objectUrl} className="w-full" />
            </div>
          )}

          {isVideo && (
            <div className="flex justify-center">
              <video controls src={objectUrl} className="max-h-[60vh] rounded border border-white/20 shadow-xl" />
            </div>
          )}

          {isPdf && (
            <iframe
              src={objectUrl}
              title="PDF Preview"
              className="w-full h-[60vh] rounded border border-white/20 bg-white"
            />
          )}

          {!isImage && !isAudio && !isVideo && !isPdf && textPreview && (
            <div className="p-6 input-3d-recessed rounded-xl font-mono text-sm overflow-x-auto max-h-[60vh] text-white whitespace-pre-wrap">
              {textPreview}
            </div>
          )}

          {!isImage && !isAudio && !isVideo && !isPdf && !textPreview && (
            <div className="text-center py-16 text-sm text-[#888888]">
              BINARY FILE READY FOR DOWNLOAD.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-white/10">
          <span className="text-xs text-[#888888]">FORMAT: {item.toExt.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
};
