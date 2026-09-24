'use client';

import React, { useState } from 'react';
import { Card } from '@components/common/Card';
import { Button } from '@components/common/Button';
import { Modal } from '@components/common/Modal';
import { Badge } from '@components/common/Badge';
import {
  Search,
  Filter,
  Users,
  Clock,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { MOCK_ACTIVITIES, MOCK_USERS_LIST } from '@services/mockData';
import type { Activity, ActivityCategory } from '@/types';
import { capacityPercent } from '@lib/utils';

export const OpportunityCatalogue: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');

  // Application Modal state
  const [applyingActivity, setApplyingActivity] = useState<Activity | null>(null);
  const [sop, setSop] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const categories = [
    { label: 'All Categories', value: 'ALL' },
    { label: 'Capstone', value: 'CAPSTONE' },
    { label: 'Research', value: 'RESEARCH' },
    { label: 'Hackathon', value: 'HACKATHON' },
    { label: 'Industry Project', value: 'INDUSTRY_PROJECT' },
  ];

  const filteredActivities = MOCK_ACTIVITIES.filter((act) => {
    const matchesSearch =
      act.title.toLowerCase().includes(search.toLowerCase()) ||
      act.description.toLowerCase().includes(search.toLowerCase());
    const matchesCat =
      selectedCategory === 'ALL' || act.category === selectedCategory;
    const matchesDept =
      selectedDept === 'ALL' || act.department === selectedDept;
    return matchesSearch && matchesCat && matchesDept;
  });

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setApplyingActivity(null);
      setSop('');
      setPortfolioUrl('');
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ─── Hero Header ─── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-200">
            Open Opportunity Registry
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
          Academic Opportunities & Industry Projects
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
          Discover multidisciplinary Capstone challenges, funded research initiatives, and hackathons. Applications are screened and matched with certified faculty supervisors.
        </p>
      </div>

      {/* ─── Filters & Search Toolbar ─── */}
      <Card padding="md" className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by keywords, machine learning, energy grid, blockchain..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="ALL">All Departments</option>
            <option value="CS & AI">Computer Science & AI</option>
            <option value="Bioinformatics">Bioinformatics</option>
            <option value="Electrical Engineering">Electrical Engineering</option>
          </select>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1 flex-shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Category:</span>
          </span>
          {categories.map((c) => (
            <button
              key={c.value}
              onClick={() => setSelectedCategory(c.value)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === c.value
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </Card>

      {/* ─── Opportunity Grid ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredActivities.map((act) => {
          const supervisor = MOCK_USERS_LIST.find((u) => u.id === act.supervisorId);
          const percent = capacityPercent(act.filledSeats, act.capacity);

          return (
            <Card
              key={act.id}
              hoverEffect
              padding="lg"
              className="flex flex-col justify-between border-slate-200/90"
            >
              <div className="space-y-3">
                {/* Header Pills */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                    {act.category.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {act.department}
                  </span>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-display line-clamp-2">
                    {act.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-3 mt-1.5 leading-relaxed">
                    {act.description}
                  </p>
                </div>

                {/* Prerequisites Tags */}
                {act.prerequisites && act.prerequisites.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {act.prerequisites.map((req, i) => (
                      <span
                        key={i}
                        className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono"
                      >
                        {req}
                      </span>
                    ))}
                  </div>
                )}

                {/* Capacity Fill Bar */}
                <div className="space-y-1 pt-2">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>Cohort Capacity</span>
                    </span>
                    <span className="font-semibold text-slate-800">
                      {act.filledSeats} / {act.capacity} seats ({percent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        percent >= 90 ? 'bg-rose-500' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* Supervisor Snippet */}
                {supervisor && (
                  <div className="pt-2 flex items-center gap-2 border-t border-slate-100">
                    <img
                      src={supervisor.avatarUrl}
                      alt={supervisor.name}
                      className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200"
                    />
                    <div className="text-xs text-slate-600 truncate">
                      Lead: <span className="font-semibold text-slate-800">{supervisor.name}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Closes 15 Oct</span>
                </span>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setApplyingActivity(act)}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Apply Now
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* ─── Application Modal ─── */}
      <Modal
        isOpen={!!applyingActivity}
        onClose={() => setApplyingActivity(null)}
        title={applyingActivity ? `Apply: ${applyingActivity.title}` : 'Apply for Opportunity'}
        description="Submit your Statement of Purpose and portfolio link. Applications are audited and forwarded directly to the supervising faculty."
        maxWidth="lg"
      >
        {submitted ? (
          <div className="text-center py-8 space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 font-display">
              Application Successfully Logged!
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Your application has been registered on the institutional ledger (FR-031). You will receive an alert once the coordinator reviews your profile.
            </p>
          </div>
        ) : (
          <form onSubmit={handleApply} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Statement of Purpose / Motivation (Required)
              </label>
              <textarea
                required
                rows={4}
                value={sop}
                onChange={(e) => setSop(e.target.value)}
                placeholder="Explain why your team or background aligns with this project..."
                className="w-full p-3 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Portfolio or GitHub URL
              </label>
              <input
                type="url"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="https://github.com/username/project"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 leading-relaxed">
              <strong>Institutional Policy Note:</strong> By submitting, you confirm you meet the stated prerequisites and commit to completing all milestone deliverables if accepted.
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setApplyingActivity(null)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Submit Application
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
