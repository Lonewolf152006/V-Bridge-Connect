'use client';

import React, { useState, useRef } from 'react';
import { Card } from '@components/common/Card';
import { Button } from '@components/common/Button';
import { InitialsAvatar } from '@components/common/InitialsAvatar';
import { useAppStore } from '@store/appStore';
import {
  MessageSquare,
  Hash,
  Send,
  Paperclip,
  Smile,
  FileText,
  FileCode,
  Image as ImageIcon,
  Download,
  Eye,
  X,
  Search,
  Video,
  Pin,
  CheckCircle2,
  Users,
  Code,
  Bold,
  Italic,
  List,
  Sparkles,
  ChevronDown,
  ExternalLink,
  Plus,
  FileSpreadsheet,
  FileArchive,
  AtSign,
  User as UserIcon,
} from 'lucide-react';
import { MOCK_TEAMS } from '@services/mockData';
import type { Team } from '@/types';

interface FileAttachment {
  id: string;
  name: string;
  size: string;
  type: 'pdf' | 'image' | 'code' | 'csv' | 'archive' | 'generic';
  url?: string;
  previewUrl?: string;
}

interface Reaction {
  emoji: string;
  count: number;
  users: string[];
}

interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  role: 'STUDENT' | 'COORDINATOR' | 'FACULTY_MENTOR' | 'INDUSTRY_PARTNER';
  timestamp: string;
  text: string;
  codeSnippet?: {
    language: string;
    code: string;
  };
  attachments?: FileAttachment[];
  reactions: Reaction[];
  isPinned?: boolean;
}

interface Channel {
  id: string;
  name: string;
  topic: string;
  isPrivate?: boolean;
  unreadCount?: number;
  isDirectMessage?: boolean;
  memberRole?: string;
}

