'use client';

import { create } from 'zustand';
import type { User, UserRole, Notification } from '@/types';

export const MOCK_USERS: Record<UserRole, User> = {
  STUDENT: {
    id: 'user-vedant-nikumbh',
    name: 'Vedant Balvant Nikumbh',
    email: 'vedant.nikumbh@vit.edu.in',
    role: 'STUDENT',
    department: 'Electronics and Computer Science',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=VedantNikumbh',
    institutionalId: '24108B0021',
    isOnline: true,
  },
  COORDINATOR: {
    id: 'user-sheetal-patil',
    name: 'Dr. Sheetal Patil',
    email: 'sheetal.patil@vit.edu.in',
    role: 'COORDINATOR',
    department: 'Electronics and Computer Science',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=SheetalPatil',
    institutionalId: 'FAC-SPATIL-2026',
    isOnline: true,
  },
  INDUSTRY_PARTNER: {
    id: 'user-partner-001',
    name: 'Rahul Kapoor (Industry Expert)',
    email: 'expert@industry.com',
    role: 'INDUSTRY_PARTNER',
    department: 'TechCorp Solutions / Industry Partner',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Rahul',
    institutionalId: 'EXP-2026-001',
    isOnline: true,
  },
  SUPER_ADMIN: {
    id: 'user-admin-001',
    name: 'Dean Rita Sharma (Super Admin)',
    email: 'admin@vbridge.com',
    role: 'SUPER_ADMIN',
    department: 'Central Institutional Administration',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Rita',
    institutionalId: 'ADMIN-2026-001',
    isOnline: true,
  },
};

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
  setRole: (role: UserRole) => void;
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
  avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Student',
  isOnline: true,
};

export const useAppStore = create<AppState>((set) => ({
  currentUser: DEFAULT_USER,
  activeWorkspace: null,
  sidebarOpen: false,
  unreadCount: 0,
  viewportMode: 'desktop',
  notifications: [],

  setRole: (role) => set({ currentUser: MOCK_USERS[role] }),
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
