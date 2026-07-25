import React from 'react';

export const HistoryPanel = ({ history }) => {
  return (
    <div className="panel-3d w-full h-full p-4 rounded-xl flex flex-col justify-between select-none font-normal">
      {/* Header */}
      <div className="pb-2.5 border-b border-white/10 text-xs font-normal uppercase tracking-wider text-[#dddddd] shrink-0">
        HISTORY
      </div>

      {/* History Items Log - Only File Name and Conversion Pair */}
      <div className="flex-1 overflow-y-auto my-2 space-y-2 pr-1 font-normal">
        {history.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center p-4 text-xs text-[#dddddd]">
            No history yet
          </div>
        ) : (
          history.map((item) => (
            <div
              key={item.id}
              className="p-2.5 bg-[#0a0a0a] border border-[#222222] rounded-lg flex items-center justify-between gap-2"
            >
              <div className="min-w-0 flex-1">
                <div className="text-xs text-white truncate font-normal">
                  {item.name}
                </div>
                <div className="text-[10px] text-[#dddddd] uppercase mt-0.5 font-normal">
                  {item.fromExt} &gt; {item.toExt}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
