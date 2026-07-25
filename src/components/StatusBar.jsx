import React from 'react';

export const StatusBar = ({ activeCategory }) => {
  return (
    <footer className="h-7 bg-gradient-to-b from-[#242424] to-[#121212] text-[#ffffff] px-4 flex items-center justify-between text-xs font-normal select-none shrink-0 border-t border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
      <div className="flex items-center gap-4 font-normal">
        <span>{activeCategory.toUpperCase()}</span>
      </div>

      <div className="flex items-center gap-4 text-[#dddddd] font-normal">
        <span>READY</span>
      </div>
    </footer>
  );
};
