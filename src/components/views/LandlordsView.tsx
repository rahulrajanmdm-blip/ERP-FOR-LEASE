import React, { useState } from 'react';
import { UserCheck, Plus, Building2, DollarSign, Mail, Phone, CreditCard, FileText, CheckCircle2, Edit } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { Landlord } from '../../types';

export const LandlordsView: React.FC = () => {
  const { landlords, properties, units, rentTransactions, workOrders, formatCurrency, addLandlord, updateLandlord } = useERP();
  const [showModal, setShowModal] = useState(false);
  const [editingLandlord, setEditingLandlord] = useState<Landlord | null>(null);

  // Form
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Bank Transfer' | 'Direct Deposit' | 'Cheque' | 'Wire'>('Direct Deposit');
  const [bankRef, setBankRef] = useState('');
  const [accountNum, setAccountNum] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [notes, setNotes] = useState('');

  const openAdd = () => {
    setEditingLandlord(null);
    setFullName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setPaymentMethod('Direct Deposit');
    setBankRef('RBC Transit 00021');
    setAccountNum('00021-8812903');
    setStatus('Active');
    setNotes('');
    setShowModal(true);
  };

  const openEdit = (l: Landlord) => {
    setEditingLandlord(l);
    setFullName(l.Full_Name);
    setEmail(l.Email);
    setPhone(l.Phone);
    setAddress(l.Address);
    setPaymentMethod(l.Payment_Method);
    setBankRef(l.Bank_Reference);
    setAccountNum(l.Account_Number);
    setStatus(l.Status);
    setNotes(l.Notes || '');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLandlord) {
      updateLandlord({
        ...editingLandlord,
        Full_Name: fullName,
        Email: email,
        Phone: phone,
        Address: address,
        Payment_Method: paymentMethod,
        Bank_Reference: bankRef,
        Account_Number: accountNum,
        Status: status,
        Notes: notes,
      });
    } else {
      addLandlord({
        Full_Name: fullName,
        Email: email,
        Phone: phone,
        Address: address,
        Payment_Method: paymentMethod,
        Bank_Reference: bankRef,
        Account_Number: accountNum,
        Status: status,
        Notes: notes,
      });
    }
    setShowModal(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Landlords & Asset Owners</h2>
          <p className="text-xs text-slate-400">
            Owner distribution statements, management fee deductions, and remittance accounts
          </p>
        </div>

        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Add Landlord</span>
        </button>
      </div>

      {/* Landlord Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {landlords.map((landlord) => {
          const ownedProps = properties.filter((p) => p.Landlord_ID === landlord.Landlord_ID);
          const ownedPropIds = ownedProps.map((p) => p.Property_ID);
          const ownedUnits = units.filter((u) => ownedPropIds.includes(u.Property_ID));

          // Calculate Financials for this landlord
          const landlordInvoices = rentTransactions.filter((r) => ownedPropIds.includes(r.Property_ID));
          const grossCollected = landlordInvoices.reduce((acc, r) => acc + r.Amount_Paid, 0);

          // Management fees
          const avgFee = ownedProps.length > 0 ? ownedProps[0].Management_Fee_Percentage : 8.0;
          const managementFeeDeduction = grossCollected * (avgFee / 100);

          // Maintenance expenses charged
          const landlordExpenses = workOrders
            .filter((w) => ownedPropIds.includes(w.Property_ID) && w.Status === 'Completed')
            .reduce((acc, w) => acc + w.Actual_Cost, 0);

          const netOwnerPayout = Math.max(0, grossCollected - managementFeeDeduction - landlordExpenses);

          return (
            <div
              key={landlord.Landlord_ID}
              className="rounded-2xl border border-slate-700/80 bg-slate-800/80 backdrop-blur-sm p-6 space-y-5 transition-all hover:border-slate-600 shadow-xl"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 font-bold text-base">
                    {landlord.Full_Name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">{landlord.Full_Name}</h3>
                    <p className="text-xs text-slate-400">{landlord.Email} · {landlord.Phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                    {landlord.Status}
                  </span>
                  <button
                    onClick={() => openEdit(landlord)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Owned Properties List */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Assigned Properties</span>
                <div className="flex flex-wrap gap-2">
                  {ownedProps.map((p) => (
                    <span
                      key={p.Property_ID}
                      className="rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-1.5"
                    >
                      <Building2 className="h-3.5 w-3.5 text-indigo-400" />
                      <span>{p.Property_Name}</span>
                    </span>
                  ))}
                  {ownedProps.length === 0 && (
                    <span className="text-xs text-slate-500 italic">No assigned buildings</span>
                  )}
                </div>
              </div>

              {/* Financial Distribution Statement */}
              <div className="rounded-xl border border-slate-700/80 bg-slate-900/80 p-4 space-y-2.5 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="font-bold text-white uppercase text-[10px] tracking-wider">Owner Payout Statement (August 2026)</span>
                  <span className="text-slate-400">{ownedUnits.length} Total Suites</span>
                </div>

                <div className="flex justify-between text-slate-300">
                  <span>Gross Rent Collected:</span>
                  <span className="font-bold text-white">{formatCurrency(grossCollected)}</span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span>Management Fee ({avgFee}%):</span>
                  <span className="text-rose-400">-{formatCurrency(managementFeeDeduction)}</span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span>Maintenance / Work Order Costs:</span>
                  <span className="text-rose-400">-{formatCurrency(landlordExpenses)}</span>
                </div>

                <div className="flex justify-between pt-2 border-t border-slate-800 text-sm font-extrabold text-emerald-400">
                  <span>Net Owner Disbursement:</span>
                  <span className="text-base">{formatCurrency(netOwnerPayout)}</span>
                </div>
              </div>

              {/* Banking & Remittance */}
              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <div className="flex items-center gap-1.5 truncate">
                  <CreditCard className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{landlord.Bank_Reference}</span>
                </div>
                <span className="font-semibold text-slate-300 shrink-0">{landlord.Payment_Method}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl p-6 space-y-4 animate-in fade-in">
            <h3 className="text-lg font-bold text-white">
              {editingLandlord ? 'Edit Landlord Account' : 'Register New Landlord'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Full Legal / Entity Name</label>
                <input
                  type="text"
                  placeholder="e.g. Michael Chen (Chen Capital Holdings)"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Office / Mailing Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Payout Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                  >
                    <option value="Direct Deposit">Direct Deposit (EFT)</option>
                    <option value="Wire">Wire Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Bank Reference / Transit</label>
                  <input
                    type="text"
                    value={bankRef}
                    onChange={(e) => setBankRef(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Notes & Mandate</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 font-bold text-white hover:bg-indigo-500"
                >
                  Save Landlord
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
