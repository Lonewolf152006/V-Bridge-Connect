'use client';

import React, { useState } from 'react';
import { Card } from '@components/common/Card';
import { Button } from '@components/common/Button';
import { InitialsAvatar } from '@components/common/InitialsAvatar';
import {
  Code2,
  GitBranch,
  GitCommit,
  GitPullRequest,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Folder,
  FileCode,
  FileText,
  File,
  ChevronRight,
  ChevronDown,
  Terminal,
  ShieldCheck,
  Clock,
  Search,
  Plus,
  Play,
  AlertCircle,
  Link as LinkIcon,
  X,
} from 'lucide-react';

interface CommitItem {
  id: string;
  sha: string;
  message: string;
  body?: string;
  author: {
    name: string;
    avatar: string;
    role: string;
  };
  branch: string;
  date: string;
  filesChanged: number;
  additions: number;
  deletions: number;
  diffSummary?: { file: string; status: 'added' | 'modified' | 'deleted' }[];
}

interface PullRequestItem {
  id: number;
  title: string;
  branch: string;
  targetBranch: string;
  author: string;
  authorAvatar: string;
  status: 'OPEN' | 'MERGED' | 'CHANGES_REQUESTED';
  createdAt: string;
  commentsCount: number;
  reviewers: { name: string; status: 'APPROVED' | 'PENDING' }[];
  labels: string[];
}

interface FileTreeItem {
  name: string;
  path: string;
  type: 'folder' | 'file';
  size?: string;
  children?: FileTreeItem[];
  content?: string;
  language?: string;
}

