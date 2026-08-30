import React, { useState } from 'react';
import {
  Home,
  Receipt,
  Wrench,
  FileSignature,
  DollarSign,
  CheckCircle2,
  ShieldCheck,
  Plus,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { InvoiceModal } from '../common/InvoiceModal';
import { WorkOrderDetailModal } from '../common/WorkOrderDetailModal';
import { WorkOrder } from '../../types';

export const TenantPortalView: React.FC = () => {
  const {
    currentUser,
    tenants,
    leases,
    properties,
    units,
    rentTransactions,
    workOrders,
    formatCurrency,
    createWorkOrder,
    acceptLeaseRenewal,
  } = useERP();

  const [activeTab, setActiveTab] = useState<'overview' | 'billing' | 'maintenance' | 'lease'>('overview');
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<WorkOrder | null>(null);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);

  // New Ticket Form
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketCategory, setTicketCategory] = useState<WorkOrder['Category']>('Plumbing');
  const [ticketPriority, setTicketPriority] = useState<WorkOrder['Priority']>('Medium');
  const [ticketDesc, setTicketDesc] = useState('');
  const [ticketSuccess, setTicketSuccess] = useState(false);

  const tenant = tenants.find((t) => t.Tenant_ID === currentUser?.Associated_Tenant_ID) || tenants[0];
  const activeLease = leases.find(
    (l) => l.Tenant_ID === tenant?.Tenant_ID && (l.Status === 'Active' || l.Status === 'Pending Renewal')
  );
  const unit = activeLease ? units.find((u) => u.Unit_ID === activeLease.Unit_ID) : null;
  const property = activeLease ? properties.find((p) => p.Property_ID === activeLease.Property_ID) : null;

  const tenantInvoices = rentTransactions.filter((r) => r.Tenant_ID === tenant?.Tenant_ID);
  const tenantWorkOrders = workOrders.filter((w) => w.Tenant_ID === tenant?.Tenant_ID);
  const totalBalanceDue = tenantInvoices.reduce((acc, r) => acc + r.Balance, 0);

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLease) return;
    createWorkOrder({
      Property_ID: activeLease.Property_ID,
      Unit_ID: activeLease.Unit_ID,
      Tenant_ID: tenant.Tenant_ID,
      Category: ticketCategory,
      Priority: ticketPriority,
      Title: ticketTitle,
      Description: ticketDesc,
      Estimated_Cost: 150,
      Cost_Chargeable_To: 'Property Owner / Operating',
      Created_By: `${tenant.Full_Name} (Tenant Portal)`,
      Status: 'New',
    });
    setTicketSuccess(true);
    setTimeout(() => {
      setTicketSuccess(false);
      setShowNewTicketModal(false);
      setTicketTitle('');
      setTicketDesc('');
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Resident Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-700 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 font-bold text-white text-xl shadow-lg shadow-indigo-600/30">
            {tenant?.Full_Name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">{tenant?.Full_Name}</h2>
              <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                Resident in Good Standing
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              {property?.Property_Name} — <span className="font-bold text-white">{unit?.Unit_Number_Name}</span> ({unit?.Unit_Type})
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Balance Due</span>
          <p className={`text-2xl font-extrabold ${totalBalanceDue > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {formatCurrency(totalBalanceDue)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-700 pb-3">
        {[
          { id: 'overview', label: 'Resident Home & Alerts', icon: Home },
          { id: 'billing', label: 'Rent Payments & Statements', icon: Receipt },
          { id: 'maintenance', label: 'Maintenance Requests', icon: Wrench },
          { id: 'lease', label: 'Tenancy Agreement', icon: FileSignature },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Pay / Balance Box */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-base">Monthly Rent Statement</h3>
                <span className="text-xs text-slate-400">Due: 1st of every month</span>
              </div>

              <div className="space-y-3">
                {tenantInvoices.map((inv) => (
                  <div
                    key={inv.Rent_Txn_ID}
                    className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900/80 p-4 text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-indigo-400">{inv.Rent_Txn_ID}</span>
                      <p className="font-bold text-white text-sm mt-0.5">{inv.Period_Month} Rent Cycle</p>
                      <p className="text-[11px] text-slate-400">Due Date: {inv.Due_Date}</p>
                    </div>

                    <div className="text-right space-y-1">
                      <p className="text-base font-extrabold text-white">{formatCurrency(inv.Amount_Billed)}</p>
                      {inv.Balance > 0 ? (
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/30 transition-all"
                        >
                          Pay {formatCurrency(inv.Balance)} Now
                        </button>
                      ) : (
                        <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                          Paid in Full
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Maintenance Shortcuts */}
            <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-base">My Maintenance Tickets</h3>
                <button
                  onClick={() => setShowNewTicketModal(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-500"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Request Repair</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {tenantWorkOrders.map((w) => (
                  <div
                    key={w.Ticket_ID}
                    onClick={() => setSelectedTicket(w)}
                    className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900/60 p-3.5 text-xs cursor-pointer hover:border-indigo-500"
                  >
                    <div>
                      <p className="font-bold text-white">{w.Title}</p>
                      <p className="text-[11px] text-slate-400">{w.Category} · Logged {w.Created_At.slice(0, 10)}</p>
                    </div>
                    <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-[10px] font-bold text-indigo-300 border border-indigo-500/30">
                      {w.Status}
                    </span>
                  </div>
                ))}

                {tenantWorkOrders.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-4">No open repair tickets.</p>
                )}
              </div>
            </div>
          </div>

          {/* Lease Card */}
          <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-6 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Lease Summary</span>
              <h3 className="font-bold text-white text-base">{property?.Property_Name}</h3>

              <div className="rounded-xl bg-slate-900/80 p-4 space-y-2.5 text-xs border border-slate-700/60">
                <div className="flex justify-between text-slate-300">
                  <span>Suite Number:</span>
                  <span className="font-bold text-white">{unit?.Unit_Number_Name}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Monthly Rent:</span>
                  <span className="font-bold text-emerald-400">{formatCurrency(activeLease?.Monthly_Rent || 0)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Lease Expiry:</span>
                  <span className="font-bold text-white">{activeLease?.Lease_End}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Security Deposit Held:</span>
                  <span className="font-bold text-white">{formatCurrency(activeLease?.Deposit_Received || 0)}</span>
                </div>
              </div>

              {activeLease?.Status === 'Pending Renewal' && activeLease.Renewal_Proposal && (
                <div className="rounded-xl bg-amber-500/15 border border-amber-500/30 p-3.5 space-y-2 text-xs">
                  <p className="font-bold text-amber-300">Renewal Offer Received!</p>
                  <p className="text-slate-300">
                    Property Management has offered a 12-month extension at {formatCurrency(activeLease.Renewal_Proposal.New_Monthly_Rent)}.
                  </p>
                  <button
                    onClick={() => {
                      acceptLeaseRenewal(activeLease.Lease_ID);
                      alert('You have accepted the lease renewal agreement!');
                    }}
                    className="w-full rounded-lg bg-amber-500 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-all"
                  >
                    Accept & Sign Extension
                  </button>
                </div>
              )}
            </div>

            <div className="rounded-xl bg-slate-950/60 p-3 text-xs text-slate-400 border border-slate-800 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Direct Bank Debit & Interac e-Transfer 256-Bit Encrypted</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Billing */}
      {activeTab === 'billing' && (
        <div className="rounded-2xl border border-slate-700/80 bg-slate-800/80 backdrop-blur-sm overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/60 text-slate-400 uppercase font-semibold">
                <th className="px-5 py-3.5">Invoice #</th>
                <th className="px-5 py-3.5">Period & Due Date</th>
                <th className="px-5 py-3.5">Total Amount</th>
                <th className="px-5 py-3.5">Paid</th>
                <th className="px-5 py-3.5">Balance</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 text-slate-300">
              {tenantInvoices.map((inv) => (
                <tr key={inv.Rent_Txn_ID} className="hover:bg-slate-700/30">
                  <td className="px-5 py-4 font-mono font-bold text-indigo-400">{inv.Rent_Txn_ID}</td>
                  <td className="px-5 py-4 font-semibold text-white">{inv.Period_Month} (Due {inv.Due_Date})</td>
                  <td className="px-5 py-4 font-bold text-white">{formatCurrency(inv.Amount_Billed)}</td>
                  <td className="px-5 py-4 font-bold text-emerald-400">{formatCurrency(inv.Amount_Paid)}</td>
                  <td className="px-5 py-4 font-extrabold text-white">{formatCurrency(inv.Balance)}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                      {inv.Status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-500"
                    >
                      View Invoice / Pay
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Maintenance */}
      {activeTab === 'maintenance' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowNewTicketModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500"
            >
              <Plus className="h-4 w-4" />
              <span>Submit Repair Ticket</span>
            </button>
          </div>

          <div className="space-y-3">
            {tenantWorkOrders.map((w) => (
              <div
                key={w.Ticket_ID}
                onClick={() => setSelectedTicket(w)}
                className="rounded-2xl border border-slate-700 bg-slate-800/80 p-5 space-y-2 cursor-pointer hover:border-indigo-500"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm">{w.Title}</h4>
                  <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-[10px] font-bold text-indigo-300 border border-indigo-500/30">
                    {w.Status}
                  </span>
                </div>
                <p className="text-xs text-slate-300">{w.Description}</p>
                <div className="flex justify-between pt-2 border-t border-slate-700 text-[11px] text-slate-400">
                  <span>Logged: {w.Created_At.slice(0, 10)}</span>
                  <span>Category: {w.Category}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Lease */}
      {activeTab === 'lease' && (
        <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-6 space-y-4">
          <h3 className="font-bold text-white text-base">Standard Residential Tenancy Agreement</h3>
          <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-5 font-mono text-xs text-slate-300 leading-relaxed max-h-96 overflow-y-auto space-y-3">
            <p className="font-bold text-white">RESIDENTIAL TENANCY AGREEMENT (STANDARD FORM LEASE)</p>
            <p>1. Parties: Landlord / Management and Resident ({tenant?.Full_Name}).</p>
            <p>2. Rental Unit: {property?.Property_Name}, {unit?.Unit_Number_Name}, {property?.Address}.</p>
            <p>3. Term: Fixed-term beginning {activeLease?.Lease_Start} and ending {activeLease?.Lease_End}.</p>
            <p>4. Rent: Base monthly rent is {formatCurrency(activeLease?.Monthly_Rent || 0)}, due in advance on the 1st day of each month.</p>
            <p>5. Deposit: Security deposit of {formatCurrency(activeLease?.Deposit_Received || 0)} held in statutory escrow trust account.</p>
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedInvoice && (
        <InvoiceModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

      {selectedTicket && (
        <WorkOrderDetailModal
          workOrder={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}

      {showNewTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl p-6 space-y-4 animate-in fade-in">
            <h3 className="text-lg font-bold text-white">Submit Maintenance / Repair Request</h3>

            <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Issue Summary</label>
                <input
                  type="text"
                  placeholder="e.g. Kitchen sink faucet leaking"
                  value={ticketTitle}
                  onChange={(e) => setTicketTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Category</label>
                  <select
                    value={ticketCategory}
                    onChange={(e) => setTicketCategory(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                  >
                    <option value="Plumbing">Plumbing</option>
                    <option value="Electrical">Electrical</option>
                    <option value="HVAC">HVAC / Heating / AC</option>
                    <option value="Appliance">Appliance</option>
                    <option value="Structural">Structural</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Urgency</label>
                  <select
                    value={ticketPriority}
                    onChange={(e) => setTicketPriority(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                  >
                    <option value="Medium">Standard Routine (3-5 days)</option>
                    <option value="High">High Urgency (24-48 hours)</option>
                    <option value="Emergency">Emergency (Immediate)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Detailed Description & Entry Instructions</label>
                <textarea
                  rows={3}
                  placeholder="Please describe symptoms and if technician has permission to enter if you are away..."
                  value={ticketDesc}
                  onChange={(e) => setTicketDesc(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                {ticketSuccess ? (
                  <span className="flex items-center gap-1.5 font-bold text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" /> Request dispatched to property manager!
                  </span>
                ) : <div />}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewTicketModal(false)}
                    className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-indigo-600 font-bold text-white hover:bg-indigo-500"
                  >
                    Submit Ticket
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
