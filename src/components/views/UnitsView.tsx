import React, { useState } from 'react';
import { DoorClosed, Plus, Search, Filter, Building, User, DollarSign, CheckCircle2, Wrench, Edit, Sparkles } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { Unit } from '../../types';

export const UnitsView: React.FC = () => {
  const { units, properties, tenants, leases, formatCurrency, addUnit, updateUnit } = useERP();

  const [selectedProperty, setSelectedProperty] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);

  // Form fields
  const [propertyId, setPropertyId] = useState(properties[0]?.Property_ID || '');
  const [unitNumber, setUnitNumber] = useState('');
  const [unitType, setUnitType] = useState('1BR + Den');
  const [targetRent, setTargetRent] = useState(2000);
  const [status, setStatus] = useState<Unit['Current_Status']>('Vacant');
  const [bedrooms, setBedrooms] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [sqft, setSqft] = useState(700);
  const [floorNumber, setFloorNumber] = useState(1);
  const [amenitiesStr, setAmenitiesStr] = useState('In-suite Laundry, Balcony, Dishwasher');

  const filteredUnits = units.filter((u) => {
    if (selectedProperty !== 'all' && u.Property_ID !== selectedProperty) return false;
    if (selectedStatus !== 'all' && u.Current_Status !== selectedStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const prop = properties.find((p) => p.Property_ID === u.Property_ID);
      return (
        u.Unit_Number_Name.toLowerCase().includes(q) ||
        u.Unit_Type.toLowerCase().includes(q) ||
        prop?.Property_Name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const openAdd = () => {
    setEditingUnit(null);
    setPropertyId(properties[0]?.Property_ID || '');
    setUnitNumber('');
    setUnitType('1BR + Den');
    setTargetRent(2000);
    setStatus('Vacant');
    setBedrooms(1);
    setBathrooms(1);
    setSqft(700);
    setFloorNumber(1);
    setAmenitiesStr('In-suite Laundry, Balcony, Dishwasher');
    setShowModal(true);
  };

  const openEdit = (unit: Unit) => {
    setEditingUnit(unit);
    setPropertyId(unit.Property_ID);
    setUnitNumber(unit.Unit_Number_Name);
    setUnitType(unit.Unit_Type);
    setTargetRent(unit.Target_Rent);
    setStatus(unit.Current_Status);
    setBedrooms(unit.Bedrooms);
    setBathrooms(unit.Bathrooms);
    setSqft(unit.Square_Feet);
    setFloorNumber(unit.Floor_Number);
    setAmenitiesStr(unit.Amenities?.join(', ') || '');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amenities = amenitiesStr.split(',').map((s) => s.trim()).filter(Boolean);

    if (editingUnit) {
      updateUnit({
        ...editingUnit,
        Property_ID: propertyId,
        Unit_Number_Name: unitNumber,
        Unit_Type: unitType,
        Target_Rent: targetRent,
        Current_Status: status,
        Bedrooms: bedrooms,
        Bathrooms: bathrooms,
        Square_Feet: sqft,
        Floor_Number: floorNumber,
        Amenities: amenities,
      });
    } else {
      addUnit({
        Property_ID: propertyId,
        Unit_Number_Name: unitNumber,
        Unit_Type: unitType,
        Target_Rent: targetRent,
        Current_Status: status,
        Bedrooms: bedrooms,
        Bathrooms: bathrooms,
        Square_Feet: sqft,
        Floor_Number: floorNumber,
        Amenities: amenities,
      });
    }
    setShowModal(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Unit Directory & Availability</h2>
          <p className="text-xs text-slate-400">
            {units.length} total residential units across your real estate portfolio
          </p>
        </div>

        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Unit</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-700/80 bg-slate-800/80 p-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search units, suite #, type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-900 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <select
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">All Properties</option>
            {properties.map((p) => (
              <option key={p.Property_ID} value={p.Property_ID}>
                {p.Property_Name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="Occupied">Occupied</option>
            <option value="Vacant">Vacant</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Turnover">Turnover</option>
          </select>
        </div>

        <span className="text-xs text-slate-400 font-medium">{filteredUnits.length} units shown</span>
      </div>

      {/* Units Table */}
      <div className="rounded-2xl border border-slate-700/80 bg-slate-800/80 backdrop-blur-sm overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/60 text-slate-400 uppercase font-semibold">
                <th className="px-5 py-3.5">Unit / Suite</th>
                <th className="px-5 py-3.5">Property</th>
                <th className="px-5 py-3.5">Layout & Specs</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Target Rent</th>
                <th className="px-5 py-3.5">Current Occupant</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 text-slate-300">
              {filteredUnits.map((unit) => {
                const prop = properties.find((p) => p.Property_ID === unit.Property_ID);
                const activeLease = leases.find(
                  (l) => l.Unit_ID === unit.Unit_ID && (l.Status === 'Active' || l.Status === 'Pending Renewal')
                );
                const tenant = activeLease ? tenants.find((t) => t.Tenant_ID === activeLease.Tenant_ID) : null;

                const statusStyles = {
                  Occupied: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
                  Vacant: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
                  Maintenance: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
                  Turnover: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
                  Reserved: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
                };

                return (
                  <tr key={unit.Unit_ID} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-5 py-4 font-bold text-white">
                      <div className="flex items-center gap-2">
                        <DoorClosed className="h-4 w-4 text-indigo-400" />
                        <span>{unit.Unit_Number_Name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block font-normal mt-0.5">Floor {unit.Floor_Number}</span>
                    </td>

                    <td className="px-5 py-4 text-slate-200">
                      <p className="font-semibold">{prop?.Property_Name}</p>
                      <p className="text-[10px] text-slate-400">{prop?.City}</p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-semibold text-white">{unit.Unit_Type}</p>
                      <p className="text-[10px] text-slate-400">
                        {unit.Bedrooms} Bed · {unit.Bathrooms} Bath · {unit.Square_Feet} sqft
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${statusStyles[unit.Current_Status]}`}>
                        {unit.Current_Status}
                      </span>
                    </td>

                    <td className="px-5 py-4 font-extrabold text-emerald-400 text-sm">
                      {formatCurrency(unit.Target_Rent)}
                    </td>

                    <td className="px-5 py-4">
                      {tenant ? (
                        <div>
                          <p className="font-semibold text-white">{tenant.Full_Name}</p>
                          <p className="text-[10px] text-slate-400">Lease ends {activeLease?.Lease_End}</p>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">No active lease</span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => openEdit(unit)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white"
                        title="Edit Unit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredUnits.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    No units matching the selected filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl p-6 space-y-4 animate-in fade-in">
            <h3 className="text-lg font-bold text-white">
              {editingUnit ? 'Edit Unit Specifications' : 'Add New Unit'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Building / Property</label>
                  <select
                    value={propertyId}
                    onChange={(e) => setPropertyId(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  >
                    {properties.map((p) => (
                      <option key={p.Property_ID} value={p.Property_ID}>
                        {p.Property_Name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Unit / Suite Number</label>
                  <input
                    type="text"
                    placeholder="e.g. Suite 504"
                    value={unitNumber}
                    onChange={(e) => setUnitNumber(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Unit Type</label>
                  <input
                    type="text"
                    value={unitType}
                    onChange={(e) => setUnitType(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Target Rent ($)</label>
                  <input
                    type="number"
                    step="1"
                    value={targetRent}
                    onChange={(e) => setTargetRent(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="Vacant">Vacant</option>
                    <option value="Occupied">Occupied</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Turnover">Turnover</option>
                    <option value="Reserved">Reserved</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Bedrooms</label>
                  <input
                    type="number"
                    value={bedrooms}
                    onChange={(e) => setBedrooms(parseInt(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Bathrooms</label>
                  <input
                    type="number"
                    step="0.5"
                    value={bathrooms}
                    onChange={(e) => setBathrooms(parseFloat(e.target.value) || 1)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Sq Feet</label>
                  <input
                    type="number"
                    value={sqft}
                    onChange={(e) => setSqft(parseInt(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Floor #</label>
                  <input
                    type="number"
                    value={floorNumber}
                    onChange={(e) => setFloorNumber(parseInt(e.target.value) || 1)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Amenities (comma-separated)</label>
                <input
                  type="text"
                  value={amenitiesStr}
                  onChange={(e) => setAmenitiesStr(e.target.value)}
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
                  Save Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
