import React, { useState } from 'react';
import {
  X,
  Smartphone,
  CreditCard,
  Wrench,
  FileText,
  Bell,
  CheckCircle2,
  AlertCircle,
  Building,
  Zap,
  RotateCcw,
  Send,
  Plus,
  Camera,
  ChevronRight,
  Shield,
  Clock,
  Check,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';

interface MobileSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileSimulatorModal: React.FC<MobileSimulatorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    tenants,
    properties,
    units,
    rentTransactions,
    workOrders,
    utilitySplits,
    googleMails,
    formatCurrency,
    recordContraPayment,
    addWorkOrder,
    updateWorkOrderStatus,
  } = useERP();

  const [activePersona, setActivePersona] = useState<'tenant' | 'operations'>('tenant');
  const [selectedTenantId, setSelectedTenantId] = useState<string>(tenants[0]?.Tenant_ID || '');
  const [mobileTab, setMobileTab] = useState<'home' | 'pay' | 'maintenance' | 'inbox'>('home');

  // Maintenance form state in mobile
  const [ticketIssue, setTicketIssue] = useState('');
  const [ticketCategory, setTicketCategory] = useState<'Plumbing' | 'Electrical' | 'HVAC' | 'Structural'>('Plumbing');
  const [ticketPriority, setTicketPriority] = useState<'Low' | 'Medium' | 'High' | 'Emergency'>('Medium');
  const [ticketSubmitted, setTicketSubmitted] = useState(false);

  // One-click quick payment simulation
  const [paySuccess, setPaySuccess] = useState(false);

  if (!isOpen) return null;

  const currentTenant = tenants.find((t) => t.Tenant_ID === selectedTenantId) || tenants[0];
  const prop = properties.find((p) => p.Property_ID === currentTenant?.Property_ID);
  const unit = units.find((u) => u.Unit_ID === currentTenant?.Unit_ID);

  const tenantUnpaidRent = rentTransactions.filter(
    (r) => r.Tenant_ID === currentTenant?.Tenant_ID && r.Status !== 'Paid'
  );
  const totalRentDue = tenantUnpaidRent.reduce((acc, r) => acc + r.Balance, 0);

  const tenantUnpaidUtil = utilitySplits.filter(
    (u) => u.Tenant_ID === currentTenant?.Tenant_ID && u.Status !== 'Paid'
  );
  const totalUtilDue = tenantUnpaidUtil.reduce((acc, u) => acc + u.Balance, 0);
  const grandTotalDue = totalRentDue + totalUtilDue;

  const tenantTickets = workOrders.filter((w) => w.Tenant_ID === currentTenant?.Tenant_ID);
  const tenantMails = googleMails.filter((m) => m.To_Email === currentTenant?.Email);

  const handleMobileSubmitWorkOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketIssue || !currentTenant) return;

    addWorkOrder({
      Property_ID: currentTenant.Property_ID,
      Unit_ID: currentTenant.Unit_ID,
      Tenant_ID: currentTenant.Tenant_ID,
      Issue_Description: ticketIssue,
      Category: ticketCategory,
      Priority: ticketPriority,
      Status: 'New',
      Reported_Date: '2026-08-30',
      Assigned_Vendor: 'Muthoot Quick Response Maintenance',
      Estimated_Cost: 120,
    });

    setTicketSubmitted(true);
    setTimeout(() => {
      setTicketSubmitted(false);
      setTicketIssue('');
      setMobileTab('maintenance');
    }, 1500);
  };

  const handleQuickPayAll = () => {
    if (!currentTenant || grandTotalDue <= 0) return;

    recordContraPayment({
      tenantId: currentTenant.Tenant_ID,
      propertyId: currentTenant.Property_ID,
      unitId: currentTenant.Unit_ID,
      totalReceivedAmount: grandTotalDue,
      depositBankAccount: '1010 Muthoot Treasury Operating Cash',
      paymentMethod: 'Bank Transfer',
      referenceNumber: `MOBILE-PAY-${Math.floor(100000 + Math.random() * 900000)}`,
      notes: 'Instant Mobile Rent + Utility combined payment settlement',
      paymentDate: '2026-08-30',
      splits: [
        {
          Target_Type: 'Rent_Invoice',
          Description: `August Consolidated Rent`,
          Amount: totalRentDue,
          Account_Code: '1100',
        },
        {
          Target_Type: 'Utility_Bill',
          Description: `August Consolidated Utilities`,
          Amount: totalUtilDue,
          Account_Code: '1110',
        },
      ],
    });

    setPaySuccess(true);
    setTimeout(() => {
      setPaySuccess(false);
      setMobileTab('home');
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="flex flex-col lg:flex-row items-center gap-6 max-w-5xl w-full justify-center">
        {/* Simulator Control Toolbar (Left / Top) */}
        <div className="w-full lg:w-80 rounded-2xl bg-white p-5 border border-slate-200 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-700 text-white">
                <Smartphone className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Mobile Simulator</h3>
                <p className="text-[10px] text-slate-500">Live Progressive Web App (PWA)</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Simulated User Profile</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setActivePersona('tenant')}
                className={`rounded-lg p-2 text-xs font-bold border text-center transition-all ${
                  activePersona === 'tenant'
                    ? 'border-red-600 bg-red-50 text-red-800 font-extrabold'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                Resident Tenant
              </button>
              <button
                onClick={() => setActivePersona('operations')}
                className={`rounded-lg p-2 text-xs font-bold border text-center transition-all ${
                  activePersona === 'operations'
                    ? 'border-red-600 bg-red-50 text-red-800 font-extrabold'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                Field Operations
              </button>
            </div>
          </div>

          {activePersona === 'tenant' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Tenant</label>
              <select
                value={selectedTenantId}
                onChange={(e) => setSelectedTenantId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold focus:border-red-600 focus:outline-none"
              >
                {tenants.map((t) => (
                  <option key={t.Tenant_ID} value={t.Tenant_ID}>
                    {t.Full_Name} ({t.Tenant_ID})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 text-slate-600">
            <p className="font-bold text-slate-800">📱 Native Mobile Experience:</p>
            <p className="text-[11px]">• Direct 1-tap contra rent + utility payment</p>
            <p className="text-[11px]">• Snap & submit maintenance work orders</p>
            <p className="text-[11px]">• Real-time Google Mail receipt sync</p>
          </div>
        </div>

        {/* Smartphone Chassis Frame */}
        <div className="relative w-[340px] h-[670px] rounded-[48px] bg-slate-900 p-3.5 shadow-2xl border-4 border-slate-700 shrink-0">
          {/* Top Notch & Camera Island */}
          <div className="absolute top-5 left-1/2 -translate-x-1/2 h-5 w-28 bg-black rounded-full z-30 flex items-center justify-between px-3">
            <div className="h-2 w-2 rounded-full bg-slate-800" />
            <div className="h-2 w-2 rounded-full bg-blue-900/60" />
          </div>

          {/* Screen Content Container */}
          <div className="w-full h-full rounded-[38px] bg-slate-100 overflow-hidden flex flex-col relative text-slate-900 font-sans select-none">
            {/* iOS/Android Status Bar */}
            <div className="pt-2.5 px-6 flex justify-between items-center text-[10px] font-bold text-slate-800 bg-white z-20">
              <span>9:41 AM</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px]">5G</span>
                <span className="h-2 w-4 rounded-xs border border-slate-800 bg-emerald-500 inline-block" />
              </div>
            </div>

            {/* Mobile App Header */}
            <div className="px-4 py-2.5 bg-red-900 text-white flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-red-900 font-extrabold text-xs">
                  M
                </div>
                <div>
                  <p className="text-xs font-bold leading-none">Muthoot Resident</p>
                  <p className="text-[9px] text-white/70">{unit?.Unit_Number_Name || 'Unit 402'}</p>
                </div>
              </div>

              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold">
                {activePersona === 'tenant' ? 'Tenant App' : 'Tech App'}
              </span>
            </div>

            {/* Mobile Main Body Views */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {activePersona === 'tenant' ? (
                <>
                  {mobileTab === 'home' && (
                    <div className="space-y-3 animate-in fade-in">
                      {/* Resident Info Card */}
                      <div className="rounded-2xl bg-gradient-to-br from-red-800 to-red-950 p-4 text-white shadow-md">
                        <p className="text-[10px] uppercase font-bold text-white/70">Welcome back</p>
                        <h3 className="text-sm font-extrabold">{currentTenant.Full_Name}</h3>
                        <p className="text-[10px] text-white/80 mt-0.5">{prop?.Property_Name} • {unit?.Unit_Number_Name}</p>

                        <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between">
                          <div>
                            <p className="text-[9px] text-white/70">Total Due (Rent + Utils)</p>
                            <p className="text-base font-extrabold text-white">{formatCurrency(grandTotalDue)}</p>
                          </div>
                          {grandTotalDue > 0 ? (
                            <button
                              onClick={() => setMobileTab('pay')}
                              className="rounded-xl bg-white px-3 py-1.5 text-xs font-extrabold text-red-900 shadow-sm"
                            >
                              Pay Now
                            </button>
                          ) : (
                            <span className="rounded-full bg-emerald-500/30 px-2.5 py-1 text-[10px] font-bold text-emerald-200">
                              ✓ Paid Up
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quick Action Tiles */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setMobileTab('maintenance')}
                          className="flex flex-col items-center justify-center rounded-xl bg-white p-3 border border-slate-200 text-center shadow-2xs hover:border-red-300"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-700 mb-1.5">
                            <Wrench className="h-4 w-4" />
                          </div>
                          <span className="text-[11px] font-bold text-slate-800">Request Repair</span>
                          <span className="text-[9px] text-slate-400">Plumbing, AC, etc.</span>
                        </button>

                        <button
                          onClick={() => setMobileTab('inbox')}
                          className="flex flex-col items-center justify-center rounded-xl bg-white p-3 border border-slate-200 text-center shadow-2xs hover:border-red-300"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-800 mb-1.5">
                            <Bell className="h-4 w-4" />
                          </div>
                          <span className="text-[11px] font-bold text-slate-800">Mail & Receipts</span>
                          <span className="text-[9px] text-slate-400">{tenantMails.length} updates</span>
                        </button>
                      </div>

                      {/* Active Tickets Mini List */}
                      <div className="rounded-xl bg-white p-3 border border-slate-200 shadow-2xs space-y-2">
                        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                          <p className="text-[11px] font-bold text-slate-800">Recent Service Requests</p>
                          <span className="text-[9px] text-red-700 font-bold">{tenantTickets.length} Total</span>
                        </div>
                        {tenantTickets.length > 0 ? (
                          tenantTickets.slice(0, 2).map((t) => (
                            <div key={t.Ticket_ID} className="flex items-center justify-between text-xs py-1">
                              <div className="min-w-0 pr-2">
                                <p className="text-[11px] font-semibold text-slate-800 truncate">{t.Issue_Description}</p>
                                <p className="text-[9px] text-slate-400">{t.Category} • {t.Reported_Date}</p>
                              </div>
                              <span className="rounded px-1.5 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-800">
                                {t.Status}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-[10px] text-slate-400 py-1">No active maintenance tickets</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Mobile Pay Screen */}
                  {mobileTab === 'pay' && (
                    <div className="space-y-3 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-800">Consolidated Contra Checkout</h4>
                        <button onClick={() => setMobileTab('home')} className="text-[10px] font-bold text-red-700">
                          ← Back
                        </button>
                      </div>

                      {paySuccess ? (
                        <div className="p-6 text-center space-y-2 bg-white rounded-2xl border border-emerald-300">
                          <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                            <CheckCircle2 className="h-6 w-6" />
                          </div>
                          <p className="text-xs font-bold text-slate-900">Payment Successful!</p>
                          <p className="text-[10px] text-slate-500">
                            Google Mail e-receipt sent to {currentTenant.Email}
                          </p>
                        </div>
                      ) : (
                        <div className="rounded-2xl bg-white p-3.5 border border-slate-200 space-y-3">
                          <div className="space-y-1.5 pb-2 border-b border-slate-100">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-slate-500">Rent Balance:</span>
                              <span className="font-bold text-slate-900">{formatCurrency(totalRentDue)}</span>
                            </div>
                            <div className="flex justify-between text-[11px]">
                              <span className="text-slate-500">Utility Recovery:</span>
                              <span className="font-bold text-slate-900">{formatCurrency(totalUtilDue)}</span>
                            </div>
                            <div className="flex justify-between text-xs font-extrabold pt-1 border-t border-slate-100">
                              <span className="text-red-900">Total Payable:</span>
                              <span className="text-red-900">{formatCurrency(grandTotalDue)}</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-600">Instant Payment Gateway</label>
                            <div className="p-2.5 rounded-lg border border-red-200 bg-red-50/50 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-red-700" />
                                <span className="text-xs font-bold text-slate-800">Muthoot NetBanking / UPI</span>
                              </div>
                              <span className="text-[9px] font-bold text-emerald-700">0% Fee</span>
                            </div>
                          </div>

                          <button
                            onClick={handleQuickPayAll}
                            disabled={grandTotalDue <= 0}
                            className="w-full rounded-xl bg-red-700 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-red-800 disabled:opacity-50"
                          >
                            Pay {formatCurrency(grandTotalDue)} Now
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mobile Maintenance Screen */}
                  {mobileTab === 'maintenance' && (
                    <div className="space-y-3 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-800">New Service Ticket</h4>
                        <button onClick={() => setMobileTab('home')} className="text-[10px] font-bold text-red-700">
                          ← Back
                        </button>
                      </div>

                      {ticketSubmitted ? (
                        <div className="p-5 text-center bg-white rounded-2xl border border-emerald-300 space-y-1.5">
                          <CheckCircle2 className="h-7 w-7 text-emerald-600 mx-auto" />
                          <p className="text-xs font-bold">Ticket Logged!</p>
                          <p className="text-[9px] text-slate-500">Muthoot Tech assigned to visit</p>
                        </div>
                      ) : (
                        <form onSubmit={handleMobileSubmitWorkOrder} className="rounded-2xl bg-white p-3.5 border border-slate-200 space-y-2.5">
                          <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-1">Issue Category</label>
                            <select
                              value={ticketCategory}
                              onChange={(e) => setTicketCategory(e.target.value as any)}
                              className="w-full rounded-lg border border-slate-300 p-1.5 text-xs"
                            >
                              <option value="Plumbing">Plumbing / Leak</option>
                              <option value="Electrical">Electrical / Light</option>
                              <option value="HVAC">AC / Heating</option>
                              <option value="Structural">Carpentry / Door</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-1">Describe Issue</label>
                            <textarea
                              rows={2}
                              required
                              placeholder="e.g. Master bathroom faucet dripping"
                              value={ticketIssue}
                              onChange={(e) => setTicketIssue(e.target.value)}
                              className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                            />
                          </div>

                          <div className="p-2.5 rounded-lg border border-dashed border-slate-300 flex items-center justify-center gap-2 text-slate-500">
                            <Camera className="h-4 w-4 text-red-700" />
                            <span className="text-[10px] font-semibold">Tap to Attach Photo / Video</span>
                          </div>

                          <button
                            type="submit"
                            className="w-full rounded-xl bg-red-700 py-2 text-xs font-bold text-white shadow-xs"
                          >
                            Submit Work Order
                          </button>
                        </form>
                      )}
                    </div>
                  )}

                  {/* Mobile Inbox Screen */}
                  {mobileTab === 'inbox' && (
                    <div className="space-y-2 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-800">Google Mail Communications</h4>
                        <button onClick={() => setMobileTab('home')} className="text-[10px] font-bold text-red-700">
                          ← Back
                        </button>
                      </div>

                      <div className="space-y-2">
                        {tenantMails.map((m) => (
                          <div key={m.Message_ID} className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-red-100 text-red-800">
                                {m.Subject.split(':')[0]}
                              </span>
                              <span className="text-[8px] text-slate-400">{m.Date}</span>
                            </div>
                            <p className="text-[11px] font-bold text-slate-900 truncate">{m.Subject}</p>
                            <p className="text-[9px] text-slate-500 line-clamp-2">{m.Body_HTML}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Field Operations Mode */
                <div className="space-y-3 animate-in fade-in">
                  <div className="rounded-xl bg-slate-900 text-white p-3">
                    <p className="text-[9px] uppercase text-slate-400">Muthoot Field Tech Mode</p>
                    <h3 className="text-xs font-bold">Assigned Tickets ({workOrders.length})</h3>
                  </div>

                  <div className="space-y-2">
                    {workOrders.map((wo) => (
                      <div key={wo.Ticket_ID} className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-900">{wo.Ticket_ID}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            wo.Status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {wo.Status}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-700">{wo.Issue_Description}</p>
                        {wo.Status !== 'Completed' && (
                          <button
                            onClick={() => updateWorkOrderStatus(wo.Ticket_ID, 'Completed')}
                            className="w-full rounded bg-emerald-600 py-1 text-[10px] font-bold text-white"
                          >
                            Mark Completed & Close
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Bottom Navigation Bar */}
            {activePersona === 'tenant' && (
              <div className="h-12 bg-white border-t border-slate-200 flex items-center justify-around px-2 z-20">
                <button
                  onClick={() => setMobileTab('home')}
                  className={`flex flex-col items-center gap-0.5 ${mobileTab === 'home' ? 'text-red-700' : 'text-slate-400'}`}
                >
                  <Building className="h-4 w-4" />
                  <span className="text-[8px] font-bold">Home</span>
                </button>
                <button
                  onClick={() => setMobileTab('pay')}
                  className={`flex flex-col items-center gap-0.5 ${mobileTab === 'pay' ? 'text-red-700' : 'text-slate-400'}`}
                >
                  <CreditCard className="h-4 w-4" />
                  <span className="text-[8px] font-bold">Pay</span>
                </button>
                <button
                  onClick={() => setMobileTab('maintenance')}
                  className={`flex flex-col items-center gap-0.5 ${mobileTab === 'maintenance' ? 'text-red-700' : 'text-slate-400'}`}
                >
                  <Wrench className="h-4 w-4" />
                  <span className="text-[8px] font-bold">Repairs</span>
                </button>
                <button
                  onClick={() => setMobileTab('inbox')}
                  className={`flex flex-col items-center gap-0.5 ${mobileTab === 'inbox' ? 'text-red-700' : 'text-slate-400'}`}
                >
                  <Bell className="h-4 w-4" />
                  <span className="text-[8px] font-bold">Inbox</span>
                </button>
              </div>
            )}

            {/* Bottom Home Indicator Bar */}
            <div className="pb-1.5 pt-0.5 flex justify-center bg-white">
              <div className="h-1 w-24 bg-slate-300 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
