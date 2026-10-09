'use client';

import React, { useState } from 'react';
import { Card } from '@components/common/Card';
import { Button } from '@components/common/Button';
import { useAppStore } from '@store/appStore';
import {
  MessageSquare,
  Send,
  Paperclip,
  Users,
  Search,
  Pin,
  Clock,
  Shield,
  Megaphone,
  Lock,
  Download,
  FileText,
  AlertCircle,
} from 'lucide-react';
import type { MessageChannel } from '@/types';

interface FacultyAnnouncement {
  id: string;
  senderName: string;
  senderRole: string;
  avatar: string;
  title?: string;
  text: string;
  timestamp: string;
  pinned: boolean;
  attachmentName?: string;
  attachmentSize?: string;
}

const OFFICIAL_BROADCAST_CHANNELS: MessageChannel[] = [
  {
    id: 'ch-faculty-directives',
    type: 'ANNOUNCEMENT',
    name: 'faculty-guidance-directives',
    unreadCount: 0,
    participantIds: [],
  },
  {
    id: 'ch-dept-announcements',
    type: 'ANNOUNCEMENT',
    name: 'department-announcements',
    unreadCount: 0,
    participantIds: [],
  },
  {
    id: 'ch-rubric-guidelines',
    type: 'ANNOUNCEMENT',
    name: 'rubric-milestone-guidelines',
    unreadCount: 0,
    participantIds: [],
  },
];

