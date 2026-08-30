import React, { useState } from 'react';
import { Users, Plus, Search, Mail, Phone, ShieldCheck, DollarSign, UserCheck, AlertCircle, Edit, MessageSquare } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { Tenant } from '../../types';

export const TenantsView: React.FC = () => {
  const { tenants, properties, units, leases, rentTransactions, formatCurrency, addTenant, updateTenant, setActiveView } = useERP();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

  // Form
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [status, setStatus] = useState<Tenant['Status']>('Active');
  const [creditScore, setCreditScore] = useState(750);
  const [employer, setEmployer] = useState('');
  const [annualIncome, setAnnualIncome] = useState(90000);
  const [notes, setNotes] = useState('');

  const filteredTenants = tenants.filter((t) => {
    if (statusFilter !== 'all' && t.Status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        t.Full_Name.toLowerCase().includes(q) ||
        t.Email.toLowerCase().includes(q) ||
        t.Phone.includes(q) ||
        (t.Employer && t.Employer.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const openAdd = () => {
    setEditingTenant(null);
    setFullName('');
    setEmail('');
    setPhone('');
    setEmergencyContact('');
    setStatus('Active');
    setCreditScore(750);
    setEmployer('');
    setAnnualIncome(90000);
    setNotes('');
    setShowModal(true);
  };

  const openEdit = (t: Tenant) => {
    setEditingTenant(t);
    setFullName(t.Full_Name);
    setEmail(t.Email);
    setPhone(t.Phone);
    setEmergencyContact(t.Emergency_Contact);
    setStatus(t.Status);
    setCreditScore(t.Credit_Score || 750);
    setEmployer(t.Employer || '');
    setAnnualIncome(t.Annual_Income || 0);
    setNotes(t.Notes || '');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTenant) {
      updateTenant({
        ...editingTenant,
        Full_Name: fullName,
        Email: email,
        Phone: phone,
        Emergency_Contact: emergencyContact,
        Status: status,
        Credit_Score: creditScore,
        Employer: employer,
        Annual_Income: annualIncome,
        Notes: notes,
      });
    } else {
      addTenant({
        Full_Name: fullName,
        Email: email,
        Phone: phone,
        Emergency_Contact: emergencyContact,
        Status: status,
        Credit_Score: creditScore,
        Employer: employer,
        Annual_Income: annualIncome,
        Notes: notes,
      });
    }
    setShowModal(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Resident & Tenant Directory</h2>
          <p className="text-xs text-slate-400">
            Manage tenant records, credit profiles, outstanding balances, and emergency contacts
          </p>
        </div>

        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Add Tenant</span>
        </button>
      </div>

      {/* Search & Status Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-700/80 bg-slate-800/80 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, employer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-900 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none w-64"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active Residents</option>
            <option value="Prospect">Prospects / Applicants</option>
            <option value="Inactive">Inactive / Past</option>
          </select>
        </div>

        <span className="text-xs text-slate-400 font-medium">{filteredTenants.length} residents listed</span>
      </div>

      {/* Tenants Table */}
      <div className="rounded-2xl border border-slate-700/80 bg-slate-800/80 backdrop-blur-sm overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/60 text-slate-400 uppercase font-semibold">
                <th className="px-5 py-3.5">Resident Name</th>
                <th className="px-5 py-3.5">Current Unit</th>
                <th className="px-5 py-3.5">Contact Info</th>
                <th className="px-5 py-3.5">Credit Score</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Account Balance</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 text-slate-300">
              {filteredTenants.map((tenant) => {
                const activeLease = leases.find(
                  (l) => l.Tenant_ID === tenant.Tenant_ID && (l.Status === 'Active' || l.Status === 'Pending Renewal')
                );
                const unit = activeLease ? units.find((u) => u.Unit_ID === activeLease.Unit_ID) : null;
                const prop = unit ? properties.find((p) => p.Property_ID === unit.Property_ID) : null;

                // Total unpaid invoices for this tenant
                const tenantBalance = rentTransactions
                  .filter((r) => r.Tenant_ID === tenant.Tenant_ID)
                  .reduce((acc, r) => acc + r.Balance, 0);

                return (
                  <tr key={tenant.Tenant_ID} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-5 py-4 font-bold text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-600 font-bold text-xs text-white">
                          {tenant.Full_Name.charAt(0)}
                        </div>
                        <div>
                          <p>{tenant.Full_Name}</p>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {tenant.Employer || 'Individual Tenant'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      {unit ? (
                        <div>
                          <p className="font-semibold text-white">{unit.Unit_Number_Name}</p>
                          <p className="text-[10px] text-slate-400">{prop?.Property_Name}</p>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">No assigned unit</span>
                      )}
                    </td>

                    <td className="px-5 py-4 space-y-0.5">
                      <p className="flex items-center gap-1 text-slate-300">
                        <Mail className="h-3 w-3 text-slate-500" />
                        <span>{tenant.Email}</span>
                      </p>
                      <p className="flex items-center gap-1 text-slate-400 text-[10px]">
                        <Phone className="h-3 w-3 text-slate-500" />
                        <span>{tenant.Phone}</span>
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="font-bold text-white">{tenant.Credit_Score || 'N/A'}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                          tenant.Status === 'Active'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : tenant.Status === 'Prospect'
                            ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                            : 'bg-slate-700 text-slate-300 border-slate-600'
                        }`}
                      >
                        {tenant.Status}
                      </span>
                    </td>

                    <td className="px-5 py-4 font-bold">
                      <span className={tenantBalance > 0 ? 'text-rose-400 font-extrabold' : 'text-emerald-400'}>
                        {formatCurrency(tenantBalance)}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setActiveView('communications')}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white"
                          title="Message Resident"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEdit(tenant)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white"
                          title="Edit Resident Record"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredTenants.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    No residents matching your search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl p-6 space-y-4 animate-in fade-in">
            <h3 className="text-lg font-bold text-white">
              {editingTenant ? 'Edit Resident Profile' : 'Register New Tenant'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Full Legal Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sarah Thompson"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Emergency Contact & Relationship</label>
                <input
                  type="text"
                  placeholder="e.g. John Thompson (Father) - +1 (647) 555-0200"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Credit Score</label>
                  <input
                    type="number"
                    value={creditScore}
                    onChange={(e) => setCreditScore(parseInt(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Annual Income ($)</label>
                  <input
                    type="number"
                    value={annualIncome}
                    onChange={(e) => setAnnualIncome(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                  >
                    <option value="Active">Active Resident</option>
                    <option value="Prospect">Prospect</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Employer / Company</label>
                <input
                  type="text"
                  value={employer}
                  onChange={(e) => setEmployer(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Notes & Pet/Parking Addenda</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 font-bold text-white hover:bg-indigo-500"
                >
                  Save Resident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
