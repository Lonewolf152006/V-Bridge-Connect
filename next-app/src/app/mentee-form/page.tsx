'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { MenteeDetailsForm } from '@/components/mentee/MenteeDetailsForm';
import { MenteeRecordsHub } from '@/components/mentee/MenteeRecordsHub';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { FileText, CheckCircle2, Clock, ShieldCheck, GraduationCap } from 'lucide-react';
import type { MenteePersonalDetails } from '@/app/api/v1/mentee-form/route';

export default function MenteeFormPage() {
  const { currentUser } = useAppStore();

  const isTeacher = currentUser.role === 'COORDINATOR';
  const isAdmin = currentUser.role === 'SUPER_ADMIN';

  const [studentForm, setStudentForm] = useState<MenteePersonalDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isTeacher && !isAdmin) {
      // Student: fetch their own form
      const fetchMyForm = async () => {
        try {
          setLoading(true);
          const email = currentUser.email;
          const res = await fetch(`/api/v1/mentee-form?email=${encodeURIComponent(email)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.form) {
              setStudentForm(data.form);
            }
          }
        } catch (err) {
          console.warn('Error fetching student mentee form:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchMyForm();
    } else {
      setLoading(false);
    }
  }, [currentUser.email, isTeacher, isAdmin]);

  // If Teacher / Mentor (COORDINATOR): Show Mentee Management Hub
  if (isTeacher) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <MenteeRecordsHub
          mentorFilter="Sheetal Patil"
          title="Mentee Personal Details • Mentorship Group"
          subtitle="Department of Electronics and Computer Science • Review, verify, and digitally sign your assigned student mentee profiles."
        />
      </div>
    );
  }

  // If Super Admin: Show Institutional Mentee Directory & NAAC Accreditation Export
  if (isAdmin) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <MenteeRecordsHub
          title="Institutional Mentee Register (All Cohorts)"
          subtitle="Department of Electronics and Computer Science • College-wide student personal details, roll numbers, and mentor verification ledger for NAAC / NBA audit."
        />
      </div>
    );
  }

  // Default: Student Fill & View Form
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Student Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-400/20 text-xs font-semibold">
            <GraduationCap className="w-3.5 h-3.5 text-indigo-300" />
            <span>VIT Department of Electronics and Computer Science</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black font-display text-white">
            Department Mentee Information Form
          </h1>
          <p className="text-xs text-indigo-200 max-w-xl">
            Every student is required by the Department to complete their official Mentee Personal Details Form and provide their Roll Number. Once submitted, your assigned Teacher Mentor (Dr. Sheetal Patil) and Super Admin will review your record.
          </p>
        </div>

        {studentForm?.status === 'verified' ? (
          <div className="p-3 bg-emerald-500/20 border border-emerald-400/30 rounded-2xl text-emerald-200 flex items-center gap-2 text-xs font-bold shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            <span>Verified by Faculty Mentor</span>
          </div>
        ) : studentForm?.status === 'submitted' ? (
          <div className="p-3 bg-indigo-500/30 border border-indigo-400/30 rounded-2xl text-indigo-200 flex items-center gap-2 text-xs font-bold shrink-0">
            <Clock className="w-5 h-5 text-indigo-300" />
            <span>Submitted • Awaiting Teacher Sign</span>
          </div>
        ) : (
          <div className="p-3 bg-amber-500/20 border border-amber-400/30 rounded-2xl text-amber-200 flex items-center gap-2 text-xs font-bold shrink-0">
            <Clock className="w-5 h-5 text-amber-300" />
            <span>Form Pending Submission</span>
          </div>
        )}
      </div>

      {loading ? (
        <Card padding="lg" className="text-center py-12">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Loading your mentee profile...</p>
        </Card>
      ) : (
        <MenteeDetailsForm
          initialData={studentForm}
          onSaved={(saved) => setStudentForm(saved)}
        />
      )}
    </div>
  );
}
