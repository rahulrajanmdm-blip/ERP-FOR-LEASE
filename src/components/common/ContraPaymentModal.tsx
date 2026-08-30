import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Building,
  DollarSign,
  Receipt,
  Mail,
  Zap,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { ContraPaymentSplit, PaymentMethod } from '../../types';

interface ContraPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedTenantId?: string;
}

export const ContraPaymentModal: React.FC<ContraPaymentModalProps> = ({
  isOpen,
  onClose,
  preselectedTenantId,
}) => {
  const {
    tenants,
    properties,
    units,
    rentTransactions,
    utilitySplits,
    utilitiesMaster,
    recordContraPayment,
    formatCurrency,
    currentUser,
  } = useERP();

  const [selectedTenantId, setSelectedTenantId] = useState<string>(preselectedTenantId || tenants[0]?.Tenant_ID || '');
  const [totalReceivedAmount, setTotalReceivedAmount] = useState<number>(0);
  const [depositBankAccount, setDepositBankAccount] = useState('1010 Dream Dwell Operating Cash (RBC)');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Interac e-Transfer');
  const [referenceNumber, setReferenceNumber] = useState(`PMT-REF-${Math.floor(100000 + Math.random() * 900000)}`);
  const [paymentDate, setPaymentDate] = useState('2026-08-30');
  const [notes, setNotes] = useState('Consolidated payment entry covering rent and utility recovery');
  const [splits, setSplits] = useState<ContraPaymentSplit[]>([]);
  const [successResult, setSuccessResult] = useState<{ contraId: string; journalId: string } | null>(null);

  const selectedTenant = tenants.find((t) => t.Tenant_ID === selectedTenantId);
  const prop = properties.find((p) => p.Property_ID === selectedTenant?.Property_ID);
  const unit = units.find((u) => u.Unit_ID === selectedTenant?.Unit_ID);

  // When tenant changes, populate default unpaid items (Rent Invoices + Utility Splits)
  useEffect(() => {
    if (!selectedTenantId) return;

    const unpaidRent = rentTransactions.filter(
      (r) => r.Tenant_ID === selectedTenantId && (r.Status === 'Unpaid' || r.Status === 'Partial' || r.Status === 'Overdue')
    );

    const unpaidUtilities = utilitySplits.filter(
      (u) => u.Tenant_ID === selectedTenantId && (u.Status === 'Unpaid' || u.Status === 'Partial')
    );

    const initialSplits: ContraPaymentSplit[] = [];

    // Add rent invoice if available
    if (unpaidRent.length > 0) {
      unpaidRent.forEach((inv) => {
        initialSplits.push({
          Target_Type: 'Rent_Invoice',
          Target_ID: inv.Rent_Txn_ID,
          Description: `Rent Invoice ${inv.Rent_Txn_ID} (${inv.Month_Year})`,
          Amount: inv.Balance,
          Account_Code: '1100',
        });
      });
    } else {
      // Fallback base rent line
      initialSplits.push({
        Target_Type: 'Rent_Invoice',
        Description: 'Monthly Base Rent Allocation',
        Amount: 1200,
        Account_Code: '1100',
      });
    }

    // Add utility split if available
    if (unpaidUtilities.length > 0) {
      unpaidUtilities.forEach((util) => {
        initialSplits.push({
          Target_Type: 'Utility_Bill',
          Target_ID: util.Split_ID,
          Description: `Utility Recovery: ${util.Utility_Name} (${util.Split_ID})`,
          Amount: util.Balance,
          Account_Code: '1110',
        });
      });
    } else {
      // Add default utility row
      initialSplits.push({
        Target_Type: 'Utility_Bill',
        Description: 'Electricity & Water Utility Recovery',
        Amount: 150,
        Account_Code: '1110',
      });
    }

    setSplits(initialSplits);
    const sum = initialSplits.reduce((acc, s) => acc + (Number(s.Amount) || 0), 0);
    setTotalReceivedAmount(sum);
  }, [selectedTenantId, rentTransactions, utilitySplits]);

  if (!isOpen) return null;

  const sumOfSplits = splits.reduce((acc, s) => acc + (Number(s.Amount) || 0), 0);
  const diff = Number(totalReceivedAmount) - sumOfSplits;
  const isBalanced = Math.abs(diff) < 0.01;

  const handleAddSplitLine = (type: 'Rent_Invoice' | 'Utility_Bill' | 'Parking' | 'Late_Fee' | 'Custom') => {
    let desc = 'Custom Charge Split';
    let code = '4030';
    let defaultAmt = 50;

    if (type === 'Utility_Bill') {
      desc = 'Sub-meter Water Utility';
      code = '1110';
      defaultAmt = 75;
    } else if (type === 'Parking') {
      desc = 'Covered Garage Parking Spot';
      code = '4030';
      defaultAmt = 100;
    } else if (type === 'Late_Fee') {
      desc = 'Late Payment Surcharge';
      code = '4020';
      defaultAmt = 50;
    } else if (type === 'Rent_Invoice') {
      desc = 'Additional Rent Adjustment';
      code = '1100';
      defaultAmt = 200;
    }

    setSplits([...splits, { Target_Type: type, Description: desc, Amount: defaultAmt, Account_Code: code }]);
  };

  const handleUpdateSplit = (index: number, field: keyof ContraPaymentSplit, value: any) => {
    const next = [...splits];
    next[index] = { ...next[index], [field]: value };
    setSplits(next);
  };

  const handleRemoveSplit = (index: number) => {
    setSplits(splits.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant) return;
    if (totalReceivedAmount <= 0) return;

    const result = recordContraPayment({
      tenantId: selectedTenant.Tenant_ID,
      propertyId: selectedTenant.Property_ID,
      unitId: selectedTenant.Unit_ID,
      totalReceivedAmount: Number(totalReceivedAmount),
      depositBankAccount,
      paymentMethod,
      referenceNumber,
      notes,
      paymentDate,
      splits,
    });

    setSuccessResult(result);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl my-8 animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-700 text-white shadow-xs">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-heading">
                Record Consolidated Payment Entry
              </h2>
              <p className="text-xs text-slate-500">
                Post single lump-sum bank deposit and allocate across Rent, Utilities, and Other Charges
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

        {successResult ? (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Payment Entry Successfully Posted!</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              Bank deposit of <strong>{formatCurrency(totalReceivedAmount)}</strong> recorded. General Ledger balanced journal entry <strong>{successResult.journalId}</strong> generated, and official payment receipt generated for <strong>{selectedTenant?.Full_Name}</strong>.
            </p>
            <div className="flex justify-center gap-3 pt-4">
              <button
                onClick={() => {
                  setSuccessResult(null);
                  onClose();
                }}
                className="rounded-lg bg-red-700 px-6 py-2.5 text-xs font-bold text-white hover:bg-red-800 shadow-xs"
              >
                Done & Return to Billing
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-5">
            {/* Top Row: Tenant Selection & Bank Deposit Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Tenant Resident</label>
                <select
                  value={selectedTenantId}
                  onChange={(e) => setSelectedTenantId(e.target.value)}
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
                    {prop?.Property_Name} • {unit?.Unit_Number_Name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Total Bank Deposit Received</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={totalReceivedAmount}
                    onChange={(e) => setTotalReceivedAmount(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-300 bg-white pl-7 pr-3 py-2 text-xs font-bold text-slate-900 focus:border-red-600 focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Exact single deposit credited to Canadian bank</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deposit Bank Account</label>
                <select
                  value={depositBankAccount}
                  onChange={(e) => setDepositBankAccount(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold focus:border-red-600 focus:outline-none"
                >
                  <option value="1010 Dream Dwell Operating Cash (RBC)">1010 Dream Dwell Operating Cash (RBC)</option>
                  <option value="1000 Dream Dwell Security Deposit Escrow (TD)">1000 Dream Dwell Security Deposit Escrow (TD)</option>
                </select>
              </div>
            </div>

            {/* Middle Row: Payment Method, Date, Reference */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method (Canada Standard)</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-red-600 focus:outline-none"
                >
                  <option value="Interac e-Transfer">Interac e-Transfer</option>
                  <option value="Pre-Authorized Debit (PAD)">Pre-Authorized Debit (PAD)</option>
                  <option value="Cheque / Post-Dated Cheque">Cheque / Post-Dated Cheque</option>
                  <option value="Interac Debit Card">Interac Debit Card</option>
                  <option value="Credit Card (Visa / Mastercard)">Credit Card (Visa / Mastercard)</option>
                  <option value="Bank Draft / Certified Cheque">Bank Draft / Certified Cheque</option>
                  <option value="Cash / Branch Deposit">Cash / Branch Deposit</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Bank Reference / Confirmation #</label>
                <input
                  type="text"
                  required
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-red-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deposit Date</label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-red-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Split Lines Section */}
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Payment Allocation Split Lines ({splits.length})
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Allocate portions of the single deposit to Rent, Utilities, Late fees, or Parking
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleAddSplitLine('Utility_Bill')}
                    className="flex items-center gap-1 rounded bg-slate-100 hover:bg-slate-200 px-2 py-1 text-[11px] font-bold text-slate-700"
                  >
                    <Plus className="h-3 w-3 text-red-600" /> + Utility Line
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddSplitLine('Parking')}
                    className="flex items-center gap-1 rounded bg-slate-100 hover:bg-slate-200 px-2 py-1 text-[11px] font-bold text-slate-700"
                  >
                    <Plus className="h-3 w-3 text-red-600" /> + Parking
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddSplitLine('Custom')}
                    className="flex items-center gap-1 rounded bg-slate-100 hover:bg-slate-200 px-2 py-1 text-[11px] font-bold text-slate-700"
                  >
                    <Plus className="h-3 w-3 text-red-600" /> + Custom
                  </button>
                </div>
              </div>

              {/* Splits Table */}
              <div className="mt-3 space-y-2 max-h-60 overflow-y-auto pr-1">
                {splits.map((split, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50/50"
                  >
                    <div className="w-32">
                      <select
                        value={split.Target_Type}
                        onChange={(e) => handleUpdateSplit(index, 'Target_Type', e.target.value)}
                        className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-[11px] font-semibold text-slate-800"
                      >
                        <option value="Rent_Invoice">Rent Invoice</option>
                        <option value="Utility_Bill">Utility Bill</option>
                        <option value="Parking">Parking Fee</option>
                        <option value="Late_Fee">Late Surcharge</option>
                        <option value="Custom">Custom Ledger</option>
                      </select>
                    </div>

                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Description"
                        value={split.Description}
                        onChange={(e) => handleUpdateSplit(index, 'Description', e.target.value)}
                        className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800"
                      />
                    </div>

                    <div className="w-24">
                      <input
                        type="text"
                        placeholder="Target ID"
                        value={split.Target_ID || ''}
                        onChange={(e) => handleUpdateSplit(index, 'Target_ID', e.target.value)}
                        className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-[11px] text-slate-600"
                      />
                    </div>

                    <div className="w-28 relative">
                      <span className="absolute left-2 top-1.5 text-xs text-slate-400">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={split.Amount}
                        onChange={(e) => handleUpdateSplit(index, 'Amount', parseFloat(e.target.value) || 0)}
                        className="w-full rounded border border-slate-300 bg-white pl-5 pr-2 py-1.5 text-xs font-bold text-slate-900"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveSplit(index)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Reconciliation Balance Bar */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50">
              <div className="space-y-0.5">
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-600">
                    Bank Deposit: <strong>{formatCurrency(totalReceivedAmount)}</strong>
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-600">
                    Allocated Splits: <strong>{formatCurrency(sumOfSplits)}</strong>
                  </span>
                </div>
                {diff > 0.01 && (
                  <p className="text-[11px] text-amber-700 font-semibold">
                    Note: Unallocated excess of {formatCurrency(diff)} will automatically credit 2300 Prepaid Rent Liability.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isBalanced ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Balanced 100%
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-300">
                    <AlertCircle className="h-3.5 w-3.5" /> Diff: {formatCurrency(diff)}
                  </span>
                )}
              </div>
            </div>

            {/* Modal Actions */}
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
                disabled={totalReceivedAmount <= 0}
                className="flex items-center gap-2 rounded-lg bg-red-700 px-5 py-2 text-xs font-bold text-white hover:bg-red-800 disabled:opacity-50 shadow-xs"
              >
                <Receipt className="h-4 w-4" />
                <span>Post Journal & Record Entry</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
