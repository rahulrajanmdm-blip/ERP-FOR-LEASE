import React, { useState } from 'react';
import { X, Receipt, Plus, Trash2, CheckCircle2, Building2, User, Calendar, DollarSign } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { RentLineItem } from '../../types';

interface CreateRentInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateRentInvoiceModal: React.FC<CreateRentInvoiceModalProps> = ({ isOpen, onClose }) => {
  const {
    tenants,
    leases,
    properties,
    units,
    createCustomRentInvoice,
    formatCurrency,
  } = useERP();

  const [selectedTenantId, setSelectedTenantId] = useState<string>(tenants[0]?.Tenant_ID || '');
  const [periodMonth, setPeriodMonth] = useState<string>('2026-09');
  const [dueDate, setDueDate] = useState<string>('2026-09-01');
  const [notes, setNotes] = useState<string>('');
  
  // Find default lease/unit for tenant
  const activeLease = leases.find((l) => l.Tenant_ID === selectedTenantId && l.Status === 'Active') || leases.find((l) => l.Tenant_ID === selectedTenantId);
  const defaultRent = activeLease?.Monthly_Rent || 2000;

  const [lineItems, setLineItems] = useState<RentLineItem[]>([
    { Description: 'Monthly Base Rent', Amount: defaultRent, Category: 'Base Rent' },
  ]);

  const [createdInvoiceId, setCreatedInvoiceId] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedTenant = tenants.find((t) => t.Tenant_ID === selectedTenantId);
  const currentLease = leases.find((l) => l.Tenant_ID === selectedTenantId && l.Status === 'Active') || leases.find((l) => l.Tenant_ID === selectedTenantId);
  const currentUnit = units.find((u) => u.Unit_ID === currentLease?.Unit_ID);
  const currentProp = properties.find((p) => p.Property_ID === currentUnit?.Property_ID);

