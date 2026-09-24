'use client';

import { create } from 'zustand';
import type { User, UserRole, Notification } from '@/types';

export const MOCK_USERS: Record<UserRole, User> = {
  STUDENT: {
    id: 'user-student-001',
    name: 'Siddharth Chen',
    email: 'siddharth.chen@university.edu',
    role: 'STUDENT',
    department: 'Computer Science & AI',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Siddharth',
    institutionalId: 'VC-2026-891',
    isOnline: true,
  },
  FACULTY_MENTOR: {
    id: 'user-mentor-001',
    name: 'Dr. Eleanor Vance',
    email: 'eleanor.vance@university.edu',
    role: 'FACULTY_MENTOR',
    department: 'Computer Science & AI',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Eleanor',
    institutionalId: 'FAC-2019-042',
    isOnline: true,
  },
  COORDINATOR: {
    id: 'user-coord-001',
    name: 'Prof. Arjun Mehta',
    email: 'arjun.mehta@university.edu',
    role: 'COORDINATOR',
    department: 'Computer Science & AI',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Arjun',
    institutionalId: 'FAC-2015-011',
  },
  EXTERNAL_REVIEWER: {
    id: 'user-reviewer-001',
    name: 'Dr. Priya Nair',
    email: 'priya.nair@externalorg.com',
    role: 'EXTERNAL_REVIEWER',
    department: 'External',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Priya',
  },
  INDUSTRY_PARTNER: {
    id: 'user-partner-001',
    name: 'Rahul Kapoor',
    email: 'rahul.kapoor@techcorp.com',
    role: 'INDUSTRY_PARTNER',
    department: 'TechCorp Solutions',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Rahul',
  },
  SUPER_ADMIN: {
    id: 'user-admin-001',
    name: 'Dean Rita Sharma',
    email: 'rita.sharma@university.edu',
    role: 'SUPER_ADMIN',
    department: 'Academic Affairs',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Rita',
    institutionalId: 'DEAN-2012-001',
  },
};

interface AppState {
  currentUser: User;
  notifications: Notification[];
  unreadCount: number;
  sidebarOpen: boolean;
  viewportMode: 'desktop' | 'mobile' | 'tablet';

  // Actions
  setRole: (role: UserRole) => void;
  setCurrentUser: (user: User) => void;
  setViewportMode: (mode: 'desktop' | 'mobile' | 'tablet') => void;
  markAllRead: () => void;
  addNotification: (n: Notification) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentUser: MOCK_USERS.STUDENT,
  sidebarOpen: true,
  unreadCount: 3,
  viewportMode: 'desktop',
  notifications: [
    {
      id: 'notif-001',
      userId: 'user-student-001',
      title: 'Milestone Due in 36 Hours',
      body: 'Hackathon 2026 — Milestone 2 submission is due soon. Demo recording is still pending.',
      severity: 'URGENT',
      isRead: false,
      linkTo: '/projects/team-001/milestones/ms-002/submit',
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    {
      id: 'notif-002',
      userId: 'user-student-001',
      title: 'Rubric Feedback Available',
      body: 'Dr. Vance has published feedback on Milestone 1 of your Capstone project.',
      severity: 'INFO',
      isRead: false,
      linkTo: '/projects/team-001',
      createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    },
    {
      id: 'notif-003',
      userId: 'user-student-001',
      title: 'Application Accepted',
      body: 'Congratulations! Your application for the Spring Incubator has been accepted.',
      severity: 'INFO',
      isRead: false,
      linkTo: '/projects/team-001',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    },
  ],

  setRole: (role) => set({ currentUser: MOCK_USERS[role] }),
  setCurrentUser: (user) => set({ currentUser: user }),
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
