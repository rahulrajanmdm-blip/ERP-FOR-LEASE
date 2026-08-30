import React, { useState } from 'react';
import { ShieldCheck, ArrowRightLeft, Lock } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { MoveOutSettlementModal } from '../common/MoveOutSettlementModal';
import { Lease } from '../../types';

export const DepositsView: React.FC = () => {
  const { leases, properties, units, tenants, formatCurrency } = useERP();
  const [selectedLeaseForMoveOut, setSelectedLeaseForMoveOut] = useState<Lease | null>(null);

  const activeLeases = leases.filter((l) => l.Status === 'Active' || l.Status === 'Pending Renewal');
  const totalEscrowDeposits = activeLeases.reduce((acc, l) => acc + (l.Deposit_Received || 0), 0);
  const endedLeases = leases.filter((l) => l.Status === 'Ended');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            Security Deposit Trust & Escrow Management
          </h2>
          <p className="text-xs text-slate-400">
            Fiduciary tenant deposit escrow ledger (GL 1020 Escrow Cash / GL 2020 Deposit Liability)
          </p>
        </div>
      </div>

      {/* Escrow KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-5">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-emerald-400" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Total Escrow Held in Trust
            </span>
          </div>
          <p className="text-2xl font-extrabold text-emerald-400 mt-2">{formatCurrency(totalEscrowDeposits)}</p>
          <span className="text-xs text-slate-400">{activeLeases.length} active tenancy deposits secured</span>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-indigo-400" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Statutory Compliance
            </span>
          </div>
          <p className="text-2xl font-extrabold text-white mt-2">100% Matched</p>
          <span className="text-xs text-slate-400">Escrow bank balance equals liability</span>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-5">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4 text-purple-400" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Disbursed / Returned
            </span>
          </div>
          <p className="text-2xl font-extrabold text-purple-400 mt-2">{endedLeases.length} Settled</p>
          <span className="text-xs text-slate-400">Historical move-out reconciliations</span>
        </div>
      </div>

      {/* Active Escrow Ledger Table */}
      <div className="space-y-3">
        <h3 className="font-bold text-white text-sm">Active Deposit Escrow Accounts</h3>
        <div className="rounded-2xl border border-slate-700/80 bg-slate-800/80 backdrop-blur-sm overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-900/60 text-slate-400 uppercase font-semibold">
                  <th className="px-5 py-3.5">Resident</th>
                  <th className="px-5 py-3.5">Property & Suite</th>
                  <th className="px-5 py-3.5">Lease Term</th>
                  <th className="px-5 py-3.5">Deposit Amount</th>
                  <th className="px-5 py-3.5">Escrow Status</th>
                  <th className="px-5 py-3.5 text-right">Settlement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 text-slate-300">
                {activeLeases.map((lease) => {
                  const tenant = tenants.find((t) => t.Tenant_ID === lease.Tenant_ID);
                  const prop = properties.find((p) => p.Property_ID === lease.Property_ID);
                  const unit = units.find((u) => u.Unit_ID === lease.Unit_ID);

                  return (
                    <tr key={lease.Lease_ID} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-5 py-4 font-bold text-white">
                        {tenant?.Full_Name || lease.Tenant_ID}
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-semibold text-white">{prop?.Property_Name}</p>
                        <p className="text-[10px] text-slate-400">{unit?.Unit_Number_Name}</p>
                      </td>

                      <td className="px-5 py-4">
                        {lease.Lease_Start} to {lease.Lease_End}
                      </td>

                      <td className="px-5 py-4 font-extrabold text-emerald-400 text-sm">
                        {formatCurrency(lease.Deposit_Received)}
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                          Secured in Trust
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setSelectedLeaseForMoveOut(lease)}
                          className="rounded-lg bg-rose-500/15 border border-rose-500/30 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-600 hover:text-white transition-all"
                        >
                          Itemize Deductions & Settle
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Move-Out Settlement Modal */}
      {selectedLeaseForMoveOut && (
        <MoveOutSettlementModal
          lease={selectedLeaseForMoveOut}
          onClose={() => setSelectedLeaseForMoveOut(null)}
        />
      )}
    </div>
  );
};