const SAMPLE_FILES: FileTreeItem[] = [
  {
    name: 'src',
    path: 'src',
    type: 'folder',
    children: [
      {
        name: 'controllers',
        path: 'src/controllers',
        type: 'folder',
        children: [
          {
            name: 'pipeline_stream.py',
            path: 'src/controllers/pipeline_stream.py',
            type: 'file',
            size: '4.2 KB',
            language: 'python',
            content: `"""
Autonomous Stream Ingestion Controller
V-Bridge Connect Capstone Project - Team Mini 6
"""
import asyncio
import logging
from typing import AsyncGenerator, Dict, Any

logger = logging.getLogger("autonomous_pipeline")

class StreamPipelineController:
    def __init__(self, buffer_size: int = 1024, max_workers: int = 4):
        self.buffer_size = buffer_size
        self.max_workers = max_workers
        self.is_active = False
        self._queue: asyncio.Queue = asyncio.Queue(maxsize=buffer_size)

    async def initialize(self) -> bool:
        """Initialize telemetry buffers and ML inference hooks."""
        logger.info("Initializing 128ch high-throughput sensor stream...")
        self.is_active = True
        return True

    async def ingest_packet(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Process packet with zero-copy buffer mitigation."""
        if not self.is_active:
            raise RuntimeError("Pipeline controller is offline")
            
        timestamp = payload.get("ts")
        telemetry = payload.get("data", [])
        
        # RL Pre-processing pass
        processed = [val * 0.985 for val in telemetry]
        return {
            "status": "INGESTED",
            "channels": len(telemetry),
            "timestamp": timestamp,
            "processed": processed
        }

    async def shutdown(self):
        self.is_active = False
        logger.info("Pipeline controller cleanly terminated.")
`,
          },
          {
            name: 'buffer_guard.py',
            path: 'src/controllers/buffer_guard.py',
            type: 'file',
            size: '2.1 KB',
            language: 'python',
            content: `import sys

def check_buffer_saturation(queue_len: int, threshold: int = 800) -> bool:
    """Mitigate buffer overrun on 128-channel sensory telemetry."""
    if queue_len > threshold:
        sys.stderr.write(f"[WARN] Ingestion queue approaching saturation: {queue_len}\\n")
        return False
    return True
`,
          },
        ],
      },
      {
        name: 'models',
        path: 'src/models',
        type: 'folder',
        children: [
          {
            name: 'rl_agent.py',
            path: 'src/models/rl_agent.py',
            type: 'file',
            size: '3.8 KB',
            language: 'python',
            content: `import torch
import torch.nn as nn

class AutonomousRLController(nn.Module):
    def __init__(self, state_dim: int = 64, action_dim: int = 12):
        super().__init__()
        self.network = nn.Sequential(
            nn.Linear(state_dim, 256),
            nn.LayerNorm(256),
            nn.GELU(),
            nn.Linear(256, 128),
            nn.GELU(),
            nn.Linear(128, action_dim),
            nn.Softmax(dim=-1)
        )

    def forward(self, state: torch.Tensor) -> torch.Tensor:
        return self.network(state)
`,
          },
        ],
      },
      {
        name: 'main.py',
        path: 'src/main.py',
        type: 'file',
        size: '1.4 KB',
        language: 'python',
        content: `import asyncio
from controllers.pipeline_stream import StreamPipelineController

async def main():
    pipeline = StreamPipelineController()
    await pipeline.initialize()
    print("[SUCCESS] Autonomous Pipeline daemon running on port 8080")

if __name__ == '__main__':
    asyncio.run(main())
`,
      },
    ],
  },
  {
    name: 'README.md',
    path: 'README.md',
    type: 'file',
    size: '2.8 KB',
    language: 'markdown',
    content: `# Autonomous Pipeline — V-Bridge Connect Capstone
**Department:** Electronics and Computer Science, VIT  
**Team:** Mini 6  
**Supervising Faculty:** Dr. Sheetal Patil  

## Overview
High-throughput telemetry ingestion & Reinforcement Learning controller pipeline designed for autonomous edge inference.

### Key Features
- Zero-copy buffer management on 128 simultaneous data channels.
- PyTorch based RL controller with sub-5ms decision latency.
- Automated CI/CD pipeline integrated with V-Bridge Connect evaluation rubrics.

### Quick Start
\`\`\`bash
git clone https://github.com/nexgen-ai/autonomous-pipeline.git
cd autonomous-pipeline
pip install -r requirements.txt
python src/main.py
\`\`\`
`,
  },
  {
    name: 'requirements.txt',
    path: 'requirements.txt',
    type: 'file',
    size: '320 B',
    language: 'text',
    content: `torch>=2.2.0
numpy>=1.26.0
asyncio>=3.4.3
websockets>=12.0
pytest>=8.0.0
ruff>=0.3.0
`,
  },
  {
    name: 'Dockerfile',
    path: 'Dockerfile',
    type: 'file',
    size: '480 B',
    language: 'dockerfile',
    content: `FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY src/ ./src/
EXPOSE 8080
CMD ["python", "src/main.py"]
`,
  },
];

