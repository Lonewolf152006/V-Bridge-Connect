'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@components/common/Card';
import { Button } from '@components/common/Button';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  Users2,
  GraduationCap,
  Download,
  AlertCircle,
  Sparkles,
  ArrowRight,
  FileText,
  RefreshCw,
  FolderGit2,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { nameToVitEmail } from '@/lib/modules/roster/vit-resolver';

interface ParsedStudent {
  name: string;
  role: string;
  email: string;
  rollNo?: string;
}

interface ParsedGroup {
  groupId: string;
  guideName: string;
  guideEmail: string;
  students: ParsedStudent[];
}

export const RosterUploadScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'excel' | 'paste'>('excel');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<any | null>(null);

  // Parsed groups staging
  const [parsedGroups, setParsedGroups] = useState<ParsedGroup[]>([]);
  const [activityTitle, setActivityTitle] = useState('Semester 5 Mini Project');
  const [departmentName, setDepartmentName] = useState('Electronics and Computer Science');

  // Text paste input
  const [rawText, setRawText] = useState('');

  // Existing database cohort preview
  const [existingTeams, setExistingTeams] = useState<any[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch current database teams
  const fetchExistingCohort = async () => {
    try {
      setLoadingExisting(true);
      const res = await fetch('/api/v1/admin/reports');
      if (res.ok) {
        const data = await res.json();
        // Also fetch from mentor cohort if possible or teams
        const teamsRes = await fetch('/api/v1/mentor/cohort');
        if (teamsRes.ok) {
          const tData = await teamsRes.json();
          setExistingTeams(tData.cohort?.teams || []);
        }
      }
    } catch (err) {
      console.error('Failed to load existing teams', err);
    } finally {
      setLoadingExisting(false);
    }
  };

  useEffect(() => {
    fetchExistingCohort();
  }, []);

  // ─── Excel / CSV File Handler ───
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    setSuccessResult(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (rows.length === 0) {
          setErrorMessage('The uploaded spreadsheet contains no data rows.');
          return;
        }

        // Parse rows into groups & teachers
        const groupMap = new Map<string, ParsedGroup>();

        for (const row of rows) {
          // Normalize column keys
          const keys = Object.keys(row);
          const findVal = (patterns: string[]) => {
            const key = keys.find((k) =>
              patterns.some((p) => k.toLowerCase().replace(/[^a-z0-9]/g, '').includes(p))
            );
            return key ? String(row[key]).trim() : '';
          };

          const groupName = findVal(['group', 'team', 'miniproject', 'batch']) || 'Mini 1';
          const guideName =
            findVal(['guide', 'faculty', 'mentor', 'teacher', 'supervisor']) ||
            'Dr. Sheetal Patil';
          const studentName = findVal(['student', 'name', 'member', 'candidate']) || '';
          const roleRaw = findVal(['role', 'designation', 'position']) || 'member';
          const rollNo = findVal(['roll', 'id', 'prn', 'urn']) || '';

          if (!studentName) continue;

          if (!groupMap.has(groupName)) {
            const resolvedGuide = nameToVitEmail(guideName);
            groupMap.set(groupName, {
              groupId: groupName,
              guideName: guideName,
              guideEmail:
                resolvedGuide.email ||
                `${guideName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@vit.edu.in`,
              students: [],
            });
          }

          const resolvedStudent = nameToVitEmail(studentName);
          const isLead =
            roleRaw.toLowerCase().includes('lead') ||
            groupMap.get(groupName)!.students.length === 0;

          groupMap.get(groupName)!.students.push({
            name: resolvedStudent.normalizedName || studentName,
            role: isLead ? 'student_lead' : 'student_member',
            email: resolvedStudent.email || '',
            rollNo: rollNo || undefined,
          });
        }

        const parsed = Array.from(groupMap.values());
        if (parsed.length === 0) {
          setErrorMessage(
            'Could not detect student and group columns. Make sure columns include "Group", "Guide", and "Student Name".'
          );
          return;
        }

        setParsedGroups(parsed);
      } catch (err: any) {
        console.error(err);
        setErrorMessage('Failed to read Excel file: ' + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  // ─── Paste Parser ───
  const handleParseText = () => {
    setErrorMessage(null);
    setSuccessResult(null);

    if (!rawText.trim()) {
      setErrorMessage('Please paste cohort allocation text or table.');
      return;
    }

    const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
    const groupMap = new Map<string, ParsedGroup>();

    let currentGroup = 'Mini 1';
    let currentGuide = 'Dr. Sheetal Patil';

    for (const line of lines) {
      // Check for Group / Guide headers: "Group: Mini 1 | Guide: Dr. Sheetal Patil"
      if (line.toLowerCase().includes('group') || line.toLowerCase().includes('guide')) {
        const groupMatch = line.match(/(?:group|team)\s*[:=-]?\s*([A-Za-z0-9\s_-]+?)(?:\||,|$)/i);
        const guideMatch = line.match(/(?:guide|faculty|mentor)\s*[:=-]?\s*([A-Za-z0-9\s._-]+?)(?:\||,|$)/i);

        if (groupMatch && groupMatch[1].trim()) {
          currentGroup = groupMatch[1].trim();
        }
        if (guideMatch && guideMatch[1].trim()) {
          currentGuide = guideMatch[1].trim();
        }
        continue;
      }

      // Check for comma or tab separated values: Group, Guide, Student, Role
      if (line.includes('\t') || line.includes(',')) {
        const parts = (line.includes('\t') ? line.split('\t') : line.split(',')).map((p) => p.trim());
        if (parts.length >= 3) {
          const gName = parts[0] || currentGroup;
          const guide = parts[1] || currentGuide;
          const sName = parts[2];
          const role = parts[3] || 'member';

          if (!groupMap.has(gName)) {
            const resolvedGuide = nameToVitEmail(guide);
            groupMap.set(gName, {
              groupId: gName,
              guideName: guide,
              guideEmail: resolvedGuide.email || '',
              students: [],
            });
          }

          const resolvedS = nameToVitEmail(sName);
          const isLead = role.toLowerCase().includes('lead') || groupMap.get(gName)!.students.length === 0;
          groupMap.get(gName)!.students.push({
            name: resolvedS.normalizedName || sName,
            role: isLead ? 'student_lead' : 'student_member',
            email: resolvedS.email || '',
          });
          continue;
        }
      }

      // Plain student name under current group
      const cleanName = line.replace(/^[0-9]+[.)\s-]+/, '').trim();
      const isLead = cleanName.toLowerCase().includes('(lead)') || cleanName.toLowerCase().includes('- lead');
      const studentNameOnly = cleanName.replace(/\((lead|member)\)/i, '').replace(/-\s*(lead|member)/i, '').trim();

      if (!groupMap.has(currentGroup)) {
        const resolvedGuide = nameToVitEmail(currentGuide);
        groupMap.set(currentGroup, {
          groupId: currentGroup,
          guideName: currentGuide,
          guideEmail: resolvedGuide.email || '',
          students: [],
        });
      }

      const resolvedStudent = nameToVitEmail(studentNameOnly);
      groupMap.get(currentGroup)!.students.push({
        name: resolvedStudent.normalizedName || studentNameOnly,
        role: isLead || groupMap.get(currentGroup)!.students.length === 0 ? 'student_lead' : 'student_member',
        email: resolvedStudent.email || '',
      });
    }

    const parsed = Array.from(groupMap.values());
    if (parsed.length === 0) {
      setErrorMessage('Could not extract groups or students from the pasted text.');
      return;
    }

    setParsedGroups(parsed);
  };

  // Sample quick test loader
  const loadSampleSheetalCohort = () => {
    setRawText(`Group: Mini 1 | Guide: Dr. Sheetal Patil
Harshad Prakash Panchal (Lead)
Aditya Vijay Parmale
Mayur Babu Naik
Ritesh Omprakash Yadav

Group: Mini 6 | Guide: Dr. Sheetal Patil
Yash Sachin Khanvilkar (Lead)
Paras Rajeev Shah
Vedant Nilesh Patole
Vedant Balvant Nikumbh

Group: Mini 8 | Guide: Dr. Sheetal Patil
Deven vilas sonawane (Lead)
Kshitij palekar
Mihtil karambe
Parth karalkar`);
  };

  // ─── Submit & Save to Live Database ───
  const handleSaveToDatabase = async () => {
    if (parsedGroups.length === 0) return;
    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessResult(null);

    try {
      const res = await fetch('/api/v1/roster/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groups: parsedGroups,
          activityTitle,
          departmentName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to associate cohort');
      }

      setSuccessResult(data);
      setParsedGroups([]);
      fetchExistingCohort();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Download sample templates
  const downloadSampleTemplate = (format: 'xlsx' | 'csv') => {
    const sampleData = [
      {
        Group: 'Mini 1',
        Guide: 'Dr. Sheetal Patil',
        'Student Name': 'Harshad Prakash Panchal',
        Role: 'Lead',
        'Roll No': '24108B0001',
      },
      {
        Group: 'Mini 1',
        Guide: 'Dr. Sheetal Patil',
        'Student Name': 'Aditya Vijay Parmale',
        Role: 'Member',
        'Roll No': '24108B0002',
      },
      {
        Group: 'Mini 1',
        Guide: 'Dr. Sheetal Patil',
        'Student Name': 'Mayur Babu Naik',
        Role: 'Member',
        'Roll No': '24108B0003',
      },
      {
        Group: 'Mini 1',
        Guide: 'Dr. Sheetal Patil',
        'Student Name': 'Ritesh Omprakash Yadav',
        Role: 'Member',
        'Roll No': '24108B0004',
      },
      {
        Group: 'Mini 6',
        Guide: 'Dr. Sheetal Patil',
        'Student Name': 'Yash Sachin Khanvilkar',
        Role: 'Lead',
        'Roll No': '24108B0010',
      },
      {
        Group: 'Mini 6',
        Guide: 'Dr. Sheetal Patil',
        'Student Name': 'Paras Rajeev Shah',
        Role: 'Member',
        'Roll No': '24108B0011',
      },
      {
        Group: 'Mini 6',
        Guide: 'Dr. Sheetal Patil',
        'Student Name': 'Vedant Nilesh Patole',
        Role: 'Member',
        'Roll No': '24108B0012',
      },
      {
        Group: 'Mini 6',
        Guide: 'Dr. Sheetal Patil',
        'Student Name': 'Vedant Balvant Nikumbh',
        Role: 'Member',
        'Roll No': '24108B0021',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'CohortRoster');

    if (format === 'xlsx') {
      XLSX.writeFile(workbook, 'VBridge_Cohort_Roster_Template.xlsx');
    } else {
      XLSX.writeFile(workbook, 'VBridge_Cohort_Roster_Template.csv');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-200">
            Institutional Cohort Allocation
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 font-display mt-1">
            Cohort Roster & Group-Teacher Association
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Upload Excel (.xlsx, .csv) or paste tabular data from official PDF allocation circulars. Automatically associates student teams with their faculty mentor and provisions team channels.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={() => downloadSampleTemplate('xlsx')}
          >
            Sample Excel (.xlsx)
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={() => downloadSampleTemplate('csv')}
          >
            Sample CSV
          </Button>
        </div>
      </div>

      {/* ─── Success Banner ─── */}
      {successResult && (
        <Card padding="md" className="bg-emerald-50/80 border-emerald-200 text-emerald-900">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-emerald-950">
                {successResult.message}
              </h3>
              <p className="text-xs text-emerald-700">
                {successResult.summary.groupsProcessed} Groups linked to faculty mentor in{' '}
                <strong>{successResult.summary.department}</strong>. Total{' '}
                {successResult.summary.totalStudentsLinked} students enrolled and staged in live database.
              </p>
              <div className="pt-2 flex flex-wrap gap-2">
                <Link href="/coordinator/dashboard">
                  <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                    View in Mentored Groups
                  </Button>
                </Link>
                <Link href="/admin/people">
                  <Button variant="outline" size="sm">
                    Inspect in Directory & Roles
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ─── Error Banner ─── */}
      {errorMessage && (
        <Card padding="md" className="bg-rose-50 border-rose-200 text-rose-800">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        </Card>
      )}

      {/* ─── Activity & Department Settings ─── */}
      <Card padding="md" className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Target Activity / Course:
          </label>
          <input
            type="text"
            value={activityTitle}
            onChange={(e) => setActivityTitle(e.target.value)}
            className="w-full text-xs sm:text-sm px-3 py-2 bg-white rounded-xl border border-slate-200 font-medium"
            placeholder="Semester 5 Mini Project"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Academic Department:
          </label>
          <input
            type="text"
            value={departmentName}
            onChange={(e) => setDepartmentName(e.target.value)}
            className="w-full text-xs sm:text-sm px-3 py-2 bg-white rounded-xl border border-slate-200 font-medium"
            placeholder="Electronics and Computer Science"
          />
        </div>
      </Card>

      {/* ─── Upload / Input Selection ─── */}
      <Card padding="md">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
          <button
            onClick={() => setActiveTab('excel')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'excel'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Upload Spreadsheet (.xlsx, .csv)</span>
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'paste'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Paste PDF / Notice Text</span>
          </button>
        </div>

        {activeTab === 'excel' ? (
          <div>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50/70 hover:bg-indigo-50/30 transition-all rounded-2xl p-8 text-center cursor-pointer group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
                <Upload className="w-6 h-6 text-indigo-600" />
              </div>
              <p className="text-sm font-bold text-slate-800">
                Click or drag & drop student allocation spreadsheet
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Supports Excel (.xlsx, .xls) and CSV (.csv). Columns: Group, Guide, Student Name, Role, Roll No.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                Paste allocation table text or circular extract:
              </label>
              <button
                type="button"
                onClick={loadSampleSheetalCohort}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load Sample Cohort Text (Dr. Sheetal Patil)</span>
              </button>
            </div>
            <textarea
              rows={8}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={`Group: Mini 1 | Guide: Dr. Sheetal Patil\nHarshad Prakash Panchal (Lead)\nAditya Vijay Parmale\nMayur Babu Naik\nRitesh Omprakash Yadav\n\nGroup: Mini 6 | Guide: Dr. Sheetal Patil\nYash Sachin Khanvilkar (Lead)\nParas Rajeev Shah...`}
              className="w-full text-xs font-mono p-3 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Sparkles className="w-4 h-4" />}
              onClick={handleParseText}
            >
              Parse & Preview Cohort
            </Button>
          </div>
        )}
      </Card>

      {/* ─── Live Staging & Association Preview ─── */}
      {parsedGroups.length > 0 && (
        <Card padding="none" className="overflow-hidden border-indigo-200 shadow-md">
          <div className="p-4 bg-indigo-50/80 border-b border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-indigo-950 font-display">
                  Validation & Association Preview
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-200 text-indigo-800">
                  {parsedGroups.length} Groups Detected
                </span>
              </div>
              <p className="text-xs text-indigo-700 mt-0.5">
                Review groups, assigned faculty mentor, and auto-generated VIT student emails prior to syncing.
              </p>
            </div>

            <Button
              variant="primary"
              size="md"
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
              isLoading={isProcessing}
              onClick={handleSaveToDatabase}
            >
              Associate & Save {parsedGroups.length} Groups
            </Button>
          </div>

          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {parsedGroups.map((grp) => (
              <div
                key={grp.groupId}
                className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-2xs hover:border-indigo-300 transition-all"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                      {grp.groupId.replace(/mini/i, 'M').trim()}
                    </span>
                    <span className="font-extrabold text-sm text-slate-900 font-display">
                      {grp.groupId}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {grp.students.length} Students
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                  <div className="text-[10px] uppercase font-bold text-slate-400">
                    Assigned Faculty Guide
                  </div>
                  <div className="font-bold text-indigo-900 flex items-center gap-1.5 mt-0.5">
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{grp.guideName}</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                    {grp.guideEmail}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-[10px] uppercase font-bold text-slate-400">
                    Enrolled Students:
                  </div>
                  {grp.students.map((s, idx) => (
                    <div
                      key={idx}
                      className="p-1.5 rounded-lg bg-slate-50/80 border border-slate-100 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <span>{s.name}</span>
                          {s.role === 'student_lead' && (
                            <span className="text-[9px] bg-indigo-600 text-white font-bold px-1.5 py-0.2 rounded">
                              LEAD
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {s.email}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ─── Existing Database Teams Inspection ─── */}
      <Card padding="none" className="overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderGit2 className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-900 font-display">
              Live Mentored Cohort Status in Database
            </h3>
          </div>
          <button
            onClick={fetchExistingCohort}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Status</span>
          </button>
        </div>

        {loadingExisting ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Checking existing cohort records...
          </div>
        ) : existingTeams.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No teams recorded yet. Upload a spreadsheet or paste roster text above to associate your first cohort!
          </div>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {existingTeams.map((t) => (
              <div
                key={t.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm font-display">
                      {t.name}
                    </span>
                    <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
                      {t.activityTitle}
                    </span>
                  </div>
                  <div className="text-slate-500 mt-1 flex flex-wrap gap-2 items-center">
                    <span>{t.students?.length || t.membersCount || 0} Students</span>
                    <span>•</span>
                    <span className="text-emerald-700 font-medium flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>All Workspace Channels Ready</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link href={`/projects/${t.id}`}>
                    <Button variant="outline" size="sm">
                      Open Workspace
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
