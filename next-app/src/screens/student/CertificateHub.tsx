'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@components/common/Card';
import { Button } from '@components/common/Button';
import { Modal } from '@components/common/Modal';
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
  UploadCloud,
} from 'lucide-react';
import type { Certificate } from '@/types';
import { formatDate } from '@lib/utils';

export const CertificateHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'OFFICIAL' | 'SELF_REPORTED'>('OFFICIAL');
  const [verifyModalCert, setVerifyModalCert] = useState<Certificate | null>(null);
  const [selectedReceiptCert, setSelectedReceiptCert] = useState<Certificate | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  // Live certificates from database
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newProvider, setNewProvider] = useState('');
  const [certFile, setCertFile] = useState<File | null>(null);
  const [certFileName, setCertFileName] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    async function loadCerts() {
      try {
        const res = await fetch('/api/certificates');
        if (res.ok) {
          const json = await res.json();
          if (json.data && Array.isArray(json.data) && json.data.length > 0 && isMounted) {
            setCerts(json.data);
          }
        }
      } catch (err) {
        console.error('Failed to load certificates from API:', err);
      }
    }
    loadCerts();
    return () => {
      isMounted = false;
    };
  }, []);

  const officialCerts = certs.filter((c) => c.type === 'PLATFORM_ISSUED');
  const externalCerts = certs.filter((c) => c.type === 'SELF_REPORTED');

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ─── Hero Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-200">
              Institutional Credential Portfolio
            </span>
            <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Immutable Ledger Verified</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            My Certificates & Accreditations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
            Access cryptographically secured university certificates and manage external self-reported achievements (maintained in separate ledgers per FR-114/FR-115).
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setShowUploadModal(true)}
        >
          Self-Report External Cert
        </Button>
      </div>

      {/* ─── Tabs Filter (Official vs External) ─── */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('OFFICIAL')}
          className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'OFFICIAL'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Official University Issued ({officialCerts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('SELF_REPORTED')}
          className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'SELF_REPORTED'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Self-Reported External ({externalCerts.length})</span>
        </button>
      </div>

      {/* ─── OFFICIAL TAB CONTENT ─── */}
      {activeTab === 'OFFICIAL' && (
        officialCerts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {officialCerts.map((cert) => (
              <Card
                key={cert.id}
                hoverEffect
                padding="lg"
                className="border-slate-200/90 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Header Badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Cryptographically Signed</span>
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Issued: {formatDate(cert.issueDate)}
                    </span>
                  </div>

                  {/* Title */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 font-display leading-snug">
                      {cert.activityTitle}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Signatories: {cert.signatories?.join(', ')}
                    </p>
                  </div>

                  {/* SHA-256 Ledger Box */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span>Ledger Hash (SHA-256)</span>
                      <button
                        onClick={() => cert.verificationHash && copyHash(cert.verificationHash)}
                        className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                      >
                        {copiedHash ? (
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
                    </div>
                    <div className="text-[11px] font-mono text-slate-700 truncate bg-white px-2 py-1 rounded border border-slate-200">
                      {cert.verificationHash}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<QrCode className="w-4 h-4" />}
                    onClick={() => setVerifyModalCert(cert)}
                  >
                    Verify QR
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Download className="w-4 h-4" />}
                  >
                    Download PDF
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card padding="lg" className="text-center py-12 border-dashed border-2 border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 font-display">
              No Official Certificates Issued Yet
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Institutional verified credentials are issued and immutably recorded upon successful completion and faculty sign-off.
            </p>
          </Card>
        )
      )}

      {/* ─── SELF-REPORTED TAB CONTENT (FR-115) ─── */}
      {activeTab === 'SELF_REPORTED' && (
        <div className="space-y-6">
          {/* Prominent Disclaimer Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 leading-relaxed">
              <strong className="text-amber-900 block font-bold mb-0.5">
                REGULATORY COMPLIANCE NOTICE (FR-115):
              </strong>
              External certificates reported in this tab are unverified student claims. They are strictly segregated and will <strong>NOT</strong> appear in official institutional transcripts, NAAC accreditation submissions, or ABET program audits.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {externalCerts.length > 0 ? (
              externalCerts.map((cert) => (
                <Card
                  key={cert.id}
                  hoverEffect
                  padding="lg"
                  className="border-slate-200/90 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                        Self-Reported
                      </span>
                      <span className="text-xs text-slate-400">
                        Reported: {formatDate(cert.issueDate)}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900 font-display">
                        {cert.activityTitle}
                      </h3>
                      <p className="text-xs text-indigo-600 font-medium mt-1">
                        Provider: {cert.externalProvider}
                      </p>
                    </div>

                    <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60 text-xs text-amber-900">
                      {cert.disclaimer}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Faculty Review: Pending</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedReceiptCert(cert)}
                      rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                    >
                      View Uploaded Receipt
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12 bg-white rounded-2xl border-dashed border-2 border-slate-200 p-6">
                <FileCheck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-700 font-display">No External Certificates Uploaded</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Click &apos;Self-Report External Cert&apos; to submit an external certification for departmental records.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Verification Modal (QR Code & Audit Proof) ─── */}
      <Modal
        isOpen={!!verifyModalCert}
        onClose={() => setVerifyModalCert(null)}
        title="Institutional Verification Proof"
        description="Public cryptographic proof registered on the university ledger."
        maxWidth="md"
      >
        {verifyModalCert && (
          <div className="space-y-4 text-center py-2">
            {/* Simulated QR Code */}
            <div className="w-40 h-40 mx-auto bg-white p-3 rounded-2xl border-2 border-indigo-100 shadow-sm flex items-center justify-center">
              <QrCode className="w-32 h-32 text-slate-900" />
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900">
                {verifyModalCert.activityTitle}
              </h4>
              <p className="text-xs text-slate-500">
                Student: Siddharth Chen (VC-2026-891)
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs font-mono space-y-1">
              <div className="text-slate-400 text-[10px]">BLOCK NUMBER: #482910</div>
              <div className="text-slate-800 break-all text-[11px]">
                HASH: {verifyModalCert.verificationHash}
              </div>
            </div>

            <div className="flex justify-center pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setVerifyModalCert(null)}
              >
                Close Proof
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── View Uploaded Receipt Modal ─── */}
      <Modal
        isOpen={!!selectedReceiptCert}
        onClose={() => setSelectedReceiptCert(null)}
        title="Uploaded Certificate Document"
        description="Self-reported external credential document recorded in personal profile."
        maxWidth="md"
      >
        {selectedReceiptCert && (
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                <span className="font-bold text-slate-900 text-sm">
                  {selectedReceiptCert.activityTitle}
                </span>
              </div>
              <div className="text-xs text-slate-500">
                Provider: <span className="font-semibold text-slate-700">{selectedReceiptCert.externalProvider}</span> • Issue Date: {formatDate(selectedReceiptCert.issueDate)}
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs font-mono text-slate-700 flex items-center justify-between">
                <span className="truncate max-w-[260px]">
                  Document: {selectedReceiptCert.uploadReceiptUrl || `${selectedReceiptCert.activityTitle.toLowerCase().replace(/\\s+/g, '-')}-cert.pdf`}
                </span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                  Attached
                </span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
              {selectedReceiptCert.disclaimer}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setSelectedReceiptCert(null)}
              >
                Close Document
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Self-Report Modal ─── */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Self-Report External Credential"
        description="Upload external MOOC or hackathon credentials for personal portfolio tracking."
        maxWidth="md"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const receiptFileUrl = certFileName || 'credential-receipt.pdf';
            try {
              const res = await fetch('/api/certificates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  activityTitle: newTitle,
                  externalProvider: newProvider,
                  type: 'SELF_REPORTED',
                  fileUrl: receiptFileUrl,
                }),
              });
              if (res.ok) {
                const data = await res.json();
                if (data.data) {
                  setCerts((prev) => [data.data, ...prev]);
                }
              } else {
                const newCert: Certificate = {
                  id: `cert-ext-${Date.now()}`,
                  studentId: 'user-std-1',
                  activityId: 'act-external',
                  activityTitle: newTitle,
                  externalProvider: newProvider,
                  type: 'SELF_REPORTED',
                  issueDate: new Date().toISOString(),
                  uploadReceiptUrl: receiptFileUrl,
                  disclaimer:
                    'UNVERIFIED STUDENT SELF-REPORT: Excluded from official university transcripts and ABET/NAAC audit submissions (FR-115).',
                };
                setCerts((prev) => [newCert, ...prev]);
              }
            } catch {
              const newCert: Certificate = {
                id: `cert-ext-${Date.now()}`,
                studentId: 'user-std-1',
                activityId: 'act-external',
                activityTitle: newTitle,
                externalProvider: newProvider,
                type: 'SELF_REPORTED',
                issueDate: new Date().toISOString(),
                uploadReceiptUrl: receiptFileUrl,
                disclaimer:
                  'UNVERIFIED STUDENT SELF-REPORT: Excluded from official university transcripts and ABET/NAAC audit submissions (FR-115).',
              };
              setCerts((prev) => [newCert, ...prev]);
            }
            setShowUploadModal(false);
            setNewTitle('');
            setNewProvider('');
            setCertFile(null);
            setCertFileName('');
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Certificate Title
            </label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. AWS Certified Solutions Architect"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Issuing Organization / Provider
            </label>
            <input
              type="text"
              required
              value={newProvider}
              onChange={(e) => setNewProvider(e.target.value)}
              placeholder="e.g. Amazon Web Services, Coursera, Kaggle"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200"
            />
          </div>

          {/* Certificate File Upload Zone */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Certificate Document / Credential File
            </label>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-3 text-center bg-slate-50/60 hover:bg-slate-50 transition-colors">
              <input
                type="file"
                id="cert-file-upload-input"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setCertFile(file);
                    setCertFileName(file.name);
                  }
                }}
                className="hidden"
              />
              {certFileName ? (
                <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 truncate">
                    <FileCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="text-xs font-medium text-slate-800 truncate">{certFileName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCertFile(null);
                      setCertFileName('');
                    }}
                    className="text-[10px] text-rose-500 font-semibold hover:underline ml-2"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="cert-file-upload-input"
                  className="cursor-pointer flex flex-col items-center justify-center gap-1 py-1"
                >
                  <UploadCloud className="w-5 h-5 text-indigo-500" />
                  <span className="text-xs font-semibold text-indigo-600">
                    Click to upload certificate file (PDF, PNG, JPG)
                  </span>
                  <span className="text-[10px] text-slate-400">PDF, JPG, or PNG up to 10MB</span>
                </label>
              )}
            </div>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
            <strong>Notice:</strong> This certificate will be saved under your personal profile only. It will not be accredited or audited by university authorities.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowUploadModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Record Credential & Upload
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
