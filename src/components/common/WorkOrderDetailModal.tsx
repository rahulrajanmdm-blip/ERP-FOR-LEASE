import React, { useState } from 'react';
import { X, Wrench, Calendar, User, Building2, CheckCircle2, Clock, AlertTriangle, DollarSign, Star } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { WorkOrder } from '../../types';

interface WorkOrderDetailModalProps {
  workOrder: WorkOrder | null;
  onClose: () => void;
}

export const WorkOrderDetailModal: React.FC<WorkOrderDetailModalProps> = ({ workOrder, onClose }) => {
  const {
    getProperty,
    getUnit,
    getTenant,
    formatCurrency,
    updateWorkOrderStatus,
    assignVendorToWorkOrder,
  } = useERP();

  const [status, setStatus] = useState<WorkOrder['Status']>(workOrder?.Status || 'New');
  const [vendorName, setVendorName] = useState(workOrder?.Assigned_Vendor_Name || '');
  const [scheduledDate, setScheduledDate] = useState(workOrder?.Scheduled_Date || '');
  const [estimatedCost, setEstimatedCost] = useState(workOrder?.Estimated_Cost || 0);
  const [actualCost, setActualCost] = useState(workOrder?.Actual_Cost || 0);
  const [technicianNotes, setTechnicianNotes] = useState(workOrder?.Technician_Notes || '');
  const [rating, setRating] = useState(workOrder?.Tenant_Feedback_Rating || 5);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!workOrder) return null;

  const property = getProperty(workOrder.Property_ID);
  const unit = getUnit(workOrder.Unit_ID);
  const tenant = workOrder.Tenant_ID ? getTenant(workOrder.Tenant_ID) : null;

  const priorityColors = {
    Emergency: 'bg-red-500/20 text-red-400 border-red-500/30',
    High: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    Medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    Low: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (vendorName !== workOrder.Assigned_Vendor_Name || scheduledDate !== workOrder.Scheduled_Date) {
      assignVendorToWorkOrder(workOrder.Ticket_ID, vendorName, scheduledDate, estimatedCost);
    }
    updateWorkOrderStatus(workOrder.Ticket_ID, status, actualCost, technicianNotes, status === 'Completed' ? rating : undefined);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">{workOrder.Title}</h3>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${priorityColors[workOrder.Priority]}`}>
                  {workOrder.Priority}
                </span>
              </div>
              <p className="text-xs text-slate-400">Ticket #{workOrder.Ticket_ID} · Logged {workOrder.Created_At.slice(0, 10)}</p>
            </div>
          </div>

          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5 text-slate-200">
          {/* Property & Tenant summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl bg-slate-800/40 p-3.5 border border-slate-700/60 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Location</span>
              <p className="font-bold text-white">{property?.Property_Name} — {unit?.Unit_Number_Name}</p>
              <p className="text-slate-400">{property?.Address}</p>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Reported By</span>
              <p className="font-bold text-white">{tenant?.Full_Name || workOrder.Created_By}</p>
              {tenant && <p className="text-slate-400">{tenant.Phone} · {tenant.Email}</p>}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Issue Description</label>
            <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-3.5 text-xs leading-relaxed text-slate-200">
              {workOrder.Description}
            </div>
          </div>

          {/* Status & Priority Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Workflow Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="New">New / Unassigned</option>
                <option value="Assigned">Assigned to Technician/Vendor</option>
                <option value="In Progress">In Progress / Work Underway</option>
                <option value="Awaiting Parts">Awaiting Parts / Quote</option>
                <option value="Completed">Completed & Verified</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Category</label>
              <div className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs text-slate-300">
                {workOrder.Category}
              </div>
            </div>
          </div>

          {/* Vendor Assignment & Costs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Assigned Vendor / Tech</label>
              <input
                type="text"
                placeholder="e.g. Apex Plumbing Ltd."
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Scheduled Date</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Estimated Cost</label>
              <input
                type="number"
                step="0.01"
                value={estimatedCost || ''}
                onChange={(e) => setEstimatedCost(parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Actual Cost & Completion Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Actual Invoiced Cost ($)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={actualCost || ''}
                onChange={(e) => setActualCost(parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">If completed, automatically posts to double-entry general ledger repairs expense (Account 5020).</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Chargeable Allocation</label>
              <div className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs text-slate-300">
                {workOrder.Cost_Chargeable_To}
              </div>
            </div>
          </div>

          {/* Technician Completion Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Technician / Inspection Notes</label>
            <textarea
              rows={2}
              placeholder="Parts replaced, scope of work completed, follow-up recommended..."
              value={technicianNotes}
              onChange={(e) => setTechnicianNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Tenant Satisfaction Rating (if Completed) */}
          {status === 'Completed' && (
            <div className="flex items-center gap-3 rounded-xl bg-slate-800/40 p-3 border border-slate-700/60">
              <span className="text-xs font-semibold text-slate-300">Resident Feedback Rating:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 text-amber-400 hover:scale-110 transition-transform"
                  >
                    <Star className={`h-4 w-4 ${star <= rating ? 'fill-amber-400' : 'text-slate-600'}`} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between border-t border-slate-800 pt-4">
            {savedSuccess ? (
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /> Changes saved successfully!
              </span>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                Close
              </button>
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all"
              >
                Save & Update Work Order
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
