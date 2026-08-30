import React, { useState } from 'react';
import {
  X,
  Zap,
  Plus,
  Edit2,
  Check,
  Building,
  DollarSign,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { UtilityMaster } from '../../types';

interface UtilityCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UtilityCategoryModal: React.FC<UtilityCategoryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { utilitiesMaster, addUtilityCategory, updateUtilityCategory, formatCurrency } = useERP();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Omit<UtilityMaster, 'Utility_ID'>>({
    Utility_Name: '',
    Default_Vendor: '',
    Allocation_Method: 'Sub_Meter',
    Rate_Per_Unit: 0.15,
    Account_Code: '4010',
    Status: 'Active',
  });

  if (!isOpen) return null;

  const handleSaveNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.Utility_Name || !formData.Default_Vendor) return;

    addUtilityCategory(formData);
    setIsCreating(false);
    setFormData({
      Utility_Name: '',
      Default_Vendor: '',
      Allocation_Method: 'Sub_Meter',
      Rate_Per_Unit: 0.15,
      Account_Code: '4010',
      Status: 'Active',
    });
  };

  const handleSaveEdit = (category: UtilityMaster) => {
    updateUtilityCategory(category);
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-700 text-white shadow-xs">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-heading">
                Utility Master Tariff Categories
              </h2>
              <p className="text-xs text-slate-500">
                Configure utility categories, RUBS allocation formulas, and per-unit billing rates
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

        {/* Existing Categories List */}
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Active Utility Tariffs ({utilitiesMaster.length})
            </h3>
            {!isCreating && (
              <button
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-1.5 rounded-lg bg-red-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-800 transition-colors shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add New Tariff</span>
              </button>
            )}
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {utilitiesMaster.map((cat) => {
              const isEditing = editingId === cat.Utility_ID;

              return (
                <div
                  key={cat.Utility_ID}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/60"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{cat.Utility_Name}</span>
                      <span className="rounded bg-red-100 px-1.5 py-0.2 text-[9px] font-bold text-red-800">
                        {cat.Allocation_Method.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Vendor: <strong>{cat.Default_Vendor}</strong> • Rate: <strong>${cat.Rate_Per_Unit || 'N/A'}/unit</strong> • Recovery GL: {cat.Account_Code || '4010'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      {cat.Status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Add New Category Form */}
        {isCreating && (
          <form onSubmit={handleSaveNew} className="mt-5 p-4 rounded-xl border border-red-200 bg-red-50/30 space-y-4">
            <h4 className="text-xs font-bold text-red-900 uppercase">Create New Utility Tariff Category</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Utility Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. High-Speed Commercial Fiber"
                  value={formData.Utility_Name}
                  onChange={(e) => setFormData({ ...formData, Utility_Name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-red-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Default Vendor</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Muthoot Telecom / Airtel Fiber"
                  value={formData.Default_Vendor}
                  onChange={(e) => setFormData({ ...formData, Default_Vendor: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-red-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Allocation Method</label>
                <select
                  value={formData.Allocation_Method}
                  onChange={(e) => setFormData({ ...formData, Allocation_Method: e.target.value as any })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-red-600 focus:outline-none"
                >
                  <option value="Sub_Meter">Sub-Meter (Direct Meter Reading)</option>
                  <option value="RUBS_SqFt">RUBS by Square Footage (Ratio Utility)</option>
                  <option value="Equal_Per_Unit">Equal Split Per Occupied Unit</option>
                  <option value="Per_Occupant">Per Number of Occupants</option>
                  <option value="Fixed_Charge">Fixed Monthly Surcharge</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Rate Per Unit / Fixed ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.Rate_Per_Unit}
                  onChange={(e) => setFormData({ ...formData, Rate_Per_Unit: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-red-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-red-700 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-800 shadow-xs"
              >
                Save Category
              </button>
            </div>
          </form>
        )}

        {/* Modal Close Button */}
        <div className="mt-6 flex justify-end pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-100 hover:bg-slate-200 px-4 py-2 text-xs font-bold text-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
