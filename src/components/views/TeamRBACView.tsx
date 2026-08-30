import React, { useState } from 'react';
import {
  Shield,
  UserPlus,
  Users,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  Key,
  ShieldAlert,
  Building,
  Eye,
  Sliders,
  Sparkles,
  Info,
  Check,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { UserAccount, UserRole, ViewTab } from '../../types';

export const TeamRBACView: React.FC = () => {
  const {
    users,
    currentUser,
    setCurrentUserById,
    addUser,
    updateUser,
    updateUserPermissions,
    deleteUser,
    hasPermission,
  } = useERP();

  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(users[0] || null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // New User Form State
  const [formData, setFormData] = useState({
    Full_Name: '',
    Email: '',
    Role: 'Operations' as UserRole,
    Department: 'Property Operations',
  });

  const allViewsList: { id: ViewTab; label: string; description: string; category: string }[] = [
    { id: 'dashboard', label: 'Executive Dashboard', description: 'View high-level KPIs, occupancy and collections summary', category: 'Core' },
    { id: 'properties', label: 'Properties & Buildings', description: 'Manage portfolio buildings, addresses, and physical assets', category: 'Portfolio' },
    { id: 'units', label: 'Units & Space Inventory', description: 'Manage individual units, square footage, and target rents', category: 'Portfolio' },
    { id: 'tenants', label: 'Tenant Directory', description: 'Manage tenant profiles, contact info, and leases', category: 'Portfolio' },
    { id: 'landlords', label: 'Landlord Accounts', description: 'Manage property owners and investor disbursement statements', category: 'Portfolio' },
    { id: 'leases', label: 'Leases & Expirations', description: 'Execute leases, renewals, and move-out settlements', category: 'Portfolio' },
    { id: 'billing', label: 'Invoices & Rent Collection', description: 'Generate monthly batches, apply payments, and contra entries', category: 'Financials' },
    { id: 'utilities', label: 'Utility Recovery & Tariffs', description: 'Log master utility bills, allocate RUBS, and sub-meters', category: 'Financials' },
    { id: 'deposits', label: 'Security Deposits & Holds', description: 'Deposit liability ledger, deductions, and refunds', category: 'Financials' },
    { id: 'accounting', label: 'General Ledger & Journals', description: 'Double-entry journals, chart of accounts, and period close', category: 'Financials' },
    { id: 'reports', label: 'Financial Statements & Aging', description: 'P&L statements, AR aging schedules, and cash flow', category: 'Financials' },
    { id: 'maintenance', label: 'Work Orders & Repairs', description: 'Create and dispatch maintenance tickets, assign vendors', category: 'Operations' },
    { id: 'upcoming_events', label: 'Upcoming Schedule & Deadlines', description: 'Lease expiries, overdue rent collections, and utility bills', category: 'Operations' },
    { id: 'data_migration', label: 'Sheets & CSV Data Migration', description: 'Google Sheets and Excel bulk data migration hub', category: 'Administration' },
    { id: 'ai_assistant', label: 'AI Lease & Rent Advisor', description: 'Gemini-assisted lease summarization and revenue insights', category: 'Intelligence' },
    { id: 'tenant_portal', label: 'Tenant Resident Portal', description: 'Self-service rent payment and work order submission', category: 'Portals' },
    { id: 'team_rbac', label: 'User Roles & Access Control', description: 'Manage administrative users, custom permissions, and RBAC', category: 'Administration' },
    { id: 'settings', label: 'System & Policies', description: 'Company settings, late fee grace periods, and audit log', category: 'Administration' },
  ];

  const handleToggleViewPermission = (viewId: ViewTab) => {
    if (!selectedUser) return;
    const currentList = selectedUser.Permissions?.Allowed_Views || [];
    const isAllowed = currentList.includes(viewId);

    const updatedViews = isAllowed
      ? currentList.filter((v) => v !== viewId)
      : [...currentList, viewId];

    updateUserPermissions(selectedUser.User_ID, {
      Allowed_Views: updatedViews,
    });

    setSelectedUser({
      ...selectedUser,
      Permissions: {
        ...selectedUser.Permissions,
        Allowed_Views: updatedViews,
      },
    });
  };

  const handleToggleActionPermission = (actionKey: 'Can_Record_Contra_Payment' | 'Can_Send_Google_Emails' | 'Can_Close_Accounting_Periods' | 'Can_Approve_Work_Orders' | 'Can_Manage_RBAC') => {
    if (!selectedUser) return;
    const currentVal = selectedUser.Permissions?.[actionKey] ?? false;

    updateUserPermissions(selectedUser.User_ID, {
      [actionKey]: !currentVal,
    });

    setSelectedUser({
      ...selectedUser,
      Permissions: {
        ...selectedUser.Permissions,
        [actionKey]: !currentVal,
      },
    });
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.Full_Name || !formData.Email) return;

    // Default permissions based on role
    let defaultViews: ViewTab[] = ['dashboard'];
    if (formData.Role === 'Admin') {
      defaultViews = allViewsList.map((v) => v.id);
    } else if (formData.Role === 'Finance') {
      defaultViews = ['dashboard', 'billing', 'utilities', 'deposits', 'accounting', 'reports', 'leases', 'tenants', 'upcoming_events', 'data_migration'];
    } else if (formData.Role === 'Operations') {
      defaultViews = ['dashboard', 'properties', 'units', 'tenants', 'maintenance', 'upcoming_events', 'leases'];
    } else if (formData.Role === 'Landlord') {
      defaultViews = ['dashboard', 'properties', 'units', 'landlords', 'reports'];
    } else if (formData.Role === 'Tenant') {
      defaultViews = ['tenant_portal'];
    }

    const newId = addUser({
      Full_Name: formData.Full_Name,
      Email: formData.Email,
      Role: formData.Role,
      Department: formData.Department,
      Status: 'Active',
      Permissions: {
        Allowed_Views: defaultViews,
        Can_Record_Contra_Payment: formData.Role === 'Admin' || formData.Role === 'Finance',
        Can_Send_Google_Emails: formData.Role === 'Admin' || formData.Role === 'Finance' || formData.Role === 'Operations',
        Can_Close_Accounting_Periods: formData.Role === 'Admin',
        Can_Approve_Work_Orders: formData.Role === 'Admin' || formData.Role === 'Operations',
        Can_Manage_RBAC: formData.Role === 'Admin',
      },
    });

    setIsAddModalOpen(false);
    setFormData({ Full_Name: '', Email: '', Role: 'Operations', Department: 'Property Operations' });
    const created = users.find((u) => u.User_ID === newId);
    if (created) setSelectedUser(created);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl bg-white p-6 border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-700 text-white shadow-2xs">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 font-heading">
                Role-Based Access Control (RBAC) & Team Management
              </h1>
              <p className="text-xs text-slate-500">
                Grant fine-grained view permissions, function restrictions, and test access across staff, landlords, and residents
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-xs font-bold text-white hover:bg-red-800 transition-colors shadow-xs"
          >
            <UserPlus className="h-4 w-4" />
            <span>Create New User</span>
          </button>
        </div>
      </div>

      {/* Main Grid: User List (Left) & Permissions Matrix (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: User Directory (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-red-700" />
                <h2 className="text-sm font-bold text-slate-900">System Users ({users.length})</h2>
              </div>
              <span className="text-[11px] text-slate-500">Click to configure</span>
            </div>

            <div className="mt-3 space-y-2 max-h-[620px] overflow-y-auto pr-1">
              {users.map((user) => {
                const isSelected = selectedUser?.User_ID === user.User_ID;
                const isCurrentActive = currentUser.User_ID === user.User_ID;

                return (
                  <div
                    key={user.User_ID}
                    onClick={() => setSelectedUser(user)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-red-600 bg-red-50/50 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-red-600 to-red-800 text-white font-bold text-xs shadow-2xs">
                          {user.Full_Name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-slate-900">{user.Full_Name}</p>
                            {isCurrentActive && (
                              <span className="rounded bg-red-100 px-1.5 py-0.2 text-[9px] font-bold text-red-800">
                                Active Session
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500">{user.Email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 border border-slate-200">
                              {user.Role}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {user.Department || 'General'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        {isCurrentActive ? (
                          <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentUserById(user.User_ID);
                            }}
                            className="rounded px-2 py-0.5 text-[10px] font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
                          >
                            Switch to User
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Access & Permissions Matrix (8 Cols) */}
        <div className="lg:col-span-8 space-y-5">
          {selectedUser ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
              {/* User Summary & Quick Switch */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-700 text-white font-extrabold text-base shadow-xs">
                    {selectedUser.Full_Name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">{selectedUser.Full_Name}</h2>
                    <p className="text-xs text-slate-500">
                      {selectedUser.Email} • Role: <strong className="text-red-700">{selectedUser.Role}</strong> ({selectedUser.Department})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentUserById(selectedUser.User_ID)}
                    className="flex items-center gap-1.5 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-700 hover:border-red-200 border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5 text-red-600" />
                    <span>Test App with this User's Permissions</span>
                  </button>
                </div>
              </div>

              {/* Functional Capability Switches */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Core Functional Permissions
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Govern specific executive actions and accounting operations
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Permission 1: Payment Entries */}
                  <div
                    onClick={() => handleToggleActionPermission('Can_Record_Contra_Payment')}
                    className={`flex items-start justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selectedUser.Permissions?.Can_Record_Contra_Payment
                        ? 'border-emerald-300 bg-emerald-50/40 text-emerald-950'
                        : 'border-slate-200 bg-slate-50/50 text-slate-500'
                    }`}
                  >
                    <div className="pr-3">
                      <p className="text-xs font-bold">Record Payment Entries</p>
                      <p className="text-[11px] opacity-80 mt-0.5">
                        Post combined multi-split bank deposits across rent, utilities & deposits
                      </p>
                    </div>
                    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${
                      selectedUser.Permissions?.Can_Record_Contra_Payment ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-white'
                    }`}>
                      {selectedUser.Permissions?.Can_Record_Contra_Payment && <Check className="h-3.5 w-3.5" />}
                    </div>
                  </div>

                  {/* Permission 2: Google Mail */}
                  <div
                    onClick={() => handleToggleActionPermission('Can_Send_Google_Emails')}
                    className={`flex items-start justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selectedUser.Permissions?.Can_Send_Google_Emails
                        ? 'border-emerald-300 bg-emerald-50/40 text-emerald-950'
                        : 'border-slate-200 bg-slate-50/50 text-slate-500'
                    }`}
                  >
                    <div className="pr-3">
                      <p className="text-xs font-bold">Send Google Workspace Emails</p>
                      <p className="text-[11px] opacity-80 mt-0.5">
                        Trigger payment receipts, welcome letters, and whole-due reminders
                      </p>
                    </div>
                    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${
                      selectedUser.Permissions?.Can_Send_Google_Emails ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-white'
                    }`}>
                      {selectedUser.Permissions?.Can_Send_Google_Emails && <Check className="h-3.5 w-3.5" />}
                    </div>
                  </div>

                  {/* Permission 3: Work Orders */}
                  <div
                    onClick={() => handleToggleActionPermission('Can_Approve_Work_Orders')}
                    className={`flex items-start justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selectedUser.Permissions?.Can_Approve_Work_Orders
                        ? 'border-emerald-300 bg-emerald-50/40 text-emerald-950'
                        : 'border-slate-200 bg-slate-50/50 text-slate-500'
                    }`}
                  >
                    <div className="pr-3">
                      <p className="text-xs font-bold">Approve & Assign Work Orders</p>
                      <p className="text-[11px] opacity-80 mt-0.5">
                        Dispatch contractors, approve actual repair expenses, and complete tickets
                      </p>
                    </div>
                    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${
                      selectedUser.Permissions?.Can_Approve_Work_Orders ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-white'
                    }`}>
                      {selectedUser.Permissions?.Can_Approve_Work_Orders && <Check className="h-3.5 w-3.5" />}
                    </div>
                  </div>

                  {/* Permission 4: Accounting Lock */}
                  <div
                    onClick={() => handleToggleActionPermission('Can_Close_Accounting_Periods')}
                    className={`flex items-start justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selectedUser.Permissions?.Can_Close_Accounting_Periods
                        ? 'border-emerald-300 bg-emerald-50/40 text-emerald-950'
                        : 'border-slate-200 bg-slate-50/50 text-slate-500'
                    }`}
                  >
                    <div className="pr-3">
                      <p className="text-xs font-bold">Lock Fiscal Periods & Post Journals</p>
                      <p className="text-[11px] opacity-80 mt-0.5">
                        Authorize month-end GL close and manual general ledger adjusting entries
                      </p>
                    </div>
                    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${
                      selectedUser.Permissions?.Can_Close_Accounting_Periods ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-white'
                    }`}>
                      {selectedUser.Permissions?.Can_Close_Accounting_Periods && <Check className="h-3.5 w-3.5" />}
                    </div>
                  </div>
                </div>
              </div>

              {/* View Access Matrix */}
              <div>
                <div className="flex items-center justify-between mb-3 pt-4 border-t border-slate-100">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Accessible App Views & Navigation Screens ({selectedUser.Permissions?.Allowed_Views?.length || 0} / {allViewsList.length})
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Unchecking a view removes it from the user's sidebar and blocks direct routing
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const allIds = allViewsList.map((v) => v.id);
                        updateUserPermissions(selectedUser.User_ID, { Allowed_Views: allIds });
                        setSelectedUser({
                          ...selectedUser,
                          Permissions: { ...selectedUser.Permissions, Allowed_Views: allIds },
                        });
                      }}
                      className="text-[11px] font-bold text-red-700 hover:underline"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      onClick={() => {
                        updateUserPermissions(selectedUser.User_ID, { Allowed_Views: ['dashboard'] });
                        setSelectedUser({
                          ...selectedUser,
                          Permissions: { ...selectedUser.Permissions, Allowed_Views: ['dashboard'] },
                        });
                      }}
                      className="text-[11px] font-bold text-slate-500 hover:underline"
                    >
                      Minimal
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {allViewsList.map((view) => {
                    const isAllowed = selectedUser.Permissions?.Allowed_Views?.includes(view.id);

                    return (
                      <div
                        key={view.id}
                        onClick={() => handleToggleViewPermission(view.id)}
                        className={`flex items-start justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                          isAllowed
                            ? 'border-red-200 bg-red-50/30 text-slate-900'
                            : 'border-slate-200 bg-white text-slate-400 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <div className="pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold">{view.label}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 font-semibold text-slate-500">
                              {view.category}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">{view.description}</p>
                        </div>

                        <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded ${
                          isAllowed ? 'bg-red-700 text-white' : 'border border-slate-300 bg-white'
                        }`}>
                          {isAllowed && <Check className="h-3 w-3" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-400">
              <p>Select a user from the directory to configure permissions</p>
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-700 text-white">
                  <UserPlus className="h-4 w-4" />
                </div>
                <h2 className="text-base font-bold text-slate-900">Add New ERP User</h2>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Varma"
                  value={formData.Full_Name}
                  onChange={(e) => setFormData({ ...formData, Full_Name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-red-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Corporate Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. ramesh.varma@muthootgroup.com"
                  value={formData.Email}
                  onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-red-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Role Hierarchy</label>
                  <select
                    value={formData.Role}
                    onChange={(e) => setFormData({ ...formData, Role: e.target.value as UserRole })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-red-600 focus:outline-none"
                  >
                    <option value="Admin">Admin / Director</option>
                    <option value="Finance">Finance & Controller</option>
                    <option value="Operations">Operations & Site Mgr</option>
                    <option value="Landlord">Landlord Investor</option>
                    <option value="Tenant">Tenant Resident</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Asset Management"
                    value={formData.Department}
                    onChange={(e) => setFormData({ ...formData, Department: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-red-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-red-700 px-4 py-2 text-xs font-bold text-white hover:bg-red-800 shadow-xs"
                >
                  Create & Assign Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
