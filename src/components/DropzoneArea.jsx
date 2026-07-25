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
    <div className="panel-3d w-full h-full p-5 rounded-xl flex flex-col justify-between shrink-0 select-none overflow-hidden font-normal">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-white/10 text-xs font-normal uppercase tracking-wider text-white shrink-0">
        <span>CONVERT FILE</span>
      </div>

      {/* Center Content Workspace */}
      <div className="flex-1 flex flex-col justify-center my-3 overflow-hidden">
        {!selectedFile ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`input-3d-recessed h-full flex flex-col items-center justify-center p-6 text-center cursor-pointer rounded-xl ${
              isDragging ? 'border-white/40' : ''
            }`}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              accept={acceptTypes}
              onChange={handleFileChange}
              className="hidden" 
            />

            <h2 className="text-lg font-normal text-white mb-2 tracking-tight">
              Select or Drop File to Convert
            </h2>
            <p className="text-xs text-[#dddddd] mb-5 max-w-sm">
              Choose any file to convert offline.
            </p>

            <button className="btn-3d-primary text-xs px-5 py-2 font-normal">
              CHOOSE FILE
            </button>
          </div>
        ) : (
          <div className="h-full flex flex-col justify-between space-y-3 overflow-y-auto pr-1">
            {/* Selected File Details */}
            <div className="flex items-center justify-between p-3 input-3d-recessed rounded-xl shrink-0">
              <div className="min-w-0 pr-3">
                <h3 className="text-xs font-normal text-white truncate max-w-xl">
                  {selectedFile.name}
                </h3>
                <p className="text-[11px] text-[#dddddd] mt-0.5 font-normal">
                  {(selectedFile.size / 1024).toFixed(1)} KB • {sourceExt.toUpperCase()}
                  {nativeDimensions.width > 0 && (
                    <span className="text-white ml-2">({nativeDimensions.width}x{nativeDimensions.height} Native)</span>
                  )}
                </p>
              </div>

              <button
                onClick={handleClearSelection}
                disabled={isConverting}
                className="btn-3d-secondary text-[11px] px-3 py-1.5 shrink-0 font-normal"
              >
                CHANGE
              </button>
            </div>

            {/* Target Format Selector */}
            {!convertedResult && (
              <div className="flex-1 flex flex-col min-h-0">
                <label className="block text-[11px] font-normal text-[#dddddd] uppercase mb-1.5 tracking-wider shrink-0">
                  SELECT TARGET FORMAT
                </label>

                <div className="flex-1 overflow-y-auto p-3 input-3d-recessed rounded-xl flex flex-wrap gap-2 content-start min-h-[90px]">
                  {availableTargets.map((ext) => {
                    const info = FORMAT_OPTIONS[ext];
                    const isSelected = targetFormat === ext;
                    return (
                      <button
                        key={ext}
                        onClick={() => setTargetFormat(ext)}
                        disabled={isConverting}
                        className={isSelected ? 'btn-3d-primary font-normal text-xs px-3 py-1.5 rounded-lg' : 'btn-3d-secondary font-normal text-xs px-3 py-1.5 rounded-lg'}
                      >
                        <span className="font-normal uppercase">{ext}</span>
                        {info && <span className="text-[10px] opacity-80 font-normal ml-1">({info.name})</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Video Resolution Presets (For Video Files Only) */}
            {isVideoFile && !convertedResult && (
              <div className="p-3 input-3d-recessed rounded-xl shrink-0 space-y-2 font-normal">
                <div className="flex items-center justify-between text-[11px] text-[#dddddd] uppercase tracking-wider">
                  <span>VIDEO RESOLUTION PRESETS</span>
                  <div className="flex gap-1 text-[10px]">
                    {VIDEO_PRESETS.map((p) => {
                      const isSelected = activePreset === p.key;
                      return (
                        <button
                          key={p.key}
                          onClick={() => handleVideoPresetSelect(p.key, p.w, p.h)}
                          className={`px-1.5 py-0.5 rounded font-normal transition-colors ${
                            isSelected
                              ? 'bg-white text-black font-normal'
                              : 'bg-[#1a1a1a] text-[#dddddd] hover:text-white'
                          }`}
                        >
                          {p.key}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 items-end">
                  <div>
                    <label className="block text-[10px] text-[#dddddd] mb-1 font-normal">
                      WIDTH (MAX {nativeDimensions.width || 7680} PX)
                    </label>
                    <input
                      type="number"
                      max={nativeDimensions.width || 7680}
                      value={customWidth}
                      onChange={(e) => handleWidthChange(e.target.value)}
                      disabled={isConverting}
                      className="w-full px-2.5 py-1 bg-[#141414] border border-white/20 text-xs font-mono text-white rounded focus:outline-none focus:border-white font-normal"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#dddddd] mb-1 font-normal">
                      HEIGHT (MAX {nativeDimensions.height || 4320} PX)
                    </label>
                    <input
                      type="number"
                      max={nativeDimensions.height || 4320}
                      value={customHeight}
                      onChange={(e) => handleHeightChange(e.target.value)}
                      disabled={isConverting}
                      className="w-full px-2.5 py-1 bg-[#141414] border border-white/20 text-xs font-mono text-white rounded focus:outline-none focus:border-white font-normal"
                    />
                  </div>
                </div>

                {/* Proportional Lock Control */}
                <div className="pt-1 flex justify-between items-center text-white font-normal">
                  <button
                    onClick={() => setLockAspect(!lockAspect)}
                    disabled={isConverting}
                    className="flex items-center gap-2 text-xs text-[#dddddd] hover:text-white font-normal transition-colors"
                  >
                    <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] transition-colors ${
                      lockAspect
                        ? 'bg-white text-black border-white'
                        : 'bg-[#141414] text-transparent border-white/30'
                    }`}>
                      ✓
                    </span>
                    <span>Proportional Lock</span>
                  </button>

                  <span className="text-[10px] text-[#dddddd] font-normal">
                    MAX: {nativeDimensions.width}x{nativeDimensions.height}
                  </span>
                </div>
              </div>
            )}

            {/* Image Quality Control Slider (For Image Files Only) */}
            {isImageFile && !convertedResult && (
              <div className="p-3 input-3d-recessed rounded-xl shrink-0 space-y-3 font-normal">
                <div className="flex items-center justify-between text-[11px] text-[#dddddd] uppercase tracking-wider">
                  <span>IMAGE QUALITY</span>
                  <span className="text-xs font-mono font-bold text-white bg-[#1a1a1a] px-2.5 py-0.5 rounded border border-white/20">
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
                    className="w-full h-1.5 bg-[#141414] rounded-lg appearance-none cursor-pointer accent-white border border-white/20"
                  />
                  <div className="flex justify-between text-[10px] text-[#dddddd]">
                    <button
                      onClick={() => setImageQuality(50)}
                      disabled={isConverting}
                      className="hover:text-white transition-colors"
                    >
                      50%
                    </button>
                    <button
                      onClick={() => setImageQuality(75)}
                      disabled={isConverting}
                      className="hover:text-white transition-colors"
                    >
                      75%
                    </button>
                    <button
                      onClick={() => setImageQuality(90)}
                      disabled={isConverting}
                      className="hover:text-white transition-colors font-semibold text-white"
                    >
                      90% (Recommended)
                    </button>
                    <button
                      onClick={() => setImageQuality(100)}
                      disabled={isConverting}
                      className="hover:text-white transition-colors"
                    >
                      100% (Max)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Converting Progress State */}
            {isConverting && (
              <div className="p-6 input-3d-recessed rounded-xl flex flex-col items-center justify-center space-y-3 my-auto font-normal">
                <div className="text-xs font-normal text-white uppercase tracking-wider">
                  CONVERTING FILE... {conversionProgress}%
                </div>
                <div className="w-full h-2 bg-[#1a1a1a] rounded-full overflow-hidden border border-white/20">
                  <div 
                    className="h-full bg-white transition-all duration-150"
                    style={{ width: `${conversionProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Completed Result Actions */}
            {convertedResult && !isConverting && (
              <div className="p-6 input-3d-recessed rounded-xl flex flex-col items-center justify-center space-y-4 my-auto font-normal">
                <div className="text-xs font-normal text-white uppercase tracking-wider">
                  CONVERSION COMPLETED
                </div>
                <p className="text-xs text-white font-mono text-center">
                  {convertedResult.fileName}
                </p>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => onPreviewResult(convertedResult)}
                    className="btn-3d-secondary text-xs px-4 py-2 font-normal"
                  >
                    PREVIEW
                  </button>
                  <button
                    onClick={handleDownloadResult}
                    className="btn-3d-primary font-normal text-xs px-6 py-2"
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
      <div className="pt-2.5 border-t border-white/10 shrink-0 font-normal flex justify-start">
        {!convertedResult ? (
          <button
            onClick={handleStartConversion}
            disabled={!selectedFile || isConverting}
            className={`btn-3d-primary font-normal text-xs px-5 py-2 tracking-wider ${
              !selectedFile || isConverting ? 'opacity-40 cursor-not-allowed' : ''
            }`}
          >
            {isConverting ? `CONVERTING (${conversionProgress}%)` : (targetFormat ? `CONVERT TO ${targetFormat.toUpperCase()}` : 'SELECT A FILE')}
          </button>
        ) : (
          <button
            onClick={handleClearSelection}
            className="btn-3d-secondary font-normal text-xs px-5 py-2 tracking-wider"
          >
            CONVERT ANOTHER FILE
          </button>
        )}
      </div>
    </div>
  );
};
