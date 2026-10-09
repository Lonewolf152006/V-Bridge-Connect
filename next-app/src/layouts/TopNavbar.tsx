'use client';

import React, { useState } from 'react';
import { useAppStore, MOCK_USERS } from '@/store/appStore';
import { Bell, Search, Menu, Building2, Check, ExternalLink, ChevronDown, ShieldCheck, LogOut, Sparkles, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { roleLabel, timeAgo, cn } from '@/lib/utils';
import { InitialsAvatar } from '@components/common/InitialsAvatar';
import type { UserRole } from '@/types';

export interface TopNavbarProps {
  isSimulation?: boolean;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ isSimulation = false }) => {
  const router = useRouter();
  const {
    currentUser,
    setRole,
    setCurrentUser,
    notifications,
    unreadCount,
    markAllRead,
    toggleSidebar,
  } = useAppStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleRoleSwitch = (newRole: UserRole) => {
    setRole(newRole);
    const targetUser = MOCK_USERS[newRole];
    setCurrentUser(targetUser);
    try {
      document.cookie = `vbridge_demo_user=${encodeURIComponent(
        JSON.stringify({ email: targetUser.email, role: newRole })
      )}; path=/; max-age=86400; SameSite=Lax`;
    } catch (e) {
      console.warn('Cookie set error:', e);
    }
    setShowUserMenu(false);
    if (newRole === 'SUPER_ADMIN') {
      router.push('/admin/reports');
    } else if (newRole === 'COORDINATOR') {
      router.push('/coordinator/dashboard');
    } else {
      router.push('/dashboard');
    }
  };

  const handleLogout = () => {
    try {
      document.cookie = 'vbridge_demo_user=; path=/; max-age=0; SameSite=Lax';
    } catch {}
    router.push('/login');
  };

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
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
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

        {/* User Identity & Interactive Role Switcher Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 pl-2 sm:border-l border-slate-200 hover:bg-slate-50 rounded-xl p-1 transition-colors text-left"
          >
            <InitialsAvatar name={currentUser.name} size="sm" />
            {!isSimulation && (
              <div className="hidden lg:block text-left">
                <div className="flex items-center gap-1">
                  <p className="text-xs font-bold text-slate-900 leading-tight">
                    {currentUser.name}
                  </p>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </div>
                <p className="text-[10px] text-indigo-600 font-medium">
                  {roleLabel(currentUser.role)}
                </p>
              </div>
            )}
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2 border-b border-slate-100">
                <div className="text-xs font-bold text-slate-900">{currentUser.name}</div>
                <div className="text-[11px] text-slate-400 font-mono truncate">{currentUser.email}</div>
                <div className="mt-1 text-[10px] inline-flex items-center px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                  {roleLabel(currentUser.role)}
                </div>
              </div>

              <div className="py-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 pb-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  <span>Switch Role / Persona</span>
                </div>
                <div className="space-y-0.5 text-xs">
                  <button
                    onClick={() => handleRoleSwitch('COORDINATOR')}
                    className={cn(
                      "w-full px-3 py-2 rounded-xl text-left font-medium transition-all flex items-center justify-between",
                      currentUser.role === 'COORDINATOR'
                        ? "bg-indigo-50 text-indigo-800 font-bold"
                        : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <span>👩‍🏫 Faculty Mentor / Coordinator</span>
                    {currentUser.role === 'COORDINATOR' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </button>
                  <button
                    onClick={() => handleRoleSwitch('STUDENT')}
                    className={cn(
                      "w-full px-3 py-2 rounded-xl text-left font-medium transition-all flex items-center justify-between",
                      currentUser.role === 'STUDENT'
                        ? "bg-indigo-50 text-indigo-800 font-bold"
                        : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <span>🎓 Student Lead</span>
                    {currentUser.role === 'STUDENT' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </button>
                  <button
                    onClick={() => handleRoleSwitch('SUPER_ADMIN')}
                    className={cn(
                      "w-full px-3 py-2 rounded-xl text-left font-medium transition-all flex items-center justify-between",
                      currentUser.role === 'SUPER_ADMIN'
                        ? "bg-purple-50 text-purple-800 font-bold"
                        : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <span>👑 Super Administrator</span>
                    {currentUser.role === 'SUPER_ADMIN' && <Check className="w-3.5 h-3.5 text-purple-600" />}
                  </button>
                  <button
                    onClick={() => handleRoleSwitch('INDUSTRY_PARTNER')}
                    className={cn(
                      "w-full px-3 py-2 rounded-xl text-left font-medium transition-all flex items-center justify-between",
                      currentUser.role === 'INDUSTRY_PARTNER'
                        ? "bg-amber-50 text-amber-800 font-bold"
                        : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <span>🏢 Industry Partner</span>
                    {currentUser.role === 'INDUSTRY_PARTNER' && <Check className="w-3.5 h-3.5 text-amber-600" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex flex-col gap-1 text-xs">
                <Link
                  href="/admin/reports"
                  onClick={() => setShowUserMenu(false)}
                  className="px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-2"
                >
                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                  <span>Institutional Reports</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-medium flex items-center gap-2 text-left"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
