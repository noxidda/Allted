import React from 'react';
import { CATEGORIES } from '../constants/matrix';

export const SectionSidebar = ({ activeCategory, onSelectCategory }) => {
  return (
    <aside className="w-full lg:w-52 bg-gradient-to-b from-[#1c1c1c] to-[#121212] border-b lg:border-b-0 lg:border-r border-[#0a0a0a] shadow-[0_4px_12px_rgba(0,0,0,0.5)] lg:shadow-[4px_0_12px_rgba(0,0,0,0.5)] flex flex-col shrink-0 select-none font-normal">
      {/* Sidebar Header - Desktop */}
      <div className="hidden lg:block p-3 border-b border-white/10 text-xs font-normal text-[#dddddd] uppercase tracking-wider shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
        SECTIONS
      </div>

      {/* Category List - Horizontal scroll on mobile, vertical stack on desktop */}
      <div className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-y-auto p-1.5 sm:p-2 gap-1.5 lg:gap-1">
        <button
          onClick={() => onSelectCategory('all')}
          className={`shrink-0 text-left px-3 py-1.5 lg:px-3.5 lg:py-2.5 text-xs font-normal rounded transition-colors whitespace-nowrap ${
            activeCategory === 'all'
              ? 'btn-3d-primary'
              : 'text-[#dddddd] hover:bg-[#282828] hover:text-white bg-[#181818] lg:bg-transparent border border-white/10 lg:border-none'
          }`}
        >
          All Formats
        </button>

        <div className="hidden lg:block my-1.5 border-t border-white/10" />

        {CATEGORIES.map((cat) => {
          const isSelected = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`shrink-0 text-left px-3 py-1.5 lg:px-3.5 lg:py-2.5 text-xs font-normal rounded transition-colors whitespace-nowrap ${
                isSelected
                  ? 'btn-3d-primary'
                  : 'text-[#dddddd] hover:bg-[#282828] hover:text-white bg-[#181818] lg:bg-transparent border border-white/10 lg:border-none'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    </aside>
  );
};
