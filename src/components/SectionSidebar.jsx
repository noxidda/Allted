import React from 'react';
import { CATEGORIES } from '../constants/matrix';
import logoImg from '../assets/logo/logo.png';

export const SectionSidebar = ({ activeCategory, onSelectCategory, darkMode, onToggleDarkMode }) => {
  return (
    <aside className="w-full lg:w-56 bg-white dark:bg-[#181326] border-b lg:border-b-0 lg:border-r border-[#E9D5FF] dark:border-[#2E2245] shadow-[0_4px_20px_rgba(124,58,237,0.05)] flex flex-col shrink-0 select-none font-normal transition-colors duration-200">
      {/* App Branding & Logo Header + Theme Toggle */}
      <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-[#F3E8FF] dark:border-[#2E2245] bg-gradient-to-r from-[#FAF5FF] to-white dark:from-[#1E1733] dark:to-[#181326]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#7C3AED] to-[#A855F7] p-0.5 shadow-sm shadow-purple-200 dark:shadow-none">
            <img src={logoImg} alt="Allted App Icon" className="w-full h-full object-contain rounded-md bg-white p-0.5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-[#2E1065] dark:text-[#F3E8FF] tracking-wider text-sm">ALLTED</span>
            <span className="text-[10px] text-[#7C3AED] dark:text-[#C084FC] font-medium tracking-wide">FILE SUITE</span>
          </div>
        </div>

        {/* Dark Mode Toggle Button */}
        <button
          onClick={onToggleDarkMode}
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="p-1.5 rounded-lg bg-[#F3E8FF] dark:bg-[#2A1F45] text-[#7C3AED] dark:text-[#C084FC] border border-[#DDD6FE] dark:border-[#3B2A57] hover:scale-105 active:scale-95 transition-all shadow-sm flex items-center justify-center cursor-pointer"
        >
          {darkMode ? (
            <svg className="w-4 h-4 text-amber-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 100 2h1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-[#7C3AED]" fill="currentColor" viewBox="0 0 20 20">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          )}
        </button>
      </div>

      {/* Category List - Horizontal scroll on mobile, vertical stack on desktop */}
      <div className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-y-auto p-2 sm:p-3 gap-1.5 lg:gap-1.5">
        <button
          onClick={() => onSelectCategory('all')}
          className={`shrink-0 text-left px-3.5 py-2.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
            activeCategory === 'all'
              ? 'btn-3d-primary'
              : 'text-[#5B21B6] dark:text-[#DDD6FE] hover:bg-[#F3E8FF] dark:hover:bg-[#2A1F45] hover:text-[#6D28D9] dark:hover:text-[#F3E8FF] bg-[#FAF5FF] dark:bg-[#1E1733] lg:bg-transparent border border-[#E9D5FF] dark:border-[#2E2245] lg:border-none'
          }`}
        >
          All Formats
        </button>

        <div className="hidden lg:block my-1 border-t border-[#F3E8FF] dark:border-[#2E2245]" />

        {CATEGORIES.map((cat) => {
          const isSelected = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`shrink-0 text-left px-3.5 py-2.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
                isSelected
                  ? 'btn-3d-primary'
                  : 'text-[#5B21B6] dark:text-[#DDD6FE] hover:bg-[#F3E8FF] dark:hover:bg-[#2A1F45] hover:text-[#6D28D9] dark:hover:text-[#F3E8FF] bg-[#FAF5FF] dark:bg-[#1E1733] lg:bg-transparent border border-[#E9D5FF] dark:border-[#2E2245] lg:border-none'
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
