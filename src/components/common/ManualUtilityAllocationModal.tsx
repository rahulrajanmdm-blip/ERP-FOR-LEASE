import React, { useState } from 'react';
import { X, Zap, CheckCircle2, Building2, User, Calendar, DollarSign, FileText } from 'lucide-react';
import { useERP } from '../../context/ERPContext';

interface ManualUtilityAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedPropertyId?: string;
}

export const ManualUtilityAllocationModal: React.FC<ManualUtilityAllocationModalProps> = ({
  isOpen,
  onClose,
  preselectedPropertyId,
}) => {
  const {
    properties,
    units,
    tenants,
    leases,
    utilitiesMaster,
    directTenantUtilityCharge,
    formatCurrency,
  } = useERP();

  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(
    preselectedPropertyId || properties[0]?.Property_ID || ''
  );
  
  // Filter tenants by selected property
  const propertyUnits = units.filter((u) => u.Property_ID === selectedPropertyId);
  const propertyUnitIds = new Set(propertyUnits.map((u) => u.Unit_ID));
  const propertyLeases = leases.filter((l) => propertyUnitIds.has(l.Unit_ID) && (l.Status === 'Active' || l.Status === 'Pending Renewal'));
  const propertyTenantIds = new Set(propertyLeases.map((l) => l.Tenant_ID));
  const availableTenants = tenants.filter((t) => propertyTenantIds.has(t.Tenant_ID));

  const [selectedTenantId, setSelectedTenantId] = useState<string>(
    availableTenants[0]?.Tenant_ID || tenants[0]?.Tenant_ID || ''
  );
  const [utilityType, setUtilityType] = useState<string>('Hydro (Electricity)');
  const [periodMonth, setPeriodMonth] = useState<string>('2026-08');
  const [amount, setAmount] = useState<number>(125.50);
  const [readingRef, setReadingRef] = useState<string>('MTR-88219');
  const [notes, setNotes] = useState<string>('Separately calculated sub-meter utility recovery');
  const [successInfo, setSuccessInfo] = useState<{ invoiceId: string } | null>(null);

  if (!isOpen) return null;

  const handlePropertyChange = (propId: string) => {
    setSelectedPropertyId(propId);
    const pUnits = units.filter((u) => u.Property_ID === propId);
    const pUnitIds = new Set(pUnits.map((u) => u.Unit_ID));
    const pLeases = leases.filter((l) => pUnitIds.has(l.Unit_ID) && (l.Status === 'Active' || l.Status === 'Pending Renewal'));
    const pTenantIds = new Set(pLeases.map((l) => l.Tenant_ID));
    const matchingTenants = tenants.filter((t) => pTenantIds.has(t.Tenant_ID));
    if (matchingTenants.length > 0) {
      setSelectedTenantId(matchingTenants[0].Tenant_ID);
    }
  };

  const selectedTenant = tenants.find((t) => t.Tenant_ID === selectedTenantId);
  const activeLease = leases.find((l) => l.Tenant_ID === selectedTenantId && (l.Status === 'Active' || l.Status === 'Pending Renewal'));
  const assignedUnit = units.find((u) => u.Unit_ID === activeLease?.Unit_ID);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenantId || amount <= 0) return;

    const result = directTenantUtilityCharge({
      tenantId: selectedTenantId,
      utilityType,
      amount,
      periodMonth,
      description: `${utilityType} [${readingRef ? `Ref: ${readingRef}, ` : ''}${periodMonth}] - ${notes || 'Manual Utility Charge'}`,
    });

    if (result) {
      setSuccessInfo({ invoiceId: result.invoiceId });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl my-8 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-700 text-white shadow-xs">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-heading">
                Manual Utility Allocation to Tenant
              </h2>
              <p className="text-xs text-slate-500">
                Update individually calculated utility charges directly against a tenant by property
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {successInfo ? (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Utility Charge Successfully Allocated!</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              <strong>{formatCurrency(amount)}</strong> for <strong>{utilityType}</strong> ({periodMonth}) has been updated against resident <strong>{selectedTenant?.Full_Name}</strong> and posted to invoice <strong>{successInfo.invoiceId}</strong>.
            </p>
            <div className="flex justify-center gap-3 pt-4">
              <button
                onClick={() => {
                  setSuccessInfo(null);
                  onClose();
                }}
                className="rounded-lg bg-red-700 px-6 py-2.5 text-xs font-bold text-white hover:bg-red-800 shadow-xs"
              >
                Done & Return to Utilities
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {/* Property and Tenant Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Property</label>
                <select
                  value={selectedPropertyId}
                  onChange={(e) => handlePropertyChange(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold focus:border-red-600 focus:outline-none"
                >
                  {properties.map((p) => (
                    <option key={p.Property_ID} value={p.Property_ID}>
                      {p.Property_Name} ({p.City})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Tenant Resident</label>
                <select
                  value={selectedTenantId}
                  onChange={(e) => setSelectedTenantId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold focus:border-red-600 focus:outline-none"
                >
                  {availableTenants.length > 0 ? (
                    availableTenants.map((t) => (
                      <option key={t.Tenant_ID} value={t.Tenant_ID}>
                        {t.Full_Name} ({t.Tenant_ID})
                      </option>
                    ))
                  ) : (
                    tenants.map((t) => (
                      <option key={t.Tenant_ID} value={t.Tenant_ID}>
                        {t.Full_Name} ({t.Tenant_ID})
                      </option>
                    ))
                  )}
                </select>
                {selectedTenant && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    Assigned: {assignedUnit?.Unit_Number_Name || 'Suite'}
                  </p>
                )}
              </div>
            </div>

            {/* Utility Type, Period, and Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Utility Service</label>
                <select
                  value={utilityType}
                  onChange={(e) => setUtilityType(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium focus:border-red-600 focus:outline-none"
                >
                  <option value="Hydro (Electricity)">Hydro (Electricity)</option>
                  <option value="Natural Gas (Heating)">Natural Gas (Heating)</option>
                  <option value="Water & Sewer">Water & Sewer</option>
                  <option value="Fiber High-Speed Internet">Fiber High-Speed Internet</option>
                  <option value="Waste & Recycling">Waste & Recycling</option>
                  <option value="Sub-Meter Adjustment">Sub-Meter Adjustment</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Billing Period</label>
                <input
                  type="month"
                  required
                  value={periodMonth}
                  onChange={(e) => setPeriodMonth(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium focus:border-red-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Calculated Amount ($)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-300 bg-white pl-7 pr-3 py-1.5 text-xs font-bold text-slate-900 focus:border-red-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Meter Reading Reference and Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Meter Reading / Ref #</label>
                <input
                  type="text"
                  placeholder="e.g. MTR-KWH-4402"
                  value={readingRef}
                  onChange={(e) => setReadingRef(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-red-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Allocation Memo</label>
                <input
                  type="text"
                  placeholder="e.g. Separately calculated sub-meter recovery"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-red-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={amount <= 0}
                className="flex items-center gap-2 rounded-lg bg-red-700 px-5 py-2 text-xs font-bold text-white hover:bg-red-800 disabled:opacity-50 shadow-xs"
              >
                <Zap className="h-4 w-4" />
                <span>Allocate & Update Tenant Account</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
