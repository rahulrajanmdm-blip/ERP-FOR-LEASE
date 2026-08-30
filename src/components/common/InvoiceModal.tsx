import React, { useState } from 'react';
import { X, Printer, Download, CreditCard, DollarSign, CheckCircle2, AlertCircle, Building2, Calendar, User, FileText } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { RentTransaction } from '../../types';

interface InvoiceModalProps {
  invoice: RentTransaction | null;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ invoice, onClose }) => {
  const {
    getProperty,
    getUnit,
    getTenant,
    formatCurrency,
    settings,
    recordRentPayment,
    addCustomChargeToInvoice,
  } = useERP();

  const [paymentAmount, setPaymentAmount] = useState<number>(invoice?.Balance || 0);
  const [paymentMethod, setPaymentMethod] = useState<any>('Interac e-Transfer');
  const [paymentReference, setPaymentReference] = useState('');
  const [showPayForm, setShowPayForm] = useState(false);
  const [showAddCharge, setShowAddCharge] = useState(false);

  const [chargeDesc, setChargeDesc] = useState('');
  const [chargeAmount, setChargeAmount] = useState(0);
  const [chargeCategory, setChargeCategory] = useState<'Utility Charge' | 'Parking' | 'Late Fee' | 'Storage' | 'Pet Rent' | 'Other'>('Utility Charge');

  if (!invoice) return null;

  const property = getProperty(invoice.Property_ID);
  const unit = getUnit(invoice.Unit_ID);
  const tenant = getTenant(invoice.Tenant_ID);

  const handlePrint = () => {
    window.print();
  };

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentAmount <= 0) return;
    recordRentPayment({
      rentTxnId: invoice.Rent_Txn_ID,
      amountPaid: paymentAmount,
      paymentMethod,
      reference: paymentReference || `PMT-${Date.now().toString().slice(-6)}`,
      paymentDate: '2026-08-30',
    });
    setShowPayForm(false);
  };

  const handleAddCharge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chargeDesc || chargeAmount <= 0) return;
    addCustomChargeToInvoice(invoice.Rent_Txn_ID, chargeDesc, chargeAmount, chargeCategory);
    setChargeDesc('');
    setChargeAmount(0);
    setShowAddCharge(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-6 py-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-400" />
            <h3 className="font-bold text-white text-base">
              Invoice Statement #{invoice.Rent_Txn_ID}
            </h3>
            <span
              className={`ml-2 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                invoice.Status === 'Paid'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : invoice.Status === 'Partial'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              {invoice.Status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Body */}
        <div id="printable-invoice" className="p-6 space-y-6 text-slate-200">
          {/* Company & Billing Header */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-slate-800 pb-6">
            <div>
              <h2 className="text-lg font-extrabold text-white">{settings.COMPANY_NAME}</h2>
              <p className="text-xs text-slate-400">{settings.COMPANY_ADDRESS}</p>
              <p className="text-xs text-slate-400">{settings.COMPANY_EMAIL} · {settings.COMPANY_PHONE}</p>
            </div>
            <div className="sm:text-right space-y-1">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Billing Period</p>
              <p className="text-sm font-bold text-white">{invoice.Period_Month}</p>
              <p className="text-xs text-slate-400">Due Date: <span className="text-white font-medium">{invoice.Due_Date}</span></p>
              {invoice.Payment_Date && (
                <p className="text-xs text-emerald-400">Paid on: {invoice.Payment_Date} ({invoice.Payment_Method})</p>
              )}
            </div>
          </div>

          {/* Tenant & Property Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl bg-slate-800/50 p-4 border border-slate-700/60">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Billed To (Tenant)</p>
              <p className="font-bold text-white text-sm">{tenant?.Full_Name || 'Valued Resident'}</p>
              <p className="text-xs text-slate-300">{tenant?.Email}</p>
              <p className="text-xs text-slate-300">{tenant?.Phone}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Property & Unit</p>
              <p className="font-bold text-white text-sm">{property?.Property_Name}</p>
              <p className="text-xs text-slate-300">{unit?.Unit_Number_Name} ({unit?.Unit_Type})</p>
              <p className="text-xs text-slate-400">{property?.Address}, {property?.City}</p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 uppercase font-semibold">
                  <th className="pb-3">Description</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {invoice.Line_Items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="py-3 font-medium text-white">{item.Description}</td>
                    <td className="py-3">
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 border border-slate-700">
                        {item.Category}
                      </span>
                    </td>
                    <td className="py-3 text-right font-semibold text-white">
                      {formatCurrency(item.Amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Breakdown */}
          <div className="border-t border-slate-800 pt-4 flex flex-col items-end space-y-1.5 text-xs">
            <div className="flex justify-between w-64 text-slate-400">
              <span>Total Billed:</span>
              <span className="font-semibold text-white">{formatCurrency(invoice.Amount_Billed)}</span>
            </div>
            <div className="flex justify-between w-64 text-emerald-400">
              <span>Amount Paid:</span>
              <span className="font-semibold">-{formatCurrency(invoice.Amount_Paid)}</span>
            </div>
            <div className="flex justify-between w-64 border-t border-slate-700 pt-2 text-sm font-bold text-white">
              <span>Outstanding Balance:</span>
              <span className={invoice.Balance > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                {formatCurrency(invoice.Balance)}
              </span>
            </div>
          </div>

          {/* Payment Form (if unpaid/partial) */}
          {invoice.Balance > 0 && !showPayForm && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  setPaymentAmount(invoice.Balance);
                  setShowPayForm(true);
                }}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
              >
                <DollarSign className="h-4 w-4" />
                <span>Record Payment ({formatCurrency(invoice.Balance)})</span>
              </button>
              <button
                onClick={() => setShowAddCharge(!showAddCharge)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                <span>+ Add Itemized Charge</span>
              </button>
            </div>
          )}

          {/* Add Charge Form */}
          {showAddCharge && (
            <form onSubmit={handleAddCharge} className="rounded-xl bg-slate-800/80 p-4 border border-slate-700 space-y-3 animate-in fade-in">
              <p className="text-xs font-bold text-white">Add Supplemental Charge to this Statement</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Charge Description (e.g. Parking spot #12)"
                  value={chargeDesc}
                  onChange={(e) => setChargeDesc(e.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  required
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Amount ($)"
                  value={chargeAmount || ''}
                  onChange={(e) => setChargeAmount(parseFloat(e.target.value) || 0)}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  required
                />
                <select
                  value={chargeCategory}
                  onChange={(e) => setChargeCategory(e.target.value as any)}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="Utility Charge">Utility Charge</option>
                  <option value="Parking">Parking Fee</option>
                  <option value="Storage">Storage Locker</option>
                  <option value="Pet Rent">Pet Rent</option>
                  <option value="Late Fee">Late Fee</option>
                  <option value="Other">Other Adjustment</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCharge(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-500"
                >
                  Apply Charge
                </button>
              </div>
            </form>
          )}

          {/* Payment Form Drawer */}
          {showPayForm && (
            <form onSubmit={handlePaySubmit} className="rounded-xl bg-slate-800/80 p-4 border border-indigo-500/40 space-y-3 animate-in fade-in">
              <div className="flex justify-between items-center">
                <p className="text-xs font-bold text-indigo-300">Receive & Post Payment to Double-Entry Ledger</p>
                <button
                  type="button"
                  onClick={() => setShowPayForm(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  Cancel
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Amount Received</label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentAmount || ''}
                    onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Payment Method (Canada Standard)</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
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
                  <label className="text-[11px] text-slate-400 block mb-1">Payment Reference</label>
                  <input
                    type="text"
                    placeholder="e.g. EFT-88910"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-md shadow-emerald-600/30"
                >
                  Confirm & Post Journal
                </button>
              </div>
            </form>
          )}

          {/* Payment Remittance Instructions */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-[11px] text-slate-400">
            <p className="font-semibold text-slate-300 mb-1">Remittance & EFT Instructions:</p>
            <p>Direct electronic bank transfer to Royal Bank of Canada (RBC). Institution: 003, Transit: 00021, Account: 8812-903. Please include Invoice #{invoice.Rent_Txn_ID} in payment memo.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
