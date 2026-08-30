import React, { useState } from 'react';
import { X, ArrowRightLeft, DollarSign, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { Lease } from '../../types';

interface MoveOutSettlementModalProps {
  lease: Lease | null;
  onClose: () => void;
}

export const MoveOutSettlementModal: React.FC<MoveOutSettlementModalProps> = ({ lease, onClose }) => {
  const {
    getProperty,
    getUnit,
    getTenant,
    formatCurrency,
    processMoveOutSettlement,
  } = useERP();

  const [moveOutDate, setMoveOutDate] = useState('2026-08-31');
  const [damagesDeduction, setDamagesDeduction] = useState(0);
  const [cleaningDeduction, setCleaningDeduction] = useState(0);
  const [unpaidRentDeduction, setUnpaidRentDeduction] = useState(0);
  const [details, setDetails] = useState('');
  const [settledSuccess, setSettledSuccess] = useState(false);

  if (!lease) return null;

  const property = getProperty(lease.Property_ID);
  const unit = getUnit(lease.Unit_ID);
  const tenant = getTenant(lease.Tenant_ID);

  const depositHeld = lease.Deposit_Received || 0;
  const totalDeductions = damagesDeduction + cleaningDeduction + unpaidRentDeduction;
  const netRefund = Math.max(0, depositHeld - totalDeductions);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processMoveOutSettlement({
      leaseId: lease.Lease_ID,
      moveOutDate,
      damages: damagesDeduction,
      cleaningFee: cleaningDeduction,
      unpaidRentDeduction,
      details: details || 'Routine end-of-lease inspection settlement',
    });
    setSettledSuccess(true);
    setTimeout(() => {
      setSettledSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Move-Out & Security Deposit Settlement</h3>
              <p className="text-xs text-slate-400">Lease #{lease.Lease_ID} · {tenant?.Full_Name}</p>
            </div>
          </div>

          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-slate-200">
          {/* Summary Box */}
          <div className="flex items-center justify-between rounded-xl bg-slate-800/50 p-4 border border-slate-700/60">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Property & Unit</span>
              <p className="font-bold text-white text-sm">{property?.Property_Name} — {unit?.Unit_Number_Name}</p>
              <p className="text-xs text-slate-400">Security Deposit in Escrow: <span className="text-emerald-400 font-bold">{formatCurrency(depositHeld)}</span></p>
            </div>
            <div className="text-right">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Move-Out Date</label>
              <input
                type="date"
                value={moveOutDate}
                onChange={(e) => setMoveOutDate(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-white"
                required
              />
            </div>
          </div>

          {/* Itemized Deductions Checklist */}
          <div className="space-y-3 rounded-xl bg-slate-800/30 p-4 border border-slate-700/60">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Itemized Deductions from Security Deposit
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Repairs / Damages ($)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={damagesDeduction || ''}
                  onChange={(e) => setDamagesDeduction(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Cleaning / Turnover ($)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={cleaningDeduction || ''}
                  onChange={(e) => setCleaningDeduction(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Unpaid Rent Offset ($)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={unpaidRentDeduction || ''}
                  onChange={(e) => setUnpaidRentDeduction(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-rose-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Inspection Notes & Deduction Justifications</label>
              <textarea
                rows={2}
                placeholder="e.g. Wall patching and deep steam cleaning deduction applied after key return..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Refund Calculation Summary */}
          <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-4 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Deposit Held:</span>
              <span className="font-semibold text-white">{formatCurrency(depositHeld)}</span>
            </div>
            <div className="flex justify-between text-rose-400">
              <span>Total Deductions:</span>
              <span className="font-semibold">-{formatCurrency(totalDeductions)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-800 pt-2 text-sm font-bold text-emerald-400">
              <span>Net Refund Disbursed to Resident:</span>
              <span className="text-base font-extrabold">{formatCurrency(netRefund)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between border-t border-slate-800 pt-4">
            {settledSuccess ? (
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /> Move-out finalized & unit marked for Turnover!
              </span>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-rose-600 px-5 py-2 text-xs font-bold text-white hover:bg-rose-500 shadow-md shadow-rose-600/30 transition-all"
              >
                Finalize Move-Out & Post Settlement
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
