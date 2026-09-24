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
} from 'lucide-react';
import { MOCK_CHANNELS, MOCK_USERS_LIST } from '@services/mockData';
import type { MessageChannel } from '@/types';

export const MessagingScreen: React.FC = () => {
  const { currentUser } = useAppStore();
  const [selectedChannel, setSelectedChannel] = useState<MessageChannel>(
    MOCK_CHANNELS[0]
  );
  const [inputText, setInputText] = useState('');

  const [messages, setMessages] = useState([
    {
      id: 'm1',
      senderId: 'user-mentor-001',
      senderName: 'Dr. Eleanor Vance',
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Eleanor',
      role: 'FACULTY_MENTOR',
      text: 'Good morning team. Remember our midterm sprint review is set for Thursday 2 PM. Please ensure your prototype benchmarks are uploaded.',
      timestamp: 'Today at 09:30 AM',
      pinned: true,
    },
    {
      id: 'm2',
      senderId: 'user-student-001',
      senderName: 'Siddharth Chen',
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Siddharth',
      role: 'STUDENT',
      text: 'Understood Dr. Vance! We completed the WebSocket pipeline stress test and are preparing the 5-minute demo video now.',
      timestamp: 'Today at 10:15 AM',
      pinned: false,
    },
  ]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setMessages([
      ...messages,
      {
        id: Date.now().toString(),
        senderId: currentUser.id,
        senderName: currentUser.name,
        avatar: currentUser.avatarUrl || '',
        role: currentUser.role,
        text: inputText,
        timestamp: 'Just now',
        pinned: false,
      },
    ]);
    setInputText('');
  };

  return (
    <div className="h-[calc(100vh-8rem)] max-w-7xl mx-auto flex flex-col sm:flex-row rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
      {/* ─── Channel List Sidebar (Left 280px) ─── */}
      <div className="w-full sm:w-80 border-r border-slate-200 flex flex-col bg-slate-50/60">
        <div className="p-4 border-b border-slate-200/80">
          <h2 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-600" />
            <span>Communications Hub</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Unified workspace & mentor threads (Rule 3)
          </p>
        </div>

        <div className="p-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search channels..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5">
            Active Threads
          </div>

          {MOCK_CHANNELS.map((ch) => {
            const isSelected = selectedChannel.id === ch.id;
            return (
              <button
                key={ch.id}
                onClick={() => setSelectedChannel(ch)}
                className={`w-full text-left p-2.5 rounded-xl text-xs transition-colors flex items-center justify-between ${
                  isSelected
                    ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-2xs border border-indigo-100'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="truncate">
                  <div className="font-semibold truncate">{ch.name}</div>
                  <div className="text-[10px] text-slate-400 capitalize">
                    {ch.type.replace('_', ' ').toLowerCase()}
                  </div>
                </div>

                {ch.unreadCount > 0 && (
                  <span className="text-[10px] bg-indigo-600 text-white font-bold px-1.5 py-0.5 rounded-full">
                    {ch.unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Active Message Feed (Right Main Area) ─── */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Thread Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-display">
              {selectedChannel.name}
            </h3>
            <p className="text-[11px] text-slate-500">
              Synchronized with Workspace Hub (Team NexGen)
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Users className="w-4 h-4 text-slate-400" />
            <span>4 Participants</span>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
          {messages.map((m) => (
            <div key={m.id} className="flex items-start gap-3 text-xs sm:text-sm">
              <img
                src={m.avatar}
                alt={m.senderName}
                className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0"
              />
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{m.senderName}</span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                    {m.role}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {m.timestamp}
                  </span>
                  {m.pinned && (
                    <span className="text-[10px] text-indigo-600 font-semibold flex items-center gap-0.5">
                      <Pin className="w-3 h-3" /> Pinned
                    </span>
                  )}
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-slate-800 leading-relaxed">
                  {m.text}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSend}
          className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center gap-2"
        >
          <button
            type="button"
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message ${selectedChannel.name}...`}
            className="flex-1 px-3 py-2 text-xs sm:text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />

          <Button
            type="submit"
            variant="primary"
            size="sm"
            rightIcon={<Send className="w-3.5 h-3.5" />}
          >
            Send
          </Button>
        </form>
      </div>
    </div>
  );
};
