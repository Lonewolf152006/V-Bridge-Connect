'use client';

import React, { useState } from 'react';
import { Card } from '@components/common/Card';
import { Button } from '@components/common/Button';
import { ProgressStepper } from '@components/common/ProgressStepper';
import {
  FilePlus,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Plus,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export const ActivityBuilderWizard: React.FC = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [published, setPublished] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('CAPSTONE');
  const [department, setDepartment] = useState('Computer Science & AI');
  const [capacity, setCapacity] = useState(25);
  const [minTeam, setMinTeam] = useState(3);
  const [maxTeam, setMaxTeam] = useState(5);

  const [milestones, setMilestones] = useState([
    { title: 'Milestone 1: Architecture Spec', weight: 20, due: '2026-10-15' },
    { title: 'Milestone 2: Prototype & Video', weight: 35, due: '2026-11-01' },
    { title: 'Milestone 3: Final Defense', weight: 45, due: '2026-11-30' },
  ]);

  const steps = [
    {
      id: 0,
      title: 'Activity Info',
      status: (currentStep > 0 ? 'completed' : currentStep === 0 ? 'current' : 'upcoming') as 'completed' | 'current' | 'upcoming',
    },
    {
      id: 1,
      title: 'Milestone Stages',
      status: (currentStep > 1 ? 'completed' : currentStep === 1 ? 'current' : 'upcoming') as 'completed' | 'current' | 'upcoming',
    },
    {
      id: 2,
      title: 'Review & Launch',
      status: (currentStep === 2 ? 'current' : 'upcoming') as 'completed' | 'current' | 'upcoming',
    },
  ];

  const handlePublish = () => {
    setPublished(true);
    setTimeout(() => {
      router.push('/activities');
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-200">
            Coordinator Suite (FR-001)
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 font-display mt-1">
            New Academic Opportunity Builder
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Configure project capacity, eligibility guidelines, and structured rubric weightages.
          </p>
        </div>
      </div>

      {/* ─── Stepper ─── */}
      <Card padding="md">
        <ProgressStepper steps={steps} orientation="horizontal" />
      </Card>

      {/* ─── Step Content ─── */}
      <Card padding="lg">
        {published ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-display">
              Opportunity Published Successfully!
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              The project is now open for student applications and listed on the institutional catalogue.
            </p>
          </div>
        ) : (
          <div>
            {currentStep === 0 && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900 font-display">
                  Step 1: General Project Information
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Activity Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Distributed EEG Signal Processing Pipeline"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="CAPSTONE">Capstone Project</option>
                      <option value="RESEARCH">Faculty Research</option>
                      <option value="HACKATHON">Hackathon</option>
                      <option value="INDUSTRY_PROJECT">Industry Sponsored</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Department
                    </label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="Computer Science & AI">Computer Science & AI</option>
                      <option value="Bioinformatics">Bioinformatics</option>
                      <option value="Electrical Engineering">Electrical Engineering</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Total Seat Capacity
                    </label>
                    <input
                      type="number"
                      value={capacity}
                      onChange={(e) => setCapacity(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Min Team Size
                    </label>
                    <input
                      type="number"
                      value={minTeam}
                      onChange={(e) => setMinTeam(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Max Team Size
                    </label>
                    <input
                      type="number"
                      value={maxTeam}
                      onChange={(e) => setMaxTeam(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 font-display">
                    Step 2: Milestone Schedule & Weightages
                  </h3>
                  <span className="text-xs text-indigo-600 font-bold">
                    Total Weight: 100%
                  </span>
                </div>

                <div className="space-y-3">
                  {milestones.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3"
                    >
                      <div className="flex-1">
                        <div className="text-xs font-bold text-slate-900">
                          {m.title}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Due Date: {m.due}
                        </div>
                      </div>
                      <div className="text-xs font-mono font-bold text-indigo-600 bg-white px-2.5 py-1 rounded border border-slate-200">
                        {m.weight}% weight
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900 font-display">
                  Step 3: Review & Publish Opportunity
                </h3>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div>
                    <strong>Title:</strong> {title || 'Distributed EEG Signal Processing Pipeline'}
                  </div>
                  <div>
                    <strong>Category:</strong> {category}
                  </div>
                  <div>
                    <strong>Department:</strong> {department}
                  </div>
                  <div>
                    <strong>Capacity:</strong> {capacity} students (Teams of {minTeam}–{maxTeam})
                  </div>
                  <div>
                    <strong>Milestone Stages:</strong> {milestones.length} predefined evaluation checkpoints
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800">
                  <strong>Audited Action:</strong> Publishing will log a <code>activity.created</code> event into the institutional tamper-evident ledger (FR-130).
                </div>
              </div>
            )}

            {/* Stepper Buttons */}
            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
              <Button
                variant="outline"
                disabled={currentStep === 0}
                onClick={() => setCurrentStep((prev) => prev - 1)}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Previous
              </Button>

              {currentStep < 2 ? (
                <Button
                  variant="primary"
                  onClick={() => setCurrentStep((prev) => prev + 1)}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Continue
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={handlePublish}
                  leftIcon={<Sparkles className="w-4 h-4" />}
                >
                  Publish Opportunity
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