const INITIAL_CHANNELS: Channel[] = [
  {
    id: 'mini-6-all',
    name: 'mini-6-group-chat',
    topic: 'Official Mini 6 team collaboration feed with student members, faculty, and industry mentor',
  },
  {
    id: 'mini-1-all',
    name: 'mini-1-group-chat',
    topic: 'Official Mini 1 team collaboration feed with student members and mentors',
  },
  {
    id: 'mini-8-all',
    name: 'mini-8-group-chat',
    topic: 'Official Mini 8 team collaboration feed with student members and mentors',
  },
  {
    id: 'general-announcements',
    name: 'general-announcements',
    topic: 'Departmental announcements for Semester 5 Capstone Projects',
  },
  {
    id: 'milestone-deliverables',
    name: 'milestone-deliverables',
    topic: 'Draft submissions, rubric compliance questions, and presentation slide decks',
  },
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'm1',
    channelId: 'mini-6-all',
    senderId: 'user-sheetal-patil',
    senderName: 'Dr. Sheetal Patil',
    role: 'COORDINATOR',
    timestamp: 'Yesterday at 3:45 PM',
    text: 'Good afternoon Mini 6 team! Please make sure your Milestone 2 evaluation rubric criteria are met. I am uploading the updated departmental guidelines PDF below for reference.',
    attachments: [
      {
        id: 'att-1',
        name: 'Capstone_Milestone2_Rubric_Guidelines_v3.pdf',
        size: '1.8 MB',
        type: 'pdf',
      },
    ],
    reactions: [
      { emoji: '👍', count: 4, users: ['Vedant Balvant Nikumbh', 'Yash Sachin Khanvilkar', 'Paras Rajeev Shah', 'Vedant Nilesh Patole'] },
      { emoji: '📌', count: 1, users: ['Dr. Sheetal Patil'] },
    ],
    isPinned: true,
  },
  {
    id: 'm2',
    channelId: 'mini-6-all',
    senderId: 'user-yash-khanvilkar',
    senderName: 'Yash Sachin Khanvilkar',
    role: 'STUDENT',
    timestamp: 'Yesterday at 4:20 PM',
    text: 'Thank you Dr. Sheetal Mam! We have implemented the zero-copy buffer queue and mitigated the 128-channel sensor overrun. Here is the architecture diagram and the test run telemetry snapshot.',
    attachments: [
      {
        id: 'att-2',
        name: 'Autonomous_Sensor_Architecture_Diagram.png',
        size: '840 KB',
        type: 'image',
        previewUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'att-3',
        name: '128ch_Throughput_Stress_Benchmark.csv',
        size: '345 KB',
        type: 'csv',
      },
    ],
    reactions: [
      { emoji: '🚀', count: 3, users: ['Dr. Sheetal Patil', 'Vedant Balvant Nikumbh', 'Paras Rajeev Shah'] },
      { emoji: '🔥', count: 2, users: ['Yash Sachin Khanvilkar', 'Rahul Kapoor'] },
    ],
  },
  {
    id: 'm3',
    channelId: 'mini-6-all',
    senderId: 'user-partner-001',
    senderName: 'Rahul Kapoor',
    role: 'INDUSTRY_PARTNER',
    timestamp: 'Today at 9:15 AM',
    text: 'Great progress on the buffer throughput! From an industry production standpoint, make sure you configure graceful fallback on network packet drops. Here is the Python mitigation wrapper we use in high-frequency pipelines:',
    codeSnippet: {
      language: 'python',
      code: `async def on_packet_drop(packet_id: str, retry_count: int = 3):\n    if retry_count <= 0:\n        logger.warning(f"Drop mitigation: rerouting packet {packet_id} to dead-letter queue")\n        return False\n    return await retry_stream_buffer(packet_id, backoff_ms=50)`,
    },
    reactions: [
      { emoji: '💡', count: 4, users: ['Vedant Balvant Nikumbh', 'Yash Sachin Khanvilkar', 'Dr. Sheetal Patil', 'Paras Rajeev Shah'] },
    ],
  },
  {
    id: 'm4',
    channelId: 'mini-6-all',
    senderId: 'user-vedant-nikumbh',
    senderName: 'Vedant Balvant Nikumbh',
    role: 'STUDENT',
    timestamp: 'Today at 10:30 AM',
    text: 'Understood Sir! I have incorporated this exponential backoff into our PyTorch telemetry collector. We are currently recording our 5-minute video presentation.',
    reactions: [
      { emoji: '🙌', count: 2, users: ['Yash Sachin Khanvilkar', 'Rahul Kapoor'] },
    ],
  },
  // Direct Message sample with Dr. Sheetal Patil
  {
    id: 'dm-1',
    channelId: 'dm-user-sheetal-patil',
    senderId: 'user-sheetal-patil',
    senderName: 'Dr. Sheetal Patil',
    role: 'COORDINATOR',
    timestamp: 'Today at 11:00 AM',
    text: 'Hello Vedant! Please ensure your git commit history is updated before the midterm audit review.',
    reactions: [{ emoji: '👍', count: 1, users: ['Vedant Balvant Nikumbh'] }],
  },
  // Direct Message sample with Yash
  {
    id: 'dm-2',
    channelId: 'dm-user-yash-khanvilkar',
    senderId: 'user-yash-khanvilkar',
    senderName: 'Yash Sachin Khanvilkar',
    role: 'STUDENT',
    timestamp: 'Today at 11:30 AM',
    text: 'Hey Vedant! Did you test the RL model on the local test harness? The unit tests passed on my branch.',
    reactions: [{ emoji: '🚀', count: 1, users: ['Vedant Balvant Nikumbh'] }],
  },
];

interface WorkspaceDiscussionTabProps {
  currentTeam?: Team;
}

