'use client';

import React from 'react';
import { Card } from '@components/common/Card';
import { Button } from '@components/common/Button';
import {
  BarChart3,
  Download,
  FileCheck,
  TrendingUp,
  ShieldAlert,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { MOCK_AUDIT_LOGS } from '@services/mockData';

export const AnalyticsAuditReports: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-200">
            Institutional Audit & Accreditations
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 font-display mt-1">
            Analytics & Regulatory Compliance
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            NAAC, NBA, and ABET compliance data exports derived strictly from platform-verified project submissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={() => alert('NAAC SSR Compliance Report PDF generated.')}
          >
            Export NAAC SSR
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={() => alert('ABET Criterion 3 CSV Data exported.')}
          >
            Export ABET Audit Data
          </Button>
        </div>
      </div>

      {/* ─── Metrics Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card padding="md">
          <div className="text-xs font-semibold text-slate-400 uppercase">
            Active Projects
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-display mt-1">
            42
          </div>
          <div className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+18% YoY Enrollment</span>
          </div>
        </Card>

        <Card padding="md">
          <div className="text-xs font-semibold text-slate-400 uppercase">
            Average Rubric Score
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-display mt-1">
            84.2%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Across 128 milestone submissions
          </div>
        </Card>

        <Card padding="md">
          <div className="text-xs font-semibold text-slate-400 uppercase">
            Official Certificates Issued
          </div>
          <div className="text-3xl font-extrabold text-indigo-600 font-display mt-1">
            89
          </div>
          <div className="text-xs text-indigo-600 mt-1">
            Cryptographically signed (FR-114)
          </div>
        </Card>

        <Card padding="md">
          <div className="text-xs font-semibold text-slate-400 uppercase">
            Ledger Integrity
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 font-display mt-1">
            100%
          </div>
          <div className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>0 Tampering Anomalies</span>
          </div>
        </Card>
      </div>

      {/* ─── Audit Trail Inspection (FR-130) ─── */}
      <Card padding="none" className="overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 font-display flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span>System-Wide Cryptographic Audit Trail (FR-130)</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            Append-only verification log
          </span>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {MOCK_AUDIT_LOGS.map((log) => (
            <div
              key={log.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/60"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-indigo-600">
                    [{log.action}]
                  </span>
                  <span className="text-slate-800 font-medium">
                    Entity: {log.entityType} #{log.entityId}
                  </span>
                </div>
                <div className="text-slate-500">
                  Actor: {log.actor?.name} ({log.actor?.role}) • IP: {log.ipAddress}
                </div>
              </div>

              <div className="text-slate-400 font-mono text-[11px] whitespace-nowrap">
                {log.timestampUtc}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
