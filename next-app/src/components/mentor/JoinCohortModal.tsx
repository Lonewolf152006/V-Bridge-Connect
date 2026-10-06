'use client';

import React, { useState } from 'react';
import { Card } from '@components/common/Card';
import { Button } from '@components/common/Button';
import { KeyRound, CheckCircle2, AlertCircle, X, Building2 } from 'lucide-react';

interface JoinCohortModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (joinedData: any) => void;
}

export const JoinCohortModal: React.FC<JoinCohortModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Please enter a faculty invite code.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/mentor/join-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to connect with faculty code.');
      }

      setSuccessData(json.data);
      onSuccess?.(json.data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please check your code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <Card
        padding="none"
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-400/30">
              <Building2 className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="font-bold text-base font-display">Industry Mentor Co-Mentorship</h3>
              <p className="text-xs text-indigo-200/80">Connect to Academic Faculty Student Groups</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {successData ? (
            <div className="text-center space-y-4 py-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-lg">Successfully Connected!</h4>
                <p className="text-xs text-slate-500 mt-1">
                  You are now an authorized Industry Mentor for{' '}
                  <span className="font-semibold text-slate-800">{successData.facultyName}</span>'s student teams.
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-left">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Project Teams Joined ({successData.teamsJoined.length})
                </div>
                <div className="space-y-1.5">
                  {successData.teamsJoined.map((team: any) => (
                    <div
                      key={team.id}
                      className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white border border-slate-200/60 font-medium text-slate-800"
                    >
                      <span>{team.name}</span>
                      <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                        Workspace Active
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => {
                  onClose();
                  window.location.reload();
                }}
              >
                Go to Workspace Hub
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Faculty Invite Code
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.toUpperCase());
                      setError(null);
                    }}
                    placeholder="e.g. FAC-SPATIL-2026"
                    className="w-full pl-9 pr-3 py-2.5 font-mono text-sm tracking-widest font-bold uppercase rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Enter the unique code shared with you by your academic guide (e.g. <span className="font-mono font-semibold text-indigo-600">FAC-SPATIL-2026</span> for Dr. Sheetal Patil).
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 rounded-xl border border-rose-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={loading}
                >
                  Connect to Groups
                </Button>
              </div>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
};
