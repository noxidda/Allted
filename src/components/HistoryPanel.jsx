import React from 'react';

export const HistoryPanel = ({ history }) => {
  return (
    <div className="panel-3d w-full h-full p-3 sm:p-4 rounded-2xl flex flex-col justify-between select-none font-normal min-h-[140px] lg:min-h-0">
      {/* Header */}
      <div className="pb-3 border-b border-[#F3E8FF] dark:border-[#2E2245] text-xs font-semibold uppercase tracking-wider text-[#6D28D9] dark:text-[#C084FC] shrink-0 flex items-center justify-between">
        <span>CONVERSION HISTORY</span>
        <span className="bg-[#F3E8FF] dark:bg-[#2A1F45] text-[#7C3AED] dark:text-[#C084FC] text-[10px] px-2 py-0.5 rounded-full font-bold">
          {history.length}
        </span>
      </div>

      {/* History Items Log */}
      <div className="flex-1 overflow-y-auto my-2 space-y-2 pr-1 font-normal max-h-[180px] lg:max-h-none">
        {history.length === 0 ? (
          <div className="h-full min-h-[80px] flex items-center justify-center text-center p-4 text-xs text-[#6B5B95] dark:text-[#A799CC] font-medium">
            No conversion history yet
          </div>
        ) : (
          history.map((item) => (
            <div
              key={item.id}
              className="p-3 bg-[#FAF5FF] dark:bg-[#110D1D] border border-[#E9D5FF] dark:border-[#2E2245] rounded-xl flex items-center justify-between gap-2 hover:border-[#C084FC] dark:hover:border-[#7C3AED] transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="text-xs text-[#2E1065] dark:text-[#F3E8FF] truncate font-semibold">
                  {item.name}
                </div>
                <div className="text-[10px] text-[#7C3AED] dark:text-[#C084FC] font-mono uppercase mt-0.5 font-bold">
                  {item.fromExt} → {item.toExt}
                </div>
              </div>
              <span className="text-[9px] text-[#6B5B95] dark:text-[#A799CC] font-medium bg-white dark:bg-[#181326] px-2 py-0.5 rounded border border-[#E9D5FF] dark:border-[#2E2245]">
                {item.timestamp}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
