'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { Bell, Search, Menu, Building2, Check, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { roleLabel, timeAgo, cn } from '@/lib/utils';

export interface TopNavbarProps {
  isSimulation?: boolean;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ isSimulation = false }) => {
  const { currentUser, notifications, unreadCount, markAllRead, toggleSidebar } =
    useAppStore();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className={cn(
      "sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 transition-all",
      isSimulation ? "h-14 px-3" : "h-16"
    )}>
      <div className="flex items-center gap-2 sm:gap-3">
        {!isSimulation && (
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden transition-colors"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-sm shadow-indigo-300 group-hover:scale-105 transition-transform">
            V
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-slate-900 tracking-tight text-base font-display">
                VBridge<span className="text-indigo-600">Connect</span>
              </span>
              <span className={cn(
                "text-[10px] font-semibold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200",
                isSimulation && "hidden"
              )}>
                Institutional
              </span>
            </div>
            <div className={cn("text-[10px] text-slate-400 -mt-0.5 hidden sm:block", isSimulation && "hidden sm:hidden")}>
              Academic & Industry Collaboration
            </div>
          </div>
        </Link>
      </div>

      {!isSimulation && (
        <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search activities, teams, deliverables..."
              className="w-full pl-9 pr-12 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 placeholder:text-slate-400"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] bg-white border border-slate-200 text-slate-400 px-1.5 py-0.5 rounded font-mono shadow-2xs">
              ⌘K
            </kbd>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 sm:gap-3">
        {!isSimulation && (
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium text-slate-700">{currentUser.department}</span>
          </div>
        )}

        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between px-2 pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900 font-display">
                    Notifications
                  </h4>
                  {unreadCount > 0 && (
                    <span className="text-[11px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded-full font-semibold border border-rose-200">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              <div className="mt-2 divide-y divide-slate-50 max-h-80 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-2.5 rounded-xl transition-colors ${
                      n.isRead ? 'opacity-70' : 'bg-indigo-50/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-900">{n.title}</p>
                      <span className="text-[10px] text-slate-400 flex-shrink-0">
                        {timeAgo(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                      {n.body}
                    </p>
                    {n.linkTo && (
                      <Link
                        href={n.linkTo}
                        onClick={() => setShowNotifications(false)}
                        className="inline-flex items-center gap-1 text-[11px] text-indigo-600 font-semibold mt-1.5 hover:underline"
                      >
                        <span>View details</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5 pl-2 sm:border-l border-slate-200">
          <img
            src={currentUser.avatarUrl}
            alt={currentUser.name}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-slate-200 bg-slate-100 object-cover"
          />
          {!isSimulation && (
            <div className="hidden lg:block text-left">
              <p className="text-xs font-bold text-slate-900 leading-tight">
                {currentUser.name}
              </p>
              <p className="text-[10px] text-indigo-600 font-medium">
                {roleLabel(currentUser.role)}
              </p>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
