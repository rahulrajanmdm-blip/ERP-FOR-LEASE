import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Building2,
  Users,
  AlertTriangle,
  Clock,
  Wrench,
  Receipt,
  FileSignature,
  Calendar,
  CheckCircle2,
  ArrowUpRight,
  ShieldAlert,
  Zap,
  Sparkles,
  CreditCard,
  Mail,
  Shield,
  Smartphone,
  Layers,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { StatsCard } from '../common/StatsCard';
import { ContraPaymentModal } from '../common/ContraPaymentModal';

export const DashboardView: React.FC = () => {
  const {
    properties,
    units,
    tenants,
    leases,
    rentTransactions,
    workOrders,
    utilitiesMaster,
    googleMails,
    formatCurrency,
    setActiveView,
    generateMonthlyRentBatch,
    applyLateFeesToOverdue,
    currentMonth,
    hasPermission,
    setIsMobileSimulatorOpen,
  } = useERP();

  const [isContraModalOpen, setIsContraModalOpen] = useState(false);

  // Calculations
  const totalBilled = rentTransactions.reduce((acc, r) => acc + r.Amount_Billed, 0);
  const totalCollected = rentTransactions.reduce((acc, r) => acc + r.Amount_Paid, 0);
  const totalReceivables = rentTransactions.reduce((acc, r) => acc + r.Balance, 0);

  const activeUnits = units.filter((u) => u.Current_Status !== 'Turnover');
  const occupiedUnits = units.filter((u) => u.Current_Status === 'Occupied');
  const occupancyRate = activeUnits.length > 0 ? (occupiedUnits.length / units.length) * 100 : 0;

  // Monthly breakdown for trend
  const currentMonthInvoices = rentTransactions.filter((r) => r.Period_Month === currentMonth);
  const currentMonthBilled = currentMonthInvoices.reduce((acc, r) => acc + r.Amount_Billed, 0);
  const currentMonthCollected = currentMonthInvoices.reduce((acc, r) => acc + r.Amount_Paid, 0);
  const currentMonthCollectionRate = currentMonthBilled > 0 ? Math.round((currentMonthCollected / currentMonthBilled) * 100) : 100;

  // Alerts
  const expiringLeases = leases.filter((l) => {
    if (l.Status !== 'Active' && l.Status !== 'Pending Renewal') return false;
    const days = Math.ceil((new Date(l.Lease_End).getTime() - new Date('2026-08-30').getTime()) / 86400000);
    return days >= 0 && days <= 60;
  });

  const overdueInvoices = rentTransactions.filter((r) => r.Status === 'Overdue');
  const urgentTickets = workOrders.filter((w) => (w.Priority === 'Emergency' || w.Priority === 'High') && w.Status !== 'Completed');

  const handleRunBatchBilling = () => {
    const result = generateMonthlyRentBatch(currentMonth);
    if (result.created > 0) {
      alert(`Successfully generated ${result.created} invoices totaling ${formatCurrency(result.totalAmount)} for ${currentMonth}.`);
    } else {
      alert(`All active leases for ${currentMonth} are already billed.`);
    }
  };

  const handleApplyLateFees = () => {
    const assessed = applyLateFeesToOverdue();
    if (assessed > 0) {
      alert(`Late fees applied to ${assessed} overdue invoices.`);
    } else {
      alert('No eligible overdue accounts without late fees found.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl bg-white p-6 border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-700 text-white shadow-2xs font-extrabold">
              D
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 font-heading">
                Dream Dwell Property Dashboard
              </h1>
              <p className="text-xs text-slate-500">
                Real-time portfolio metrics, lease expiration tracking, Canadian rent invoicing & payment entries
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasPermission('Can_Record_Contra_Payment') && (
            <button
              onClick={() => setIsContraModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-red-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-red-800 transition-all shadow-xs"
            >
              <CreditCard className="h-4 w-4" />
              <span>Record Payment Entry</span>
            </button>
          )}

          <button
            onClick={() => setActiveView('communications')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all"
          >
            <Mail className="h-3.5 w-3.5 text-red-700" />
            <span>Communications</span>
          </button>

          <button
            onClick={() => setIsMobileSimulatorOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all"
          >
            <Smartphone className="h-3.5 w-3.5 text-red-700" />
            <span>Mobile Simulator</span>
          </button>

          <button
            onClick={handleRunBatchBilling}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-100 hover:bg-slate-200 px-3 py-2 text-xs font-bold text-slate-800 transition-all"
          >
            <Receipt className="h-3.5 w-3.5 text-slate-600" />
            <span>Generate Invoices</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Collections Received"
          value={formatCurrency(totalCollected)}
          subtitle={`${currentMonthCollectionRate}% collection rate this cycle`}
          icon={DollarSign}
          colorScheme="emerald"
          trend={{ value: '+4.2%', isPositive: true }}
          onClick={() => setActiveView('billing')}
        />

        <StatsCard
          title="Outstanding Receivables"
          value={formatCurrency(totalReceivables)}
          subtitle={`${overdueInvoices.length} overdue accounts pending`}
          icon={Receipt}
          colorScheme={totalReceivables > 0 ? 'rose' : 'emerald'}
          trend={{ value: '-12.5%', isPositive: true }}
          onClick={() => setActiveView('billing')}
        />

        <StatsCard
          title="Portfolio Occupancy"
          value={`${Math.round(occupancyRate)}%`}
          subtitle={`${occupiedUnits.length} of ${units.length} total units occupied`}
          icon={Building2}
          colorScheme="indigo"
          trend={{ value: 'Stable', isNeutral: true }}
          onClick={() => setActiveView('units')}
        />

        <StatsCard
          title="Active Maintenance"
          value={workOrders.filter((w) => w.Status !== 'Completed' && w.Status !== 'Cancelled').length}
          subtitle={`${urgentTickets.length} emergency / high priority tickets`}
          icon={Wrench}
          colorScheme="amber"
          onClick={() => setActiveView('maintenance')}
        />
      </div>

      {/* Action Radar: Expiring Leases, Overdue Balances, Urgent Maintenance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Expiring Leases Alert Box */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              <h3 className="font-bold text-slate-900 text-sm">Lease Expirations (Next 60 Days)</h3>
            </div>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-300">
              {expiringLeases.length} Action Needed
            </span>
          </div>

          <div className="space-y-2.5">
            {expiringLeases.map((l) => {
              const tenant = tenants.find((t) => t.Tenant_ID === l.Tenant_ID);
              const days = Math.ceil((new Date(l.Lease_End).getTime() - new Date('2026-08-30').getTime()) / 86400000);
              return (
                <div
                  key={l.Lease_ID}
                  onClick={() => setActiveView('leases')}
                  className="group flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/50 p-3 text-xs transition-all hover:border-amber-400 hover:bg-amber-50/30 cursor-pointer"
                >
                  <div>
                    <p className="font-bold text-slate-900 group-hover:text-amber-900 transition-colors">
                      {tenant?.Full_Name || l.Tenant_ID}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Suite {units.find((u) => u.Unit_ID === l.Unit_ID)?.Unit_Number_Name} · Ends {l.Lease_End}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-amber-800">{days} days left</span>
                    <span className="block text-[10px] text-red-700 group-hover:underline">Review & Renew →</span>
                  </div>
                </div>
              );
            })}

            {expiringLeases.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-4">No leases expiring in the next 60 days.</p>
            )}
          </div>
        </div>

        {/* Overdue Rents Alert Box */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <h3 className="font-bold text-slate-900 text-sm">Overdue Tenant Invoices</h3>
            </div>
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800 border border-red-300">
              {overdueInvoices.length} Delinquent
            </span>
          </div>

          <div className="space-y-2.5">
            {overdueInvoices.map((inv) => {
              const tenant = tenants.find((t) => t.Tenant_ID === inv.Tenant_ID);
              return (
                <div
                  key={inv.Rent_Txn_ID}
                  onClick={() => setActiveView('billing')}
                  className="group flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/50 p-3 text-xs transition-all hover:border-red-300 hover:bg-red-50/30 cursor-pointer"
                >
                  <div>
                    <p className="font-bold text-slate-900 group-hover:text-red-900 transition-colors">
                      {tenant?.Full_Name || inv.Tenant_ID}
                    </p>
                    <p className="text-[11px] text-slate-500">Due {inv.Due_Date} · Late Fee ${inv.Late_Fee_Applied}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-red-700">{formatCurrency(inv.Balance)}</span>
                    <span className="block text-[10px] text-red-700 group-hover:underline">Collect Payment →</span>
                  </div>
                </div>
              );
            })}

            {overdueInvoices.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-4">All rent accounts are current!</p>
            )}
          </div>
        </div>

        {/* Urgent Maintenance Tickets Box */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-red-700" />
              <h3 className="font-bold text-slate-900 text-sm">Urgent Facility Repairs</h3>
            </div>
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800 border border-red-300">
              {urgentTickets.length} Priority
            </span>
          </div>

          <div className="space-y-2.5">
            {urgentTickets.map((t) => (
              <div
                key={t.Ticket_ID}
                onClick={() => setActiveView('maintenance')}
                className="group flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/50 p-3 text-xs transition-all hover:border-slate-300 hover:bg-slate-50 cursor-pointer"
              >
                <div className="min-w-0 pr-2">
                  <p className="font-bold text-slate-900 truncate">
                    {t.Title}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {units.find((u) => u.Unit_ID === t.Unit_ID)?.Unit_Number_Name} · {t.Category}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                      t.Priority === 'Emergency'
                        ? 'bg-red-100 text-red-800 border-red-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}
                  >
                    {t.Priority}
                  </span>
                  <span className="block text-[10px] text-slate-500 mt-1">{t.Status}</span>
                </div>
              </div>
            ))}

            {urgentTickets.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-4">No open urgent work orders.</p>
            )}
          </div>
        </div>
      </div>

      {/* Buildings Summary & Fast Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Buildings Summary */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Building Portfolio & Unit Occupancy</h3>
            <button
              onClick={() => setActiveView('properties')}
              className="text-xs font-bold text-red-700 hover:underline"
            >
              View Full Portfolio →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {properties.map((prop) => {
              const propUnits = units.filter((u) => u.Property_ID === prop.Property_ID);
              const propOccupied = propUnits.filter((u) => u.Current_Status === 'Occupied').length;
              const propRate = propUnits.length > 0 ? Math.round((propOccupied / propUnits.length) * 100) : 0;
              const propRentRoll = propUnits.reduce((acc, u) => acc + u.Target_Rent, 0);

              return (
                <div key={prop.Property_ID} className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 truncate">{prop.Property_Name}</span>
                    <span className="text-[10px] font-bold text-red-800 bg-red-100 px-2 py-0.5 rounded-md border border-red-200">
                      {prop.City}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Occupancy:</span>
                      <span className="font-bold text-slate-900">{propOccupied} / {propUnits.length} ({propRate}%)</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: `${propRate}%` }} />
                    </div>
                    <div className="flex justify-between text-slate-600 pt-1">
                      <span>Target Rent Roll:</span>
                      <span className="font-bold text-slate-900 font-heading">{formatCurrency(propRentRoll)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Launchpad & RBAC Shortcuts */}
        <div className="rounded-xl border border-red-200 bg-gradient-to-br from-red-50/60 to-white p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-700" />
            <h3 className="font-bold text-slate-900 text-sm">Role-Based Access Control</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Customize user roles, assign or restrict views, configure Google Mail and Contra payment permissions for staff and landlords.
          </p>

          <button
            onClick={() => setActiveView('team_rbac')}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-700 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-red-800 transition-all"
          >
            <Shield className="h-4 w-4" />
            <span>Manage User Roles & Access</span>
          </button>
        </div>
      </div>

      {/* Contra Payment Multi-Split Modal */}
      {isContraModalOpen && (
        <ContraPaymentModal
          isOpen={isContraModalOpen}
          onClose={() => setIsContraModalOpen(false)}
        />
      )}
    </div>
  );
};
