import React, { useState } from 'react';
import { SectionSidebar } from './components/SectionSidebar';
import { DropzoneArea } from './components/DropzoneArea';
import { HistoryPanel } from './components/HistoryPanel';
import { PreviewModal } from './components/PreviewModal';
import { FORMAT_OPTIONS } from './constants/matrix';
import { processConversion } from './services/conversionEngine';

export const App = () => {
  const [history, setHistory] = useState([]);
  const [activeCategory, setActiveCategory] = useState('word');
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [convertedResult, setConvertedResult] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);

  const handleConvertFile = async (file, targetExt, options = {}) => {
    if (!file || isConverting) return;

    setIsConverting(true);
    setConversionProgress(10);
    setConvertedResult(null);

    const fromExt = file.name.split('.').pop()?.toLowerCase() || '';
    const category = FORMAT_OPTIONS[targetExt]?.category || 'word';

    try {
      const result = await processConversion(
        file,
        targetExt,
        category,
        (progress) => {
          setConversionProgress(progress);
        },
        options
      );

      const completedItem = {
        id: Math.random().toString(36).substring(2, 9),
        file,
        name: file.name,
        size: file.size,
        fromExt,
        toExt: targetExt,
        category,
        convertedBlob: result.blob,
        convertedFileName: result.fileName,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setConvertedResult(result);
      setIsConverting(false);

      // Log into conversion history
      setHistory((prev) => [completedItem, ...prev]);
    } catch (err) {
      setIsConverting(false);
      alert(`Conversion Error: ${err.message || 'Failed to convert file'}`);
    }
  };

  const handleResetConverter = () => {
    setConvertedResult(null);
    setIsConverting(false);
    setConversionProgress(0);
  };

  return (
    <div className="min-h-screen w-screen flex flex-col bg-[#000000] text-[#ffffff] font-sans overflow-x-hidden lg:overflow-hidden select-none">
      {/* Main Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
        {/* Left Section Sidebar */}
        <SectionSidebar
          activeCategory={activeCategory}
          onSelectCategory={(cat) => setActiveCategory(cat)}
        />

        {/* Central & Right Split Workspace Pane */}
        <main className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden p-2 sm:p-4 gap-3 sm:gap-4 bg-[#0d0d0d]">
          {/* Left 75% Space Single File Converter Workspace */}
          <div className="w-full lg:w-[75%] h-auto lg:h-full shrink-0 overflow-visible lg:overflow-hidden">
            <DropzoneArea
              onConvertFile={handleConvertFile}
              activeCategory={activeCategory}
              isConverting={isConverting}
              conversionProgress={conversionProgress}
              convertedResult={convertedResult}
              onPreviewResult={(result) => setPreviewItem({
                convertedBlob: result.blob,
                convertedFileName: result.fileName,
                toExt: result.fileName.split('.').pop() || '',
              })}
              onReset={handleResetConverter}
            />
          </div>

          {/* Right 25% Space Conversion History Panel */}
          <div className="w-full lg:w-[25%] flex-1 flex flex-col h-auto lg:h-full overflow-hidden min-w-0">
            <HistoryPanel
              history={history}
            />
          </div>
        </main>
      </div>

      {/* Preview Modal */}
      <PreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />
    </div>
  );
};

export default App;
