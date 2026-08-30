import React, { useState } from 'react';
import { X, FileSignature, Sparkles, CheckCircle2, Send, Calendar, TrendingUp, DollarSign } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { Lease } from '../../types';

interface LeaseRenewalModalProps {
  lease: Lease | null;
  onClose: () => void;
}

export const LeaseRenewalModal: React.FC<LeaseRenewalModalProps> = ({ lease, onClose }) => {
  const {
    getProperty,
    getUnit,
    getTenant,
    formatCurrency,
    sendRenewalProposal,
    acceptLeaseRenewal,
    settings,
  } = useERP();

  const [increasePercentage, setIncreasePercentage] = useState<number>(4.0);
  const [newRent, setNewRent] = useState<number>(() => {
    if (!lease) return 0;
    return Math.round(lease.Monthly_Rent * 1.04);
  });
  const [termMonths, setTermMonths] = useState<number>(12);
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    if (!lease) return '';
    const currentEnd = new Date(lease.Lease_End);
    const newEnd = new Date(currentEnd.setFullYear(currentEnd.getFullYear() + 1));
    return newEnd.toISOString().slice(0, 10);
  });
  const [sentSuccess, setSentSuccess] = useState(false);

  if (!lease) return null;

  const property = getProperty(lease.Property_ID);
  const unit = getUnit(lease.Unit_ID);
  const tenant = getTenant(lease.Tenant_ID);

  const daysRemaining = Math.ceil((new Date(lease.Lease_End).getTime() - new Date('2026-08-30').getTime()) / 86400000);

  const handlePercentageChange = (pct: number) => {
    setIncreasePercentage(pct);
    const calculated = Math.round(lease.Monthly_Rent * (1 + pct / 100));
    setNewRent(calculated);
  };

  const handleSendProposal = (e: React.FormEvent) => {
    e.preventDefault();
    sendRenewalProposal(lease.Lease_ID, newRent, customEndDate);
    setSentSuccess(true);
    setTimeout(() => {
      setSentSuccess(false);
      onClose();
    }, 1000);
  };

  const handleExecuteNow = () => {
    sendRenewalProposal(lease.Lease_ID, newRent, customEndDate);
    acceptLeaseRenewal(lease.Lease_ID);
    setSentSuccess(true);
    setTimeout(() => {
      setSentSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400">
              <FileSignature className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Automated Lease Expiration & Renewal Workflow</h3>
              <p className="text-xs text-slate-400">Lease #{lease.Lease_ID} · {property?.Property_Name} ({unit?.Unit_Number_Name})</p>
            </div>
          </div>

          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSendProposal} className="p-6 space-y-6 text-slate-200">
          {/* Expiry Banner */}
          <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-amber-500/15 via-purple-500/10 to-indigo-500/15 p-4 border border-amber-500/30">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Expiration Status</span>
              <p className="text-sm font-bold text-white mt-0.5">
                Current Term Ends: <span className="text-amber-300">{lease.Lease_End}</span>
              </p>
              <p className="text-xs text-slate-300">
                {daysRemaining > 0 ? (
                  <span><b className="text-white">{daysRemaining} days</b> remaining in notice window</span>
                ) : (
                  <span className="text-rose-400 font-bold">Lease expired (Month-to-Month)</span>
                )}
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Base Rent</span>
              <p className="text-xl font-extrabold text-white">{formatCurrency(lease.Monthly_Rent)}<span className="text-xs font-normal text-slate-400">/mo</span></p>
            </div>
          </div>

          {/* Rent Escalator Calculator */}
          <div className="space-y-3 rounded-xl bg-slate-800/40 p-4 border border-slate-700/60">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-indigo-400" />
                <span>Rent Adjustment & Escalation Rules</span>
              </label>
              <span className="text-xs text-slate-400">Market Rate: {formatCurrency(unit?.Target_Rent || 0)}</span>
            </div>

            {/* Quick Percentage Presets */}
            <div className="flex flex-wrap gap-2">
              {[0, 2.5, 3.5, 4.0, 5.0, 7.5].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handlePercentageChange(pct)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold border transition-all ${
                    increasePercentage === pct
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  +{pct}% ({formatCurrency(Math.round(lease.Monthly_Rent * (1 + pct / 100)))})
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Proposed Monthly Rent ($)</label>
                <input
                  type="number"
                  step="1"
                  value={newRent}
                  onChange={(e) => setNewRent(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-bold text-emerald-400 focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">New Term Expiration Date</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-white focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Generated Formal Proposal Preview */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Notice Letter & Agreement Preview</span>
              <span className="text-[10px] text-indigo-400">Automated Template</span>
            </label>
            <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-4 text-xs font-mono text-slate-300 leading-relaxed max-h-36 overflow-y-auto">
              <p>RE: Formal Lease Renewal Offer for {property?.Property_Name}, {unit?.Unit_Number_Name}</p>
              <p className="mt-2">Tenant: {tenant?.Full_Name}</p>
              <p className="mt-1">We hereby offer to extend the tenancy agreement beginning the day after current expiry for an additional 12-month term concluding on {customEndDate}. The revised monthly rental rate shall be {formatCurrency(newRent)}/month (an adjustment of +{((newRent - lease.Monthly_Rent) / lease.Monthly_Rent * 100).toFixed(1)}%). All existing addenda and security deposit covenants remain in full force.</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4">
            {sentSuccess ? (
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /> Renewal Notice dispatched to resident!
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
                type="button"
                onClick={handleExecuteNow}
                className="rounded-lg border border-emerald-600/50 bg-emerald-600/20 px-4 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-600/30 transition-all"
              >
                1-Click Sign & Renew
              </button>

              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Send Proposal to Tenant</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
