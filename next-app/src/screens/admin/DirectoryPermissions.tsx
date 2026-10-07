'use client';

import React, { useState } from 'react';
import { Card } from '@components/common/Card';
import { Button } from '@components/common/Button';
import { Modal } from '@components/common/Modal';
import { ShieldCheck, UserPlus, Search, Edit3, Lock, Check } from 'lucide-react';
import { MOCK_USERS_LIST } from '@services/mockData';
import { roleLabel } from '@lib/utils';
import type { UserRole } from '@/types';

export const DirectoryPermissions: React.FC = () => {
  const [users, setUsers] = useState(MOCK_USERS_LIST);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Add User Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('STUDENT');
  const [newDepartment, setNewDepartment] = useState('Electronics and Computer Science');
  const [newInstId, setNewInstId] = useState('');

  // Edit User Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<(typeof MOCK_USERS_LIST)[0] | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('STUDENT');
  const [editDepartment, setEditDepartment] = useState('');

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.department.toLowerCase().includes(search.toLowerCase());
    const matchesRole =
      roleFilter === 'ALL' ||
      u.role === roleFilter ||
      (roleFilter === 'COORDINATOR' && (u.role === 'COORDINATOR' || (u.role as string) === 'FACULTY_MENTOR')) ||
      (roleFilter === 'FACULTY_MENTOR' && (u.role === 'COORDINATOR' || (u.role as string) === 'FACULTY_MENTOR'));
    return matchesSearch && matchesRole;
  });

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    const newUser = {
      id: `usr-${Date.now()}`,
      name: newName.trim(),
      email: newEmail.trim().toLowerCase(),
      role: newRole,
      department: newDepartment.trim() || 'General Engineering',
      institutionalId: newInstId.trim() || `INST-${Date.now().toString().slice(-4)}`,
      avatarUrl: `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(newName.trim())}`,
    };

    setUsers((prev) => [newUser, ...prev]);
    setIsAddModalOpen(false);
    setNewName('');
    setNewEmail('');
    setNewInstId('');
  };

  const handleOpenEdit = (user: (typeof MOCK_USERS_LIST)[0]) => {
    setEditingUser(user);
    setEditRole(user.role as UserRole);
    setEditDepartment(user.department);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setUsers((prev) =>
      prev.map((u) =>
        u.id === editingUser.id
          ? {
              ...u,
              role: editRole,
              department: editDepartment.trim() || u.department,
            }
          : u
      )
    );
    setIsEditModalOpen(false);
    setEditingUser(null);
  };

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
          onClick={() => setIsAddModalOpen(true)}
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
          className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-700"
        >
          <option value="ALL">All Institutional Roles</option>
          <option value="STUDENT">Student</option>
          <option value="COORDINATOR">Faculty Mentor / Coordinator</option>
          <option value="INDUSTRY_PARTNER">Industry Partner</option>
          <option value="SUPER_ADMIN">Dean / Super Administrator</option>
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(u)}
                      title="Edit role and department"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ─── Add Member Modal ─── */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Institutional User"
        description="Provision a new institutional identity with scoped role permissions."
        maxWidth="md"
      >
        <form onSubmit={handleAddUser} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Prof. Arvind Deshmukh"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Institutional Email
            </label>
            <input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="e.g. arvind.deshmukh@vit.edu.in"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Institutional Role
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs"
              >
                <option value="STUDENT">Student</option>
                <option value="COORDINATOR">Faculty Mentor / Coordinator</option>
                <option value="INDUSTRY_PARTNER">Industry Partner</option>
                <option value="SUPER_ADMIN">Dean / Super Administrator</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                PRN / Institutional ID
              </label>
              <input
                type="text"
                value={newInstId}
                onChange={(e) => setNewInstId(e.target.value)}
                placeholder="e.g. 2026FAC881"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Department Scope
            </label>
            <input
              type="text"
              value={newDepartment}
              onChange={(e) => setNewDepartment(e.target.value)}
              placeholder="e.g. Electronics and Computer Science"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Add User
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─── Edit Member Modal ─── */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Scoped Permissions"
        description={editingUser ? `Update permissions and scope for ${editingUser.name}.` : 'Update role permissions.'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4 text-xs sm:text-sm">
          {editingUser && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
              <img
                src={editingUser.avatarUrl}
                alt={editingUser.name}
                className="w-9 h-9 rounded-full bg-slate-200"
              />
              <div>
                <div className="font-bold text-slate-900">{editingUser.name}</div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {editingUser.email} • {editingUser.institutionalId}
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Assigned Role
            </label>
            <select
              value={editRole}
              onChange={(e) => setEditRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs"
            >
              <option value="STUDENT">Student</option>
              <option value="COORDINATOR">Faculty Mentor / Coordinator</option>
              <option value="INDUSTRY_PARTNER">Industry Partner</option>
              <option value="SUPER_ADMIN">Dean / Super Administrator</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Department Scope
            </label>
            <input
              type="text"
              value={editDepartment}
              onChange={(e) => setEditDepartment(e.target.value)}
              placeholder="e.g. Electronics and Computer Science"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
