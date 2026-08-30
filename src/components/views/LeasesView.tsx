import React, { useState } from 'react';
import {
  FileSignature,
  Plus,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  FolderOpen,
  ArrowRightLeft,
  Send,
  User,
  Building2,
  DollarSign,
  Search,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { Lease } from '../../types';
import { LeaseRenewalModal } from '../common/LeaseRenewalModal';
import { MoveOutSettlementModal } from '../common/MoveOutSettlementModal';

export const LeasesView: React.FC = () => {
  const {
    leases,
    properties,
    units,
    tenants,
    formatCurrency,
    createLease,
    acceptLeaseRenewal,
    setActiveView,
  } = useERP();

  const [filterWindow, setFilterWindow] = useState<'all' | '30' | '60' | '90' | 'active' | 'ended'>('all');
  const [search, setSearch] = useState('');
  const [selectedLeaseForRenewal, setSelectedLeaseForRenewal] = useState<Lease | null>(null);
  const [selectedLeaseForMoveOut, setSelectedLeaseForMoveOut] = useState<Lease | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Lease Form State
  const [tenantId, setTenantId] = useState(tenants[0]?.Tenant_ID || '');
  const [propertyId, setPropertyId] = useState(properties[0]?.Property_ID || '');
  const [unitId, setUnitId] = useState(units[0]?.Unit_ID || '');
  const [leaseStart, setLeaseStart] = useState('2026-09-01');
  const [leaseEnd, setLeaseEnd] = useState('2027-08-31');
  const [monthlyRent, setMonthlyRent] = useState(2000);
  const [depositRequired, setDepositRequired] = useState(2000);
  const [depositReceived, setDepositReceived] = useState(2000);
  const [autoRenew, setAutoRenew] = useState(true);
  const [notes, setNotes] = useState('');

  const now = new Date('2026-08-30');

  const filteredLeases = leases.filter((l) => {
    const days = Math.ceil((new Date(l.Lease_End).getTime() - now.getTime()) / 86400000);

    if (filterWindow === '30' && (days < 0 || days > 30 || l.Status === 'Ended')) return false;
    if (filterWindow === '60' && (days < 0 || days > 60 || l.Status === 'Ended')) return false;
    if (filterWindow === '90' && (days < 0 || days > 90 || l.Status === 'Ended')) return false;
    if (filterWindow === 'active' && l.Status !== 'Active' && l.Status !== 'Pending Renewal') return false;
    if (filterWindow === 'ended' && l.Status !== 'Ended') return false;

    if (search) {
      const q = search.toLowerCase();
      const tenant = tenants.find((t) => t.Tenant_ID === l.Tenant_ID);
      const prop = properties.find((p) => p.Property_ID === l.Property_ID);
      return (
        l.Lease_ID.toLowerCase().includes(q) ||
        tenant?.Full_Name.toLowerCase().includes(q) ||
        prop?.Property_Name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleUnitSelect = (uId: string) => {
    setUnitId(uId);
    const u = units.find((x) => x.Unit_ID === uId);
    if (u) {
      setMonthlyRent(u.Target_Rent);
      setDepositRequired(u.Target_Rent);
      setDepositReceived(u.Target_Rent);
    }
  };

  const handleCreateLeaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createLease({
      Tenant_ID: tenantId,
      Property_ID: propertyId,
      Unit_ID: unitId,
      Lease_Start: leaseStart,
      Lease_End: leaseEnd,
      Monthly_Rent: monthlyRent,
      Deposit_Required: depositRequired,
      Deposit_Received: depositReceived,
      Rent_Due_Day: 1,
      Grace_Period_Days: 5,
      Late_Fee_Amount: 50,
      Auto_Renew: autoRenew,
      Notes: notes,
    });
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            Lease Agreements & Expiration Workflows
          </h2>
          <p className="text-xs text-slate-400">
            Track automated 90/60/30-day expiration notices, generate rent escalation renewal proposals, and settle move-outs
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>New Lease Agreement</span>
        </button>
      </div>

      {/* Expiry Timeline Filter Chips */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-700/80 bg-slate-800/80 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative mr-2">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search lease ID, tenant, building..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-900 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none w-60"
            />
          </div>

          {[
            { id: 'all', label: 'All Leases' },
            { id: '30', label: 'Expiring < 30 Days', urgent: true },
            { id: '60', label: 'Expiring < 60 Days' },
            { id: '90', label: 'Expiring < 90 Days' },
            { id: 'active', label: 'Active' },
            { id: 'ended', label: 'Ended / Move-Outs' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterWindow(f.id as any)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                filterWindow === f.id
                  ? f.urgent
                    ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md shadow-amber-500/30'
                    : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-400 font-medium">{filteredLeases.length} leases shown</span>
      </div>

      {/* Leases Table */}
      <div className="rounded-2xl border border-slate-700/80 bg-slate-800/80 backdrop-blur-sm overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/60 text-slate-400 uppercase font-semibold">
                <th className="px-5 py-3.5">Lease ID & Tenant</th>
                <th className="px-5 py-3.5">Property & Suite</th>
                <th className="px-5 py-3.5">Term Dates</th>
                <th className="px-5 py-3.5">Monthly Rent</th>
                <th className="px-5 py-3.5">Security Deposit</th>
                <th className="px-5 py-3.5">Expiration Countdown</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Renewal & Settlement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 text-slate-300">
              {filteredLeases.map((lease) => {
                const tenant = tenants.find((t) => t.Tenant_ID === lease.Tenant_ID);
                const prop = properties.find((p) => p.Property_ID === lease.Property_ID);
                const unit = units.find((u) => u.Unit_ID === lease.Unit_ID);

                const daysRemaining = Math.ceil((new Date(lease.Lease_End).getTime() - now.getTime()) / 86400000);
                const isUrgent = daysRemaining <= 30 && daysRemaining >= 0 && lease.Status !== 'Ended';

                return (
                  <tr key={lease.Lease_ID} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-bold text-white text-sm">{tenant?.Full_Name || lease.Tenant_ID}</p>
                      <span className="font-mono text-[10px] text-slate-400">{lease.Lease_ID}</span>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-semibold text-white">{prop?.Property_Name}</p>
                      <p className="text-[10px] text-slate-400">{unit?.Unit_Number_Name} ({unit?.Unit_Type})</p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-200">{lease.Lease_Start}</p>
                      <p className="text-[10px] text-slate-400">to {lease.Lease_End}</p>
                    </td>

                    <td className="px-5 py-4 font-extrabold text-emerald-400 text-sm">
                      {formatCurrency(lease.Monthly_Rent)}
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-semibold text-white">{formatCurrency(lease.Deposit_Received)}</p>
                      <span className="text-[10px] text-slate-400">Held in Trust (1020)</span>
                    </td>

                    <td className="px-5 py-4">
                      {lease.Status === 'Ended' ? (
                        <span className="text-slate-500">Terminated</span>
                      ) : daysRemaining < 0 ? (
                        <span className="text-rose-400 font-bold">Expired (M-to-M)</span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          {isUrgent && <AlertTriangle className="h-3.5 w-3.5 text-amber-400 animate-pulse" />}
                          <span className={`font-bold ${isUrgent ? 'text-amber-400' : 'text-slate-200'}`}>
                            {daysRemaining} days left
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                          lease.Status === 'Active'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : lease.Status === 'Pending Renewal'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                            : lease.Status === 'Renewed'
                            ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                            : 'bg-slate-700 text-slate-400 border-slate-600'
                        }`}
                      >
                        {lease.Status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {lease.Status !== 'Ended' && (
                          <>
                            <button
                              onClick={() => setSelectedLeaseForRenewal(lease)}
                              className="rounded-lg bg-indigo-600/30 border border-indigo-500/40 px-2.5 py-1 text-[11px] font-bold text-indigo-300 hover:bg-indigo-600 hover:text-white transition-all"
                            >
                              Renew Offer
                            </button>

                            <button
                              onClick={() => setSelectedLeaseForMoveOut(lease)}
                              className="rounded-lg bg-rose-500/15 border border-rose-500/30 px-2.5 py-1 text-[11px] font-bold text-rose-300 hover:bg-rose-600 hover:text-white transition-all"
                              title="Move-Out & Deposit Settlement"
                            >
                              Move-Out
                            </button>
                          </>
                        )}

                        {lease.Drive_Folder_URL && (
                          <a
                            href={lease.Drive_Folder_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white"
                            title="Open Google Drive Vault"
                          >
                            <FolderOpen className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredLeases.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    No lease agreements found matching filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Renewal Modal */}
      {selectedLeaseForRenewal && (
        <LeaseRenewalModal
          lease={selectedLeaseForRenewal}
          onClose={() => setSelectedLeaseForRenewal(null)}
        />
      )}

      {/* Move-Out Settlement Modal */}
      {selectedLeaseForMoveOut && (
        <MoveOutSettlementModal
          lease={selectedLeaseForMoveOut}
          onClose={() => setSelectedLeaseForMoveOut(null)}
        />
      )}

      {/* Create New Lease Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl p-6 space-y-4 animate-in fade-in my-8">
            <h3 className="text-lg font-bold text-white">Draft New Residential Tenancy Lease</h3>

            <form onSubmit={handleCreateLeaseSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Tenant Resident</label>
                  <select
                    value={tenantId}
                    onChange={(e) => setTenantId(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  >
                    {tenants.map((t) => (
                      <option key={t.Tenant_ID} value={t.Tenant_ID}>
                        {t.Full_Name} ({t.Email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Property</label>
                  <select
                    value={propertyId}
                    onChange={(e) => setPropertyId(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  >
                    {properties.map((p) => (
                      <option key={p.Property_ID} value={p.Property_ID}>
                        {p.Property_Name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Assigned Suite / Unit</label>
                <select
                  value={unitId}
                  onChange={(e) => handleUnitSelect(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                >
                  {units
                    .filter((u) => u.Property_ID === propertyId)
                    .map((u) => (
                      <option key={u.Unit_ID} value={u.Unit_ID}>
                        {u.Unit_Number_Name} — {u.Unit_Type} ({formatCurrency(u.Target_Rent)})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Lease Start Date</label>
                  <input
                    type="date"
                    value={leaseStart}
                    onChange={(e) => setLeaseStart(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Lease End Date</label>
                  <input
                    type="date"
                    value={leaseEnd}
                    onChange={(e) => setLeaseEnd(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Monthly Base Rent ($)</label>
                  <input
                    type="number"
                    step="1"
                    value={monthlyRent}
                    onChange={(e) => setMonthlyRent(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white font-bold text-emerald-400"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Security Deposit Required ($)</label>
                  <input
                    type="number"
                    step="1"
                    value={depositRequired}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setDepositRequired(val);
                      setDepositReceived(val);
                    }}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="rounded-xl bg-slate-800/50 p-3 border border-slate-700/60 text-slate-400 space-y-1">
                <p className="text-[11px] font-semibold text-indigo-300">Automated Financial Engine Actions:</p>
                <p>Creating this lease will automatically mark the suite as <b className="text-emerald-400">Occupied</b>, set the resident to <b className="text-emerald-400">Active</b>, and post security deposit liability holds in the general ledger.</p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 font-bold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/30"
                >
                  Execute & Create Lease
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
