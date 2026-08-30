import React, { useState, useMemo } from 'react';
import {
  CalendarDays,
  Clock,
  AlertTriangle,
  FileSignature,
  Receipt,
  Zap,
  Wrench,
  CheckCircle2,
  Filter,
  Search,
  ArrowRight,
  Sparkles,
  Building2,
  User,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Plus,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';

type EventType = 'all' | 'lease_expiry' | 'rent_overdue' | 'utility_due' | 'maintenance' | 'deposit_settlement';

export const UpcomingEventsView: React.FC = () => {
  const {
    leases,
    rentTransactions,
    utilityBills,
    workOrders,
    properties,
    units,
    tenants,
    landlords,
    formatCurrency,
    setActiveView,
    sendRenewalProposal,
  } = useERP();

  const [selectedType, setSelectedType] = useState<EventType>('all');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [timeWindowDays, setTimeWindowDays] = useState<number>(90);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const notifySuccess = (msg: string) => {
    setActionSuccessMessage(msg);
    setTimeout(() => setActionSuccessMessage(null), 4000);
  };

  const currentDate = new Date('2026-08-30');

  // 1. Compile Lease Expiry Events
  const leaseEvents = useMemo(() => {
    return leases
      .filter((l) => l.Status === 'Active' || l.Status === 'Pending Renewal')
      .map((l) => {
        const endDate = new Date(l.Lease_End);
        const daysLeft = Math.ceil((endDate.getTime() - currentDate.getTime()) / 86400000);
        const prop = properties.find((p) => p.Property_ID === l.Property_ID);
        const unit = units.find((u) => u.Unit_ID === l.Unit_ID);
        const tenant = tenants.find((t) => t.Tenant_ID === l.Tenant_ID);

        let urgency: 'critical' | 'high' | 'medium' | 'low' = 'low';
        if (daysLeft <= 15) urgency = 'critical';
        else if (daysLeft <= 30) urgency = 'high';
        else if (daysLeft <= 60) urgency = 'medium';

        return {
          id: `lease-${l.Lease_ID}`,
          rawId: l.Lease_ID,
          type: 'lease_expiry' as const,
          title: `Lease Expiration — Unit ${unit?.Unit_Number_Name || l.Unit_ID}`,
          date: l.Lease_End,
          daysRemaining: daysLeft,
          urgency,
          propertyName: prop?.Property_Name || 'Unknown Property',
          propertyId: l.Property_ID,
          tenantName: tenant?.Full_Name || 'Unknown Tenant',
          tenantEmail: tenant?.Email,
          amount: l.Monthly_Rent,
          statusText: l.Status === 'Pending Renewal' ? 'Renewal Proposal Sent' : `${daysLeft} days to expiry`,
          actionLabel: l.Status === 'Pending Renewal' ? 'View Agreement' : 'Send Renewal Offer (CAD)',
          targetView: 'leases' as const,
        };
      })
      .filter((e) => e.daysRemaining >= -10 && e.daysRemaining <= timeWindowDays);
  }, [leases, properties, units, tenants, timeWindowDays]);

  // 2. Compile Rent Payment Overdues & Milestones
  const rentEvents = useMemo(() => {
    return rentTransactions
      .filter((r) => r.Status === 'Overdue' || (r.Status === 'Partial' && new Date(r.Due_Date) < currentDate))
      .map((r) => {
        const dueDate = new Date(r.Due_Date);
        const daysOverdue = Math.ceil((currentDate.getTime() - dueDate.getTime()) / 86400000);
        const prop = properties.find((p) => p.Property_ID === r.Property_ID);
        const unit = units.find((u) => u.Unit_ID === r.Unit_ID);
        const tenant = tenants.find((t) => t.Tenant_ID === r.Tenant_ID);

        let urgency: 'critical' | 'high' | 'medium' | 'low' = 'medium';
        if (daysOverdue >= 30) urgency = 'critical';
        else if (daysOverdue >= 15) urgency = 'high';

        return {
          id: `rent-${r.Rent_Txn_ID}`,
          rawId: r.Rent_Txn_ID,
          type: 'rent_overdue' as const,
          title: `Rent Arrears Overdue — Unit ${unit?.Unit_Number_Name || r.Unit_ID}`,
          date: r.Due_Date,
          daysRemaining: -daysOverdue,
          urgency,
          propertyName: prop?.Property_Name || 'Unknown Property',
          propertyId: r.Property_ID,
          tenantName: tenant?.Full_Name || 'Unknown Tenant',
          tenantEmail: tenant?.Email,
          amount: r.Balance,
          statusText: `${daysOverdue} days past due`,
          actionLabel: 'Record Collection',
          targetView: 'billing' as const,
        };
      });
  }, [rentTransactions, properties, units, tenants]);

  // 3. Compile Master Utility Bill Payment Deadlines
  const utilityEvents = useMemo(() => {
    return utilityBills
      .filter((u) => u.Status === 'Open' || u.Status === 'Pending')
      .map((u) => {
        const dueDate = new Date(u.Due_Date);
        const daysLeft = Math.ceil((dueDate.getTime() - currentDate.getTime()) / 86400000);
        const prop = properties.find((p) => p.Property_ID === u.Property_ID);

        let urgency: 'critical' | 'high' | 'medium' | 'low' = 'low';
        if (daysLeft <= 3) urgency = 'critical';
        else if (daysLeft <= 10) urgency = 'high';
        else if (daysLeft <= 20) urgency = 'medium';

        return {
          id: `utility-${u.Utility_Bill_ID}`,
          rawId: u.Utility_Bill_ID,
          type: 'utility_due' as const,
          title: `Utility Bill Payment Due — ${u.Provider_Name} (${u.Utility_Type})`,
          date: u.Due_Date,
          daysRemaining: daysLeft,
          urgency,
          propertyName: prop?.Property_Name || 'Building Master Account',
          propertyId: u.Property_ID,
          tenantName: `Vendor: ${u.Provider_Name}`,
          tenantEmail: `Ref: ${u.Invoice_Number}`,
          amount: u.Total_Amount,
          statusText: daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days until due`,
          actionLabel: 'Review & Allocate',
          targetView: 'utilities' as const,
        };
      });
  }, [utilityBills, properties]);

  // 4. Compile Urgent Facility Repairs & Inspections
  const maintenanceEvents = useMemo(() => {
    return workOrders
      .filter((w) => w.Status !== 'Completed' && w.Status !== 'Cancelled')
      .map((w) => {
        const prop = properties.find((p) => p.Property_ID === w.Property_ID);
        const unit = units.find((u) => u.Unit_ID === w.Unit_ID);

        let urgency: 'critical' | 'high' | 'medium' | 'low' = 'low';
        if (w.Priority === 'Emergency') urgency = 'critical';
        else if (w.Priority === 'High') urgency = 'high';
        else urgency = 'medium';

        return {
          id: `work-${w.Ticket_ID}`,
          rawId: w.Ticket_ID,
          type: 'maintenance' as const,
          title: `Work Order: ${w.Title}`,
          date: w.Scheduled_Date || w.Created_At.split('T')[0],
          daysRemaining: w.Scheduled_Date ? Math.ceil((new Date(w.Scheduled_Date).getTime() - currentDate.getTime()) / 86400000) : 0,
          urgency,
          propertyName: prop?.Property_Name || 'Property Facility',
          propertyId: w.Property_ID,
          tenantName: `Unit ${unit?.Unit_Number_Name || 'Common Area'}`,
          tenantEmail: `Vendor: ${w.Assigned_Vendor || 'Unassigned'}`,
          amount: w.Estimated_Cost || 0,
          statusText: `Priority: ${w.Priority} • ${w.Status}`,
          actionLabel: 'Manage Ticket',
          targetView: 'maintenance' as const,
        };
      });
  }, [workOrders, properties, units]);

  // Merge and Filter all events
  const allEvents = useMemo(() => {
    let combined = [...leaseEvents, ...rentEvents, ...utilityEvents, ...maintenanceEvents];

    if (selectedType !== 'all') {
      combined = combined.filter((e) => e.type === selectedType);
    }

    if (selectedPropertyId !== 'all') {
      combined = combined.filter((e) => e.propertyId === selectedPropertyId);
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      combined = combined.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.propertyName.toLowerCase().includes(q) ||
          e.tenantName.toLowerCase().includes(q)
      );
    }

    // Sort by daysRemaining ascending (most urgent first)
    return combined.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [leaseEvents, rentEvents, utilityEvents, maintenanceEvents, selectedType, selectedPropertyId, searchTerm]);

  // Aggregate stats
  const totalCritical = allEvents.filter((e) => e.urgency === 'critical').length;
  const totalHigh = allEvents.filter((e) => e.urgency === 'high').length;
  const totalActionableAmount = allEvents.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Upcoming Schedule & Operational Deadlines
              </h1>
              <p className="text-xs text-slate-500">
                Track lease expirations, overdue rent collections, master utility bills, and facility work orders
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('leases')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-2xs"
          >
            <FileSignature className="h-4 w-4" />
            <span>Manage All Leases</span>
          </button>
        </div>
      </div>

      {actionSuccessMessage && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4.5 rounded-xl border border-rose-200 bg-rose-50/60 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-xs font-bold text-rose-800 uppercase tracking-wider">Critical Immediate Actions</p>
            <p className="text-2xl font-black text-rose-950 mt-1">{totalCritical}</p>
            <p className="text-[11px] text-rose-700 mt-0.5">&le; 15 days or severe arrears</p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-rose-200/80 flex items-center justify-center text-rose-800">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4.5 rounded-xl border border-amber-200 bg-amber-50/60 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Expiring Leases (60 Days)</p>
            <p className="text-2xl font-black text-amber-950 mt-1">{leaseEvents.length}</p>
            <p className="text-[11px] text-amber-700 mt-0.5">Ontario & BC renewal window</p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-amber-200/80 flex items-center justify-center text-amber-800">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4.5 rounded-xl border border-sky-200 bg-sky-50/60 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-xs font-bold text-sky-800 uppercase tracking-wider">Master Utility Bills Due</p>
            <p className="text-2xl font-black text-sky-950 mt-1">{utilityEvents.length}</p>
            <p className="text-[11px] text-sky-700 mt-0.5">Hydro, Gas & City Water</p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-sky-200/80 flex items-center justify-center text-sky-800">
            <Zap className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Value at Stake</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(totalActionableAmount)}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Monthly volume involved</p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <Building2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Event Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200/80">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                selectedType === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Events ({allEvents.length})
            </button>
            <button
              onClick={() => setSelectedType('lease_expiry')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                selectedType === 'lease_expiry'
                  ? 'bg-white text-amber-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSignature className="h-3.5 w-3.5 text-amber-600" />
              <span>Lease Expiries ({leaseEvents.length})</span>
            </button>
            <button
              onClick={() => setSelectedType('rent_overdue')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                selectedType === 'rent_overdue'
                  ? 'bg-white text-rose-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Receipt className="h-3.5 w-3.5 text-rose-600" />
              <span>Rent Overdue ({rentEvents.length})</span>
            </button>
            <button
              onClick={() => setSelectedType('utility_due')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                selectedType === 'utility_due'
                  ? 'bg-white text-sky-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Zap className="h-3.5 w-3.5 text-sky-600" />
              <span>Utility Bills ({utilityEvents.length})</span>
            </button>
            <button
              onClick={() => setSelectedType('maintenance')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                selectedType === 'maintenance'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Wrench className="h-3.5 w-3.5 text-slate-600" />
              <span>Repairs ({maintenanceEvents.length})</span>
            </button>
          </div>

          {/* Property Selector */}
          <div className="flex items-center gap-2 ml-auto">
            <select
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="all">All Canadian Properties</option>
              {properties.map((p) => (
                <option key={p.Property_ID} value={p.Property_ID}>
                  {p.Property_Name}
                </option>
              ))}
            </select>

            <select
              value={timeWindowDays}
              onChange={(e) => setTimeWindowDays(Number(e.target.value))}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value={30}>Next 30 Days</option>
              <option value={60}>Next 60 Days</option>
              <option value={90}>Next 90 Days</option>
              <option value={180}>Next 6 Months</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search upcoming tasks, tenant names, building addresses or unit numbers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
          />
        </div>
      </div>

      {/* Events Timeline / Action Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-900">Upcoming Actionable Schedule</h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Showing {allEvents.length} scheduled items
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {allEvents.map((evt) => {
            const isCritical = evt.urgency === 'critical';
            const isHigh = evt.urgency === 'high';

            return (
              <div
                key={evt.id}
                className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors hover:bg-slate-50/80 ${
                  isCritical ? 'bg-rose-50/20' : isHigh ? 'bg-amber-50/20' : ''
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl shrink-0 ${
                      evt.type === 'lease_expiry'
                        ? 'bg-amber-100 text-amber-800'
                        : evt.type === 'rent_overdue'
                        ? 'bg-rose-100 text-rose-800'
                        : evt.type === 'utility_due'
                        ? 'bg-sky-100 text-sky-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {evt.type === 'lease_expiry' && <FileSignature className="h-4 w-4" />}
                    {evt.type === 'rent_overdue' && <Receipt className="h-4 w-4" />}
                    {evt.type === 'utility_due' && <Zap className="h-4 w-4" />}
                    {evt.type === 'maintenance' && <Wrench className="h-4 w-4" />}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{evt.title}</h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          isCritical
                            ? 'bg-rose-100 text-rose-800 border-rose-200'
                            : isHigh
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {evt.statusText}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500">
                      <span className="font-medium text-slate-700">{evt.propertyName}</span>
                      <span>•</span>
                      <span>{evt.tenantName}</span>
                      {evt.tenantEmail && (
                        <>
                          <span>•</span>
                          <span className="text-slate-400">{evt.tenantEmail}</span>
                        </>
                      )}
                      <span>•</span>
                      <span className="text-slate-600">Date: {evt.date}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="text-left md:text-right">
                    <p className="text-xs font-bold text-slate-900">{formatCurrency(evt.amount)}</p>
                    <p className="text-[10px] text-slate-400">
                      {evt.type === 'lease_expiry' ? 'Monthly Contract Rent' : 'Balance / Invoice'}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if (evt.type === 'lease_expiry') {
                        setActiveView('leases');
                      } else if (evt.type === 'rent_overdue') {
                        setActiveView('billing');
                      } else if (evt.type === 'utility_due') {
                        setActiveView('utilities');
                      } else {
                        setActiveView('maintenance');
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      isCritical
                        ? 'bg-rose-600 text-white border-rose-700 hover:bg-rose-700 shadow-2xs'
                        : 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800 shadow-2xs'
                    }`}
                  >
                    <span>{evt.actionLabel}</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}

          {allEvents.length === 0 && (
            <div className="p-12 text-center text-slate-400">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-bold text-slate-800">All Schedules & Clearances Up to Date</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                There are no upcoming lease expiries, overdue invoices, or pending utility bills for the selected filters.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