export const MessagingScreen: React.FC = () => {
  const currentUser = useAppStore((state) => state.currentUser);
  const isProfessorOrAdmin =
    currentUser.role === 'COORDINATOR' || currentUser.role === 'SUPER_ADMIN';

  const [selectedChannel, setSelectedChannel] = useState<MessageChannel>(
    OFFICIAL_BROADCAST_CHANNELS[0]
  );
  const [inputText, setInputText] = useState('');

  const [messages, setMessages] = useState<FacultyAnnouncement[]>([
    {
      id: 'm1',
      senderName: 'Dr. Sheetal Patil',
      senderRole: 'Lead Faculty Coordinator',
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=SheetalPatil',
      title: 'Milestone 2 Evaluation Schedule & Guidelines',
      text: 'Good afternoon students. The Milestone 2 reviews for all Mini Project groups will be conducted this Thursday starting at 10:00 AM. Please make sure your GitHub repositories are updated with commit histories and that your demonstration slides follow the attached template.',
      timestamp: 'Today at 09:30 AM',
      pinned: true,
      attachmentName: 'Milestone2_Evaluation_Template_VIT.pdf',
      attachmentSize: '2.4 MB',
    },
    {
      id: 'm2',
      senderName: 'Dr. Sheetal Patil',
      senderRole: 'Lead Faculty Coordinator',
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=SheetalPatil',
      text: 'Important reminder for Group Leads: Please ensure all group members have claimed their roster profiles. Direct messaging between individual students has been disabled to maintain academic integrity and centralized records.',
      timestamp: 'Today at 11:15 AM',
      pinned: false,
    },
    {
      id: 'm3',
      senderName: 'Prof. Principal (Dean Academics)',
      senderRole: 'Academic Directorate',
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Rita',
      text: 'Accreditation audits for the semester projects will review ledger hashes directly. Ensure that all external certificates are logged in your portfolio under the institutional guidelines.',
      timestamp: 'Yesterday at 04:00 PM',
      pinned: true,
    },
  ]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !isProfessorOrAdmin) return;

    setMessages([
      ...messages,
      {
        id: Date.now().toString(),
        senderName: currentUser.name || 'Faculty Guide',
        senderRole: currentUser.role === 'SUPER_ADMIN' ? 'Dean Academics' : 'Faculty Guide / Coordinator',
        avatar: currentUser.avatarUrl || 'https://api.dicebear.com/9.x/avataaars/svg?seed=Faculty',
        text: inputText.trim(),
        timestamp: 'Just now',
        pinned: false,
      },
    ]);
    setInputText('');
  };

  return (
    <div className="h-[calc(100vh-8rem)] max-w-7xl mx-auto flex flex-col sm:flex-row rounded-3xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
      {/* ─── Channel List Sidebar (Left 300px) ─── */}
      <div className="w-full sm:w-80 border-r border-slate-200 flex flex-col bg-slate-50/70">
        <div className="p-4 border-b border-slate-200/80 bg-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <Megaphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 font-display">
                Faculty Directives
              </h2>
              <p className="text-[11px] text-slate-500">
                Official professor announcements
              </p>
            </div>
          </div>
        </div>

        <div className="p-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search announcements..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5 flex items-center justify-between">
            <span>Broadcast Feeds</span>
            <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.2 rounded font-mono font-semibold">
              One-Way
            </span>
          </div>

          {OFFICIAL_BROADCAST_CHANNELS.map((ch) => {
            const isSelected = selectedChannel.id === ch.id;
            return (
              <button
                key={ch.id}
                onClick={() => setSelectedChannel(ch)}
                className={`w-full text-left p-2.5 rounded-xl text-xs transition-colors flex items-center justify-between ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="truncate">
                  <div className="font-semibold truncate">#{ch.name}</div>
                  <div className={`text-[10px] ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                    Official Directive Channel
                  </div>
                </div>

                <Megaphone className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
              </button>
            );
          })}

          <div className="mt-4 p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-indigo-950">
              <Shield className="w-3.5 h-3.5 text-indigo-600" />
              <span>Policy Notice</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Personal student-to-student messaging is disabled. All communications are preserved as official one-way faculty broadcasts.
            </p>
          </div>
        </div>
      </div>

      {/* ─── Active Broadcast Feed (Right Main Area) ─── */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Thread Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 font-display">
                #{selectedChannel.name}
              </h3>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                Official Faculty Channel
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Verified announcements from professors and project guides
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Users className="w-4 h-4 text-slate-400" />
            <span>All Enrolled Students</span>
          </div>
        </div>

        {/* Announcements Stream */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
          {messages.map((m) => (
            <div key={m.id} className="flex items-start gap-3.5 text-xs sm:text-sm">
              <img
                src={m.avatar}
                alt={m.senderName}
                className="w-9 h-9 rounded-full bg-slate-200 flex-shrink-0 ring-2 ring-indigo-100"
              />
              <div className="space-y-1.5 max-w-2xl flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-900">{m.senderName}</span>
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-semibold border border-indigo-100">
                    {m.senderRole}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {m.timestamp}
                  </span>
                  {m.pinned && (
                    <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-0.5 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      <Pin className="w-3 h-3 text-amber-500" /> Pinned Directive
                    </span>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-slate-800 leading-relaxed shadow-2xs space-y-3">
                  {m.title && (
                    <div className="font-bold text-slate-900 text-sm">
                      {m.title}
                    </div>
                  )}
                  <p>{m.text}</p>

                  {m.attachmentName && (
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-rose-500 flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-slate-800">{m.attachmentName}</div>
                          <div className="text-[10px] text-slate-400">{m.attachmentSize}</div>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Download className="w-3.5 h-3.5" />}
                        onClick={() => alert(`Downloading official document: ${m.attachmentName}`)}
                        className="text-xs border-slate-200"
                      >
                        Download
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input Bar or One-Way Student Lock Banner */}
        {isProfessorOrAdmin ? (
          <form
            onSubmit={handleSend}
            className="p-3 border-t border-slate-100 bg-slate-50/70 flex items-center gap-2"
          >
            <button
              type="button"
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
              title="Attach document or rubric"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Post official announcement in #${selectedChannel.name}...`}
              className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
            />

            <Button
              type="submit"
              variant="primary"
              size="sm"
              rightIcon={<Send className="w-3.5 h-3.5" />}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
            >
              Broadcast
            </Button>
          </form>
        ) : (
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs text-slate-600">
              <Lock className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span>
                <strong>One-Way Broadcast Feed:</strong> Only faculty mentors and department coordinators have permission to publish messages. Students have access to read directives and download attachments.
              </span>
            </div>

            <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex-shrink-0">
              Read-Only
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
