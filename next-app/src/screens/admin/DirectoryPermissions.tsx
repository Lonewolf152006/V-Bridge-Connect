'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@components/common/Card';
import { Button } from '@components/common/Button';
import { Modal } from '@components/common/Modal';
import {
  ShieldCheck,
  UserPlus,
  Search,
  Edit3,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2,
  Users2,
  AlertCircle,
} from 'lucide-react';
import { roleLabel } from '@lib/utils';
import type { UserRole } from '@/types';
import Link from 'next/link';

interface DirectoryUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  institutionalId: string;
  avatarUrl: string;
  activeTeamsCount?: number;
}

export const DirectoryPermissions: React.FC = () => {
  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  // Add User Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('student');
  const [newDept, setNewDept] = useState('Electronics and Computer Science');
  const [newInstId, setNewInstId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/admin/users');
      if (res.ok) {
        const data = await res.json();
        if (data.users) setUsers(data.users);
      }
    } catch (err) {
      console.error('Failed to fetch directory users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/v1/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          role: newRole,
          departmentName: newDept,
          institutionalId: newInstId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      setUsers([data.user, ...users]);
      setIsAddModalOpen(false);
      setNewName('');
      setNewEmail('');
      setNewInstId('');
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.department.toLowerCase().includes(search.toLowerCase()) ||
      (u.institutionalId && u.institutionalId.toLowerCase().includes(search.toLowerCase()));

    const matchesRole =
      roleFilter === 'ALL' || u.role.toUpperCase() === roleFilter.toUpperCase();
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-200">
            Institutional Identity & Directory
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 font-display mt-1">
            Directory & Scoped Role Permissions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Live database view of institutional identities, student accounts, faculty guides, and role assignments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/coordinator/roster-upload">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<FileSpreadsheet className="w-4 h-4 text-indigo-600" />}
            >
              Bulk Upload Roster (Excel/PDF)
            </Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<UserPlus className="w-4 h-4" />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Add Institutional User
          </Button>
        </div>
      </div>

      {/* ─── Filter Bar ─── */}
      <Card padding="md" className="flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, institutional ID, email, or department..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="ALL">All Roles ({users.length})</option>
          <option value="STUDENT">Students</option>
          <option value="COORDINATOR">Faculty Mentors / Coordinators</option>
          <option value="INDUSTRY_PARTNER">Industry Partners</option>
          <option value="SUPER_ADMIN">Super Admins</option>
        </select>

        <button
          onClick={fetchUsers}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          title="Refresh Directory"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </Card>

      {/* ─── Directory Table (Live DB Data) ─── */}
      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200/60 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="px-5 py-3">Member & Institutional ID</th>
                <th className="px-5 py-3">Assigned Role</th>
                <th className="px-5 py-3">Department Scope</th>
                <th className="px-5 py-3">Active Groups</th>
                <th className="px-5 py-3">Access Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                    Loading live directory members from database...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                    No members match your search query.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
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
                            {u.email} • {u.institutionalId || 'ID-PENDING'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {roleLabel(u.role as UserRole)}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-slate-600">{u.department}</td>

                    <td className="px-5 py-3.5 text-slate-600 font-medium">
                      {u.activeTeamsCount || 1} Workspaces
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Verified Database Identity</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ─── Modal: Add Institutional User ─── */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Institutional Member"
        description="Provision a verified student, faculty guide, or coordinator directly into the platform database."
        maxWidth="lg"
      >
        <form onSubmit={handleAddUser} className="space-y-4">
          {modalError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{modalError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Full Legal / Institutional Name:
            </label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Dr. Sheetal Patil or Vedant Patole"
              className="w-full text-xs sm:text-sm px-3 py-2 bg-slate-50 rounded-xl border border-slate-200"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Institutional Email:
            </label>
            <input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="e.g. sheetal.patil@vit.edu.in"
              className="w-full text-xs sm:text-sm px-3 py-2 bg-slate-50 rounded-xl border border-slate-200"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Institutional Role:
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full text-xs sm:text-sm px-3 py-2 bg-slate-50 rounded-xl border border-slate-200"
              >
                <option value="student">Student</option>
                <option value="coordinator">Faculty Guide / Coordinator</option>
                <option value="industry_partner">Industry Partner</option>
                <option value="super_admin">Dean / Super Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Institutional ID / Roll No:
              </label>
              <input
                type="text"
                value={newInstId}
                onChange={(e) => setNewInstId(e.target.value)}
                placeholder="24108B0021 / VIT-FAC-0142"
                className="w-full text-xs sm:text-sm px-3 py-2 bg-slate-50 rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Department:
            </label>
            <input
              type="text"
              value={newDept}
              onChange={(e) => setNewDept(e.target.value)}
              className="w-full text-xs sm:text-sm px-3 py-2 bg-slate-50 rounded-xl border border-slate-200"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={submitting}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Save to Database
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
