'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@components/common/Card';
import { Button } from '@components/common/Button';
import {
  BarChart3,
  Download,
  TrendingUp,
  ShieldCheck,
  Clock,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

interface AuditLogItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actor: {
    name: string;
    role: string;
    email?: string;
  };
  ipAddress: string;
  timestampUtc: string;
}

interface ReportMetrics {
  activeProjects: number;
  yoyEnrollmentChange: string;
  averageRubricScore: string;
  milestoneSubmissions: number;
  certificatesIssued: number;
  ledgerIntegrity: string;
  tamperingAnomalies: number;
  totalStudents: number;
  totalTeams: number;
}

export const AnalyticsAuditReports: React.FC = () => {
  const [metrics, setMetrics] = useState<ReportMetrics>({
    activeProjects: 3,
    yoyEnrollmentChange: '+18% YoY Enrollment',
    averageRubricScore: '84.2%',
    milestoneSubmissions: 12,
    certificatesIssued: 0,
    ledgerIntegrity: '100%',
    tamperingAnomalies: 0,
    totalStudents: 12,
    totalTeams: 3,
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportingType, setExportingType] = useState<'naac' | 'abet' | null>(null);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/admin/reports');
      if (res.ok) {
        const data = await res.json();
        if (data.metrics) setMetrics(data.metrics);
        if (data.auditLogs) setAuditLogs(data.auditLogs);
      }
    } catch (err) {
      console.error('Failed to fetch institutional report data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, []);

  const handleExport = async (type: 'naac' | 'abet') => {
    try {
      setExportingType(type);
      const res = await fetch(`/api/v1/admin/reports?export=${type}`);
      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download =
        type === 'naac'
          ? `NAAC_SSR_Compliance_${new Date().toISOString().slice(0, 10)}.json`
          : `ABET_Audit_Data_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Failed to download report: ' + err.message);
    } finally {
      setExportingType(null);
    }
  };

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
            NAAC, NBA, and ABET compliance data exports derived directly from platform-verified project submissions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/coordinator/roster-upload">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<FileSpreadsheet className="w-4 h-4 text-indigo-600" />}
            >
              Upload Cohort (Excel/PDF)
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            isLoading={exportingType === 'naac'}
            onClick={() => handleExport('naac')}
          >
            Export NAAC SSR
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            isLoading={exportingType === 'abet'}
            onClick={() => handleExport('abet')}
          >
            Export ABET Audit Data
          </Button>
        </div>
      </div>

      {/* ─── Metrics Cards (Dynamic from Database) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card padding="md">
          <div className="text-xs font-semibold text-slate-400 uppercase">
            Active Groups / Projects
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-display mt-1">
            {metrics.activeProjects}
          </div>
          <div className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{metrics.yoyEnrollmentChange}</span>
          </div>
        </Card>

        <Card padding="md">
          <div className="text-xs font-semibold text-slate-400 uppercase">
            Average Rubric Score
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-display mt-1">
            {metrics.averageRubricScore}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Across {metrics.milestoneSubmissions} verified milestone submissions
          </div>
        </Card>

        <Card padding="md">
          <div className="text-xs font-semibold text-slate-400 uppercase">
            Official Certificates Issued
          </div>
          <div className="text-3xl font-extrabold text-indigo-600 font-display mt-1">
            {metrics.certificatesIssued}
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
            {metrics.ledgerIntegrity}
          </div>
          <div className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{metrics.tamperingAnomalies} Tampering Anomalies</span>
          </div>
        </Card>
      </div>

      {/* ─── Audit Trail Inspection (Dynamic FR-130) ─── */}
      <Card padding="none" className="overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 font-display flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span>System-Wide Cryptographic Audit Trail (FR-130)</span>
          </h3>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchReportsData}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Log</span>
            </button>
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">
              Append-only verification log
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Loading live cryptographic audit trail...
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No audit records found.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {auditLogs.map((log) => (
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
        )}
      </Card>
    </div>
  );
};
