'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@components/common/Card';
import { Button } from '@components/common/Button';
import { Badge } from '@components/common/Badge';
import {
  Users2,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Shield,
  Search,
} from 'lucide-react';
import { MOCK_APPLICATIONS, MOCK_ACTIVITIES } from '@services/mockData';
import type { ApplicationStatus } from '@/types';
import { getApplicationBadge } from '@lib/utils';

export const ApplicationPipeline: React.FC = () => {
  const [applications, setApplications] = useState(MOCK_APPLICATIONS);
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus | 'ALL'>('ALL');
  const [loading, setLoading] = useState(false);
  const activity = MOCK_ACTIVITIES[0];

  useEffect(() => {
    async function loadApplications() {
      try {
        const res = await fetch('/api/v1/applications');
        if (res.ok) {
          const json = await res.json();
          if (json.data && Array.isArray(json.data) && json.data.length > 0) {
            setApplications(json.data);
          }
        }
      } catch (err) {
        console.warn('Using default demo applications:', err);
      }
    }
    loadApplications();
  }, []);

  const handleUpdateStatus = async (appId: string, newStatus: ApplicationStatus) => {
    // 1. Optimistic UI update
    setApplications((prev) =>
      prev.map((app) =>
        app.id === appId ? { ...app, status: newStatus } : app
      )
    );

    // 2. Dispatch state machine verb to backend
    const verb = newStatus === 'ACCEPTED' ? 'accept' : newStatus === 'REJECTED' ? 'reject' : 'waitlist';
    try {
      await fetch(`/api/v1/applications/${appId}/${verb}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      console.warn(`[Pipeline] Offline/mock mode fallback for application ${appId} -> ${verb}`);
    }
  };

  const filtered = applications.filter(
    (app) => selectedStatus === 'ALL' || app.status === selectedStatus
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-200">
              Pipeline Management (FR-031)
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-display mt-1">
            Application Review Pipeline
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            {activity.title} • {activity.filledSeats} / {activity.capacity} seats filled
          </p>
        </div>

        {/* Capacity Warning Chip */}
        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-600" />
          <span>Capacity Locks Active (Row-level transactional safety)</span>
        </div>
      </div>

      {/* ─── Applications List ─── */}
      <Card padding="none" className="overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users2 className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900 font-display">
              Candidate Applications
            </h3>
            <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full font-medium text-slate-600">
              {filtered.length} total
            </span>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filtered.map((app) => {
            const badge = getApplicationBadge(app.status);
            return (
              <div
                key={app.id}
                className="p-5 hover:bg-slate-50/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-3">
                    <img
                      src={app.student?.avatarUrl}
                      alt={app.student?.name}
                      className="w-9 h-9 rounded-full bg-slate-200"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {app.student?.name}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {app.student?.department} • PRN: {app.student?.institutionalId} • GPA: <span className="font-bold text-slate-700">{app.gpa}</span>
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/80 leading-relaxed">
                    <strong>Statement of Purpose:</strong> {app.statementOfPurpose}
                  </p>

                  {app.portfolioUrl && (
                    <a
                      href={app.portfolioUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline font-medium"
                    >
                      <span>View Candidate Portfolio</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {/* Status & Actions */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-shrink-0">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${badge.classes}`}
                  >
                    {badge.label}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {app.status !== 'ACCEPTED' && (
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleUpdateStatus(app.id, 'ACCEPTED')}
                        leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                      >
                        Accept
                      </Button>
                    )}

                    {app.status !== 'REJECTED' && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleUpdateStatus(app.id, 'REJECTED')}
                        leftIcon={<XCircle className="w-3.5 h-3.5" />}
                      >
                        Reject
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
