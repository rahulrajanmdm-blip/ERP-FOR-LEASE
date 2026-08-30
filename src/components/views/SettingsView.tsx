import React, { useState } from 'react';
import { Settings, Save, RotateCcw, Building2, DollarSign, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useERP } from '../../context/ERPContext';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, resetDemoData } = useERP();

  const [companyName, setCompanyName] = useState(settings.COMPANY_NAME);
  const [currency, setCurrency] = useState(settings.CURRENCY);
  const [gracePeriodDays, setGracePeriodDays] = useState(settings.DEFAULT_GRACE_PERIOD_DAYS);
  const [lateFeeAmount, setLateFeeAmount] = useState(settings.DEFAULT_LATE_FEE);
  const [billingDay, setBillingDay] = useState(settings.AUTOMATED_BILLING_DAY);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      COMPANY_NAME: companyName,
      CURRENCY: currency,
      DEFAULT_GRACE_PERIOD_DAYS: gracePeriodDays,
      DEFAULT_LATE_FEE: lateFeeAmount,
      AUTOMATED_BILLING_DAY: billingDay,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all data back to the clean demonstration database? All custom modifications will be reloaded.')) {
      resetDemoData();
      alert('ERP database successfully restored to initial state.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            ERP System Settings & Global Business Rules
          </h2>
          <p className="text-xs text-slate-400">
            Configure financial rules, grace periods, automated lease notice triggers, and company parameters
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleSave} className="lg:col-span-2 rounded-2xl border border-slate-700 bg-slate-800/80 p-6 space-y-6 shadow-xl">
          {/* Section 1: Company Profile */}
          <div className="space-y-3">
            <h3 className="font-bold text-white text-sm border-b border-slate-700 pb-2 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-indigo-400" />
              <span>Property Management Entity</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Company / Operating Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Default Base Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                >
                  <option value="CAD">CAD ($ - Canadian Dollar)</option>
                  <option value="USD">USD ($ - US Dollar)</option>
                  <option value="EUR">EUR (€ - Euro)</option>
                  <option value="GBP">GBP (£ - British Pound)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Billing & Late Fee Policies */}
          <div className="space-y-3">
            <h3 className="font-bold text-white text-sm border-b border-slate-700 pb-2 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-400" />
              <span>Rent Collection & Late Penalty Rules</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Grace Period (Days)</label>
                <input
                  type="number"
                  value={gracePeriodDays}
                  onChange={(e) => setGracePeriodDays(parseInt(e.target.value) || 0)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">e.g. 5 days after 1st of month</span>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Automated Billing Day</label>
                <input
                  type="number"
                  value={billingDay}
                  onChange={(e) => setBillingDay(parseInt(e.target.value) || 1)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Day of month invoices generate</span>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Late Penalty Value ($)</label>
                <input
                  type="number"
                  value={lateFeeAmount}
                  onChange={(e) => setLateFeeAmount(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white font-bold text-emerald-400"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-700">
            {saved ? (
              <span className="flex items-center gap-1.5 font-bold text-emerald-400 text-xs">
                <CheckCircle2 className="h-4 w-4" /> Global settings updated successfully!
              </span>
            ) : <div />}

            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all active:scale-95"
            >
              <Save className="h-4 w-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>

        {/* Danger Zone & Reset */}
        <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="font-bold text-white text-sm">System Database Maintenance</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Reset the ERP database, re-seed standard demonstration buildings, tenants, active leases, general ledger accounts, and work orders.
            </p>
          </div>

          <button
            onClick={handleReset}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition-all"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset Demo Data to Defaults</span>
          </button>
        </div>
      </div>
    </div>
  );
};
