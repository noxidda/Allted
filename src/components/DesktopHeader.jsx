import React, { useState } from 'react';
import { Minus, Square, Copy, X } from 'lucide-react';

export const DesktopHeader = () => {
  const [isMaximized, setIsMaximized] = useState(true);

  return (
    <header className="bg-gradient-to-b from-[#262626] to-[#141414] text-[#ffffff] border-b border-[#000000] shadow-[0_2px_6px_rgba(0,0,0,0.7)] select-none font-normal">
      {/* 3D Top Highlight Rim */}
      <div className="h-[1px] bg-white/20 w-full" />

      {/* Main Titlebar Row */}
      <div className="h-8 px-3 flex items-center justify-between text-xs font-normal">
        {/* Left App Brand Title */}
        <div className="flex items-center gap-2">
          <span className="font-normal text-white tracking-wide text-xs">
            ALLTED
          </span>
        </div>

        {/* Right Window Native Controls */}
        <div className="flex items-center">
          <button 
            className="h-7 w-7 flex items-center justify-center text-[#dddddd] hover:bg-[#333333] hover:text-white transition-colors border-l border-white/5"
            title="Minimize"
          >
            <Minus className="w-3 h-3 stroke-[1.5]" />
          </button>

          <button 
            onClick={() => setIsMaximized(!isMaximized)}
            className="h-7 w-7 flex items-center justify-center text-[#dddddd] hover:bg-[#333333] hover:text-white transition-colors"
            title={isMaximized ? "Restore Down" : "Maximize"}
          >
            {isMaximized ? (
              <Copy className="w-2.5 h-2.5 stroke-[1.5]" />
            ) : (
              <Square className="w-2.5 h-2.5 stroke-[1.5]" />
            )}
          </button>

          <button 
            className="h-7 w-7 flex items-center justify-center text-[#dddddd] hover:bg-[#e81123] hover:text-white transition-colors"
            title="Close"
          >
            <X className="w-3.5 h-3.5 stroke-[1.5]" />
          </button>
        </div>
      </div>
    </header>
  );
};