const INITIAL_COMMITS: CommitItem[] = [
  {
    id: 'c1',
    sha: '7e9b4a1',
    message: 'fix(ingestion): buffer overrun mitigation on 128ch streams',
    body: 'Implements adaptive rate throttling and backpressure queue checks in buffer_guard.py.',
    author: {
      name: 'Yash Sachin Khanvilkar',
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=YashKhanvilkar',
      role: 'Student Lead',
    },
    branch: 'main',
    date: '2 hours ago',
    filesChanged: 2,
    additions: 48,
    deletions: 12,
    diffSummary: [
      { file: 'src/controllers/pipeline_stream.py', status: 'modified' },
      { file: 'src/controllers/buffer_guard.py', status: 'modified' },
    ],
  },
  {
    id: 'c2',
    sha: '3b8c2e1',
    message: 'feat(models): add synthetic test harness for RL controller',
    body: 'Added PyTest suite with 38 unit test cases validating tensor dimensions and convergence.',
    author: {
      name: 'Vedant Balvant Nikumbh',
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=VedantNikumbh',
      role: 'Student Collaborator',
    },
    branch: 'main',
    date: 'Yesterday at 3:15 PM',
    filesChanged: 3,
    additions: 142,
    deletions: 28,
    diffSummary: [
      { file: 'src/models/rl_agent.py', status: 'modified' },
      { file: 'tests/test_rl.py', status: 'added' },
      { file: 'requirements.txt', status: 'modified' },
    ],
  },
  {
    id: 'c3',
    sha: 'a1c0f94',
    message: 'docs: architecture design spec initial draft v1',
    body: 'Deliverable documentation for Milestone 2 submission including system flowchart.',
    author: {
      name: 'Paras Rajeev Shah',
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=ParasShah',
      role: 'Student Collaborator',
    },
    branch: 'main',
    date: '3 days ago',
    filesChanged: 1,
    additions: 89,
    deletions: 4,
    diffSummary: [{ file: 'README.md', status: 'modified' }],
  },
  {
    id: 'c4',
    sha: 'c84d102',
    message: 'chore(docker): containerize pipeline service for evaluation sandbox',
    body: 'Added multi-stage Dockerfile and healthcheck probe.',
    author: {
      name: 'Vedant Nilesh Patole',
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=VedantPatole',
      role: 'Student Collaborator',
    },
    branch: 'develop',
    date: '5 days ago',
    filesChanged: 2,
    additions: 32,
    deletions: 6,
    diffSummary: [
      { file: 'Dockerfile', status: 'added' },
      { file: '.dockerignore', status: 'added' },
    ],
  },
];

const INITIAL_PRS: PullRequestItem[] = [
  {
    id: 14,
    title: 'feat: Implement adaptive buffer throttling for Milestone 2 live demo',
    branch: 'feature/buffer-throttle',
    targetBranch: 'main',
    author: 'Yash Sachin Khanvilkar',
    authorAvatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=YashKhanvilkar',
    status: 'OPEN',
    createdAt: 'Today at 11:20 AM',
    commentsCount: 4,
    reviewers: [
      { name: 'Dr. Sheetal Patil (Lead Mentor)', status: 'APPROVED' },
      { name: 'Rahul Kapoor (Industry Mentor)', status: 'PENDING' },
    ],
    labels: ['milestone-2', 'backend', 'enhancement'],
  },
  {
    id: 12,
    title: 'fix: Address WebSocket stream memory leak in telemetry bridge',
    branch: 'bugfix/ws-memory-leak',
    targetBranch: 'main',
    author: 'Vedant Balvant Nikumbh',
    authorAvatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=VedantNikumbh',
    status: 'MERGED',
    createdAt: '3 days ago',
    commentsCount: 2,
    reviewers: [{ name: 'Dr. Sheetal Patil', status: 'APPROVED' }],
    labels: ['bug', 'performance'],
  },
  {
    id: 9,
    title: 'docs: Milestone 1 System Architecture Specification v2',
    branch: 'docs/m1-spec',
    targetBranch: 'main',
    author: 'Paras Rajeev Shah',
    authorAvatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=ParasShah',
    status: 'MERGED',
    createdAt: '1 week ago',
    commentsCount: 5,
    reviewers: [{ name: 'Prof. Akhil Masurkar', status: 'APPROVED' }],
    labels: ['documentation', 'approved'],
  },
];

