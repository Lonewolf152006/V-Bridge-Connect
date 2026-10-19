'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@components/common/Card';
import { Button } from '@components/common/Button';
import {
  FileSpreadsheet,
  Download,
  Search,
  CheckCircle2,
  AlertTriangle,
  Users,
  Eye,
  RefreshCw,
  ExternalLink,
  ClipboardCheck,
  Award,
  Filter,
} from 'lucide-react';
import type { Review2Evaluation } from '@/app/api/v1/evaluations/review-2/route';
import { Modal } from '@components/common/Modal';

export const Review2EvaluationAuditTable: React.FC = () => {
  const [evaluations, setEvaluations] = useState<Review2Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOutcome, setFilterOutcome] = useState<'ALL' | 'APPROVED' | 'MODIFICATIONS'>('ALL');
  const [selectedEval, setSelectedEval] = useState<Review2Evaluation | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const fetchEvaluations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/evaluations/review-2');
      if (res.ok) {
        const data = await res.json();
        setEvaluations(data.evaluations || []);
      }
    } catch (err) {
      console.warn('Failed to fetch Review-2 evaluations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluations();
  }, []);

  // Filtered list
  const filtered = evaluations.filter((item) => {
    const matchesSearch =
      item.groupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.suggestedTitle && item.suggestedTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.panelMember1.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.panelMember2.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesOutcome =
      filterOutcome === 'ALL' ||
      (filterOutcome === 'APPROVED' && item.ideaOutcome === 'Idea Approved') ||
      (filterOutcome === 'MODIFICATIONS' && item.ideaOutcome === 'Modifications required');

    return matchesSearch && matchesOutcome;
  });

  // Calculate live audit metrics
  const totalCount = evaluations.length;
  const approvedCount = evaluations.filter((e) => e.ideaOutcome === 'Idea Approved').length;
  const modificationsCount = evaluations.filter((e) => e.ideaOutcome === 'Modifications required').length;
  const avgScore =
    totalCount > 0
      ? (evaluations.reduce((sum, e) => sum + e.totalMarks, 0) / totalCount).toFixed(1)
      : '0.0';

  // 1-Click Excel Export for Authorities (NAAC/NBA/University audit)
  const handleExportToExcel = async () => {
    setIsExporting(true);
    try {
      const XLSX = await import('xlsx');
      const rows = evaluations.map((item, idx) => ({
        'Sr. No': idx + 1,
        'Project Group': item.groupName,
        'Suggested Project Title': item.suggestedTitle || 'N/A',
        'All Students Present?': item.allPresent,
        'Absent Students': item.absentStudents || 'NA',
        'Outcome of Idea Presentation': item.ideaOutcome,
        'Modifications Suggested by Panel': item.modificationsSuggested || 'NA',
        'Expected Outcome for TE Completion': item.expectedOutcome,
        'Planning (Score 1-10)': item.planningScore,
        'Planning (Mapped /5 M)': item.planningMarks,
        'Problem Clarity (Score 1-10)': item.problemClarityScore,
        'Problem Clarity (Mapped /10 M)': item.problemClarityMarks,
        'Literature Review (Score 1-10)': item.literatureReviewScore,
        'Literature Review (Mapped /15 M)': item.literatureReviewMarks,
        'Analysis & Usability (Score 1-10)': item.analysisScore,
        'Analysis & Usability (Mapped /20 M)': item.analysisMarks,
        'Total Marks (/50 M)': item.totalMarks,
        'Difficulty Level (/10)': item.difficultyLevel,
        'Presentation Quality (/10)': item.presentationQuality,
        'Proper English Speaking (/10)': item.englishProficiency,
        'Project Completed %': item.progressPercentage,
        'Panel Member 1': item.panelMember1,
        'Panel Member 2': item.panelMember2,
        'Attachment Name': item.attachmentName || 'None',
        'Evaluator Name': item.submittedByName,
        'Evaluator Email': item.submittedByEmail,
        'Evaluation Timestamp': new Date(item.submittedAt).toLocaleString(),
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);

      // Auto-fit column widths
      const colWidths = Object.keys(rows[0] || {}).map((key) => ({
        wch: Math.max(key.length + 3, 14),
      }));
      worksheet['!cols'] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'TE Review-2 Evaluations');

      const fileName = `TE_Mini_Project_Review_2_Evaluations_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (err: any) {
      console.error('Failed to export Review-2 Excel:', err);
      alert('Error exporting Excel: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card padding="none" className="overflow-hidden border-slate-200 shadow-sm">
      {/* ─── Header & Actions ─── */}
      <div className="p-5 border-b border-slate-100 bg-white space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold mb-1">
              <ClipboardCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>TE Mini-Project Review-2 (2026-27)</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-display">
              Panel Evaluation Records & Audit Ledger
            </h3>
            <p className="text-xs text-slate-500">
              Complete evaluation submissions filled by faculty review panels for all mini-project groups. Audit-ready for higher authorities.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className="w-3.5 h-3.5 text-slate-600" />}
              onClick={fetchEvaluations}
              disabled={loading}
            >
              Refresh
            </Button>

            <Button
              variant="primary"
              size="sm"
              leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-300" />}
              isLoading={isExporting}
              onClick={handleExportToExcel}
              className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold shadow-md shadow-emerald-700/20"
            >
              Export Review-2 Excel (.xlsx) for Audit
            </Button>
          </div>
        </div>

        {/* ─── KPI Metric Badges ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Groups Evaluated</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5 font-display">
              {totalCount}
            </div>
          </div>

          <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200/80">
            <div className="text-[11px] font-semibold text-emerald-800 uppercase">Idea Approved</div>
            <div className="text-2xl font-black text-emerald-700 mt-0.5 font-display">
              {approvedCount}
            </div>
          </div>

          <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/80">
            <div className="text-[11px] font-semibold text-amber-800 uppercase">Modifications Req.</div>
            <div className="text-2xl font-black text-amber-700 mt-0.5 font-display">
              {modificationsCount}
            </div>
          </div>

          <div className="p-3 bg-indigo-50/80 rounded-xl border border-indigo-200/80">
            <div className="text-[11px] font-semibold text-indigo-800 uppercase">Avg Total Marks</div>
            <div className="text-2xl font-black text-indigo-700 mt-0.5 font-display">
              {avgScore} <span className="text-xs font-normal text-slate-500">/ 50</span>
            </div>
          </div>
        </div>

        {/* ─── Search and Filter Controls ─── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search group, title, or panel member..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs font-semibold">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 mr-1">Outcome:</span>
            <button
              onClick={() => setFilterOutcome('ALL')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                filterOutcome === 'ALL'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => setFilterOutcome('APPROVED')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                filterOutcome === 'APPROVED'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Approved ({approvedCount})
            </button>
            <button
              onClick={() => setFilterOutcome('MODIFICATIONS')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                filterOutcome === 'MODIFICATIONS'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Modifications ({modificationsCount})
            </button>
          </div>
        </div>
      </div>

      {/* ─── Table ─── */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 animate-pulse">
          Loading Review-2 panel evaluations from database ledger...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-500">
          No evaluations matching the current filter.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Group</th>
                <th className="py-3 px-4">Suggested Title</th>
                <th className="py-3 px-4">Outcome</th>
                <th className="py-3 px-4 text-center">Planning (5M)</th>
                <th className="py-3 px-4 text-center">Problem (10M)</th>
                <th className="py-3 px-4 text-center">Lit Rev (15M)</th>
                <th className="py-3 px-4 text-center">Analysis (20M)</th>
                <th className="py-3 px-4 text-center">Total (/50)</th>
                <th className="py-3 px-4">Panel Evaluators</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 block font-display">
                      {item.groupName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(item.submittedAt).toLocaleDateString()}
                    </span>
                  </td>

                  <td className="py-3 px-4 max-w-xs truncate" title={item.suggestedTitle}>
                    {item.suggestedTitle || <span className="text-slate-400 italic">None suggested</span>}
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        item.ideaOutcome === 'Idea Approved'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {item.ideaOutcome === 'Idea Approved' ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                      )}
                      <span>{item.ideaOutcome}</span>
                    </span>
                  </td>

                  <td className="py-3 px-4 text-center font-mono">{item.planningMarks}</td>
                  <td className="py-3 px-4 text-center font-mono">{item.problemClarityMarks}</td>
                  <td className="py-3 px-4 text-center font-mono">{item.literatureReviewMarks}</td>
                  <td className="py-3 px-4 text-center font-mono">{item.analysisMarks}</td>

                  <td className="py-3 px-4 text-center">
                    <span className="font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200 font-mono">
                      {item.totalMarks}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-slate-600 whitespace-nowrap text-[11px]">
                    <div>{item.panelMember1}</div>
                    <div className="text-slate-400">{item.panelMember2}</div>
                  </td>

                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                      onClick={() => setSelectedEval(item)}
                      className="text-xs"
                    >
                      Inspect
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Detail Modal (Inspect Full 18-Question Response) ─── */}
      {selectedEval && (
        <Modal
          isOpen={Boolean(selectedEval)}
          onClose={() => setSelectedEval(null)}
          title={`Evaluation Details — ${selectedEval.groupName}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs text-slate-700 max-h-[75vh] overflow-y-auto pr-2">
            {/* Header Outcome Bar */}
            <div className={`p-4 rounded-2xl flex items-center justify-between gap-3 ${
              selectedEval.ideaOutcome === 'Idea Approved'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border border-amber-200 text-amber-900'
            }`}>
              <div>
                <span className="font-bold text-sm block">Outcome: {selectedEval.ideaOutcome}</span>
                <span className="text-[11px] opacity-80">
                  Total Evaluated Score: <strong>{selectedEval.totalMarks} / 50 Marks</strong> ({((selectedEval.totalMarks / 50) * 100).toFixed(0)}%)
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] block opacity-75">Progress</span>
                <strong className="text-sm font-black">{selectedEval.progressPercentage}</strong>
              </div>
            </div>

            {/* Marks Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl font-mono text-[11px] border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px]">Planning (/5M)</span>
                <strong>{selectedEval.planningMarks} M</strong> (Score: {selectedEval.planningScore}/10)
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Problem Clarity (/10M)</span>
                <strong>{selectedEval.problemClarityMarks} M</strong> (Score: {selectedEval.problemClarityScore}/10)
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Literature Review (/15M)</span>
                <strong>{selectedEval.literatureReviewMarks} M</strong> (Score: {selectedEval.literatureReviewScore}/10)
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Analysis & Usability (/20M)</span>
                <strong>{selectedEval.analysisMarks} M</strong> (Score: {selectedEval.analysisScore}/10)
              </div>
            </div>

            {/* Other Ratings */}
            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl text-center text-[11px]">
              <div>
                <span className="text-slate-400 block">Difficulty Level</span>
                <strong className="text-slate-800">{selectedEval.difficultyLevel} / 10</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Presentation Quality</span>
                <strong className="text-slate-800">{selectedEval.presentationQuality} / 10</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Proper English Speaking</span>
                <strong className="text-slate-800">{selectedEval.englishProficiency} / 10</strong>
              </div>
            </div>

            {/* Text details */}
            <div className="space-y-2">
              <div>
                <span className="font-bold text-slate-900 block">4. Suggested Project Title:</span>
                <p className="text-slate-800 mt-0.5">{selectedEval.suggestedTitle || 'None suggested'}</p>
              </div>

              <div>
                <span className="font-bold text-slate-900 block">2 & 3. Attendance Status:</span>
                <p className="text-slate-800 mt-0.5">
                  All Present: <strong>{selectedEval.allPresent}</strong>
                  {selectedEval.absentStudents && selectedEval.absentStudents !== 'NA' && (
                    <span className="text-rose-600 font-bold ml-2">(Absent: {selectedEval.absentStudents})</span>
                  )}
                </p>
              </div>

              {selectedEval.modificationsSuggested && selectedEval.modificationsSuggested !== 'NA' && (
                <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200">
                  <span className="font-bold text-amber-900 block mb-1">6. Modifications Suggested by Panel:</span>
                  <p className="text-amber-800 whitespace-pre-wrap">{selectedEval.modificationsSuggested}</p>
                </div>
              )}

              <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200">
                <span className="font-bold text-indigo-900 block mb-1">7. Expected Outcome for TE Level Completion (#MANDATORY):</span>
                <p className="text-indigo-800 whitespace-pre-wrap">{selectedEval.expectedOutcome}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <span className="font-bold text-slate-900 block">Panel Member 1:</span>
                  <p className="text-slate-700">{selectedEval.panelMember1}</p>
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">Panel Member 2:</span>
                  <p className="text-slate-700">{selectedEval.panelMember2}</p>
                </div>
              </div>

              {selectedEval.attachmentName && (
                <div className="pt-2">
                  <span className="font-bold text-slate-900 block mb-1">18. Uploaded Attachment:</span>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-lg text-indigo-600 font-medium text-xs">
                    <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                    <span>{selectedEval.attachmentName}</span>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-400 flex justify-between">
                <span>Submitted by: {selectedEval.submittedByName} ({selectedEval.submittedByEmail})</span>
                <span>Date: {new Date(selectedEval.submittedAt).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </Card>
  );
};
