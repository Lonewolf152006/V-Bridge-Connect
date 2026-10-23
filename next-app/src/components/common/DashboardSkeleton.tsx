import React from 'react';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-pulse select-none">
      {/* ─── Hero / Greeting Bar Skeleton ─── */}
      <div className="bg-slate-800/80 rounded-3xl p-6 sm:p-8 border border-slate-700/50 shadow-xl space-y-4">
        <div className="w-48 h-6 bg-slate-700/60 rounded-full" />
        <div className="w-72 h-8 bg-slate-700/80 rounded-xl" />
        <div className="w-full max-w-xl h-4 bg-slate-700/50 rounded" />
      </div>

      {/* ─── Mentee Roll No Action Banner Skeleton ─── */}
      <div className="h-20 bg-slate-100 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/40 p-5 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700" />
          <div className="space-y-2">
            <div className="w-32 h-3.5 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="w-64 h-4 bg-slate-200 dark:bg-slate-700 rounded font-semibold" />
          </div>
        </div>
        <div className="w-28 h-8 rounded-lg bg-slate-200 dark:bg-slate-700" />
      </div>

      {/* ─── 4 KPI Metrics Skeleton ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/50 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-24 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700/60" />
            </div>
            <div className="w-16 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg" />
            <div className="w-32 h-3 bg-slate-100 dark:bg-slate-700/40 rounded" />
          </div>
        ))}
      </div>

      {/* ─── 2-Column Main Content Skeleton ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Project & Milestone Progress */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/50 space-y-4">
            <div className="flex justify-between items-center">
              <div className="w-48 h-6 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="w-20 h-6 bg-slate-200 dark:bg-slate-700 rounded-full" />
            </div>
            <div className="w-full h-16 bg-slate-100 dark:bg-slate-700/40 rounded-xl" />
            <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full" />
            <div className="flex items-center gap-2 pt-2">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700" />
            </div>
          </div>
        </div>

        {/* Right 1 Col: Urgent Milestone Action */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/50 space-y-4">
            <div className="w-36 h-5 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="w-full h-24 bg-slate-100 dark:bg-slate-700/40 rounded-xl" />
            <div className="w-full h-10 bg-slate-200 dark:bg-slate-700 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
};
