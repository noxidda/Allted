import React from 'react';
import { CATEGORIES } from '../constants/matrix';
import logoImg from '../assets/logo/logo.png';

export const SectionSidebar = ({ activeCategory, onSelectCategory }) => {
  return (
    <aside className="w-full lg:w-56 bg-white border-b lg:border-b-0 lg:border-r border-[#E9D5FF] shadow-[0_4px_20px_rgba(124,58,237,0.05)] flex flex-col shrink-0 select-none font-normal">
      {/* App Branding & Logo Header */}
      <div className="flex items-center gap-3 p-4 border-b border-[#F3E8FF] bg-gradient-to-r from-[#FAF5FF] to-white">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#7C3AED] to-[#A855F7] p-0.5 shadow-sm shadow-purple-200">
          <img src={logoImg} alt="Allted App Icon" className="w-full h-full object-contain rounded-md bg-white p-0.5" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-[#2E1065] tracking-wider text-sm">ALLTED</span>
          <span className="text-[10px] text-[#7C3AED] font-medium tracking-wide">FILE SUITE</span>
        </div>
      </div>

      {/* Category List - Horizontal scroll on mobile, vertical stack on desktop */}
      <div className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-y-auto p-2 sm:p-3 gap-1.5 lg:gap-1.5">
        <button
          onClick={() => onSelectCategory('all')}
          className={`shrink-0 text-left px-3.5 py-2.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
            activeCategory === 'all'
              ? 'btn-3d-primary'
              : 'text-[#5B21B6] hover:bg-[#F3E8FF] hover:text-[#6D28D9] bg-[#FAF5FF] lg:bg-transparent border border-[#E9D5FF] lg:border-none'
          }`}
        >
          All Formats
        </button>

        <div className="hidden lg:block my-1 border-t border-[#F3E8FF]" />

        {CATEGORIES.map((cat) => {
          const isSelected = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`shrink-0 text-left px-3.5 py-2.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
                isSelected
                  ? 'btn-3d-primary'
                  : 'text-[#5B21B6] hover:bg-[#F3E8FF] hover:text-[#6D28D9] bg-[#FAF5FF] lg:bg-transparent border border-[#E9D5FF] lg:border-none'
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
