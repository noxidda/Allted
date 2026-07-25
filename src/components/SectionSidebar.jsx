import React from 'react';
import { CATEGORIES } from '../constants/matrix';

export const SectionSidebar = ({ activeCategory, onSelectCategory }) => {
  return (
    <aside className="w-52 bg-gradient-to-b from-[#1c1c1c] to-[#121212] border-r border-[#0a0a0a] shadow-[4px_0_12px_rgba(0,0,0,0.5)] flex flex-col shrink-0 select-none font-normal">
      {/* Sidebar Header */}
      <div className="p-3 border-b border-white/10 text-xs font-normal text-[#dddddd] uppercase tracking-wider shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
        SECTIONS
      </div>

      {/* Category List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <button
          onClick={() => onSelectCategory('all')}
          className={`w-full text-left px-3.5 py-2.5 text-xs font-normal rounded transition-colors ${
            activeCategory === 'all'
              ? 'btn-3d-primary'
              : 'text-[#dddddd] hover:bg-[#282828] hover:text-white'
          }`}
        >
          All Formats
        </button>

        <div className="my-1.5 border-t border-white/10" />

        {CATEGORIES.map((cat) => {
          const isSelected = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`w-full text-left px-3.5 py-2.5 text-xs font-normal rounded transition-colors ${
                isSelected
                  ? 'btn-3d-primary'
                  : 'text-[#dddddd] hover:bg-[#282828] hover:text-white'
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
