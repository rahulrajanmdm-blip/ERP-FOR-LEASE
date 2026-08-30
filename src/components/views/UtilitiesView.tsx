import React, { useState } from 'react';
import {
  Zap,
  Plus,
  Droplets,
  Flame,
  Trash2,
  DollarSign,
  Building2,
  Split,
  CheckCircle2,
  Settings2,
  Sliders,
  Layers,
  Check,
  UserCheck,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { UtilityCategoryModal } from '../common/UtilityCategoryModal';
import { ManualUtilityAllocationModal } from '../common/ManualUtilityAllocationModal';

export const UtilitiesView: React.FC = () => {
  const {
    utilityBills,
    utilitySplits,
    utilitiesMaster,
    properties,
    units,
    tenants,
    leases,
    rentTransactions,
    formatCurrency,
    createUtilityBill,
    allocateUtilityBill,
    recordUtilityPayment,
  } = useERP();

  const [showAddBillModal, setShowAddBillModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showManualAllocationModal, setShowManualAllocationModal] = useState(false);

  // Form State
  const [propertyId, setPropertyId] = useState(properties[0]?.Property_ID || '');
  const [utilityId, setUtilityId] = useState(utilitiesMaster[0]?.Utility_ID || 'UTIL-ELEC');
  const [billDate, setBillDate] = useState('2026-08-01');
  const [dueDate, setDueDate] = useState('2026-08-25');
  const [vendor, setVendor] = useState('Toronto Hydro Electric System');
  const [masterAmount, setMasterAmount] = useState(780);
  const [billRef, setBillRef] = useState('TH-992019');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const uItem = utilitiesMaster.find((u) => u.Utility_ID === utilityId);
    createUtilityBill({
      Property_ID: propertyId,
      Utility_ID: utilityId,
      Utility_Name: uItem?.Utility_Name || 'Electricity',
      Bill_Date: billDate,
      Due_Date: dueDate,
      Vendor: vendor,
      Master_Amount: masterAmount,
      Bill_Reference: billRef,
    });
    setShowAddBillModal(false);
  };

  const handleSplitBill = (billId: string) => {
    const bill = utilityBills.find((b) => b.Utility_Bill_ID === billId);
    if (!bill) return;

    // Find occupied units in this property
    const propUnits = units.filter((u) => u.Property_ID === bill.Property_ID && u.Current_Status === 'Occupied');
    if (propUnits.length === 0) {
      alert('No occupied units found in this property to split with.');
      return;
    }

    const perUnitAmount = parseFloat((bill.Master_Amount / propUnits.length).toFixed(2));
    const splits = propUnits.map((u) => {
      const activeLease = leases.find((l) => l.Unit_ID === u.Unit_ID && (l.Status === 'Active' || l.Status === 'Pending Renewal'));
      return {
        unitId: u.Unit_ID,
        tenantId: activeLease?.Tenant_ID || 'TNT-UNKNOWN',
        amount: perUnitAmount,
      };
    });

    allocateUtilityBill(billId, splits);
    alert(`Successfully split ${formatCurrency(bill.Master_Amount)} across ${propUnits.length} suites! Each resident allocated ${formatCurrency(perUnitAmount)}.`);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl bg-white p-6 border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-700 text-white shadow-2xs">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 font-heading">
                Utility Management & Manual Tenant Allocations
              </h1>
              <p className="text-xs text-slate-500">
                Log master utility bills and manually allocate separately calculated utility charges to tenants by property
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Main user requirement: Manual Tenant Allocation */}
          <button
            onClick={() => setShowManualAllocationModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-red-700 px-4 py-2 text-xs font-bold text-white hover:bg-red-800 transition-colors shadow-xs"
          >
            <UserCheck className="h-4 w-4" />
            <span>Allocate to Tenant Manually</span>
          </button>

          <button
            onClick={() => setShowCategoryModal(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Settings2 className="h-4 w-4 text-red-700" />
            <span>Tariffs & Formulas</span>
          </button>

          <button
            onClick={() => setShowAddBillModal(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Plus className="h-4 w-4 text-slate-600" />
            <span>Add Master Bill</span>
          </button>
        </div>
      </div>

      {/* Utility Bills List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {utilityBills.map((bill) => {
          const prop = properties.find((p) => p.Property_ID === bill.Property_ID);
          const propUnits = units.filter((u) => u.Property_ID === bill.Property_ID && u.Current_Status === 'Occupied');
          const estimatedPerUnit = propUnits.length > 0 ? bill.Master_Amount / propUnits.length : 0;

          return (
            <div
              key={bill.Utility_Bill_ID}
              className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 flex flex-col justify-between shadow-xs"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-700 border border-red-100">
                      <Zap className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{bill.Utility_Name}</h3>
                      <p className="text-xs text-slate-500">{prop?.Property_Name}</p>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                      bill.Status === 'Allocated'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {bill.Status}
                  </span>
                </div>

                <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Vendor:</span>
                    <span className="font-semibold text-slate-900">{bill.Vendor}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Bill Date / Due:</span>
                    <span className="font-semibold text-slate-800">{bill.Bill_Date} / {bill.Due_Date}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Master Invoice Total:</span>
                    <span className="font-extrabold text-red-700 text-sm font-heading">{formatCurrency(bill.Master_Amount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 pt-1.5 border-t border-slate-200">
                    <span>Occupied Suites ({propUnits.length}):</span>
                    <span className="font-bold text-slate-900">~{formatCurrency(estimatedPerUnit)} / suite</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                {bill.Status === 'Allocated' ? (
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700 py-1">
                    <CheckCircle2 className="h-4 w-4" /> Split & Added to Resident Ledgers
                  </div>
                ) : (
                  <button
                    onClick={() => handleSplitBill(bill.Utility_Bill_ID)}
                    className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-red-700 px-4 py-2 text-xs font-bold text-white hover:bg-red-800 shadow-xs transition-all"
                  >
                    <Split className="h-3.5 w-3.5" />
                    <span>Split & Add to Tenant Bills</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Utility Modal */}
      {showAddBillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 font-heading">Record Master Property Utility Bill</h3>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Building</label>
                  <select
                    value={propertyId}
                    onChange={(e) => setPropertyId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-red-600 focus:outline-none"
                  >
                    {properties.map((p) => (
                      <option key={p.Property_ID} value={p.Property_ID}>
                        {p.Property_Name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">Utility Tariff</label>
                  <select
                    value={utilityId}
                    onChange={(e) => setUtilityId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-red-600 focus:outline-none"
                  >
                    {utilitiesMaster.map((u) => (
                      <option key={u.Utility_ID} value={u.Utility_ID}>
                        {u.Utility_Name} ({u.Allocation_Method.replace(/_/g, ' ')})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Vendor Name</label>
                  <input
                    type="text"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-red-600 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">Total Bill Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={masterAmount}
                    onChange={(e) => setMasterAmount(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 font-bold focus:border-red-600 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Bill Date</label>
                  <input
                    type="date"
                    value={billDate}
                    onChange={(e) => setBillDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-red-600 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-red-600 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Invoice / Reference #</label>
                <input
                  type="text"
                  value={billRef}
                  onChange={(e) => setBillRef(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-red-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddBillModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-red-700 font-bold text-white hover:bg-red-800 shadow-xs"
                >
                  Save Utility Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Utility Category & Tariff Modal */}
      {showCategoryModal && (
        <UtilityCategoryModal
          isOpen={showCategoryModal}
          onClose={() => setShowCategoryModal(false)}
        />
      )}

      {/* Manual Tenant Utility Allocation Modal */}
      {showManualAllocationModal && (
        <ManualUtilityAllocationModal
          isOpen={showManualAllocationModal}
          onClose={() => setShowManualAllocationModal(false)}
        />
      )}
    </div>
  );
};
