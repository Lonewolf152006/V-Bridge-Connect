import React from 'react';

export const WorkspaceSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-pulse select-none">
      {/* ─── Workspace Header Banner Skeleton ─── */}
      <div className="bg-slate-800/80 rounded-3xl p-6 sm:p-8 border border-slate-700/50 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-24 h-4 bg-slate-700/60 rounded" />
          <div className="w-4 h-4 bg-slate-700/40 rounded" />
          <div className="w-36 h-4 bg-slate-700/60 rounded" />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="w-64 sm:w-96 h-8 bg-slate-700/80 rounded-xl" />
            <div className="w-48 h-4 bg-slate-700/50 rounded" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-24 h-8 bg-slate-700/60 rounded-full" />
            <div className="w-28 h-8 bg-slate-700/60 rounded-xl" />
          </div>
        </div>
      </div>

      {/* ─── 9 Tabs Bar Skeleton ─── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
          <div key={i} className="w-24 h-9 bg-slate-200 dark:bg-slate-800 rounded-lg shrink-0" />
        ))}
      </div>

      {/* ─── Main Tab Content Grid Skeleton ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Sprint Milestones & Tasks */}
        <div className="lg:col-span-2 space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/50 space-y-3"
            >
              <div className="flex justify-between items-center">
                <div className="w-40 h-5 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="w-20 h-5 bg-slate-200 dark:bg-slate-700 rounded-full" />
              </div>
              <div className="w-full h-12 bg-slate-100 dark:bg-slate-700/40 rounded-xl" />
              <div className="flex justify-between items-center pt-2">
                <div className="w-28 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="w-20 h-7 bg-slate-200 dark:bg-slate-700 rounded-lg" />
              </div>
            </div>
          ))}
        </div>

        {/* Right 1 Col: Team Roster & Mentor Sync */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/50 space-y-4">
            <div className="w-32 h-5 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700" />
                  <div className="space-y-1">
                    <div className="w-28 h-3.5 bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="w-20 h-2.5 bg-slate-100 dark:bg-slate-700/50 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
