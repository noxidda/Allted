import React, { useRef, useState } from 'react';
import { getCompatibleTargetFormats, FORMAT_OPTIONS, CATEGORY_ACCEPT_MAP } from '../constants/matrix';
import { exportFileWithPicker } from '../utils/fileSaver';

const VIDEO_PRESETS = [
  { key: '8K', w: 7680, h: 4320 },
  { key: '4K', w: 3840, h: 2160 },
  { key: '2K', w: 2560, h: 1440 },
  { key: 'FHD', w: 1920, h: 1080 },
  { key: 'HD', w: 1280, h: 720 },
  { key: 'SD', w: 854, h: 480 },
];

export const DropzoneArea = ({ onConvertFile, activeCategory, isConverting, conversionProgress, convertedResult, onPreviewResult, onReset }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [targetFormat, setTargetFormat] = useState('');
  
  // Media Resolution & Quality States
  const [nativeDimensions, setNativeDimensions] = useState({ width: 0, height: 0 });
  const [customWidth, setCustomWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');
  const [lockAspect, setLockAspect] = useState(true);
  const [activePreset, setActivePreset] = useState(null);
  const [imageQuality, setImageQuality] = useState(90);

  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processSingleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processSingleFile(e.target.files[0]);
    }
  };

  const processSingleFile = (file) => {
    setSelectedFile(file);
    setActivePreset(null);
    if (onReset) onReset();

    const sourceExt = file.name.split('.').pop()?.toLowerCase() || '';
    const candidates = getCompatibleTargetFormats(sourceExt);
    const chosenTarget = candidates.length > 0 ? candidates[0] : 'pdf';
    setTargetFormat(chosenTarget);

    if (file.type.includes('image') || ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif', 'svg'].includes(sourceExt)) {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const w = img.naturalWidth || 1920;
        const h = img.naturalHeight || 1080;
        setNativeDimensions({ width: w, height: h });
        setCustomWidth(String(w));
        setCustomHeight(String(h));
      };
      img.src = url;
    } else if (file.type.includes('video') || ['mp4', 'webm', 'mkv', 'avi', 'mov'].includes(sourceExt)) {
      const video = document.createElement('video');
      const url = URL.createObjectURL(file);
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        const w = video.videoWidth || 1280;
        const h = video.videoHeight || 720;
        setNativeDimensions({ width: w, height: h });
        setCustomWidth(String(w));
        setCustomHeight(String(h));
      };
      video.src = url;
    } else {
      setNativeDimensions({ width: 0, height: 0 });
      setCustomWidth('');
      setCustomHeight('');
    }
  };

  const handleWidthChange = (valStr) => {
    setActivePreset(null);
    const rawVal = parseInt(valStr, 10);
    if (isNaN(rawVal) || rawVal <= 0) {
      setCustomWidth(valStr);
      return;
    }

    const maxW = nativeDimensions.width || 7680;
    const clampedW = Math.min(rawVal, maxW);
    setCustomWidth(String(clampedW));

    if (lockAspect && nativeDimensions.width > 0 && nativeDimensions.height > 0) {
      const aspect = nativeDimensions.width / nativeDimensions.height;
      const propH = Math.round(clampedW / aspect);
      const clampedH = Math.min(propH, nativeDimensions.height);
      setCustomHeight(String(clampedH));
    }
  };

  const handleHeightChange = (valStr) => {
    setActivePreset(null);
    const rawVal = parseInt(valStr, 10);
    if (isNaN(rawVal) || rawVal <= 0) {
      setCustomHeight(valStr);
      return;
    }

    const maxH = nativeDimensions.height || 4320;
    const clampedH = Math.min(rawVal, maxH);
    setCustomHeight(String(clampedH));

    if (lockAspect && nativeDimensions.width > 0 && nativeDimensions.height > 0) {
      const aspect = nativeDimensions.width / nativeDimensions.height;
      const propW = Math.round(clampedH * aspect);
      const clampedW = Math.min(propW, nativeDimensions.width);
      setCustomWidth(String(clampedW));
    }
  };

  const handleVideoPresetSelect = (presetKey, presetW, presetH) => {
    setActivePreset(presetKey);
    const maxW = nativeDimensions.width || presetW;
    const maxH = nativeDimensions.height || presetH;
    const targetW = Math.min(presetW, maxW);
    const targetH = Math.min(presetH, maxH);

    setCustomWidth(String(targetW));
    setCustomHeight(String(targetH));
  };

  const handleStartConversion = () => {
    if (selectedFile && targetFormat) {
      if (isImageFile) {
        onConvertFile(selectedFile, targetFormat, {
          quality: imageQuality / 100,
        });
      } else {
        onConvertFile(selectedFile, targetFormat, {
          width: customWidth ? parseInt(customWidth, 10) : undefined,
          height: customHeight ? parseInt(customHeight, 10) : undefined,
        });
      }
    }
  };

  const handleDownloadResult = async () => {
    if (!convertedResult?.blob || !convertedResult?.fileName) return;
    await exportFileWithPicker(convertedResult.blob, convertedResult.fileName);
  };

  const handleClearSelection = () => {
    setSelectedFile(null);
    setTargetFormat('');
    setActivePreset(null);
    setNativeDimensions({ width: 0, height: 0 });
    setCustomWidth('');
    setCustomHeight('');
    if (onReset) onReset();
  };

  const sourceExt = selectedFile ? selectedFile.name.split('.').pop()?.toLowerCase() || '' : '';
  const availableTargets = selectedFile ? getCompatibleTargetFormats(sourceExt) : [];

  const isVideoFile = selectedFile && (
    selectedFile.type.includes('video') ||
    ['mp4', 'webm', 'mkv', 'avi', 'mov'].includes(sourceExt)
  );

  const isImageFile = selectedFile && (
    selectedFile.type.includes('image') ||
    ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif', 'svg', 'heic', 'avif'].includes(sourceExt)
  );

  const acceptTypes = CATEGORY_ACCEPT_MAP[activeCategory] || '*/*';

  return (
    <div className="panel-3d w-full h-full p-3 sm:p-5 rounded-2xl flex flex-col justify-between shrink-0 select-none overflow-hidden font-normal">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#F3E8FF] text-xs font-semibold uppercase tracking-wider text-[#6D28D9] shrink-0">
        <span>CONVERT FILE</span>
      </div>

      {/* Center Content Workspace */}
      <div className="flex-1 flex flex-col justify-center my-2 sm:my-3 overflow-y-auto lg:overflow-hidden">
        {!selectedFile ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`bg-[#FAF5FF] border-2 border-dashed ${isDragging ? 'border-[#7C3AED] bg-[#F3E8FF]' : 'border-[#C084FC]/60 hover:border-[#7C3AED]'} min-h-[220px] sm:min-h-0 h-full flex flex-col items-center justify-center p-4 sm:p-8 text-center cursor-pointer rounded-2xl transition-all duration-200`}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              accept={acceptTypes}
              onChange={handleFileChange}
              className="hidden" 
            />

            <div className="w-14 h-14 rounded-2xl bg-white shadow-md shadow-purple-100 border border-[#E9D5FF] flex items-center justify-center mb-3">
              <svg className="w-7 h-7 text-[#7C3AED]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>

            <h2 className="text-base sm:text-lg font-bold text-[#2E1065] mb-1 tracking-tight">
              Select or Drop File to Convert
            </h2>
            <p className="text-xs text-[#6B5B95] mb-5 max-w-sm">
              Convert your photos, videos, documents & data 100% offline.
            </p>

            <button className="btn-3d-primary text-xs px-6 py-2.5 font-medium shadow-lg shadow-purple-200">
              CHOOSE FILE
            </button>
          </div>
        ) : (
          <div className="h-full flex flex-col justify-between space-y-3 overflow-y-auto pr-1">
            {/* Selected File Details */}
            <div className="flex items-center justify-between p-3 bg-[#FAF5FF] border border-[#E9D5FF] rounded-xl shrink-0 gap-2">
              <div className="min-w-0 flex-1 pr-1">
                <h3 className="text-xs font-semibold text-[#2E1065] truncate max-w-full">
                  {selectedFile.name}
                </h3>
                <p className="text-[10px] sm:text-[11px] text-[#6B5B95] mt-0.5 font-medium truncate">
                  {(selectedFile.size / 1024).toFixed(1)} KB • {sourceExt.toUpperCase()}
                  {nativeDimensions.width > 0 && (
                    <span className="text-[#7C3AED] ml-1.5 font-semibold">({nativeDimensions.width}x{nativeDimensions.height})</span>
                  )}
                </p>
              </div>

              <button
                onClick={handleClearSelection}
                disabled={isConverting}
                className="btn-3d-secondary text-[11px] px-3 py-1.5 shrink-0 font-medium"
              >
                CHANGE
              </button>
            </div>

            {/* Target Format Selector */}
            {!convertedResult && (
              <div className="flex-1 flex flex-col min-h-0">
                <label className="block text-[11px] font-semibold text-[#6D28D9] uppercase mb-1.5 tracking-wider shrink-0">
                  SELECT TARGET FORMAT
                </label>

                <div className="flex-1 overflow-y-auto p-3 bg-[#FAF5FF] border border-[#E9D5FF] rounded-xl flex flex-wrap gap-1.5 sm:gap-2 content-start min-h-[90px] max-h-[160px] sm:max-h-none">
                  {availableTargets.map((ext) => {
                    const info = FORMAT_OPTIONS[ext];
                    const isSelected = targetFormat === ext;
                    return (
                      <button
                        key={ext}
                        onClick={() => setTargetFormat(ext)}
                        disabled={isConverting}
                        className={isSelected ? 'btn-3d-primary font-medium text-xs px-3 py-1.5 rounded-lg' : 'btn-3d-secondary font-medium text-xs px-3 py-1.5 rounded-lg'}
                      >
                        <span className="font-semibold uppercase">{ext}</span>
                        {info && <span className="text-[10px] opacity-75 font-normal ml-1">({info.name})</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Video Resolution Presets */}
            {isVideoFile && !convertedResult && (
              <div className="p-3 bg-[#FAF5FF] border border-[#E9D5FF] rounded-xl shrink-0 space-y-2 font-normal">
                <div className="flex flex-wrap items-center justify-between text-[11px] text-[#6D28D9] font-semibold uppercase tracking-wider gap-1">
                  <span>VIDEO RESOLUTION PRESETS</span>
                  <div className="flex flex-wrap gap-1 text-[10px]">
                    {VIDEO_PRESETS.map((p) => {
                      const isSelected = activePreset === p.key;
                      return (
                        <button
                          key={p.key}
                          onClick={() => handleVideoPresetSelect(p.key, p.w, p.h)}
                          className={`px-2 py-0.5 rounded font-medium transition-colors ${
                            isSelected
                              ? 'bg-[#7C3AED] text-white'
                              : 'bg-white text-[#6D28D9] border border-[#DDD6FE] hover:bg-[#F3E8FF]'
                          }`}
                        >
                          {p.key}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-3 items-end">
                  <div>
                    <label className="block text-[10px] text-[#6B5B95] mb-1 font-medium">
                      WIDTH (MAX {nativeDimensions.width || 7680} PX)
                    </label>
                    <input
                      type="number"
                      max={nativeDimensions.width || 7680}
                      value={customWidth}
                      onChange={(e) => handleWidthChange(e.target.value)}
                      disabled={isConverting}
                      className="w-full px-2.5 py-1 bg-white border border-[#DDD6FE] text-xs font-mono text-[#2E1065] rounded-md focus:outline-none focus:border-[#7C3AED] font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#6B5B95] mb-1 font-medium">
                      HEIGHT (MAX {nativeDimensions.height || 4320} PX)
                    </label>
                    <input
                      type="number"
                      max={nativeDimensions.height || 4320}
                      value={customHeight}
                      onChange={(e) => handleHeightChange(e.target.value)}
                      disabled={isConverting}
                      className="w-full px-2.5 py-1 bg-white border border-[#DDD6FE] text-xs font-mono text-[#2E1065] rounded-md focus:outline-none focus:border-[#7C3AED] font-medium"
                    />
                  </div>
                </div>

                {/* Proportional Lock Control */}
                <div className="pt-1 flex justify-between items-center text-[#2E1065] font-medium">
                  <button
                    onClick={() => setLockAspect(!lockAspect)}
                    disabled={isConverting}
                    className="flex items-center gap-2 text-xs text-[#6B5B95] hover:text-[#6D28D9] transition-colors"
                  >
                    <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] transition-colors ${
                      lockAspect
                        ? 'bg-[#7C3AED] text-white border-[#7C3AED]'
                        : 'bg-white text-transparent border-[#DDD6FE]'
                    }`}>
                      ✓
                    </span>
                    <span>Proportional Lock</span>
                  </button>

                  <span className="text-[10px] text-[#6B5B95] font-mono">
                    MAX: {nativeDimensions.width}x{nativeDimensions.height}
                  </span>
                </div>
              </div>
            )}

            {/* Image Quality Control Slider */}
            {isImageFile && !convertedResult && (
              <div className="p-3 bg-[#FAF5FF] border border-[#E9D5FF] rounded-xl shrink-0 space-y-2.5 sm:space-y-3 font-normal">
                <div className="flex items-center justify-between text-[11px] text-[#6D28D9] font-semibold uppercase tracking-wider">
                  <span>IMAGE QUALITY</span>
                  <span className="text-xs font-mono font-bold text-[#7C3AED] bg-white px-2.5 py-0.5 rounded-md border border-[#DDD6FE] shadow-sm">
                    {imageQuality}%
                  </span>
                </div>

                <div className="space-y-2">
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={imageQuality}
                    onChange={(e) => setImageQuality(Number(e.target.value))}
                    disabled={isConverting}
                    className="w-full h-2 bg-[#E9D5FF] rounded-lg appearance-none cursor-pointer accent-[#7C3AED]"
                  />
                  <div className="flex justify-between text-[10px] text-[#6B5B95] font-medium">
                    <button
                      onClick={() => setImageQuality(50)}
                      disabled={isConverting}
                      className="hover:text-[#7C3AED] transition-colors"
                    >
                      50%
                    </button>
                    <button
                      onClick={() => setImageQuality(75)}
                      disabled={isConverting}
                      className="hover:text-[#7C3AED] transition-colors"
                    >
                      75%
                    </button>
                    <button
                      onClick={() => setImageQuality(90)}
                      disabled={isConverting}
                      className="hover:text-[#7C3AED] transition-colors font-bold text-[#7C3AED]"
                    >
                      90% (Recommended)
                    </button>
                    <button
                      onClick={() => setImageQuality(100)}
                      disabled={isConverting}
                      className="hover:text-[#7C3AED] transition-colors"
                    >
                      100%
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Converting Progress State */}
            {isConverting && (
              <div className="p-6 bg-[#FAF5FF] border border-[#E9D5FF] rounded-xl flex flex-col items-center justify-center space-y-3 my-auto font-normal">
                <div className="text-xs font-bold text-[#7C3AED] uppercase tracking-wider">
                  CONVERTING FILE... {conversionProgress}%
                </div>
                <div className="w-full h-2.5 bg-[#E9D5FF] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#7C3AED] to-[#9333EA] transition-all duration-150 rounded-full"
                    style={{ width: `${conversionProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Completed Result Actions */}
            {convertedResult && !isConverting && (
              <div className="p-6 bg-[#FAF5FF] border border-[#E9D5FF] rounded-xl flex flex-col items-center justify-center space-y-3 sm:space-y-4 my-auto font-normal">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-lg">
                  ✓
                </div>
                <div className="text-xs font-bold text-[#2E1065] uppercase tracking-wider">
                  CONVERSION COMPLETED
                </div>
                <p className="text-xs text-[#6D28D9] font-mono text-center truncate max-w-full bg-white px-3 py-1 rounded-md border border-[#DDD6FE]">
                  {convertedResult.fileName}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-1">
                  <button
                    onClick={() => onPreviewResult(convertedResult)}
                    className="btn-3d-secondary text-xs px-4 py-2 font-medium"
                  >
                    PREVIEW
                  </button>
                  <button
                    onClick={handleDownloadResult}
                    className="btn-3d-primary font-medium text-xs px-6 py-2 shadow-md shadow-purple-200"
                  >
                    SAVE FILE
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Action Trigger */}
      <div className="pt-3 border-t border-[#F3E8FF] shrink-0 font-normal flex justify-start">
        {!convertedResult ? (
          <button
            onClick={handleStartConversion}
            disabled={!selectedFile || isConverting}
            className={`btn-3d-primary font-semibold text-xs px-6 py-2.5 tracking-wider w-full sm:w-auto ${
              !selectedFile || isConverting ? 'opacity-40 cursor-not-allowed shadow-none' : ''
            }`}
          >
            {isConverting ? `CONVERTING (${conversionProgress}%)` : (targetFormat ? `CONVERT TO ${targetFormat.toUpperCase()}` : 'SELECT A FILE')}
          </button>
        ) : (
          <button
            onClick={handleClearSelection}
            className="btn-3d-secondary font-medium text-xs px-5 py-2 tracking-wider w-full sm:w-auto"
          >
            CONVERT ANOTHER FILE
          </button>
        )}
      </div>
    </div>
  );
};
