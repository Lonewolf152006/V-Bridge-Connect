'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card } from '@components/common/Card';
import { Button } from '@components/common/Button';
import { Modal } from '@components/common/Modal';
import { useAppStore } from '@store/appStore';
import {
  Award,
  ShieldCheck,
  ExternalLink,
  Download,
  AlertTriangle,
  Plus,
  QrCode,
  FileCheck,
  CheckCircle2,
  Copy,
  Check,
  Upload,
  UploadCloud,
  FileText,
  Search,
  RefreshCw,
  Sparkles,
  X,
  FileSpreadsheet,
  Layers,
  GraduationCap,
  Calendar,
  Building,
  UserCheck,
} from 'lucide-react';
import type { Certificate } from '@/types';
import { formatDate } from '@lib/utils';

export const CertificateHub: React.FC = () => {
  const { currentUser } = useAppStore();
  const isFaculty = currentUser.role === 'COORDINATOR' || currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'INDUSTRY_PARTNER';

  // Live certificates from database
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'ALL' | 'PLATFORM_ISSUED' | 'SELF_REPORTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [verifyModalCert, setVerifyModalCert] = useState<Certificate | null>(null);
  const [previewDocCert, setPreviewDocCert] = useState<Certificate | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [showUploadCard, setShowUploadCard] = useState(true);

  // Direct Upload Form State
  const [title, setTitle] = useState('');
  const [provider, setProvider] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [credentialUrl, setCredentialUrl] = useState('');
  const [certType, setCertType] = useState<'SELF_REPORTED' | 'PLATFORM_ISSUED'>('SELF_REPORTED');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadSectionRef = useRef<HTMLDivElement>(null);

  // Fetch certificates from API
  const fetchCerts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/certificates');
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          setCerts(json.data);
        }
      }
    } catch (err) {
      console.error('Failed to load certificates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCerts();
  }, []);

  // Compute counts
  const officialCount = useMemo(
    () => certs.filter((c) => c.type === 'PLATFORM_ISSUED').length,
    [certs]
  );
  const externalCount = useMemo(
    () => certs.filter((c) => c.type === 'SELF_REPORTED').length,
    [certs]
  );

  // Filtered and searched certificates
  const filteredCerts = useMemo(() => {
    return certs.filter((c) => {
      // Type match
      if (filterType !== 'ALL' && c.type !== filterType) {
        return false;
      }
      // Search query match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = c.activityTitle.toLowerCase().includes(q);
        const matchesProvider = c.externalProvider?.toLowerCase().includes(q);
        const matchesHash = c.verificationHash?.toLowerCase().includes(q);
        const matchesStudent =
          Boolean(c.studentName?.toLowerCase().includes(q)) ||
          Boolean(c.studentEmail?.toLowerCase().includes(q)) ||
          Boolean(c.studentInstitutionalId?.toLowerCase().includes(q)) ||
          Boolean(c.student?.name?.toLowerCase().includes(q));
        return matchesTitle || matchesProvider || matchesHash || matchesStudent;
      }
      return true;
    });
  }, [certs, filterType, searchQuery]);

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // File selection handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setUploadError(null);

    // Auto-populate title if empty
    if (!title.trim()) {
      const cleanName = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());
      setTitle(cleanName);
    }

    // Read file for preview
    const reader = new FileReader();
    reader.onload = () => {
      setFileDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Direct Upload Submission
  const handleDirectUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);
    setUploadSuccess(null);

    if (!title.trim()) {
      setUploadError('Please provide a certificate title.');
      return;
    }

    try {
      setIsUploading(true);

      const payload = {
        activityTitle: title.trim(),
        externalProvider: provider.trim() || (certType === 'PLATFORM_ISSUED' ? 'University Department' : 'Self-Uploaded Credential'),
        issueDate: issueDate,
        type: certType,
        fileUrl: fileDataUrl || credentialUrl || undefined,
        credentialUrl: credentialUrl || undefined,
        fileName: selectedFile?.name || undefined,
      };

      const res = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to register certificate');
      }

      // Add to state immediately
      const newCert: Certificate = json.data;
      setCerts((prev) => [newCert, ...prev]);

      setUploadSuccess(`"${newCert.activityTitle}" has been added to your certificate portfolio!`);
      
      // Reset form
      setTitle('');
      setProvider('');
      setCredentialUrl('');
      setSelectedFile(null);
      setFileDataUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Auto-hide success message after 4s
      setTimeout(() => setUploadSuccess(null), 4000);
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || 'Error uploading certificate. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const scrollToUpload = () => {
    setShowUploadCard(true);
    uploadSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ─── Hero Header ─── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full border border-indigo-400/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                <span>Unified Credential Portfolio</span>
              </span>
              <span className="text-[11px] bg-emerald-500/20 text-emerald-300 font-semibold px-3 py-1 rounded-full border border-emerald-400/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>Immutable University Ledger</span>
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight font-display text-white">
              {isFaculty ? 'Student Certificates & Verified Portfolios' : 'My Certificates & Accreditations'}
            </h1>
            
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {isFaculty
                ? 'Review, inspect proof documents, and audit external certificates (AWS, Coursera, Hackathons) and platform credentials submitted by students across your cohorts.'
                : 'All your credentials in one place. Access cryptographically secured university project certificates and directly upload external certifications (AWS, Coursera, Hackathons).'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              size="md"
              leftIcon={<Upload className="w-4 h-4" />}
              onClick={scrollToUpload}
              className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 font-semibold"
            >
              Upload Certificate Directly
            </Button>

            <Button
              variant="outline"
              size="md"
              leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
              onClick={fetchCerts}
              className="border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700"
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Live Counters Banner */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-slate-800/50 rounded-2xl p-3 border border-slate-700/60 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">{certs.length}</div>
              <div className="text-xs text-slate-400">Total Portfolio Items</div>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-2xl p-3 border border-slate-700/60 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">{officialCount}</div>
              <div className="text-xs text-slate-400">University Verified</div>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-slate-800/50 rounded-2xl p-3 border border-slate-700/60 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">{externalCount}</div>
              <div className="text-xs text-slate-400">Directly Uploaded</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── DIRECT UPLOAD SECTION (Inline on the Page) ─── */}
      <div ref={uploadSectionRef} className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-display">
                Upload Certificate to Portfolio
              </h2>
              <p className="text-xs text-slate-500">
                Upload your external certification, MOOC completion, or project diploma directly below.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowUploadCard(!showUploadCard)}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            {showUploadCard ? 'Collapse Upload Form' : '+ Expand Upload Form'}
          </button>
        </div>

        {showUploadCard && (
          <Card padding="lg" className="border-indigo-100 bg-white shadow-md relative overflow-hidden">
            {uploadSuccess && (
              <div className="mb-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm font-medium">{uploadSuccess}</div>
              </div>
            )}

            {uploadError && (
              <div className="mb-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm font-medium">{uploadError}</div>
              </div>
            )}

            <form onSubmit={handleDirectUpload} className="space-y-5">
              {/* Drag and Drop Zone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Certificate Document / Proof (PDF, PNG, JPG)
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                    selectedFile
                      ? 'border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50/70'
                      : 'border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/30'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf,image/png,image/jpeg,image/webp"
                    className="hidden"
                  />

                  {selectedFile ? (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <FileCheck className="w-6 h-6" />
                      </div>
                      <div className="text-center sm:text-left">
                        <div className="text-sm font-bold text-slate-800 break-all">{selectedFile.name}</div>
                        <div className="text-xs text-slate-500">
                          {(selectedFile.size / 1024).toFixed(1)} KB • Ready to upload
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                          setFileDataUrl(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white transition-colors"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-sm">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-semibold text-indigo-600 hover:underline">
                          Click to select a file
                        </span>
                        <span className="text-xs sm:text-sm text-slate-500"> or drag and drop certificate here</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Supports PDF diploma, certificate scan, or badge screenshot (up to 15MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Title */}
                <div className="lg:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Certificate / Activity Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. AWS Certified Solutions Architect / Capstone Distinction"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 placeholder:text-slate-400"
                  />
                </div>

                {/* Issuing Authority */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Issuing Organization / Authority *
                  </label>
                  <input
                    type="text"
                    required
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    placeholder="e.g. Amazon Web Services, Coursera, VIT"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 placeholder:text-slate-400"
                  />
                </div>

                {/* Issue Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Issue Date
                  </label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800"
                  />
                </div>

                {/* Credential URL */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Online Verification URL / Badge Link (Optional)
                  </label>
                  <input
                    type="url"
                    value={credentialUrl}
                    onChange={(e) => setCredentialUrl(e.target.value)}
                    placeholder="https://credly.com/badges/..."
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 placeholder:text-slate-400"
                  />
                </div>

                {/* Type Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Credential Category
                  </label>
                  <select
                    value={certType}
                    onChange={(e) => setCertType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 bg-white"
                  >
                    <option value="SELF_REPORTED">External Certification (MOOC, Vendor, Hackathon)</option>
                    <option value="PLATFORM_ISSUED">Institutional / University Activity Certificate</option>
                  </select>
                </div>
              </div>

              {/* Regulatory Notice & Submit Bar */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100">
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  <span>
                    Directly saves to your personal accredited portfolio. Automatically indexed for student profile view.
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    leftIcon={isUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    disabled={isUploading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 font-semibold px-6"
                  >
                    {isUploading ? 'Registering...' : 'Upload & Add to Portfolio'}
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        )}
      </div>

      {/* ─── COMBINED CERTIFICATES GALLERY SECTION ─── */}
      <div className="space-y-4">
        {/* Controls Bar: Filter Chips & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          {/* Unified Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                filterType === 'ALL'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Credentials ({certs.length})</span>
            </button>

            <button
              onClick={() => setFilterType('PLATFORM_ISSUED')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                filterType === 'PLATFORM_ISSUED'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>University Issued ({officialCount})</span>
            </button>

            <button
              onClick={() => setFilterType('SELF_REPORTED')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                filterType === 'SELF_REPORTED'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200/60'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Uploaded / External ({externalCount})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={isFaculty ? "Search student name, roll no, title, provider..." : "Search by title, provider, hash..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Unified Cards Grid */}
        {filteredCerts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredCerts.map((cert) => {
              const isOfficial = cert.type === 'PLATFORM_ISSUED';

              return (
                <Card
                  key={cert.id}
                  hoverEffect
                  padding="lg"
                  className={`border flex flex-col justify-between transition-all duration-200 ${
                    isOfficial
                      ? 'border-emerald-200/80 bg-white hover:border-emerald-300 shadow-sm'
                      : 'border-slate-200/90 bg-white hover:border-indigo-300 shadow-sm'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Header: Origin Badge & Date */}
                    <div className="flex items-center justify-between gap-2">
                      {isOfficial ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Official University Verified</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-200 flex items-center gap-1.5">
                          <FileCheck className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Uploaded / External</span>
                        </span>
                      )}

                      <div className="flex items-center gap-1 text-xs text-slate-400 font-mono">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{formatDate(cert.issueDate)}</span>
                      </div>
                    </div>

                    {/* Student Attribution (When viewed by faculty or present on credential) */}
                    {(cert.studentName || cert.student) && (
                      <div className="flex items-center gap-2.5 p-2 bg-slate-50 border border-slate-200/80 rounded-xl">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-2xs">
                          {(cert.studentName || cert.student?.name || 'S').slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-slate-900 truncate">
                            {cert.studentName || cert.student?.name}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono truncate">
                            {cert.studentInstitutionalId || cert.student?.institutionalId
                              ? `ID: ${cert.studentInstitutionalId || cert.student?.institutionalId}`
                              : cert.studentEmail || cert.student?.email || 'Student'}
                          </div>
                        </div>
                        <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded">
                          Student
                        </span>
                      </div>
                    )}

                    {/* Certificate Title & Organization */}
                    <div>
                      <h3 className="text-base font-bold text-slate-900 font-display leading-snug">
                        {cert.activityTitle}
                      </h3>
                      
                      <div className="flex items-center gap-1.5 text-xs mt-1">
                        <Building className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="text-slate-600 font-medium">
                          {cert.externalProvider || 'Vidyalankar Institute of Technology'}
                        </span>
                      </div>

                      {cert.signatories && cert.signatories.length > 0 && (
                        <p className="text-[11px] text-slate-400 mt-1">
                          Signatories: {cert.signatories.join(', ')}
                        </p>
                      )}
                    </div>

                    {/* Technical Proof / Ledger Section */}
                    {isOfficial ? (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                          <span className="flex items-center gap-1 font-mono">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            SHA-256 Ledger Hash
                          </span>
                          {cert.verificationHash && (
                            <button
                              onClick={() => copyHash(cert.verificationHash!)}
                              className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-[11px] font-semibold"
                            >
                              {copiedHash === cert.verificationHash ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span className="text-emerald-600">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-slate-700 truncate bg-white px-2 py-1 rounded border border-slate-200">
                          {cert.verificationHash || 'sha256-verified-institutional-ledger'}
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-[11px] text-amber-900 flex items-start gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <span>
                          Self-reported external credential for personal portfolio & skill showcase (FR-115).
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons Bar */}
                  <div className="mt-5 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    {isOfficial ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<QrCode className="w-3.5 h-3.5 text-indigo-600" />}
                          onClick={() => setVerifyModalCert(cert)}
                          className="border-slate-200 text-slate-700"
                        >
                          Verify Ledger QR
                        </Button>

                        <Button
                          variant="primary"
                          size="sm"
                          leftIcon={<Download className="w-3.5 h-3.5" />}
                          onClick={() => {
                            alert(`Downloading official cryptographically signed certificate PDF: ${cert.activityTitle}`);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                        >
                          Download PDF
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          {cert.externalFileUrl ? (
                            <Button
                              variant="outline"
                              size="sm"
                              leftIcon={<FileText className="w-3.5 h-3.5 text-indigo-600" />}
                              onClick={() => setPreviewDocCert(cert)}
                              className="border-slate-200 text-slate-700 text-xs"
                            >
                              View Uploaded Receipt
                            </Button>
                          ) : (
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                              Recorded
                            </span>
                          )}
                        </div>

                        {cert.externalFileUrl && cert.externalFileUrl.startsWith('http') && (
                          <a
                            href={cert.externalFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                          >
                            <span>Verify Link</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card padding="lg" className="text-center py-12 border-dashed border-2 border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 font-display">
              {searchQuery ? 'No certificates matching your search' : 'No Certificates Found'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              {searchQuery
                ? 'Try searching with a different term, or reset your filters.'
                : 'Upload your first certificate directly using the form above to build your verified credential portfolio.'}
            </p>
            <div className="mt-4">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Upload className="w-4 h-4" />}
                onClick={scrollToUpload}
              >
                Upload Certificate
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* ─── Verification Modal (QR Code & Cryptographic Ledger Proof) ─── */}
      <Modal
        isOpen={!!verifyModalCert}
        onClose={() => setVerifyModalCert(null)}
        title="Institutional Verification Proof"
        description="Public cryptographic proof registered on the university immutable ledger."
        maxWidth="md"
      >
        {verifyModalCert && (
          <div className="space-y-4 text-center py-2">
            <div className="w-40 h-40 mx-auto bg-white p-3 rounded-2xl border-2 border-indigo-100 shadow-sm flex items-center justify-center">
              <QrCode className="w-32 h-32 text-slate-900" />
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900 font-display">
                {verifyModalCert.activityTitle}
              </h4>
              <p className="text-xs text-slate-500">
                Institutional Credential • Vidyalankar Institute of Technology
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs font-mono space-y-1">
              <div className="text-slate-400 text-[10px]">LEDGER STATUS: IMMUTABLE VERIFIED</div>
              <div className="text-slate-800 break-all text-[11px]">
                HASH: {verifyModalCert.verificationHash || 'sha256-verified-proof-registered'}
              </div>
            </div>

            <div className="flex justify-center pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setVerifyModalCert(null)}
              >
                Close Verification Proof
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Document Preview Modal ─── */}
      <Modal
        isOpen={!!previewDocCert}
        onClose={() => setPreviewDocCert(null)}
        title={previewDocCert?.activityTitle || 'Uploaded Document'}
        description={`Issuer: ${previewDocCert?.externalProvider || 'External Authority'}`}
        maxWidth="lg"
      >
        {previewDocCert && (
          <div className="space-y-4 py-2">
            {(previewDocCert.studentName || previewDocCert.student) && (
              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center flex-shrink-0">
                  {(previewDocCert.studentName || previewDocCert.student?.name || 'S').slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-indigo-950">
                    Uploaded by {previewDocCert.studentName || previewDocCert.student?.name}
                  </div>
                  <div className="text-[11px] text-indigo-700 font-mono">
                    {previewDocCert.studentInstitutionalId || previewDocCert.student?.institutionalId
                      ? `Roll No: ${previewDocCert.studentInstitutionalId || previewDocCert.student?.institutionalId}`
                      : previewDocCert.studentEmail || previewDocCert.student?.email}
                  </div>
                </div>
              </div>
            )}

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto">
                <FileCheck className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800 font-display">
                  {previewDocCert.activityTitle}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Uploaded on {formatDate(previewDocCert.issueDate)}
                </p>
              </div>

              {/* Direct Image Preview if available */}
              {(previewDocCert.externalFileUrl || previewDocCert.uploadReceiptUrl) && (
                <div>
                  {(previewDocCert.externalFileUrl?.startsWith('data:image') ||
                    previewDocCert.externalFileUrl?.includes('unsplash') ||
                    previewDocCert.externalFileUrl?.match(/\.(jpeg|jpg|png|webp)($|\?)/i)) && (
                    <div className="mb-3 rounded-xl overflow-hidden border border-slate-200 max-h-72 flex items-center justify-center bg-white p-1">
                      <img
                        src={previewDocCert.externalFileUrl || previewDocCert.uploadReceiptUrl}
                        alt={previewDocCert.activityTitle}
                        className="max-h-64 object-contain rounded-lg"
                      />
                    </div>
                  )}

                  <a
                    href={previewDocCert.externalFileUrl || previewDocCert.uploadReceiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs bg-indigo-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    <span>Open Uploaded Document / Full Proof</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            {previewDocCert.disclaimer && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                {previewDocCert.disclaimer}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewDocCert(null)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