export const WorkspaceDiscussionTab: React.FC<WorkspaceDiscussionTabProps> = ({ currentTeam }) => {
  const { currentUser } = useAppStore();
  const activeTeam = currentTeam || MOCK_TEAMS[1]; // defaults to Mini 6

  // Default active channel matches the current group
  const defaultChannelId = activeTeam.id === 'team-mini-1' ? 'mini-1-all' : activeTeam.id === 'team-mini-8' ? 'mini-8-all' : 'mini-6-all';
  const [activeChannel, setActiveChannel] = useState<string>(defaultChannelId);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [stagedFiles, setStagedFiles] = useState<FileAttachment[]>([]);
  const [previewFile, setPreviewFile] = useState<FileAttachment | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [showCodeSnippetBox, setShowCodeSnippetBox] = useState(false);
  const [snippetCode, setSnippetCode] = useState('');
  const [snippetLanguage, setSnippetLanguage] = useState('python');

  // Role simulator so user can test sending as Student, Faculty Coordinator, or Industry Mentor
  const [simulatedRole, setSimulatedRole] = useState<'CURRENT' | 'COORDINATOR' | 'INDUSTRY_PARTNER'>('CURRENT');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Group members from active team
  const groupMembers = activeTeam.members.map((m) => ({
    id: `dm-${m.userId}`,
    userId: m.userId,
    name: m.user.name,
    role: m.role === 'LEAD' ? 'Student Lead' : 'Student Member',
    institutionalId: m.user.institutionalId || '24108B',
  }));

  // Faculty and external mentors
  const facultyMentors = [
    {
      id: 'dm-user-sheetal-patil',
      userId: 'user-sheetal-patil',
      name: 'Dr. Sheetal Patil',
      role: 'Lead Faculty Coordinator',
      institutionalId: 'FAC-SPATIL',
    },
    {
      id: 'dm-user-akhil-masurkar',
      userId: 'user-akhil-masurkar',
      name: 'Prof. Akhil Masurkar',
      role: 'Faculty Co-Coordinator',
      institutionalId: 'FAC-AMASURKAR',
    },
    {
      id: 'dm-user-partner-001',
      userId: 'user-partner-001',
      name: 'Rahul Kapoor',
      role: 'Industry Mentor @ TechCorp',
      institutionalId: 'CORP-TECHCORP',
    },
  ];

  // Current channel/chat metadata
  const currentChannelObj =
    INITIAL_CHANNELS.find((c) => c.id === activeChannel) ||
    [...groupMembers, ...facultyMentors].find((m) => m.id === activeChannel);

  const channelDisplayName = currentChannelObj
    ? (currentChannelObj as { name?: string }).name || activeChannel
    : activeChannel;

  const isDirectChat = activeChannel.startsWith('dm-');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: FileAttachment[] = Array.from(files).map((file, idx) => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      let type: FileAttachment['type'] = 'generic';
      if (ext === 'pdf') type = 'pdf';
      else if (['png', 'jpg', 'jpeg', 'svg', 'webp'].includes(ext || '')) type = 'image';
      else if (['py', 'ts', 'tsx', 'js', 'json', 'html', 'css'].includes(ext || '')) type = 'code';
      else if (['csv', 'xlsx', 'xls'].includes(ext || '')) type = 'csv';
      else if (['zip', 'tar', 'gz'].includes(ext || '')) type = 'archive';

      return {
        id: `upload-${Date.now()}-${idx}`,
        name: file.name,
        size: `${Math.round(file.size / 1024)} KB`,
        type,
        previewUrl: type === 'image' ? URL.createObjectURL(file) : undefined,
      };
    });

    setStagedFiles((prev) => [...prev, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addSampleFile = (type: 'pdf' | 'csv' | 'code' | 'image') => {
    const sampleMap = {
      pdf: { name: 'Milestone_2_Executive_Summary.pdf', size: '2.1 MB', type: 'pdf' as const },
      csv: { name: 'Model_Convergence_Loss_Epochs.csv', size: '142 KB', type: 'csv' as const },
      code: { name: 'realtime_sensor_bridge.py', size: '4.8 KB', type: 'code' as const },
      image: {
        name: 'Neural_Network_Weights_Heatmap.png',
        size: '1.2 MB',
        type: 'image' as const,
        previewUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80',
      },
    };
    const sample = sampleMap[type];
    setStagedFiles((prev) => [
      ...prev,
      {
        id: `sample-${Date.now()}`,
        ...sample,
      },
    ]);
  };

  const removeStagedFile = (id: string) => {
    setStagedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && stagedFiles.length === 0 && !snippetCode.trim()) return;

    let sender = {
      id: currentUser.id,
      name: currentUser.name || 'Vedant Balvant Nikumbh',
      role: (currentUser.role as ChatMessage['role']) || 'STUDENT',
    };

    if (simulatedRole === 'COORDINATOR') {
      sender = {
        id: 'user-sheetal-patil',
        name: 'Dr. Sheetal Patil',
        role: 'COORDINATOR',
      };
    } else if (simulatedRole === 'INDUSTRY_PARTNER') {
      sender = {
        id: 'user-partner-001',
        name: 'Rahul Kapoor',
        role: 'INDUSTRY_PARTNER',
      };
    }

    const newChatMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      channelId: activeChannel,
      senderId: sender.id,
      senderName: sender.name,
      role: sender.role,
      timestamp: 'Just now',
      text: inputText.trim(),
      codeSnippet: snippetCode.trim()
        ? { language: snippetLanguage, code: snippetCode.trim() }
        : undefined,
      attachments: stagedFiles.length > 0 ? [...stagedFiles] : undefined,
      reactions: [],
    };

    setMessages((prev) => [...prev, newChatMessage]);
    setInputText('');
    setStagedFiles([]);
    setSnippetCode('');
    setShowCodeSnippetBox(false);

    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const toggleReaction = (messageId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg;

        const userName = currentUser.name || 'You';
        const existingIdx = msg.reactions.findIndex((r) => r.emoji === emoji);

        if (existingIdx >= 0) {
          const reaction = msg.reactions[existingIdx];
          const hasUser = reaction.users.includes(userName);

          if (hasUser) {
            const updatedUsers = reaction.users.filter((u) => u !== userName);
            if (updatedUsers.length === 0) {
              return {
                ...msg,
                reactions: msg.reactions.filter((r) => r.emoji !== emoji),
              };
            } else {
              const updatedReactions = [...msg.reactions];
              updatedReactions[existingIdx] = {
                ...reaction,
                count: updatedUsers.length,
                users: updatedUsers,
              };
              return { ...msg, reactions: updatedReactions };
            }
          } else {
            const updatedReactions = [...msg.reactions];
            updatedReactions[existingIdx] = {
              ...reaction,
              count: reaction.count + 1,
              users: [...reaction.users, userName],
            };
            return { ...msg, reactions: updatedReactions };
          }
        } else {
          return {
            ...msg,
            reactions: [
              ...msg.reactions,
              { emoji, count: 1, users: [userName] },
            ],
          };
        }
      })
    );
  };

  const filteredMessages = messages
    .filter((m) => m.channelId === activeChannel)
    .filter((m) =>
      searchFilter
        ? m.text.toLowerCase().includes(searchFilter.toLowerCase()) ||
          m.senderName.toLowerCase().includes(searchFilter.toLowerCase()) ||
          m.attachments?.some((a) => a.name.toLowerCase().includes(searchFilter.toLowerCase()))
        : true
    );

  const getRoleBadgeClasses = (role: ChatMessage['role']) => {
    switch (role) {
      case 'COORDINATOR':
      case 'FACULTY_MENTOR':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'INDUSTRY_PARTNER':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'STUDENT':
      default:
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    }
  };

  const getRoleLabel = (role: ChatMessage['role']) => {
    switch (role) {
      case 'COORDINATOR':
        return 'FACULTY COORDINATOR';
      case 'FACULTY_MENTOR':
        return 'FACULTY MENTOR';
      case 'INDUSTRY_PARTNER':
        return 'INDUSTRY MENTOR';
      case 'STUDENT':
        return 'STUDENT';
    }
  };

  const getFileIcon = (type: FileAttachment['type']) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-rose-500" />;
      case 'image':
        return <ImageIcon className="w-5 h-5 text-emerald-500" />;
      case 'code':
        return <FileCode className="w-5 h-5 text-blue-500" />;
      case 'csv':
        return <FileSpreadsheet className="w-5 h-5 text-teal-500" />;
      case 'archive':
        return <FileArchive className="w-5 h-5 text-amber-500" />;
      default:
        return <FileText className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="h-[750px] max-w-7xl mx-auto flex flex-col md:flex-row rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
      {/* ─── SLACK SIDEBAR (Left 280px) ─── */}
      <div className="w-full md:w-72 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 border-r border-slate-800">
        {/* Workspace Title Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-sm font-extrabold text-white font-display tracking-tight">
                {activeTeam.name} Workspace
              </h2>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">V-Bridge Messenger Hub</p>
          </div>
          <span className="text-[10px] bg-slate-800 text-indigo-300 px-2 py-0.5 rounded font-mono font-semibold">
            Active
          </span>
        </div>

        {/* Filter / Search input */}
        <div className="p-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search chats & files..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>
        </div>

        {/* Channels & Direct Messages Navigation */}
        <div className="flex-1 overflow-y-auto px-2 space-y-4 py-2 text-xs">
          {/* 1. Group Channels */}
          <div>
            <div className="flex items-center justify-between px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <span>Group Channels</span>
              <Users className="w-3.5 h-3.5 text-slate-500" />
            </div>

            <div className="space-y-0.5 mt-1">
              {INITIAL_CHANNELS.map((ch) => {
                const isActive = activeChannel === ch.id;
                return (
                  <button
                    key={ch.id}
                    onClick={() => setActiveChannel(ch.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition-colors ${
                      isActive
                        ? 'bg-indigo-600 text-white font-bold shadow-xs'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Hash className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span className="truncate">{ch.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Individual Members of the Group (1-on-1 Direct Chats) */}
          <div>
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>{activeTeam.name} Members (1-on-1)</span>
              <span className="text-[10px] text-indigo-400 font-mono">{groupMembers.length}</span>
            </div>

            <div className="space-y-0.5 mt-1">
              {groupMembers.map((member) => {
                const isActive = activeChannel === member.id;
                return (
                  <button
                    key={member.id}
                    onClick={() => setActiveChannel(member.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between transition-colors group ${
                      isActive
                        ? 'bg-indigo-600 text-white font-bold shadow-xs'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <InitialsAvatar name={member.name} size="xs" />
                      <div className="min-w-0 truncate">
                        <div className="text-xs font-semibold truncate leading-tight">
                          {member.name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate leading-tight">
                          {member.role}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Faculty Coordinators & Mentors (1-on-1 Direct Chats) */}
          <div>
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Faculty & Mentors</span>
              <span className="text-[10px] text-emerald-400 font-mono">3</span>
            </div>

            <div className="space-y-0.5 mt-1">
              {facultyMentors.map((mentor) => {
                const isActive = activeChannel === mentor.id;
                return (
                  <button
                    key={mentor.id}
                    onClick={() => setActiveChannel(mentor.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between transition-colors group ${
                      isActive
                        ? 'bg-indigo-600 text-white font-bold shadow-xs'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <InitialsAvatar name={mentor.name} size="xs" />
                      <div className="min-w-0 truncate">
                        <div className="text-xs font-semibold truncate leading-tight">
                          {mentor.name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate leading-tight">
                          {mentor.role}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Current User Bar at Bottom (With simple InitialsAvatar) */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <InitialsAvatar name={currentUser.name || 'User'} size="sm" />
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">{currentUser.name}</div>
              <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MAIN CHAT AREA (Right) ─── */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        {/* Chat Header */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              {isDirectChat ? (
                <InitialsAvatar name={channelDisplayName} size="xs" />
              ) : (
                <Hash className="w-4 h-4 text-indigo-600" />
              )}
              <h3 className="text-sm sm:text-base font-bold text-slate-900 font-display">
                {isDirectChat ? channelDisplayName : `#${channelDisplayName}`}
              </h3>
              {isDirectChat && (
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                  Direct Message
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 truncate max-w-xl">
              {isDirectChat
                ? `Direct private communication thread with ${channelDisplayName}`
                : 'topic' in (currentChannelObj || {})
                ? (currentChannelObj as any).topic
                : 'Shared workspace thread'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://meet.google.com/vbc-mini-project-sync"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs font-semibold transition-colors"
            >
              <Video className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Google Meet Call</span>
              <span className="sm:hidden">Meet</span>
            </a>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-white">
          {filteredMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs text-center space-y-2">
              <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
              <div>
                <p className="font-semibold text-slate-600">No messages yet in this conversation</p>
                <p className="text-[11px] text-slate-400">
                  Send a message or attach a file below to start the conversation!
                </p>
              </div>
            </div>
          ) : (
            filteredMessages.map((msg) => (
              <div
                key={msg.id}
                className="group relative flex items-start gap-3 hover:bg-slate-50/80 -mx-4 px-4 py-2 rounded-2xl transition-colors"
              >
                {/* Initials Avatar (No dicebear images!) */}
                <InitialsAvatar name={msg.senderName} size="sm" className="mt-0.5" />

                {/* Message Body */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">
                      {msg.senderName}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide ${getRoleBadgeClasses(
                        msg.role
                      )}`}
                    >
                      {getRoleLabel(msg.role)}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {msg.timestamp}
                    </span>
                    {msg.isPinned && (
                      <span className="text-[10px] text-indigo-600 font-semibold flex items-center gap-0.5 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                        <Pin className="w-2.5 h-2.5" /> Pinned
                      </span>
                    )}
                  </div>

                  {/* Text Content */}
                  {msg.text && (
                    <div className="text-xs sm:text-sm text-slate-800 leading-relaxed break-words">
                      {msg.text}
                    </div>
                  )}

                  {/* Code Snippet Box */}
                  {msg.codeSnippet && (
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs font-mono text-slate-200 overflow-x-auto my-2 max-w-2xl">
                      <div className="text-[10px] text-slate-500 uppercase pb-1 border-b border-slate-800 mb-2">
                        {msg.codeSnippet.language}
                      </div>
                      <pre className="whitespace-pre">{msg.codeSnippet.code}</pre>
                    </div>
                  )}

                  {/* Attached Files & Documents */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="space-y-2 pt-1 max-w-2xl">
                      {msg.attachments.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 rounded-lg bg-white border border-slate-200 flex-shrink-0 shadow-2xs">
                              {getFileIcon(file.type)}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-800 truncate">
                                {file.name}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {file.size} • {file.type.toUpperCase()} File
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {file.previewUrl && (
                              <button
                                onClick={() => setPreviewFile(file)}
                                className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-200/80 rounded-lg transition-colors"
                                title="Preview Attachment"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}

                            <a
                              href={file.previewUrl || '#'}
                              download={file.name}
                              onClick={(e) => {
                                if (!file.previewUrl) {
                                  e.preventDefault();
                                  alert(`Downloading ${file.name}...`);
                                }
                              }}
                              className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-200/80 rounded-lg transition-colors"
                              title="Download File"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reaction Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {msg.reactions.map((react, idx) => {
                      const hasReacted = react.users.includes(currentUser.name || 'You');
                      return (
                        <button
                          key={idx}
                          onClick={() => toggleReaction(msg.id, react.emoji)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors border ${
                            hasReacted
                              ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold'
                              : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                          }`}
                          title={`Reacted by: ${react.users.join(', ')}`}
                        >
                          <span>{react.emoji}</span>
                          <span className="text-[11px] font-mono">{react.count}</span>
                        </button>
                      );
                    })}

                    <button
                      onClick={() => toggleReaction(msg.id, '👍')}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-opacity text-xs"
                      title="Add thumbs up"
                    >
                      <Smile className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Floating Action Menu */}
                <div className="absolute top-2 right-4 hidden group-hover:flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-1.5 py-1 shadow-sm">
                  <button
                    onClick={() => toggleReaction(msg.id, '👍')}
                    className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors text-xs"
                    title="Thumbs up"
                  >
                    👍
                  </button>
                  <button
                    onClick={() => toggleReaction(msg.id, '🚀')}
                    className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors text-xs"
                    title="Rocket"
                  >
                    🚀
                  </button>
                  <button
                    onClick={() => toggleReaction(msg.id, '💡')}
                    className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors text-xs"
                    title="Idea"
                  >
                    💡
                  </button>
                  <button
                    onClick={() => {
                      setInputText(`> Replying to ${msg.senderName}: "${msg.text.slice(0, 40)}..."\n`);
                    }}
                    className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors text-xs"
                    title="Reply in thread"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ─── MESSAGE COMPOSER ─── */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/70 space-y-2">
          {/* Staged File Attachments Preview before sending */}
          {stagedFiles.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pb-2">
              <span className="text-[11px] font-bold text-slate-500">Staged Attachments:</span>
              {stagedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-white border border-indigo-200 text-xs shadow-2xs"
                >
                  {getFileIcon(file.type)}
                  <span className="font-semibold text-slate-800 max-w-xs truncate">{file.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">({file.size})</span>
                  <button
                    onClick={() => removeStagedFile(file.id)}
                    className="text-slate-400 hover:text-rose-500 ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Code Snippet Box */}
          {showCodeSnippetBox && (
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-mono font-bold">Add Code Snippet</span>
                <div className="flex items-center gap-2">
                  <select
                    value={snippetLanguage}
                    onChange={(e) => setSnippetLanguage(e.target.value)}
                    className="bg-slate-800 text-slate-200 text-xs px-2 py-0.5 rounded border border-slate-700"
                  >
                    <option value="python">Python</option>
                    <option value="typescript">TypeScript</option>
                    <option value="bash">Bash / Shell</option>
                    <option value="json">JSON</option>
                  </select>
                  <button
                    onClick={() => setShowCodeSnippetBox(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <textarea
                value={snippetCode}
                onChange={(e) => setSnippetCode(e.target.value)}
                placeholder="Paste code or script snippet here..."
                rows={3}
                className="w-full bg-slate-950 text-slate-200 p-2 rounded-lg font-mono text-xs border border-slate-800 focus:outline-none"
              />
            </div>
          )}

          {/* Input Form */}
          <form
            onSubmit={handleSendMessage}
            className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all"
          >
            {/* Formatting Toolbar */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-100 bg-slate-50/50 text-slate-500">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setInputText((prev) => prev + '**bold text** ')}
                  className="p-1 hover:text-slate-800 hover:bg-slate-200 rounded text-xs"
                  title="Bold"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setInputText((prev) => prev + '_italic text_ ')}
                  className="p-1 hover:text-slate-800 hover:bg-slate-200 rounded text-xs"
                  title="Italic"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowCodeSnippetBox((prev) => !prev)}
                  className={`p-1 rounded text-xs ${
                    showCodeSnippetBox ? 'bg-indigo-100 text-indigo-700' : 'hover:text-slate-800 hover:bg-slate-200'
                  }`}
                  title="Insert Code Snippet"
                >
                  <Code className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setInputText((prev) => prev + '\n- Item 1\n- Item 2')}
                  className="p-1 hover:text-slate-800 hover:bg-slate-200 rounded text-xs"
                  title="Bulleted List"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <div className="h-4 w-px bg-slate-200 mx-1" />
                <button
                  type="button"
                  onClick={() => setInputText((prev) => prev + '@Dr. Sheetal Patil ')}
                  className="p-1 hover:text-slate-800 hover:bg-slate-200 rounded text-xs flex items-center gap-0.5"
                  title="Mention Faculty"
                >
                  <AtSign className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Sender Role Switcher */}
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="text-slate-400 hidden sm:inline">Sending as:</span>
                <select
                  value={simulatedRole}
                  onChange={(e) => setSimulatedRole(e.target.value as any)}
                  className="bg-transparent font-bold text-indigo-600 focus:outline-none cursor-pointer"
                >
                  <option value="CURRENT">You ({currentUser.name})</option>
                  <option value="COORDINATOR">Dr. Sheetal Patil (Coordinator)</option>
                  <option value="INDUSTRY_PARTNER">Rahul Kapoor (Industry Mentor)</option>
                </select>
              </div>
            </div>

            {/* Input Textarea */}
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder={`Message ${channelDisplayName}... (Press Enter to send)`}
              rows={2}
              className="w-full px-4 py-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none resize-none placeholder-slate-400"
            />

            {/* Bottom Actions Bar */}
            <div className="flex items-center justify-between px-3 py-2 border-t border-slate-100 bg-white">
              {/* Attachment Actions */}
              <div className="flex items-center gap-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors flex items-center gap-1 text-xs"
                  title="Attach file from device"
                >
                  <Paperclip className="w-4 h-4" />
                  <span className="hidden sm:inline font-semibold">Attach File</span>
                </button>

                {/* Quick Sample File Adders */}
                <div className="hidden sm:flex items-center gap-1 ml-2">
                  <button
                    type="button"
                    onClick={() => addSampleFile('pdf')}
                    className="px-2 py-0.5 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                  >
                    + Sample PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => addSampleFile('csv')}
                    className="px-2 py-0.5 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                  >
                    + Dataset CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => addSampleFile('image')}
                    className="px-2 py-0.5 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                  >
                    + Diagram PNG
                  </button>
                </div>
              </div>

              {/* Send Button */}
              <Button
                type="submit"
                variant="primary"
                size="sm"
                rightIcon={<Send className="w-3.5 h-3.5" />}
                className="bg-indigo-600 hover:bg-indigo-700 font-semibold"
              >
                Send
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* ─── FILE PREVIEW MODAL ─── */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                {getFileIcon(previewFile.type)}
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{previewFile.name}</h3>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {previewFile.size} • Shared in {channelDisplayName}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content Preview */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 min-h-[240px] flex items-center justify-center overflow-hidden">
              {previewFile.previewUrl ? (
                <img
                  src={previewFile.previewUrl}
                  alt={previewFile.name}
                  className="max-h-[350px] object-contain rounded-lg shadow-xs"
                />
              ) : (
                <div className="text-center space-y-2">
                  <FileText className="w-12 h-12 text-slate-400 mx-auto" />
                  <div className="text-xs font-semibold text-slate-700">
                    Document preview ready for download
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Verified by V-Bridge File Service
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setPreviewFile(null)}>
                Close
              </Button>
              <a
                href={previewFile.previewUrl || '#'}
                download={previewFile.name}
                onClick={() => alert(`Downloaded ${previewFile.name}`)}
              >
                <Button variant="primary" size="sm" leftIcon={<Download className="w-3.5 h-3.5" />}>
                  Download Document
                </Button>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
