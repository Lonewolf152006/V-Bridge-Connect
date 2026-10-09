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
  FileType,
  FileUp,
  Eye,
  Loader2,
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
  const [activeTab, setActiveTab] = useState<'excel' | 'pdf' | 'paste'>('excel');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<any | null>(null);

  // PDF processing state
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [pdfFileSize, setPdfFileSize] = useState<number | null>(null);
  const [pdfExtractedStats, setPdfExtractedStats] = useState<{ groups: number; students: number } | null>(null);
  const [showRawExtracted, setShowRawExtracted] = useState(false);
  const [isDraggingPdf, setIsDraggingPdf] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Parsed groups staging
  const [parsedGroups, setParsedGroups] = useState<ParsedGroup[]>([]);
  const [activityTitle, setActivityTitle] = useState('Semester 5 Mini Project');
  const [departmentName, setDepartmentName] = useState('Electronics and Computer Science');

  // Text paste input / PDF extracted raw text
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

  // ─── Table-Style Academic PDF Roster Parser ───
  const parseAcademicTableRoster = (raw: string): ParsedGroup[] | null => {
    const groupPattern = /\b([A-Z0-9]+-[0-9]+-Mini-[0-9]+|(?:Mini|Group|Team|Batch)[-_ ]+[0-9]+)\b/gi;
    const matches = [...raw.matchAll(groupPattern)].filter(
      (m) => !/^(group member|mini project|groups|group id)/i.test(m[0])
    );

    if (matches.length === 0) return null;

    const result: ParsedGroup[] = [];
    for (let i = 0; i < matches.length; i++) {
      const curr = matches[i];
      const next = matches[i + 1];
      const rawChunk = raw.slice(curr.index, next ? next.index : undefined);
      const groupId = curr[0];

      let chunk = rawChunk.replace(curr[0], '');
      chunk = chunk.replace(/--\s*\d+\s*of\s*\d+\s*--/gi, '');
      chunk = chunk.replace(/T\.?E\.?.*extract.*Page\s*\d+/gi, '');
      chunk = chunk.replace(/Page\s*\d+/gi, '');

      let guide = 'Dr. Sheetal Patil';
      const guideMatch = chunk.match(/(?:Dr\.|Prof\.|Mr\.|Ms\.|Mrs\.)[\s\n]+[A-Za-z]+(?:[\s\n]+[A-Za-z]+)*/i);
      if (guideMatch) {
        guide = guideMatch[0].replace(/[\s\n]+/g, ' ').trim();
        chunk = chunk.replace(guideMatch[0], ' ');
      }

      let rawStudentNames: string[] = [];
      if (chunk.includes('\t')) {
        const parts = chunk
          .split('\t')
          .map((p) => p.replace(/[\s\n]+/g, ' ').trim())
          .filter(Boolean);
        for (const p of parts) {
          const words = p.split(' ').filter(Boolean);
          if (words.length >= 4) {
            if (words.length === 5) {
              rawStudentNames.push(words.slice(0, 3).join(' '));
              rawStudentNames.push(words.slice(3).join(' '));
            } else {
              const mid = Math.floor(words.length / 2);
              rawStudentNames.push(words.slice(0, mid).join(' '));
              rawStudentNames.push(words.slice(mid).join(' '));
            }
          } else {
            rawStudentNames.push(p);
          }
        }
      } else {
        const cleanChunk = chunk.replace(/[\s\n]+/g, ' ').trim();
        const words = cleanChunk.split(' ').filter(Boolean);

        if (words.length >= 6 && words.length % 3 === 0) {
          for (let w = 0; w < words.length; w += 3) {
            rawStudentNames.push(words.slice(w, w + 3).join(' '));
          }
        } else if (words.length === 8) {
          for (let w = 0; w < words.length; w += 2) {
            rawStudentNames.push(words.slice(w, w + 2).join(' '));
          }
        } else if (words.length > 0) {
          const count = 4;
          const per = Math.ceil(words.length / count);
          for (let w = 0; w < words.length; w += per) {
            rawStudentNames.push(words.slice(w, w + per).join(' '));
          }
        }
      }

      const resolvedGuide = nameToVitEmail(guide);
      const students = rawStudentNames
        .filter((s) => s.length >= 2)
        .map((s, idx) => {
          const resolved = nameToVitEmail(s);
          return {
            name: resolved.normalizedName || s,
            role: (idx === 0 ? 'student_lead' : 'student_member') as 'student_lead' | 'student_member',
            email: resolved.email || '',
          };
        });

      if (students.length > 0) {
        result.push({
          groupId,
          guideName: guide,
          guideEmail: resolvedGuide.email || '',
          students,
        });
      }
    }

    return result.length > 0 ? result : null;
  };

  // ─── Centralized Roster Text Parser (for Pasted text & PDF extracts) ───
  const parseRosterText = (text: string): ParsedGroup[] => {
    if (!text.trim()) return [];

    // First attempt academic table parser (for multi-column PDF table extracts)
    const tableGroups = parseAcademicTableRoster(text);
    if (tableGroups && tableGroups.length > 0) {
      return tableGroups;
    }

    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const groupMap = new Map<string, ParsedGroup>();

    let currentGroup = 'Mini 1';
    let currentGuide = 'Dr. Sheetal Patil';

    for (const line of lines) {
      // Skip obvious header titles or document boilerplate
      if (
        /^(sr\.?\s*no|roll\s*no|student\s*name|candidate\s*name|guide\s*name|faculty\s*name|signature|department\s*of|vishwakarma|page\s*\d+)/i.test(
          line
        )
      ) {
        continue;
      }

      // Check for Group / Guide headers: "Group: Mini 1 | Guide: Dr. Sheetal Patil"
      if (
        line.toLowerCase().includes('group') ||
        line.toLowerCase().includes('guide') ||
        line.toLowerCase().includes('batch')
      ) {
        const groupMatch = line.match(/(?:group|team|batch)\s*[:=-]?\s*([A-Za-z0-9\s_-]+?)(?:\||,|$)/i);
        const guideMatch = line.match(/(?:guide|faculty|mentor|supervisor)\s*[:=-]?\s*([A-Za-z0-9\s._-]+?)(?:\||,|$)/i);

        if (groupMatch && groupMatch[1].trim()) {
          currentGroup = groupMatch[1].trim();
        }
        if (guideMatch && guideMatch[1].trim()) {
          currentGuide = guideMatch[1].trim();
        }
        // If this line only was a group/guide header without student entries, proceed to next line
        if (!line.includes(',') && !line.includes('\t') && !line.match(/\([0-9]+\)/)) {
          continue;
        }
      }

      // Check for comma, tab, or pipe separated values: Group, Guide, Student, Role, RollNo
      if (line.includes('\t') || line.includes(',') || line.includes('|')) {
        const sep = line.includes('\t') ? '\t' : line.includes(',') ? ',' : '|';
        const parts = line.split(sep).map((p) => p.trim()).filter(Boolean);
        if (parts.length >= 2) {
          // If first column is serial number (e.g. "1"), shift it
          if (/^\d+$/.test(parts[0]) && parts.length >= 3) {
            parts.shift();
          }

          let gName = currentGroup;
          let guide = currentGuide;
          let sName = '';
          let role = 'member';
          let rollNo = '';

          if (parts.length >= 4) {
            gName = parts[0] || currentGroup;
            guide = parts[1] || currentGuide;
            sName = parts[2];
            role = parts[3] || 'member';
            if (parts[4]) rollNo = parts[4];
          } else if (parts.length === 3) {
            sName = parts[0];
            guide = parts[1] || currentGuide;
            role = parts[2] || 'member';
          } else if (parts.length === 2) {
            sName = parts[0];
            role = parts[1];
          }

          if (sName && !/^(sr|roll|name|guide)/i.test(sName)) {
            const rollMatch = (sName + ' ' + role).match(/\b([0-9]{2,}[A-Za-z0-9_-]{3,})\b/);
            if (rollMatch) {
              rollNo = rollMatch[1];
              sName = sName.replace(rollMatch[1], '').trim();
            }

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
              rollNo: rollNo || undefined,
            });
            continue;
          }
        }
      }

      // Plain student name line under current group
      let cleanName = line.replace(/^[0-9]+[.)\s-]+/, '').trim();
      if (!cleanName || cleanName.length < 3) continue;

      let rollNo: string | undefined = undefined;
      const rollMatch = cleanName.match(/\b([0-9]{2,}[A-Za-z0-9_-]{3,})\b/);
      if (rollMatch) {
        rollNo = rollMatch[1];
        cleanName = cleanName.replace(rollMatch[1], '').trim();
      }

      const isLead =
        cleanName.toLowerCase().includes('(lead)') ||
        cleanName.toLowerCase().includes('- lead') ||
        cleanName.toLowerCase().includes('[lead]');

      const studentNameOnly = cleanName
        .replace(/\((lead|member)\)/i, '')
        .replace(/-\s*(lead|member)/i, '')
        .replace(/\[(lead|member)\]/i, '')
        .trim();

      if (!studentNameOnly || studentNameOnly.length < 2) continue;

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
        rollNo,
      });
    }

    return Array.from(groupMap.values());
  };

  // ─── PDF File Upload Handler (calls /api/v1/roster/parse-pdf) ───
  const handlePdfUpload = async (file: File) => {
    setIsProcessingPdf(true);
    setErrorMessage(null);
    setSuccessResult(null);
    setPdfFileName(file.name);
    setPdfFileSize(file.size);
    setPdfExtractedStats(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/v1/roster/parse-pdf', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to extract text from PDF');
      }

      const extracted = data.text || '';
      setRawText(extracted);

      const parsed = parseRosterText(extracted);
      if (parsed.length === 0) {
        setErrorMessage(
          `Extracted text from "${file.name}" (${extracted.length} chars), but could not detect structured student groups. Check the "Paste PDF / Notice Text" tab to review or format the extracted text.`
        );
        setActiveTab('paste');
        return;
      }

      const totalStudents = parsed.reduce((sum, g) => sum + g.students.length, 0);
      setPdfExtractedStats({
        groups: parsed.length,
        students: totalStudents,
      });
      setParsedGroups(parsed);
    } catch (err: any) {
      console.error('PDF extraction failed:', err);
      setErrorMessage(err.message || 'Failed to process PDF document');
    } finally {
      setIsProcessingPdf(false);
    }
  };

  // ─── Excel / CSV File Handler ───
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    setSuccessResult(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // If user dropped or selected a PDF in the generic file input
    if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
      setActiveTab('pdf');
      handlePdfUpload(file);
      return;
    }

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

    const parsed = parseRosterText(rawText);
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
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3 mb-4">
          <button
            onClick={() => setActiveTab('excel')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'excel'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Upload Spreadsheet (.xlsx, .csv)</span>
          </button>
          <button
            onClick={() => setActiveTab('pdf')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'pdf'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileUp className="w-4 h-4" />
            <span>Upload PDF Roster (.pdf)</span>
            <span className="text-[10px] bg-rose-500/30 text-rose-100 font-semibold px-1.5 py-0.2 rounded">
              Direct
            </span>
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'paste'
                ? 'bg-indigo-600 text-white shadow-sm'
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
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const droppedFile = e.dataTransfer.files?.[0];
                if (droppedFile) {
                  if (droppedFile.name.toLowerCase().endsWith('.pdf') || droppedFile.type === 'application/pdf') {
                    setActiveTab('pdf');
                    handlePdfUpload(droppedFile);
                  } else {
                    const syntheticEvent = { target: { files: [droppedFile] } } as any;
                    handleFileUpload(syntheticEvent);
                  }
                }
              }}
              className="border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50/70 hover:bg-indigo-50/30 transition-all rounded-2xl p-8 text-center cursor-pointer group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv, .pdf"
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
        ) : activeTab === 'pdf' ? (
          <div className="space-y-4">
            <div
              onClick={() => !isProcessingPdf && pdfInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingPdf(true);
              }}
              onDragLeave={() => setIsDraggingPdf(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingPdf(false);
                const file = e.dataTransfer.files?.[0];
                if (file) {
                  if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
                    setErrorMessage('Uploaded file must be a PDF document (.pdf)');
                    return;
                  }
                  handlePdfUpload(file);
                }
              }}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer group ${
                isDraggingPdf
                  ? 'border-rose-500 bg-rose-50/60 scale-[1.01]'
                  : 'border-rose-200 hover:border-rose-400 bg-rose-50/30 hover:bg-rose-50/50'
              } ${isProcessingPdf ? 'opacity-70 pointer-events-none' : ''}`}
            >
              <input
                ref={pdfInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePdfUpload(file);
                }}
                className="hidden"
              />

              <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-rose-200 flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
                {isProcessingPdf ? (
                  <Loader2 className="w-7 h-7 text-rose-600 animate-spin" />
                ) : (
                  <FileUp className="w-7 h-7 text-rose-600" />
                )}
              </div>

              {isProcessingPdf ? (
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-900">
                    Extracting Student Names & Roster from PDF...
                  </p>
                  <p className="text-xs text-rose-700 font-medium">
                    Parsing document streams and mapping student identities to VIT emails...
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-900">
                    Click to select or drag & drop student allocation PDF document
                  </p>
                  <p className="text-xs text-slate-500 max-w-lg mx-auto">
                    Upload official departmental project allocation circular or student roster PDF (.pdf). The server extracts group IDs, student names, roles (Lead/Member), and assigns official <code className="font-mono bg-white px-1 py-0.5 rounded text-rose-700">@vit.edu.in</code> emails.
                  </p>
                </div>
              )}
            </div>

            {/* Extracted PDF file summary */}
            {pdfFileName && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-rose-100 text-rose-700 rounded-lg shrink-0">
                    <FileType className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-800">{pdfFileName}</span>
                    {pdfFileSize && (
                      <span className="text-slate-400 ml-2">
                        ({(pdfFileSize / 1024).toFixed(1)} KB)
                      </span>
                    )}
                    {pdfExtractedStats && (
                      <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                        ✓ Extracted {pdfExtractedStats.students} students across {pdfExtractedStats.groups} groups
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    leftIcon={<Eye className="w-3.5 h-3.5" />}
                    onClick={() => setShowRawExtracted(!showRawExtracted)}
                  >
                    {showRawExtracted ? 'Hide Extracted Text' : 'Inspect Raw Text'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => pdfInputRef.current?.click()}
                  >
                    Choose Different PDF
                  </Button>
                </div>
              </div>
            )}

            {/* Inspect raw extracted text accordion */}
            {showRawExtracted && rawText && (
              <div className="bg-slate-900 text-slate-200 rounded-xl p-4 font-mono text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
                  <span>Raw Text Extracted from PDF Document:</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('paste')}
                    className="text-indigo-400 hover:text-indigo-300 font-sans font-semibold text-xs"
                  >
                    Edit in Paste Editor →
                  </button>
                </div>
                <pre className="max-h-60 overflow-y-auto whitespace-pre-wrap leading-relaxed text-[11px]">
                  {rawText}
                </pre>
              </div>
            )}
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
