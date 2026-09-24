'use client';

import React, { useState } from 'react';
import { Card } from '@components/common/Card';
import { Button } from '@components/common/Button';
import { ShieldCheck, UserPlus, Search, Edit3, Lock } from 'lucide-react';
import { MOCK_USERS_LIST } from '@services/mockData';
import { roleLabel } from '@lib/utils';
import type { UserRole } from '@/types';

export const DirectoryPermissions: React.FC = () => {
  const [users, setUsers] = useState(MOCK_USERS_LIST);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.department.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-200">
            Administrative Console
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 font-display mt-1">
            Directory & Scoped Role Permissions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Manage institutional identities, departmental boundaries, and role-based access controls.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<UserPlus className="w-4 h-4" />}
          onClick={() => alert('Add Member modal simulated.')}
        >
          Add Institutional User
        </Button>
      </div>

      {/* ─── Filter Bar ─── */}
      <Card padding="md" className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, department..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50"
        >
          <option value="ALL">All Roles</option>
          <option value="STUDENT">Student</option>
          <option value="FACULTY_MENTOR">Faculty Mentor</option>
          <option value="COORDINATOR">Coordinator</option>
          <option value="INDUSTRY_PARTNER">Industry Partner</option>
          <option value="EXTERNAL_REVIEWER">External Reviewer</option>
        </select>
      </Card>

      {/* ─── Directory Table ─── */}
      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200/60 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="px-5 py-3">Member & Institutional ID</th>
                <th className="px-5 py-3">Assigned Role</th>
                <th className="px-5 py-3">Department Scope</th>
                <th className="px-5 py-3">Access Level</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <img
                        src={u.avatarUrl}
                        alt={u.name}
                        className="w-8 h-8 rounded-full bg-slate-200"
                      />
                      <div>
                        <div className="font-bold text-slate-900">{u.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {u.email} • {u.institutionalId || 'EXT-PARTNER'}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {roleLabel(u.role)}
                    </span>
                  </td>

                  <td className="px-5 py-3.5 text-slate-600">{u.department}</td>

                  <td className="px-5 py-3.5">
                    <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Standard Institutional</span>
                    </span>
                  </td>

                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <Button variant="ghost" size="sm">
                      <Edit3 className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
