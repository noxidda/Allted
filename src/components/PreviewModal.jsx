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

  const isImage = item.convertedBlob.type.includes('image') || ['jpg', 'png', 'webp', 'gif', 'bmp', 'svg'].includes(item.toExt);
  const isAudio = item.convertedBlob.type.includes('audio') || ['mp3', 'wav', 'ogg', 'm4a'].includes(item.toExt);
  const isVideo = item.convertedBlob.type.includes('video') || ['mp4', 'webm'].includes(item.toExt);
  const isPdf = item.toExt === 'pdf';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-purple-950/40 dark:bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-white dark:bg-[#181326] border border-[#E9D5FF] dark:border-[#2E2245] shadow-2xl shadow-purple-950/20 rounded-2xl flex flex-col overflow-hidden">
        {/* Title Bar */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-[#F3E8FF] dark:border-[#2E2245] bg-[#FAF5FF] dark:bg-[#110D1D] gap-2">
          <h3 className="text-xs sm:text-sm font-bold text-[#2E1065] dark:text-[#F3E8FF] uppercase truncate max-w-[80%]">
            PREVIEW: {item.convertedFileName}
          </h3>

          <button
            onClick={onClose}
            className="btn-3d-secondary text-xs px-2.5 sm:px-3 py-1 font-bold"
          >
            ✕
          </button>
        </div>

        {/* Viewport */}
        <div className="flex-1 overflow-auto p-3 sm:p-6 bg-[#FAF5FF]/50 dark:bg-[#0D0B14]/50">
          {isImage && (
            <div className="flex justify-center items-center">
              <img
                src={objectUrl}
                alt="Preview"
                className="max-h-[50vh] sm:max-h-[60vh] max-w-full rounded-xl border border-[#E9D5FF] dark:border-[#2E2245] object-contain shadow-lg"
              />
            </div>
          )}

          {isAudio && (
            <div className="flex flex-col items-center justify-center p-6 sm:p-10 bg-white dark:bg-[#110D1D] border border-[#E9D5FF] dark:border-[#2E2245] rounded-2xl max-w-lg mx-auto my-6 sm:my-10 space-y-6 shadow-sm">
              <audio controls src={objectUrl} className="w-full" />
            </div>
          )}

          {isVideo && (
            <div className="flex justify-center">
              <video controls src={objectUrl} className="max-h-[50vh] sm:max-h-[60vh] rounded-xl border border-[#E9D5FF] dark:border-[#2E2245] shadow-lg w-full object-contain" />
            </div>
          )}

          {isPdf && (
            <iframe
              src={objectUrl}
              title="PDF Preview"
              className="w-full h-[50vh] sm:h-[60vh] rounded-xl border border-[#E9D5FF] dark:border-[#2E2245] bg-white shadow-sm"
            />
          )}

          {!isImage && !isAudio && !isVideo && !isPdf && textPreview && (
            <div className="p-3 sm:p-6 bg-white dark:bg-[#110D1D] border border-[#E9D5FF] dark:border-[#2E2245] rounded-xl font-mono text-xs sm:text-sm overflow-x-auto max-h-[50vh] sm:max-h-[60vh] text-[#2E1065] dark:text-[#F3E8FF] whitespace-pre-wrap shadow-inner">
              {textPreview}
            </div>
          )}

          {!isImage && !isAudio && !isVideo && !isPdf && !textPreview && (
            <div className="text-center py-12 sm:py-16 text-xs sm:text-sm text-[#6B5B95] dark:text-[#A799CC] font-medium">
              BINARY FILE READY FOR DOWNLOAD.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-t border-[#F3E8FF] dark:border-[#2E2245] bg-[#FAF5FF] dark:bg-[#110D1D]">
          <span className="text-xs text-[#7C3AED] dark:text-[#C084FC] font-bold font-mono">FORMAT: {item.toExt.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
};