export const WorkspaceRepositoryTab: React.FC = () => {
  const [repoUrl, setRepoUrl] = useState('https://github.com/nexgen-ai/autonomous-pipeline');
  const [selectedBranch, setSelectedBranch] = useState('main');
  const [activeSubTab, setActiveSubTab] = useState<'commits' | 'code' | 'prs' | 'cicd'>('commits');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);

  // File explorer state
  const [selectedFile, setSelectedFile] = useState<FileTreeItem>(SAMPLE_FILES[0].children![0].children![0]);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    src: true,
    'src/controllers': true,
    'src/models': false,
  });

  // Commit diff expansion
  const [expandedCommitId, setExpandedCommitId] = useState<string | null>('c1');

  // Clone modal state
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [showEditRepoModal, setShowEditRepoModal] = useState(false);
  const [tempRepoUrl, setTempRepoUrl] = useState(repoUrl);

  // Pull Requests state
  const [prs, setPrs] = useState<PullRequestItem[]>(INITIAL_PRS);
  const [showNewPrModal, setShowNewPrModal] = useState(false);
  const [newPrTitle, setNewPrTitle] = useState('');
  const [newPrBranch, setNewPrBranch] = useState('feature/buffer-throttle');
  const [newPrTarget, setNewPrTarget] = useState('main');
  const [newPrDescription, setNewPrDescription] = useState('');

  const handleCreatePr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrTitle.trim()) return;

    const newPr: PullRequestItem = {
      id: prs.length + 10,
      title: newPrTitle.trim(),
      branch: newPrBranch,
      targetBranch: newPrTarget,
      author: 'Harshad Panchal',
      authorAvatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=HarshadPanchal',
      status: 'OPEN',
      createdAt: 'Just now',
      commentsCount: 0,
      reviewers: [{ name: 'Dr. Sheetal Patil (Lead Mentor)', status: 'PENDING' }],
      labels: ['student-submission', 'in-review'],
    };

    setPrs([newPr, ...prs]);
    setShowNewPrModal(false);
    setNewPrTitle('');
    setNewPrDescription('');
    setRefreshMessage(`Pull request #${newPr.id} created successfully!`);
    setTimeout(() => setRefreshMessage(null), 4000);
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshMessage(null);
    setTimeout(() => {
      setIsRefreshing(false);
      setRefreshMessage('Repository synchronized with origin/' + selectedBranch + ' • All commits up to date');
      setTimeout(() => setRefreshMessage(null), 4000);
    }, 800);
  };

  const filteredCommits = INITIAL_COMMITS.filter((c) =>
    c.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.sha.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.author.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* ─── Top Repository Bar ─── */}
      <Card padding="md" className="border-slate-200/90 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="p-1.5 rounded-lg bg-slate-900 text-white">
                <Code2 className="w-4 h-4" />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 font-display flex items-center gap-1.5">
                <span>{repoUrl.replace('https://github.com/', '')}</span>
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Webhook Active
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <GitBranch className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-700">4 Branches</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <GitCommit className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-700">142 Commits</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                <span className="font-semibold text-indigo-600">Faculty Review Required for Merge</span>
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Branch Selector */}
            <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
              <GitBranch className="w-3.5 h-3.5 text-slate-600" />
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="main">main</option>
                <option value="develop">develop</option>
                <option value="feature/buffer-throttle">feature/buffer-throttle</option>
                <option value="v1.0-release">v1.0-release</option>
              </select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              isLoading={isRefreshing}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
            >
              Sync
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCloneModal(true)}
              leftIcon={<Terminal className="w-3.5 h-3.5" />}
            >
              Clone
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTempRepoUrl(repoUrl);
                setShowEditRepoModal(true);
              }}
              leftIcon={<LinkIcon className="w-3.5 h-3.5" />}
            >
              Edit Repo
            </Button>

            <a
              href={repoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors"
            >
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>
        </div>

        {refreshMessage && (
          <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{refreshMessage}</span>
          </div>
        )}
      </Card>

      {/* ─── Sub-Tabs Bar ─── */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('commits')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-colors flex items-center gap-2 ${
              activeSubTab === 'commits'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <GitCommit className="w-4 h-4" />
            <span>Commits ({filteredCommits.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('code')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-colors flex items-center gap-2 ${
              activeSubTab === 'code'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>File Explorer & Code</span>
          </button>

          <button
            onClick={() => setActiveSubTab('prs')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-colors flex items-center gap-2 ${
              activeSubTab === 'prs'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <GitPullRequest className="w-4 h-4" />
            <span>Pull Requests ({prs.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('cicd')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-colors flex items-center gap-2 ${
              activeSubTab === 'cicd'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>CI / CD Actions</span>
          </button>
        </div>

        {activeSubTab === 'commits' && (
          <div className="relative hidden sm:block">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search commit or SHA..."
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        )}
      </div>

      {/* ─── SUB-TAB 1: COMMITS HISTORY ─── */}
      {activeSubTab === 'commits' && (
        <div className="space-y-3">
          {filteredCommits.map((commit) => {
            const isExpanded = expandedCommitId === commit.id;
            return (
              <Card
                key={commit.id}
                padding="md"
                className="border-slate-200 hover:border-slate-300 transition-all shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <InitialsAvatar name={commit.author.name} size="md" className="mt-0.5" />
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{commit.message}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                          {commit.branch}
                        </span>
                      </div>

                      {commit.body && (
                        <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                          {commit.body}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1">
                        <span className="font-semibold text-slate-800">{commit.author.name}</span>
                        <span className="text-indigo-600 font-medium">({commit.author.role})</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{commit.date}</span>
                        </span>
                        <span>•</span>
                        <span className="text-emerald-600 font-medium">+{commit.additions}</span>
                        <span className="text-rose-600 font-medium">-{commit.deletions}</span>
                      </div>
                    </div>
                  </div>

                  {/* SHA & Diff details toggle */}
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <button
                      onClick={() => copyToClipboard(commit.sha, commit.id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs font-semibold transition-colors"
                      title="Copy full commit SHA"
                    >
                      {copiedType === commit.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-slate-400" />
                          <span>{commit.sha}</span>
                        </>
                      )}
                    </button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExpandedCommitId(isExpanded ? null : commit.id)}
                      className="text-xs"
                    >
                      {isExpanded ? 'Hide Diff' : 'View Diff'}
                    </Button>
                  </div>
                </div>

                {/* Expanded Diff Preview */}
                {isExpanded && commit.diffSummary && (
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 animate-in fade-in duration-200">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Modified Files ({commit.diffSummary.length})
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {commit.diffSummary.map((diff, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono"
                        >
                          <span className="text-slate-800 truncate">{diff.file}</span>
                          <span
                            className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                              diff.status === 'added'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {diff.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* ─── SUB-TAB 2: FILE EXPLORER & CODE ─── */}
      {activeSubTab === 'code' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* File Tree (Left 4 cols) */}
          <Card padding="sm" className="lg:col-span-4 border-slate-200 overflow-hidden">
            <div className="p-2 border-b border-slate-100 font-bold text-xs text-slate-800 flex items-center justify-between">
              <span>Repository Tree</span>
              <span className="text-[10px] text-slate-400 font-mono">branch: {selectedBranch}</span>
            </div>
            <div className="p-2 space-y-1 text-xs max-h-[500px] overflow-y-auto">
              {SAMPLE_FILES.map((item) => renderTreeItem(item, 0))}
            </div>
          </Card>

          {/* Code Viewer (Right 8 cols) */}
          <div className="lg:col-span-8">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-lg">
              {/* Code Header */}
              <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-indigo-400" />
                  <span className="font-mono text-slate-200 font-semibold">{selectedFile.path}</span>
                  {selectedFile.size && (
                    <span className="text-[10px] text-slate-500 font-mono">({selectedFile.size})</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(selectedFile.content || '', 'code')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-xs font-mono"
                  >
                    {copiedType === 'code' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-400" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Code Editor Body */}
              <div className="p-4 overflow-x-auto text-xs font-mono text-slate-300 leading-relaxed max-h-[500px] bg-slate-950">
                <pre className="grid grid-cols-[auto_1fr] gap-4">
                  <span className="text-slate-600 select-none text-right pr-2 border-r border-slate-800">
                    {(selectedFile.content || '')
                      .split('\n')
                      .map((_, i) => (
                        <span key={i} className="block">
                          {i + 1}
                        </span>
                      ))}
                  </span>
                  <code className="text-slate-200 whitespace-pre">
                    {selectedFile.content || '// Empty file'}
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── SUB-TAB 3: PULL REQUESTS ─── */}
      {activeSubTab === 'prs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Active peer reviews and milestone code submissions
            </div>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setShowNewPrModal(true)}
            >
              New Pull Request
            </Button>
          </div>

          <div className="space-y-3">
            {prs.map((pr) => (
              <Card key={pr.id} padding="md" className="border-slate-200 hover:border-slate-300">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-slate-400 font-bold">#{pr.id}</span>
                      <h4 className="font-bold text-slate-900 text-sm">{pr.title}</h4>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          pr.status === 'OPEN'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}
                      >
                        {pr.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>By <strong className="text-slate-800">{pr.author}</strong></span>
                      <span>•</span>
                      <span className="font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                        {pr.branch}
                      </span>
                      <span>into</span>
                      <span className="font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                        {pr.targetBranch}
                      </span>
                      <span>•</span>
                      <span>{pr.createdAt}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {pr.labels.map((label) => (
                        <span
                          key={label}
                          className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Reviewers */}
                  <div className="text-right space-y-1 flex-shrink-0">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Faculty / Mentor Reviews
                    </div>
                    {pr.reviewers.map((rev, i) => (
                      <div key={i} className="text-xs font-semibold flex items-center gap-1.5 justify-end">
                        <span className="text-slate-800">{rev.name}</span>
                        {rev.status === 'APPROVED' ? (
                          <span className="text-emerald-600 text-[10px] font-bold">● Approved</span>
                        ) : (
                          <span className="text-amber-600 text-[10px] font-bold">● Review Pending</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ─── SUB-TAB 4: CI/CD ACTIONS ─── */}
      {activeSubTab === 'cicd' && (
        <Card padding="md" className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-display">
                Automated Verification & Pipeline Runs
              </h3>
              <p className="text-xs text-slate-500">
                Continuous integration checks connected to GitHub Actions webhook
              </p>
            </div>
            <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-full border border-emerald-200">
              Pipeline Healthy (100% Pass)
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div>
                  <div className="font-bold text-slate-800">
                    Sprint 2 Test Matrix & Inference Benchmark #48
                  </div>
                  <div className="text-slate-500 text-[11px] font-mono">
                    commit 7e9b4a1 • branch: main • triggered by Yash Khanvilkar
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-slate-600 font-mono">
                <span>38 tests passed</span>
                <span>Coverage: 92%</span>
                <span className="text-slate-400">1m 45s</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div>
                  <div className="font-bold text-slate-800">
                    Static Security Scan & Vulnerability Audit #47
                  </div>
                  <div className="text-slate-500 text-[11px] font-mono">
                    CodeQL Analysis • 0 high/critical issues found
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-slate-600 font-mono">
                <span className="text-emerald-600">0 vulnerabilities</span>
                <span className="text-slate-400">54s</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div>
                  <div className="font-bold text-slate-800">
                    Docker Container Build & Sandbox Validation #46
                  </div>
                  <div className="text-slate-500 text-[11px] font-mono">
                    Tagged as v1.2.0-rc1 • Ready for faculty demonstration
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-slate-600 font-mono">
                <span>Image: 184MB</span>
                <span className="text-slate-400">2m 10s</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ─── CLONE REPOSITORY MODAL ─── */}
      {showCloneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-600" />
                <span>Clone this Repository</span>
              </h3>
              <button
                onClick={() => setShowCloneModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">HTTPS Clone</label>
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 font-mono text-[11px]">
                  <span className="flex-1 truncate">{repoUrl}.git</span>
                  <button
                    onClick={() => copyToClipboard(`git clone ${repoUrl}.git`, 'https')}
                    className="px-2 py-1 bg-white hover:bg-slate-100 rounded border border-slate-200 text-slate-700 font-sans font-semibold"
                  >
                    {copiedType === 'https' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">SSH Clone</label>
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 font-mono text-[11px]">
                  <span className="flex-1 truncate">git@github.com:nexgen-ai/autonomous-pipeline.git</span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        'git clone git@github.com:nexgen-ai/autonomous-pipeline.git',
                        'ssh'
                      )
                    }
                    className="px-2 py-1 bg-white hover:bg-slate-100 rounded border border-slate-200 text-slate-700 font-sans font-semibold"
                  >
                    {copiedType === 'ssh' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="primary" size="sm" onClick={() => setShowCloneModal(false)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── EDIT REPO MODAL ─── */}
      {showEditRepoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-indigo-600" />
                <span>Connected GitHub Repository URL</span>
              </h3>
              <button
                onClick={() => setShowEditRepoModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600">
                Update the official project repository link tracked by mentors and V-Bridge Connect evaluators.
              </p>
              <input
                type="url"
                value={tempRepoUrl}
                onChange={(e) => setTempRepoUrl(e.target.value)}
                placeholder="https://github.com/organization/repository"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowEditRepoModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setRepoUrl(tempRepoUrl.trim() || repoUrl);
                  setShowEditRepoModal(false);
                  setRefreshMessage('Repository link updated successfully!');
                  setTimeout(() => setRefreshMessage(null), 3000);
                }}
              >
                Save Repository
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── NEW PULL REQUEST MODAL ─── */}
      {showNewPrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <GitPullRequest className="w-4 h-4 text-indigo-600" />
                <span>Open New Pull Request</span>
              </h3>
              <button
                onClick={() => setShowNewPrModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePr} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  PR Title / Commit Summary
                </label>
                <input
                  type="text"
                  required
                  value={newPrTitle}
                  onChange={(e) => setNewPrTitle(e.target.value)}
                  placeholder="e.g. feat: Integrate sensory data stream buffer"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Source Branch
                  </label>
                  <select
                    value={newPrBranch}
                    onChange={(e) => setNewPrBranch(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none"
                  >
                    <option value="feature/buffer-throttle">feature/buffer-throttle</option>
                    <option value="develop">develop</option>
                    <option value="bugfix/ws-memory-leak">bugfix/ws-memory-leak</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Target Branch
                  </label>
                  <select
                    value={newPrTarget}
                    onChange={(e) => setNewPrTarget(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none"
                  >
                    <option value="main">main</option>
                    <option value="develop">develop</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Description & Deliverable Notes
                </label>
                <textarea
                  rows={3}
                  value={newPrDescription}
                  onChange={(e) => setNewPrDescription(e.target.value)}
                  placeholder="Describe your architectural changes and milestone verification details..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <Button variant="outline" size="sm" type="button" onClick={() => setShowNewPrModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Create Pull Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  function renderTreeItem(item: FileTreeItem, depth: number) {
    if (item.type === 'folder') {
      const isExpanded = !!expandedFolders[item.path];
      return (
        <div key={item.path} style={{ paddingLeft: `${depth * 12}px` }}>
          <button
            onClick={() => toggleFolder(item.path)}
            className="w-full text-left flex items-center gap-1.5 py-1 px-1.5 rounded-lg hover:bg-slate-100 text-slate-700 font-semibold transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            )}
            <Folder className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
            <span className="truncate">{item.name}</span>
          </button>
          {isExpanded && item.children && (
            <div>{item.children.map((child) => renderTreeItem(child, depth + 1))}</div>
          )}
        </div>
      );
    }

    const isSelected = selectedFile.path === item.path;
    return (
      <div key={item.path} style={{ paddingLeft: `${depth * 12 + 18}px` }}>
        <button
          onClick={() => setSelectedFile(item)}
          className={`w-full text-left flex items-center justify-between py-1 px-1.5 rounded-lg text-xs transition-colors ${
            isSelected
              ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200'
              : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <div className="flex items-center gap-1.5 truncate">
            {item.name.endsWith('.py') ? (
              <FileCode className="w-3.5 h-3.5 text-blue-500" />
            ) : item.name.endsWith('.md') ? (
              <FileText className="w-3.5 h-3.5 text-indigo-500" />
            ) : (
              <File className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span className="truncate">{item.name}</span>
          </div>
          {item.size && <span className="text-[10px] text-slate-400 font-mono ml-2">{item.size}</span>}
        </button>
      </div>
    );
  }
};
