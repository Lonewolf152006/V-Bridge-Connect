'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@components/common/Card';
import { Button } from '@components/common/Button';
import { useAppStore } from '@store/appStore';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Printer,
  Edit3,
  Send,
  Save,
  ShieldCheck,
  UserCheck,
  Building,
  Phone,
  Mail,
  HeartPulse,
  Sparkles,
  ArrowLeft,
  GraduationCap,
} from 'lucide-react';
import type { MenteePersonalDetails } from '@/app/api/v1/mentee-form/route';

interface MenteeDetailsFormProps {
  initialData?: MenteePersonalDetails | null;
  readOnly?: boolean;
  onSaved?: (form: MenteePersonalDetails) => void;
  onBack?: () => void;
  isMentorOrAdminViewing?: boolean;
}

export const MenteeDetailsForm: React.FC<MenteeDetailsFormProps> = ({
  initialData,
  readOnly = false,
  onSaved,
  onBack,
  isMentorOrAdminViewing = false,
}) => {
  const { currentUser } = useAppStore();

  const isTeacher = currentUser.role === 'COORDINATOR';
  const isAdmin = currentUser.role === 'SUPER_ADMIN';

  // Form Fields
  const [mentorName, setMentorName] = useState(
    initialData?.mentorName || 'Dr. Sheetal Patil'
  );
  const [studentName, setStudentName] = useState(
    initialData?.studentName || currentUser.name || ''
  );
  const [rollNo, setRollNo] = useState(
    initialData?.rollNo || currentUser.institutionalId || ''
  );
  const [yearAndDivision, setYearAndDivision] = useState(
    initialData?.yearAndDivision || 'TE ECS - Div B'
  );
  const [studentMobile, setStudentMobile] = useState(
    initialData?.studentMobile || '+91 '
  );
  const [residentialTelephone, setResidentialTelephone] = useState(
    initialData?.residentialTelephone || '022-'
  );
  const [residentialAddress, setResidentialAddress] = useState(
    initialData?.residentialAddress || ''
  );
  const [emergencyContact, setEmergencyContact] = useState(
    initialData?.emergencyContact || ''
  );
  const [permanentAddress, setPermanentAddress] = useState(
    initialData?.permanentAddress || ''
  );
  const [emailVit, setEmailVit] = useState(
    initialData?.emailVit || currentUser.email || ''
  );
  const [emailPersonal, setEmailPersonal] = useState(
    initialData?.emailPersonal || ''
  );
  const [familyBackground, setFamilyBackground] = useState(
    initialData?.familyBackground || ''
  );
  const [medicalHistory, setMedicalHistory] = useState(
    initialData?.medicalHistory || 'None / No known medical conditions'
  );
  const [hobbiesAndInterest, setHobbiesAndInterest] = useState(
    initialData?.hobbiesAndInterest || ''
  );
  const [strength, setStrength] = useState(initialData?.strength || '');
  const [weakness, setWeakness] = useState(initialData?.weakness || '');
  const [studentSignature, setStudentSignature] = useState(
    initialData?.studentSignature || currentUser.name || ''
  );
  const [studentDeclarationAgreed, setStudentDeclarationAgreed] = useState(
    Boolean(initialData?.studentSignedAt)
  );

  // Mentor Verification State (for Teacher view)
  const [mentorRemarks, setMentorRemarks] = useState(
    initialData?.mentorRemarks || ''
  );
  const [isVerifying, setIsVerifying] = useState(false);

  // UI state
  const [isEditing, setIsEditing] = useState(!initialData || !readOnly);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setMentorName(initialData.mentorName || 'Dr. Sheetal Patil');
      setStudentName(initialData.studentName || '');
      setRollNo(initialData.rollNo || '');
      setYearAndDivision(initialData.yearAndDivision || 'TE ECS - Div B');
      setStudentMobile(initialData.studentMobile || '');
      setResidentialTelephone(initialData.residentialTelephone || '');
      setResidentialAddress(initialData.residentialAddress || '');
      setEmergencyContact(initialData.emergencyContact || '');
      setPermanentAddress(initialData.permanentAddress || '');
      setEmailVit(initialData.emailVit || '');
      setEmailPersonal(initialData.emailPersonal || '');
      setFamilyBackground(initialData.familyBackground || '');
      setMedicalHistory(initialData.medicalHistory || 'None');
      setHobbiesAndInterest(initialData.hobbiesAndInterest || '');
      setStrength(initialData.strength || '');
      setWeakness(initialData.weakness || '');
      setStudentSignature(initialData.studentSignature || '');
      setStudentDeclarationAgreed(Boolean(initialData.studentSignedAt));
      setMentorRemarks(initialData.mentorRemarks || '');
    }
  }, [initialData]);

  const handleCopyResidentialToPermanent = () => {
    setPermanentAddress(residentialAddress);
  };

  const handleQuickNoneMedical = () => {
    setMedicalHistory('None / No chronic illness, physical ailments or allergies');
  };

  const handleSubmit = async (isDraft = false) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!rollNo.trim()) {
      setErrorMsg('Roll Number is mandatory! Please enter your official college Roll No (e.g. 24108B0021).');
      return;
    }

    if (!studentName.trim()) {
      setErrorMsg('Please enter your full Student Name.');
      return;
    }

    if (!emailVit.trim()) {
      setErrorMsg('Please enter your official VIT email ID.');
      return;
    }

    if (!isDraft && !studentDeclarationAgreed) {
      setErrorMsg('Please confirm the student declaration checkbox before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: Partial<MenteePersonalDetails> = {
        studentId: initialData?.studentId || currentUser.id,
        studentName: studentName.trim(),
        rollNo: rollNo.trim().toUpperCase(),
        mentorName: mentorName.trim(),
        mentorEmail: 'sheetal.patil@vit.edu.in',
        department: 'Department of Electronics and Computer Science',
        yearAndDivision: yearAndDivision.trim(),
        studentMobile: studentMobile.trim(),
        residentialTelephone: residentialTelephone.trim(),
        residentialAddress: residentialAddress.trim(),
        emergencyContact: emergencyContact.trim(),
        permanentAddress: permanentAddress.trim(),
        emailVit: emailVit.trim().toLowerCase(),
        emailPersonal: emailPersonal.trim(),
        familyBackground: familyBackground.trim(),
        medicalHistory: medicalHistory.trim(),
        hobbiesAndInterest: hobbiesAndInterest.trim(),
        strength: strength.trim(),
        weakness: weakness.trim(),
        studentSignature: studentSignature.trim() || studentName.trim(),
        studentSignedAt: new Date().toISOString(),
        status: isDraft ? 'draft' : 'submitted',
      };

      const res = await fetch('/api/v1/mentee-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit mentee form');
      }

      setSuccessMsg(
        isDraft
          ? 'Draft saved successfully!'
          : 'Your Mentee Personal Details Form has been successfully submitted to your Mentor & Super Admin!'
      );
      setIsEditing(false);
      if (onSaved) onSaved(data.form);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred while saving form');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMentorVerify = async () => {
    if (!initialData && !rollNo) return;
    setIsVerifying(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/v1/mentee-form', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formId: initialData?.id,
          rollNo: rollNo.trim().toUpperCase(),
          mentorSignature: currentUser.name || 'Dr. Sheetal Patil',
          mentorRemarks: mentorRemarks.trim() || 'Verified by Faculty Mentor. Information acknowledged.',
          status: 'verified',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to verify mentee form');
      }

      setSuccessMsg('Mentee form verified and signed by Mentor successfully!');
      if (onSaved) onSaved(data.form);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to verify form');
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const isFormLocked = !isEditing && (initialData?.status === 'submitted' || initialData?.status === 'verified');

  return (
    <div className="space-y-6 max-w-4xl mx-auto print:m-0 print:p-0 print:max-w-none">
      {/* ─── Screen Header & Action Toolbar ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-display">
                Personal Details of Mentee
              </h1>
              {initialData?.status === 'verified' ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified by Mentor
                </span>
              ) : initialData?.status === 'submitted' ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                  Submitted • Awaiting Sign-off
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  Form Pending
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Official Department Form • Visible to assigned Teacher Mentor & Super Admin
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-4 h-4 text-slate-600" />}
            className="text-xs border-slate-300"
          >
            Print / PDF
          </Button>

          {isFormLocked && !isMentorOrAdminViewing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              leftIcon={<Edit3 className="w-4 h-4 text-indigo-600" />}
              className="text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50"
            >
              Edit Form
            </Button>
          )}
        </div>
      </div>

      {/* ─── Feedback Messages ─── */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3 print:hidden">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Please check your inputs:</p>
            <p>{errorMsg}</p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start gap-3 print:hidden">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <p className="font-semibold">{successMsg}</p>
        </div>
      )}

      {/* ─── THE OFFICIAL DOCUMENT PAPER CONTAINER ─── */}
      <div className="bg-white rounded-2xl shadow-md border border-slate-300 overflow-hidden print:shadow-none print:border-none print:rounded-none">
        {/* Document Header (Replicating scanned sheet exactly) */}
        <div className="p-6 sm:p-8 border-b-2 border-slate-900 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center justify-between border-b border-slate-400 pb-4 mb-4">
            {/* VIT Emblem Badge */}
            <div className="flex items-center gap-3">
              <div className="border-2 border-indigo-950 px-3 py-1.5 rounded bg-white text-center shadow-xs">
                <div className="text-xl font-black tracking-widest text-indigo-950 font-serif leading-none">
                  VIT
                </div>
                <div className="text-[7.5px] font-semibold text-slate-600 leading-tight border-t border-slate-300 mt-0.5 pt-0.5">
                  Vidyalankar Institute of Technology
                </div>
                <div className="text-[7px] font-extrabold text-amber-700 uppercase tracking-tighter">
                  Accredited A+ by NAAC
                </div>
              </div>
            </div>

            {/* Department Title */}
            <div className="text-right">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 uppercase tracking-wide">
                Department of Electronics and Computer Science
              </h2>
              <h3 className="text-lg sm:text-xl font-black text-slate-950 tracking-tight mt-0.5">
                Personal Details of Mentee
              </h3>
            </div>
          </div>

          {/* Mentor Header Field */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1">
            <span className="font-bold text-slate-900 text-sm tracking-wide">
              Name of the mentor:
            </span>
            {isEditing ? (
              <input
                type="text"
                value={mentorName}
                onChange={(e) => setMentorName(e.target.value)}
                placeholder="e.g. Dr. Sheetal Patil"
                className="flex-1 px-3 py-1.5 text-sm font-semibold border-b-2 border-slate-600 bg-indigo-50/40 focus:bg-white focus:outline-none focus:border-indigo-600 transition"
              />
            ) : (
              <span className="text-sm font-bold text-indigo-900 border-b border-dotted border-slate-600 pb-0.5 flex-1">
                {mentorName || 'Dr. Sheetal Patil'}
              </span>
            )}
          </div>
        </div>

        {/* ─── FORM TABLE BODY (Replicating exact PDF layout) ─── */}
        <div className="divide-y divide-slate-300 text-xs sm:text-sm">
          {/* Section Heading Banner */}
          <div className="bg-slate-100/90 px-6 py-2.5 font-black uppercase tracking-wider text-slate-800 text-xs border-b border-slate-300">
            PERSONAL INFORMATION
          </div>

          {/* Row 1: Name of the Student */}
          <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-300">
            <div className="md:col-span-1 p-3.5 bg-slate-50/80 font-bold text-slate-800 flex items-center">
              Name of the Student
            </div>
            <div className="md:col-span-3 p-3">
              {isEditing ? (
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Full Student Name (Surname First or Standard Order)"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                />
              ) : (
                <span className="font-bold text-slate-900 text-base">{studentName || '—'}</span>
              )}
            </div>
          </div>

          {/* Row 2: Roll No (HIGHLIGHTED REQUIRED FIELD) */}
          <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-300 bg-amber-50/30">
            <div className="md:col-span-1 p-3.5 bg-amber-100/60 font-bold text-amber-950 flex items-center justify-between">
              <span>Roll No *</span>
              <span className="text-[10px] bg-amber-700 text-white font-extrabold px-1.5 py-0.2 rounded print:hidden">
                REQUIRED
              </span>
            </div>
            <div className="md:col-span-3 p-3">
              {isEditing ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <input
                    type="text"
                    value={rollNo}
                    onChange={(e) => setRollNo(e.target.value)}
                    placeholder="Enter Roll No / PRN (e.g. 24108B0021, 2022BECS042)"
                    className="flex-1 px-3 py-1.5 rounded-lg border-2 border-amber-400 font-mono font-bold text-sm text-slate-900 uppercase focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-500">
                    Will be synced to your official college profile
                  </span>
                </div>
              ) : (
                <span className="font-mono font-black text-slate-950 text-base tracking-wider bg-white px-3 py-1 rounded-md border border-slate-300 inline-block shadow-2xs">
                  {rollNo || 'Not entered'}
                </span>
              )}
            </div>
          </div>

          {/* Row 3: Year & Division */}
          <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-300">
            <div className="md:col-span-1 p-3.5 bg-slate-50/80 font-bold text-slate-800 flex items-center">
              Year & Division
            </div>
            <div className="md:col-span-3 p-3">
              {isEditing ? (
                <select
                  value={yearAndDivision}
                  onChange={(e) => setYearAndDivision(e.target.value)}
                  className="w-full sm:w-72 px-3 py-1.5 rounded-lg border border-slate-300 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                >
                  <option value="TE ECS - Div A">TE ECS - Div A</option>
                  <option value="TE ECS - Div B">TE ECS - Div B</option>
                  <option value="BE ECS - Div A">BE ECS - Div A</option>
                  <option value="BE ECS - Div B">BE ECS - Div B</option>
                  <option value="SE ECS - Div A">SE ECS - Div A</option>
                  <option value="SE ECS - Div B">SE ECS - Div B</option>
                </select>
              ) : (
                <span className="font-semibold text-slate-800">{yearAndDivision || '—'}</span>
              )}
            </div>
          </div>

          {/* Row 4: Student Telephone (Mobile No) & (Residential No) */}
          <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-300">
            <div className="md:col-span-1 p-3.5 bg-slate-50/80 font-bold text-slate-800 flex items-center">
              Student Telephone
            </div>
            <div className="md:col-span-3 p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  (Mobile No)
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={studentMobile}
                    onChange={(e) => setStudentMobile(e.target.value)}
                    placeholder="+91 98201 XXXXX"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  />
                ) : (
                  <span className="font-medium text-slate-800">{studentMobile || '—'}</span>
                )}
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  (Residential No)
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={residentialTelephone}
                    onChange={(e) => setResidentialTelephone(e.target.value)}
                    placeholder="022-2410 XXXX"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  />
                ) : (
                  <span className="font-medium text-slate-800">{residentialTelephone || '—'}</span>
                )}
              </div>
            </div>
          </div>

          {/* Row 5: Residential Address */}
          <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-300">
            <div className="md:col-span-1 p-3.5 bg-slate-50/80 font-bold text-slate-800 flex items-center">
              Residential Address
            </div>
            <div className="md:col-span-3 p-3">
              {isEditing ? (
                <textarea
                  rows={2}
                  value={residentialAddress}
                  onChange={(e) => setResidentialAddress(e.target.value)}
                  placeholder="Enter complete current residential address in Mumbai"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                />
              ) : (
                <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {residentialAddress || '—'}
                </p>
              )}
            </div>
          </div>

          {/* Row 6: Emergency contact */}
          <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-300">
            <div className="md:col-span-1 p-3.5 bg-slate-50/80 font-bold text-slate-800 flex items-center">
              Emergency contact
            </div>
            <div className="md:col-span-3 p-3">
              {isEditing ? (
                <input
                  type="text"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="Parent Name, Relation, Phone No (e.g. Ramesh Nikumbh (Father) - +91 98201 11223)"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                />
              ) : (
                <span className="font-semibold text-slate-900">{emergencyContact || '—'}</span>
              )}
            </div>
          </div>

          {/* Row 7: Permanent Address */}
          <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-300">
            <div className="md:col-span-1 p-3.5 bg-slate-50/80 font-bold text-slate-800 flex flex-col justify-center">
              <span>Permanent Address</span>
              {isEditing && (
                <button
                  type="button"
                  onClick={handleCopyResidentialToPermanent}
                  className="text-[10px] text-indigo-600 hover:text-indigo-800 underline font-semibold mt-1 text-left print:hidden"
                >
                  Same as Residential
                </button>
              )}
            </div>
            <div className="md:col-span-3 p-3">
              {isEditing ? (
                <textarea
                  rows={2}
                  value={permanentAddress}
                  onChange={(e) => setPermanentAddress(e.target.value)}
                  placeholder="Enter permanent address (or click Same as Residential above)"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                />
              ) : (
                <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {permanentAddress || '—'}
                </p>
              )}
            </div>
          </div>

          {/* Row 8: Email.id (VIT - & Personal -) */}
          <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-300">
            <div className="md:col-span-1 p-3.5 bg-slate-50/80 font-bold text-slate-800 flex items-center">
              Email.id
            </div>
            <div className="md:col-span-3 p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-indigo-900 mb-1">
                  VIT -
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={emailVit}
                    onChange={(e) => setEmailVit(e.target.value)}
                    placeholder="student.name@vit.edu.in"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  />
                ) : (
                  <span className="font-semibold text-indigo-700">{emailVit || '—'}</span>
                )}
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Personal -
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={emailPersonal}
                    onChange={(e) => setEmailPersonal(e.target.value)}
                    placeholder="student.personal@gmail.com"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  />
                ) : (
                  <span className="font-medium text-slate-800">{emailPersonal || '—'}</span>
                )}
              </div>
            </div>
          </div>

          {/* Row 9: Family Background */}
          <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-300">
            <div className="md:col-span-1 p-3.5 bg-slate-50/80 font-bold text-slate-800 flex items-center">
              Family Background
            </div>
            <div className="md:col-span-3 p-3">
              {isEditing ? (
                <textarea
                  rows={2}
                  value={familyBackground}
                  onChange={(e) => setFamilyBackground(e.target.value)}
                  placeholder="Father's profession, Mother's profession, siblings, family overview"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                />
              ) : (
                <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {familyBackground || '—'}
                </p>
              )}
            </div>
          </div>

          {/* Row 10: Medical History if Any */}
          <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-300">
            <div className="md:col-span-1 p-3.5 bg-slate-50/80 font-bold text-slate-800 flex flex-col justify-center">
              <span>Medical History if Any</span>
              {isEditing && (
                <button
                  type="button"
                  onClick={handleQuickNoneMedical}
                  className="text-[10px] text-emerald-700 hover:text-emerald-900 underline font-semibold mt-1 text-left print:hidden"
                >
                  Quick: None
                </button>
              )}
            </div>
            <div className="md:col-span-3 p-3">
              {isEditing ? (
                <textarea
                  rows={2}
                  value={medicalHistory}
                  onChange={(e) => setMedicalHistory(e.target.value)}
                  placeholder="Mention any allergies, chronic conditions, regular medications, or 'None'"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                />
              ) : (
                <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {medicalHistory || 'None'}
                </p>
              )}
            </div>
          </div>

          {/* Row 11: Hobbies And Interest */}
          <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-300">
            <div className="md:col-span-1 p-3.5 bg-slate-50/80 font-bold text-slate-800 flex items-center">
              Hobbies And Interest
            </div>
            <div className="md:col-span-3 p-3">
              {isEditing ? (
                <textarea
                  rows={2}
                  value={hobbiesAndInterest}
                  onChange={(e) => setHobbiesAndInterest(e.target.value)}
                  placeholder="Technical domains, co-curricular interests, sports, creative hobbies"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                />
              ) : (
                <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {hobbiesAndInterest || '—'}
                </p>
              )}
            </div>
          </div>

          {/* Row 12: Strength */}
          <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-300">
            <div className="md:col-span-1 p-3.5 bg-slate-50/80 font-bold text-slate-800 flex items-center">
              Strength
            </div>
            <div className="md:col-span-3 p-3">
              {isEditing ? (
                <textarea
                  rows={2}
                  value={strength}
                  onChange={(e) => setStrength(e.target.value)}
                  placeholder="Key technical, interpersonal, or problem-solving strengths"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                />
              ) : (
                <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {strength || '—'}
                </p>
              )}
            </div>
          </div>

          {/* Row 13: Weakness */}
          <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-300">
            <div className="md:col-span-1 p-3.5 bg-slate-50/80 font-bold text-slate-800 flex items-center">
              Weakness
            </div>
            <div className="md:col-span-3 p-3">
              {isEditing ? (
                <textarea
                  rows={2}
                  value={weakness}
                  onChange={(e) => setWeakness(e.target.value)}
                  placeholder="Areas where you require mentorship, guidance, or improvement"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                />
              ) : (
                <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {weakness || '—'}
                </p>
              )}
            </div>
          </div>

          {/* Row 14: Signatures Section (Matching PDF footer) */}
          <div className="p-6 sm:p-8 bg-slate-50/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-end pt-4">
              {/* Student Signature */}
              <div className="space-y-3">
                <div className="h-14 border-b border-slate-600 flex flex-col justify-end pb-1 font-serif">
                  <span className="italic font-bold text-slate-900 text-base">
                    {studentSignature || studentName || 'Student Signature'}
                  </span>
                  {initialData?.studentSignedAt && (
                    <span className="text-[10px] text-slate-500 font-sans">
                      Digitally declared on: {new Date(initialData.studentSignedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <div className="font-bold text-slate-800 text-xs sm:text-sm">
                  (Signature of student)
                </div>

                {isEditing && (
                  <label className="flex items-start gap-2 pt-1 text-xs text-slate-700 cursor-pointer print:hidden">
                    <input
                      type="checkbox"
                      checked={studentDeclarationAgreed}
                      onChange={(e) => setStudentDeclarationAgreed(e.target.checked)}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>
                      I hereby declare that all details filled above are true, complete, and accurate.
                    </span>
                  </label>
                )}
              </div>

              {/* Mentor Signature */}
              <div className="space-y-3 sm:text-right">
                <div className="h-14 border-b border-slate-600 flex flex-col justify-end sm:items-end pb-1 font-serif">
                  {initialData?.status === 'verified' ? (
                    <div className="flex flex-col sm:items-end">
                      <span className="italic font-bold text-indigo-900 text-base">
                        {initialData.mentorSignature || mentorName}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-sans font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified: {initialData.mentorSignedAt ? new Date(initialData.mentorSignedAt).toLocaleDateString() : 'Signed'}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">
                      Pending Mentor Verification
                    </span>
                  )}
                </div>
                <div className="font-bold text-slate-800 text-xs sm:text-sm">
                  (Signature of mentor)
                </div>

                {/* Mentor remarks display */}
                {initialData?.mentorRemarks && (
                  <p className="text-[11px] text-slate-600 italic sm:text-right">
                    Remarks: &quot;{initialData.mentorRemarks}&quot;
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Mentor Verification Panel (Visible to Teacher / Super Admin) ─── */}
      {(isTeacher || isAdmin) && initialData && (
        <Card padding="md" className="border-indigo-200 bg-indigo-50/50 print:hidden">
          <div className="flex items-center gap-2 mb-3">
            <UserCheck className="w-5 h-5 text-indigo-700" />
            <h3 className="text-sm font-bold text-indigo-950 font-display">
              Faculty Mentor Review & Signature Section
            </h3>
          </div>
          <p className="text-xs text-indigo-900/80 mb-3">
            As faculty mentor ({mentorName}), you can review this student&apos;s mentee information, add mentorship notes, and digitally sign the record.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mentor Notes / Remarks
              </label>
              <input
                type="text"
                value={mentorRemarks}
                onChange={(e) => setMentorRemarks(e.target.value)}
                placeholder="e.g. Verified. Discussed strengths in edge AI and agreed on weekly sync."
                className="w-full px-3 py-2 text-xs rounded-xl border border-indigo-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleMentorVerify}
                disabled={isVerifying}
                leftIcon={<ShieldCheck className="w-4 h-4" />}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
              >
                {isVerifying ? 'Verifying...' : initialData.status === 'verified' ? 'Update Signature & Remarks' : 'Sign & Verify Mentee Form'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* ─── Bottom Actions for Student ─── */}
      {isEditing && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm print:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSubmit(true)}
            disabled={submitting}
            leftIcon={<Save className="w-4 h-4 text-slate-500" />}
            className="w-full sm:w-auto text-xs"
          >
            Save Draft
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {initialData && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(false)}
                className="w-full sm:w-auto text-xs text-slate-600"
              >
                Cancel
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              leftIcon={<Send className="w-4 h-4" />}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
            >
              {submitting ? 'Submitting...' : 'Submit Form to Teacher & Admin'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
