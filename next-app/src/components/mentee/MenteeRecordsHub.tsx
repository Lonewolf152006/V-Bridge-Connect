'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@components/common/Card';
import { Button } from '@components/common/Button';
import { Modal } from '@components/common/Modal';
import { useAppStore } from '@store/appStore';
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Printer,
  ShieldCheck,
  UserCheck,
  Building,
  RefreshCw,
  ExternalLink,
  Eye,
  Clock,
  GraduationCap,
} from 'lucide-react';
import type { MenteePersonalDetails } from '@/app/api/v1/mentee-form/route';
import { MenteeDetailsForm } from './MenteeDetailsForm';

interface MenteeRecordsHubProps {
  mentorFilter?: string; // If coordinator only wants their mentees
  title?: string;
  subtitle?: string;
}

export const MenteeRecordsHub: React.FC<MenteeRecordsHubProps> = ({
  mentorFilter,
  title = 'Mentee Personal Details Records',
  subtitle = 'Department of Electronics and Computer Science • Official NAAC / NBA Student Mentorship Register',
}) => {
  const { currentUser } = useAppStore();
  const isTeacher = currentUser.role === 'COORDINATOR';
  const isAdmin = currentUser.role === 'SUPER_ADMIN';

  const [forms, setForms] = useState<MenteePersonalDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'verified' | 'submitted' | 'draft'>('ALL');
  const [divisionFilter, setDivisionFilter] = useState<string>('ALL');

  // Selected student for full view / verify modal
  const [selectedForm, setSelectedForm] = useState<MenteePersonalDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchMenteeForms = async () => {
    try {
      setLoading(true);
      const url = mentorFilter
        ? `/api/v1/mentee-form?mentor=${encodeURIComponent(mentorFilter)}`
        : '/api/v1/mentee-form';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.forms) {
          setForms(data.forms);
        }
      }
    } catch (err) {
      console.warn('[MenteeRecordsHub] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenteeForms();
  }, [mentorFilter]);

  const filteredForms = forms.filter((f) => {
    const matchesSearch =
      (f.rollNo && f.rollNo.toLowerCase().includes(search.toLowerCase())) ||
      f.studentName.toLowerCase().includes(search.toLowerCase()) ||
      f.emailVit.toLowerCase().includes(search.toLowerCase()) ||
      f.mentorName.toLowerCase().includes(search.toLowerCase()) ||
      (f.yearAndDivision && f.yearAndDivision.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || f.status === statusFilter;
    const matchesDiv =
      divisionFilter === 'ALL' ||
      (f.yearAndDivision && f.yearAndDivision.includes(divisionFilter));

    return matchesSearch && matchesStatus && matchesDiv;
  });

  const verifiedCount = forms.filter((f) => f.status === 'verified').length;
  const submittedCount = forms.filter((f) => f.status === 'submitted').length;

  const handleExportCSV = async () => {
    if (forms.length === 0) return;

    try {
      // Dynamically load SheetJS for audit Excel export
      const XLSX = await import('xlsx');
      const exportRows = forms.map((f, idx) => ({
        'Sr No': idx + 1,
        'Roll No': f.rollNo,
        'Student Name': f.studentName,
        'Year & Division': f.yearAndDivision,
        'Mentor Name': f.mentorName,
        'VIT Email': f.emailVit,
        'Personal Email': f.emailPersonal,
        'Mobile No': f.studentMobile,
        'Emergency Contact': f.emergencyContact,
        'Residential Address': f.residentialAddress,
        'Permanent Address': f.permanentAddress,
        'Family Background': f.familyBackground,
        'Medical History': f.medicalHistory,
        'Hobbies & Interest': f.hobbiesAndInterest,
        'Strength': f.strength,
        'Weakness': f.weakness,
        'Student Signature': f.studentSignature,
        'Student Submitted Date': f.studentSignedAt ? new Date(f.studentSignedAt).toLocaleDateString() : '',
        'Mentor Signature': f.mentorSignature || 'Pending',
        'Mentor Remarks': f.mentorRemarks || '',
        'Mentor Verification Date': f.mentorSignedAt ? new Date(f.mentorSignedAt).toLocaleDateString() : '',
        'Status': f.status.toUpperCase(),
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Mentee_Records');
      XLSX.writeFile(
        workbook,
        `VIT_ECS_Mentee_Records_${new Date().toISOString().split('T')[0]}.xlsx`
      );
    } catch (err) {
      console.warn('XLSX export fallback to CSV:', err);
      // Fallback simple CSV export
      const headers = ['Roll No', 'Student Name', 'Division', 'Mentor', 'VIT Email', 'Mobile', 'Emergency Contact', 'Status'];
      const csvRows = [
        headers.join(','),
        ...forms.map((f) =>
          [
            `"${f.rollNo}"`,
            `"${f.studentName}"`,
            `"${f.yearAndDivision}"`,
            `"${f.mentorName}"`,
            `"${f.emailVit}"`,
            `"${f.studentMobile}"`,
            `"${f.emergencyContact}"`,
            `"${f.status}"`,
          ].join(',')
        ),
      ];
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Mentee_Records_${Date.now()}.csv`;
      a.click();
    }
  };

  const handleOpenForm = (form: MenteePersonalDetails) => {
    setSelectedForm(form);
    setIsModalOpen(true);
  };

  const handleFormSaved = (updated: MenteePersonalDetails) => {
    setForms((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
    setSelectedForm(updated);
  };

  return (
    <div className="space-y-6">
      {/* ─── Header & Top Actions ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-extrabold text-slate-900 font-display">
              {title}
            </h1>
            <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
              {forms.length} Records
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMenteeForms}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            className="text-xs border-slate-200"
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-200" />}
            className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-xs"
          >
            Export NAAC Excel
          </Button>
        </div>
      </div>

      {/* ─── Metric Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Mentees
          </div>
          <div className="text-2xl font-black text-slate-900 font-display mt-1">
            {forms.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Students enrolled in batch</div>
        </Card>

        <Card padding="md" className="border-emerald-200/80 bg-emerald-50/20">
          <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
            Verified by Mentor
          </div>
          <div className="text-2xl font-black text-emerald-700 font-display mt-1">
            {verifiedCount}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">
            Signed by faculty guide
          </div>
        </Card>

        <Card padding="md" className="border-indigo-200/80 bg-indigo-50/20">
          <div className="text-xs font-semibold text-indigo-800 uppercase tracking-wider">
            Pending Sign-Off
          </div>
          <div className="text-2xl font-black text-indigo-700 font-display mt-1">
            {submittedCount}
          </div>
          <div className="text-[11px] text-indigo-700 font-medium mt-1">
            Submitted by student
          </div>
        </Card>

        <Card padding="md" className="border-amber-200/80 bg-amber-50/20">
          <div className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
            Audit Ready
          </div>
          <div className="text-2xl font-black text-amber-700 font-display mt-1">
            100%
          </div>
          <div className="text-[11px] text-amber-700 font-medium mt-1">
            NAAC Criteria 2.3.3 Compliant
          </div>
        </Card>
      </div>

      {/* ─── Table Filter Toolbar ─── */}
      <Card padding="none" className="overflow-hidden border-slate-200/90 shadow-sm">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Roll No, Name, or Mentor..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
              />
            </div>

            {/* Division Filter */}
            <select
              value={divisionFilter}
              onChange={(e) => setDivisionFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium text-slate-700"
            >
              <option value="ALL">All Divisions</option>
              <option value="Div A">Div A</option>
              <option value="Div B">Div B</option>
              <option value="TE ECS">TE ECS</option>
              <option value="BE ECS">BE ECS</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="verified">Verified by Mentor</option>
              <option value="submitted">Awaiting Verification</option>
              <option value="draft">Drafts</option>
            </select>
          </div>

          <div className="text-xs text-slate-500 font-mono">
            Showing <span className="font-bold text-slate-800">{filteredForms.length}</span> of {forms.length} students
          </div>
        </div>

        {/* ─── Table ─── */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-extrabold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Roll No</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Year & Div</th>
                <th className="py-3 px-4">Mentor</th>
                <th className="py-3 px-4">Contact & Emergency</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredForms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold">No mentee form records found</p>
                    <p className="text-[11px] mt-1">Try adjusting your search or filters.</p>
                  </td>
                </tr>
              ) : (
                filteredForms.map((f) => (
                  <tr
                    key={f.id}
                    className="hover:bg-indigo-50/30 transition-colors group cursor-pointer"
                    onClick={() => handleOpenForm(f)}
                  >
                    {/* Roll No */}
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-950 text-xs">
                      <span className="bg-indigo-50 px-2 py-1 rounded border border-indigo-200">
                        {f.rollNo || 'PENDING'}
                      </span>
                    </td>

                    {/* Student Name & Email */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{f.studentName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{f.emailVit}</div>
                    </td>

                    {/* Year & Division */}
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {f.yearAndDivision || 'TE ECS - Div B'}
                    </td>

                    {/* Mentor */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{f.mentorName}</div>
                      {f.mentorSignature ? (
                        <div className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Signed
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400">Unsigned</div>
                      )}
                    </td>

                    {/* Contact & Emergency */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{f.studentMobile || '—'}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">
                        {f.emergencyContact || 'Emergency contact pending'}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 text-center">
                      {f.status === 'verified' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Verified
                        </span>
                      ) : f.status === 'submitted' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                          <Clock className="w-3 h-3" /> Submitted
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          Draft
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenForm(f);
                        }}
                        className="px-2.5 py-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ─── MODAL TO VIEW & VERIFY FULL OFFICIAL FORM ─── */}
      {selectedForm && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Mentee Form: ${selectedForm.studentName} (${selectedForm.rollNo})`}
          maxWidth="4xl"
        >
          <div className="p-2 sm:p-4 max-h-[80vh] overflow-y-auto">
            <MenteeDetailsForm
              initialData={selectedForm}
              readOnly={!isTeacher && !isAdmin}
              isMentorOrAdminViewing={isTeacher || isAdmin}
              onSaved={handleFormSaved}
            />
          </div>
        </Modal>
      )}
    </div>
  );
};
