'use client';

import { create } from 'zustand';
import type { User, Notification } from '@/types';

export interface ActiveWorkspaceInfo {
  teamId?: string;
  name: string;
  activityTitle: string;
  nextMilestoneTitle?: string;
  nextMilestoneDue?: string;
  mentorName?: string;
}

interface AppState {
  currentUser: User;
  activeWorkspace: ActiveWorkspaceInfo | null;
  notifications: Notification[];
  unreadCount: number;
  sidebarOpen: boolean;
  viewportMode: 'desktop' | 'mobile' | 'tablet';

  // Actions
  setCurrentUser: (user: User) => void;
  setActiveWorkspace: (ws: ActiveWorkspaceInfo | null) => void;
  setViewportMode: (mode: 'desktop' | 'mobile' | 'tablet') => void;
  markAllRead: () => void;
  addNotification: (n: Notification) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const DEFAULT_USER: User = {
  id: '',
  name: 'Student User',
  email: '',
  role: 'STUDENT',
  department: 'Electronics and Computer Science',
  avatarUrl: '',
  isOnline: true,
};

export const useAppStore = create<AppState>((set) => ({
  currentUser: DEFAULT_USER,
  activeWorkspace: null,
  sidebarOpen: false,
  unreadCount: 0,
  viewportMode: 'desktop',
  notifications: [],

  setCurrentUser: (user) => set({ currentUser: user }),
  setActiveWorkspace: (ws) => set({ activeWorkspace: ws }),
  setViewportMode: (mode) => set({ viewportMode: mode }),
  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    })),
  addNotification: (n) =>
    set((state) => ({
      notifications: [n, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
