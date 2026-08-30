import React, { useState } from 'react';
import {
  Wrench,
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  DollarSign,
  User,
  Building,
  Filter,
  Search,
  LayoutGrid,
  List,
  Star,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { WorkOrder } from '../../types';
import { WorkOrderDetailModal } from '../common/WorkOrderDetailModal';

export const MaintenanceView: React.FC = () => {
  const {
    workOrders,
    properties,
    units,
    tenants,
    formatCurrency,
    createWorkOrder,
    currentRole,
    currentUserTenantId,
  } = useERP();

  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<WorkOrder | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Work Order Form State
  const [title, setTitle] = useState('');
  const [propertyId, setPropertyId] = useState(properties[0]?.Property_ID || '');
  const [unitId, setUnitId] = useState(units[0]?.Unit_ID || '');
  const [category, setCategory] = useState<WorkOrder['Category']>('Plumbing');
  const [priority, setPriority] = useState<WorkOrder['Priority']>('Medium');
  const [description, setDescription] = useState('');
  const [estimatedCost, setEstimatedCost] = useState(150);
  const [chargeableTo, setChargeableTo] = useState<WorkOrder['Cost_Chargeable_To']>('Landlord');

  const filteredOrders = workOrders.filter((w) => {
    if (priorityFilter !== 'all' && w.Priority !== priorityFilter) return false;
    if (statusFilter !== 'all' && w.Status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const prop = properties.find((p) => p.Property_ID === w.Property_ID);
      const unit = units.find((u) => u.Unit_ID === w.Unit_ID);
      return (
        w.Title.toLowerCase().includes(q) ||
        w.Description.toLowerCase().includes(q) ||
        w.Ticket_ID.toLowerCase().includes(q) ||
        prop?.Property_Name.toLowerCase().includes(q) ||
        unit?.Unit_Number_Name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const priorityStyles = {
    Emergency: 'bg-red-500/20 text-red-400 border-red-500/30',
    High: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    Medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    Low: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  };

  const statusStyles = {
    New: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    Assigned: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    'In Progress': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'Awaiting Parts': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    Completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    Cancelled: 'bg-slate-700 text-slate-400 border-slate-600',
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createWorkOrder({
      Property_ID: propertyId,
      Unit_ID: unitId,
      Tenant_ID: currentUserTenantId || undefined,
      Category: category,
      Priority: priority,
      Title: title,
      Description: description,
      Estimated_Cost: estimatedCost,
      Cost_Chargeable_To: chargeableTo,
      Created_By: currentRole === 'tenant' ? 'Resident Portal' : 'Property Manager',
    });
    setTitle('');
    setDescription('');
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            Facility Maintenance & Work Order Management
          </h2>
          <p className="text-xs text-slate-400">
            Dispatch technicians, track emergency repairs, schedule vendors, and account for repair costs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-slate-700 bg-slate-800 p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`rounded-lg p-1.5 transition-all ${
                viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Table View"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`rounded-lg p-1.5 transition-all ${
                viewMode === 'kanban' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Kanban Board"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Create Work Order</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-4">
          <span className="text-[10px] uppercase font-bold tracking-wider text-rose-400">Emergency & High</span>
          <p className="text-2xl font-extrabold text-rose-400 mt-1">
            {workOrders.filter((w) => (w.Priority === 'Emergency' || w.Priority === 'High') && w.Status !== 'Completed').length}
          </p>
          <span className="text-xs text-slate-400">Urgent immediate action needed</span>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-4">
          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">In Progress / Active</span>
          <p className="text-2xl font-extrabold text-amber-400 mt-1">
            {workOrders.filter((w) => w.Status === 'In Progress' || w.Status === 'Assigned').length}
          </p>
          <span className="text-xs text-slate-400">Under technician remediation</span>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-4">
          <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400">Awaiting Parts</span>
          <p className="text-2xl font-extrabold text-purple-400 mt-1">
            {workOrders.filter((w) => w.Status === 'Awaiting Parts').length}
          </p>
          <span className="text-xs text-slate-400">Supply quote or delivery pending</span>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-4">
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">Resolved & Closed</span>
          <p className="text-2xl font-extrabold text-emerald-400 mt-1">
            {workOrders.filter((w) => w.Status === 'Completed').length}
          </p>
          <span className="text-xs text-slate-400">Verified & invoiced</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-700/80 bg-slate-800/80 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search tickets, description, building..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-900 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none w-64"
            />
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="Emergency">Emergency</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="New">New</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Awaiting Parts">Awaiting Parts</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <span className="text-xs text-slate-400 font-medium">{filteredOrders.length} tickets matching</span>
      </div>

      {/* Table or Kanban View */}
      {viewMode === 'list' ? (
        <div className="rounded-2xl border border-slate-700/80 bg-slate-800/80 backdrop-blur-sm overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-900/60 text-slate-400 uppercase font-semibold">
                  <th className="px-5 py-3.5">Ticket # & Issue</th>
                  <th className="px-5 py-3.5">Property & Suite</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Priority</th>
                  <th className="px-5 py-3.5">Assigned Tech</th>
                  <th className="px-5 py-3.5">Cost</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 text-slate-300">
                {filteredOrders.map((w) => {
                  const prop = properties.find((p) => p.Property_ID === w.Property_ID);
                  const unit = units.find((u) => u.Unit_ID === w.Unit_ID);

                  return (
                    <tr
                      key={w.Ticket_ID}
                      onClick={() => setSelectedTicket(w)}
                      className="hover:bg-slate-700/30 transition-colors cursor-pointer"
                    >
                      <td className="px-5 py-4">
                        <p className="font-bold text-white text-sm">{w.Title}</p>
                        <p className="font-mono text-[10px] text-slate-400">{w.Ticket_ID} · Logged {w.Created_At.slice(0, 10)}</p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-semibold text-white">{prop?.Property_Name}</p>
                        <p className="text-[10px] text-slate-400">{unit?.Unit_Number_Name}</p>
                      </td>

                      <td className="px-5 py-4 font-medium text-slate-200">
                        {w.Category}
                      </td>

                      <td className="px-5 py-4">
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${priorityStyles[w.Priority]}`}>
                          {w.Priority}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {w.Assigned_Vendor_Name ? (
                          <div>
                            <p className="font-semibold text-white">{w.Assigned_Vendor_Name}</p>
                            <p className="text-[10px] text-slate-400">{w.Scheduled_Date || 'Unscheduled'}</p>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Unassigned</span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {w.Actual_Cost > 0 ? (
                          <p className="font-bold text-emerald-400">{formatCurrency(w.Actual_Cost)}</p>
                        ) : (
                          <p className="text-slate-400 font-medium">Est. {formatCurrency(w.Estimated_Cost)}</p>
                        )}
                        <span className="text-[10px] text-slate-500 block">{w.Cost_Chargeable_To}</span>
                      </td>

                      <td className="px-5 py-4">
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${statusStyles[w.Status]}`}>
                          {w.Status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTicket(w);
                          }}
                          className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                        >
                          Manage Ticket
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                      No maintenance work orders found matching criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Kanban Columns View */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {(['New', 'Assigned', 'In Progress', 'Awaiting Parts', 'Completed'] as WorkOrder['Status'][]).map((col) => {
            const colTickets = filteredOrders.filter((w) => w.Status === col);
            return (
              <div key={col} className="rounded-2xl border border-slate-700 bg-slate-900/60 p-3.5 space-y-3 flex flex-col">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-bold text-xs text-white uppercase">{col}</span>
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-400">
                    {colTickets.length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto">
                  {colTickets.map((t) => (
                    <div
                      key={t.Ticket_ID}
                      onClick={() => setSelectedTicket(t)}
                      className="rounded-xl border border-slate-700/80 bg-slate-800/90 p-3 text-xs space-y-2 hover:border-indigo-500 cursor-pointer shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`rounded-full px-2 py-0.2 text-[9px] font-bold border ${priorityStyles[t.Priority]}`}>
                          {t.Priority}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">#{t.Ticket_ID}</span>
                      </div>

                      <h4 className="font-bold text-white text-xs leading-snug">{t.Title}</h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2">{t.Description}</p>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-700 text-[10px] text-slate-400">
                        <span>{units.find((u) => u.Unit_ID === t.Unit_ID)?.Unit_Number_Name}</span>
                        <span className="font-bold text-emerald-400">{formatCurrency(t.Actual_Cost || t.Estimated_Cost)}</span>
                      </div>
                    </div>
                  ))}

                  {colTickets.length === 0 && (
                    <p className="text-[11px] text-slate-500 text-center py-6">No tickets</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Work Order Detail Modal */}
      {selectedTicket && (
        <WorkOrderDetailModal
          workOrder={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl p-6 space-y-4 animate-in fade-in my-8">
            <h3 className="text-lg font-bold text-white">Log Facility Work Order Ticket</h3>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Issue Title</label>
                <input
                  type="text"
                  placeholder="e.g. Master bathroom faucet dripping"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Building</label>
                  <select
                    value={propertyId}
                    onChange={(e) => setPropertyId(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                  >
                    {properties.map((p) => (
                      <option key={p.Property_ID} value={p.Property_ID}>
                        {p.Property_Name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Unit / Suite</label>
                  <select
                    value={unitId}
                    onChange={(e) => setUnitId(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                  >
                    {units
                      .filter((u) => u.Property_ID === propertyId)
                      .map((u) => (
                        <option key={u.Unit_ID} value={u.Unit_ID}>
                          {u.Unit_Number_Name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                  >
                    <option value="Plumbing">Plumbing</option>
                    <option value="Electrical">Electrical</option>
                    <option value="HVAC">HVAC / Heating / Cooling</option>
                    <option value="Appliance">Appliance</option>
                    <option value="Structural">Structural / Roofing</option>
                    <option value="Pest Control">Pest Control</option>
                    <option value="General">General / Locksmith</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                  >
                    <option value="Emergency">Emergency (Immediate)</option>
                    <option value="High">High (24-48 Hours)</option>
                    <option value="Medium">Medium (3-5 Days)</option>
                    <option value="Low">Low (Scheduled Routine)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Estimated Cost ($)</label>
                  <input
                    type="number"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Charge Allocation</label>
                  <select
                    value={chargeableTo}
                    onChange={(e) => setChargeableTo(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                  >
                    <option value="Landlord">Landlord / Operating Expense</option>
                    <option value="Tenant">Tenant Chargeable (Misuse/Damage)</option>
                    <option value="Shared">Shared</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Detailed Description of Defect</label>
                <textarea
                  rows={3}
                  placeholder="Describe location, symptoms, tenant notes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 font-bold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/30"
                >
                  Create Work Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