  const handleTenantChange = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    const lease = leases.find((l) => l.Tenant_ID === tenantId && l.Status === 'Active') || leases.find((l) => l.Tenant_ID === tenantId);
    const rent = lease?.Monthly_Rent || 2000;
    setLineItems([
      { Description: 'Monthly Base Rent', Amount: rent, Category: 'Base Rent' },
    ]);
  };

  const handleAddLineItem = (category: 'Utility Charge' | 'Parking' | 'Storage' | 'Pet Rent' | 'Other' = 'Other') => {
    setLineItems([
      ...lineItems,
      { Description: `${category} charge`, Amount: 100, Category: category },
    ]);
  };

  const handleUpdateLineItem = (index: number, field: keyof RentLineItem, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const totalBilled = lineItems.reduce((acc, item) => acc + (Number(item.Amount) || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenantId || totalBilled <= 0) return;

    const invoice = createCustomRentInvoice({
      tenantId: selectedTenantId,
      periodMonth,
      dueDate,
      lineItems,
      notes: notes || undefined,
    });

    if (invoice) {
      setCreatedInvoiceId(invoice.Rent_Txn_ID);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl my-8 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-700 text-white shadow-xs">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-heading">
                Create Custom Rent Invoice
              </h2>
              <p className="text-xs text-slate-500">
                Generate custom tenant invoice with itemized rent, utilities, parking, or adjustments
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

        {createdInvoiceId ? (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Invoice Successfully Created!</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              Custom Invoice <strong>{createdInvoiceId}</strong> for <strong>{formatCurrency(totalBilled)}</strong> has been posted to Accounts Receivable for <strong>{selectedTenant?.Full_Name}</strong>.
            </p>
            <div className="flex justify-center gap-3 pt-4">
              <button
                onClick={() => {
                  setCreatedInvoiceId(null);
                  onClose();
                }}
                className="rounded-lg bg-red-700 px-6 py-2.5 text-xs font-bold text-white hover:bg-red-800 shadow-xs"
              >
                Done & View Billing Table
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-5">
            {/* Top Row: Tenant Selection & Property info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Tenant</label>
                <select
                  value={selectedTenantId}
                  onChange={(e) => handleTenantChange(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold focus:border-red-600 focus:outline-none"
                >
                  {tenants.map((t) => (
                    <option key={t.Tenant_ID} value={t.Tenant_ID}>
                      {t.Full_Name} ({t.Tenant_ID})
                    </option>
                  ))}
                </select>
                {selectedTenant && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    {currentProp?.Property_Name} • {currentUnit?.Unit_Number_Name || 'Assigned Suite'}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium focus:border-red-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Line Items Section */}
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Itemized Invoice Charges ({lineItems.length})
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Add base rent, utilities, parking, or custom itemized fees
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleAddLineItem('Utility Charge')}
                    className="flex items-center gap-1 rounded bg-slate-100 hover:bg-slate-200 px-2 py-1 text-[11px] font-bold text-slate-700"
                  >
                    <Plus className="h-3 w-3 text-red-600" /> + Utility
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddLineItem('Parking')}
                    className="flex items-center gap-1 rounded bg-slate-100 hover:bg-slate-200 px-2 py-1 text-[11px] font-bold text-slate-700"
                  >
                    <Plus className="h-3 w-3 text-red-600" /> + Parking
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddLineItem('Other')}
                    className="flex items-center gap-1 rounded bg-slate-100 hover:bg-slate-200 px-2 py-1 text-[11px] font-bold text-slate-700"
                  >
                    <Plus className="h-3 w-3 text-red-600" /> + Custom Line
                  </button>
                </div>
              </div>

              {/* Table of items */}
              <div className="mt-3 space-y-2 max-h-56 overflow-y-auto pr-1">
                {lineItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50/50">
                    <div className="w-32">
                      <select
                        value={item.Category}
                        onChange={(e) => handleUpdateLineItem(idx, 'Category', e.target.value)}
                        className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-[11px] font-semibold text-slate-800"
                      >
                        <option value="Base Rent">Base Rent</option>
                        <option value="Utility Charge">Utility Charge</option>
                        <option value="Parking">Parking Fee</option>
                        <option value="Storage">Storage Locker</option>
                        <option value="Pet Rent">Pet Rent</option>
                        <option value="Late Fee">Late Surcharge</option>
                        <option value="Other">Other Adjustment</option>
                      </select>
                    </div>

                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Description"
                        value={item.Description}
                        onChange={(e) => handleUpdateLineItem(idx, 'Description', e.target.value)}
                        className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800"
                      />
                    </div>

                    <div className="w-32 relative">
                      <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-bold">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.Amount}
                        onChange={(e) => handleUpdateLineItem(idx, 'Amount', parseFloat(e.target.value) || 0)}
                        className="w-full rounded border border-slate-300 bg-white pl-6 pr-2 py-1.5 text-xs font-bold text-slate-900"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveLineItem(idx)}
                      disabled={lineItems.length <= 1}
                      className="p-1 text-slate-400 hover:text-red-600 disabled:opacity-30 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Summary */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50">
              <div className="text-xs text-slate-600">
                <span>Total Invoice Receivable: </span>
                <strong className="text-sm font-bold text-slate-900 font-heading ml-1">
                  {formatCurrency(totalBilled)}
                </strong>
              </div>

              <div className="text-[11px] text-slate-500">
                Posts to Accounts Receivable (GL 1200)
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Invoice Memo / Notes (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Standard monthly invoice including prorated utility adjustment"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-red-600 focus:outline-none"
              />
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
                disabled={totalBilled <= 0}
                className="flex items-center gap-2 rounded-lg bg-red-700 px-5 py-2 text-xs font-bold text-white hover:bg-red-800 disabled:opacity-50 shadow-xs"
              >
                <Receipt className="h-4 w-4" />
                <span>Create & Post Invoice</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
