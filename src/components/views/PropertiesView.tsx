import React, { useState, useMemo } from 'react';
import {
  Building2,
  Plus,
  MapPin,
  User,
  DollarSign,
  DoorClosed,
  CheckCircle2,
  Wrench,
  AlertCircle,
  Edit,
  Trash2,
  FileSpreadsheet,
  Download,
  Image as ImageIcon,
  Layers,
  Sparkles,
  Search,
  Filter,
  ShieldCheck,
  Tag,
  Calendar,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { Property } from '../../types';
import { exportToExcel, exportToPDF, AuditReportData } from '../../utils/exportAuditReports';

const AVAILABLE_AMENITIES = [
  'Underground Parking',
  'Concierge & Security',
  'EV Charging Station',
  'Fitness & Wellness Hub',
  'Rooftop Terrace & BBQ',
  'Smart Parcel Lockers',
  'Pet Wash Station',
  'Keyless Mobile Entry',
  'In-suite Laundry',
  'High-Speed Fibre Internet',
];

export const PropertiesView: React.FC = () => {
  const {
    properties,
    units,
    landlords,
    currentUser,
    formatCurrency,
    addProperty,
    updateProperty,
    setActiveView,
  } = useERP();

  const [showModal, setShowModal] = useState(false);
  const [editingProp, setEditingProp] = useState<Property | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Form State
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Toronto');
  const [province, setProvince] = useState('ON');
  const [postalCode, setPostalCode] = useState('');
  const [landlordId, setLandlordId] = useState(landlords[0]?.Landlord_ID || '');
  const [feePct, setFeePct] = useState(6.5);
  const [status, setStatus] = useState<Property['Property_Status']>('Active');
  const [propertyType, setPropertyType] = useState<Property['Property_Type']>('Multi-Family Residential');
  const [yearBuilt, setYearBuilt] = useState<number>(2022);
  const [totalSquareFeet, setTotalSquareFeet] = useState<number>(85000);
  const [valuationCAD, setValuationCAD] = useState<number>(28500000);
  const [propertyManager, setPropertyManager] = useState<string>('Sarah Jenkins');
  const [taxRollNumber, setTaxRollNumber] = useState<string>('1904-08-1-230-00100');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [extraImages, setExtraImages] = useState<string[]>([]);
  const [newImageInput, setNewImageInput] = useState('');

  const openAdd = () => {
    setEditingProp(null);
    setName('');
    setAddress('');
    setCity('Toronto');
    setProvince('ON');
    setPostalCode('M5V 2T6');
    setLandlordId(landlords[0]?.Landlord_ID || '');
    setFeePct(6.5);
    setStatus('Active');
    setPropertyType('Multi-Family Residential');
    setYearBuilt(2022);
    setTotalSquareFeet(85000);
    setValuationCAD(28500000);
    setPropertyManager('Sarah Jenkins');
    setTaxRollNumber('1904-08-1-230-00100');
    setAmenities(['Underground Parking', 'Smart Parcel Lockers', 'Fitness & Wellness Hub']);
    setImageUrl('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80');
    setExtraImages([
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
    ]);
    setShowModal(true);
  };

  const openEdit = (prop: Property) => {
    setEditingProp(prop);
    setName(prop.Property_Name);
    setAddress(prop.Address);
    setCity(prop.City);
    setProvince(prop.Province);
    setPostalCode(prop.Postal_Code);
    setLandlordId(prop.Landlord_ID);
    setFeePct(prop.Management_Fee_Percentage);
    setStatus(prop.Property_Status);
    setPropertyType(prop.Property_Type || 'Multi-Family Residential');
    setYearBuilt(prop.Year_Built || 2021);
    setTotalSquareFeet(prop.Total_Square_Feet || 75000);
    setValuationCAD(prop.Valuation_CAD || 25000000);
    setPropertyManager(prop.Property_Manager || 'Sarah Jenkins');
    setTaxRollNumber(prop.Tax_Roll_Number || '1904-08-1-230-00100');
    setAmenities(prop.Amenities || ['Underground Parking', 'Fitness & Wellness Hub']);
    setImageUrl(prop.Image_URL || '');
    setExtraImages(prop.Images || [prop.Image_URL || '']);
    setShowModal(true);
  };

  const toggleAmenity = (amenity: string) => {
    setAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const handleAddImage = () => {
    if (newImageInput.trim()) {
      setExtraImages((prev) => [...prev, newImageInput.trim()]);
      setNewImageInput('');
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setExtraImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const primaryImg = imageUrl || extraImages[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80';
    const allImgs = extraImages.length > 0 ? extraImages : [primaryImg];

    if (editingProp) {
      updateProperty({
        ...editingProp,
        Property_Name: name,
        Address: address,
        City: city,
        Province: province,
        Postal_Code: postalCode,
        Landlord_ID: landlordId,
        Management_Fee_Percentage: feePct,
        Property_Status: status,
        Property_Type: propertyType,
        Year_Built: yearBuilt,
        Total_Square_Feet: totalSquareFeet,
        Valuation_CAD: valuationCAD,
        Property_Manager: propertyManager,
        Tax_Roll_Number: taxRollNumber,
        Amenities: amenities,
        Image_URL: primaryImg,
        Images: allImgs,
      });
    } else {
      addProperty({
        Property_Name: name,
        Address: address,
        City: city,
        Province: province,
        Postal_Code: postalCode,
        Landlord_ID: landlordId,
        Management_Fee_Percentage: feePct,
        Property_Status: status,
        Property_Type: propertyType,
        Year_Built: yearBuilt,
        Total_Square_Feet: totalSquareFeet,
        Valuation_CAD: valuationCAD,
        Property_Manager: propertyManager,
        Tax_Roll_Number: taxRollNumber,
        Amenities: amenities,
        Image_URL: primaryImg,
        Images: allImgs,
      });
    }
    setShowModal(false);
  };

  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      if (selectedProvince !== 'all' && p.Province !== selectedProvince) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          p.Property_Name.toLowerCase().includes(q) ||
          p.Address.toLowerCase().includes(q) ||
          p.City.toLowerCase().includes(q) ||
          (p.Property_Type && p.Property_Type.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [properties, selectedProvince, searchTerm]);

  // Aggregate Portfolio Valuation
  const totalValuation = properties.reduce((acc, p) => acc + (p.Valuation_CAD || 0), 0);
  const totalSqFt = properties.reduce((acc, p) => acc + (p.Total_Square_Feet || 0), 0);

  const handleExportPropertiesExcel = () => {
    const reportData: AuditReportData = {
      title: 'Canadian Real Estate Asset Inventory & Valuation',
      subtitle: 'Schedule of managed residential & mixed-use properties under Dream Dwell Asset Management',
      reportCode: 'DD-FIN-PROP-01',
      generatedBy: currentUser.Full_Name,
      generatedAt: new Date().toLocaleString(),
      period: 'August 2026',
      propertyFilter: 'All Canadian Properties',
      headers: [
        'Property Name',
        'Address',
        'City',
        'Province',
        'Asset Type',
        'Total Suites',
        'Occupied Suites',
        'Square Feet',
        'Valuation (CAD $)',
        'Monthly Rent Roll ($)',
        'Property Manager',
        'Mgt Fee %',
      ],
      rows: filteredProperties.map((p) => {
        const propUnits = units.filter((u) => u.Property_ID === p.Property_ID);
        const occ = propUnits.filter((u) => u.Current_Status === 'Occupied').length;
        const totalRent = propUnits.reduce((acc, u) => acc + u.Target_Rent, 0);
        return [
          p.Property_Name,
          p.Address,
          p.City,
          p.Province,
          p.Property_Type || 'Multi-Family',
          propUnits.length,
          occ,
          p.Total_Square_Feet || '—',
          p.Valuation_CAD || 0,
          totalRent,
          p.Property_Manager || 'Sarah Jenkins',
          `${p.Management_Fee_Percentage}%`,
        ];
      }),
      summaryRows: [
        { label: 'Total Managed Assets:', value: filteredProperties.length },
        { label: 'Total Managed Suites:', value: units.length },
        { label: 'Portfolio Valuation (CAD):', value: formatCurrency(totalValuation) },
        { label: 'Total Gross Area:', value: `${totalSqFt.toLocaleString()} sq ft` },
      ],
    };
    exportToExcel(reportData);
  };

  const handleExportPropertiesPDF = () => {
    const reportData: AuditReportData = {
      title: 'Canadian Real Estate Asset Inventory & Valuation',
      subtitle: 'Schedule of managed residential & mixed-use properties under Dream Dwell Asset Management',
      reportCode: 'DD-FIN-PROP-01',
      generatedBy: currentUser.Full_Name,
      generatedAt: new Date().toLocaleString(),
      period: 'August 2026',
      propertyFilter: 'All Canadian Properties',
      headers: ['Property Name', 'City', 'Province', 'Type', 'Suites', 'Valuation (CAD $)', 'Monthly Rent Roll ($)', 'Manager'],
      rows: filteredProperties.map((p) => {
        const propUnits = units.filter((u) => u.Property_ID === p.Property_ID);
        const occ = propUnits.filter((u) => u.Current_Status === 'Occupied').length;
        const totalRent = propUnits.reduce((acc, u) => acc + u.Target_Rent, 0);
        return [
          p.Property_Name,
          p.City,
          p.Province,
          p.Property_Type || 'Multi-Family',
          `${occ}/${propUnits.length}`,
          p.Valuation_CAD || 0,
          totalRent,
          p.Property_Manager || 'Sarah Jenkins',
        ];
      }),
      summaryRows: [
        { label: 'Portfolio Valuation (CAD):', value: formatCurrency(totalValuation) },
        { label: 'Aggregate Target Rent Roll:', value: formatCurrency(units.reduce((acc, u) => acc + u.Target_Rent, 0)) },
      ],
    };
    exportToPDF(reportData);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Property Portfolio & Asset Management
              </h1>
              <p className="text-xs text-slate-500">
                Canadian residential towers, luxury condominiums, and commercial assets managed by Dream Dwell
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportPropertiesExcel}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-700" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={handleExportPropertiesPDF}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <Download className="h-4 w-4 text-slate-700" />
            <span>Export PDF</span>
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Property</span>
          </button>
        </div>
      </div>

      {/* Portfolio Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Portfolio Valuation</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(totalValuation)}</p>
          <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">Under Active Asset Management (CAD)</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Managed Properties</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{properties.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Across Ontario, BC & Alberta</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Square Footage</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalSqFt.toLocaleString()} sq ft</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{units.length} total residential & commercial units</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Aggregate Monthly Rent Roll</p>
          <p className="text-2xl font-black text-emerald-700 font-mono mt-1">
            {formatCurrency(units.reduce((acc, u) => acc + u.Target_Rent, 0))}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Scheduled monthly gross billing</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200">
          <button
            onClick={() => setSelectedProvince('all')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              selectedProvince === 'all'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Provinces ({properties.length})
          </button>
          <button
            onClick={() => setSelectedProvince('ON')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              selectedProvince === 'ON'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ontario (ON)
          </button>
          <button
            onClick={() => setSelectedProvince('BC')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              selectedProvince === 'BC'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            British Columbia (BC)
          </button>
          <button
            onClick={() => setSelectedProvince('AB')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              selectedProvince === 'AB'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Alberta (AB)
          </button>
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search property name, address, or manager..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
        </div>
      </div>

      {/* Property Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProperties.map((prop) => {
          const propUnits = units.filter((u) => u.Property_ID === prop.Property_ID);
          const occupiedCount = propUnits.filter((u) => u.Current_Status === 'Occupied').length;
          const totalRent = propUnits.reduce((acc, u) => acc + u.Target_Rent, 0);
          const landlord = landlords.find((l) => l.Landlord_ID === prop.Landlord_ID);
          const occupancyRate = propUnits.length > 0 ? Math.round((occupiedCount / propUnits.length) * 100) : 0;

          return (
            <div
              key={prop.Property_ID}
              className="rounded-2xl border border-slate-200 bg-white overflow-hidden flex flex-col justify-between transition-all hover:border-slate-400 hover:shadow-md group"
            >
              {/* Image Banner */}
              <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                {prop.Image_URL ? (
                  <img
                    src={prop.Image_URL}
                    alt={prop.Property_Name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400">
                    <Building2 className="h-12 w-12" />
                  </div>
                )}

                {/* Overlay Badges */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="rounded-md bg-slate-900/85 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs">
                    {prop.Property_Type || 'Residential Asset'}
                  </span>
                  <span className="rounded-md bg-white/90 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-slate-900 shadow-2xs border border-slate-200">
                    {prop.Province}
                  </span>
                </div>

                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  <span className="rounded-md bg-white/90 backdrop-blur-xs px-2 py-0.5 text-[10px] font-extrabold text-emerald-800 shadow-2xs border border-emerald-200">
                    {occupancyRate}% Occupied
                  </span>
                  <button
                    onClick={() => openEdit(prop)}
                    className="rounded-md bg-white/90 backdrop-blur-xs p-1.5 text-slate-700 hover:text-slate-950 shadow-2xs border border-slate-200 transition-colors"
                    title="Edit Property"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Title and Address Pill */}
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="rounded-xl bg-white/95 backdrop-blur-xs p-3 shadow-xs border border-slate-200/80">
                    <h3 className="font-bold text-slate-900 text-sm truncate">{prop.Property_Name}</h3>
                    <p className="text-[11px] text-slate-600 flex items-center gap-1 truncate mt-0.5">
                      <MapPin className="h-3 w-3 text-slate-500 shrink-0" />
                      <span>
                        {prop.Address}, {prop.City}, {prop.Province} {prop.Postal_Code}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Property Details */}
              <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3.5">
                  {/* Financial & Valuation Matrix */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                      <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Asset Valuation</span>
                      <p className="font-extrabold text-slate-900 text-sm mt-0.5 font-mono">
                        {prop.Valuation_CAD ? formatCurrency(prop.Valuation_CAD) : '—'}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                      <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Monthly Rent Roll</span>
                      <p className="font-extrabold text-emerald-700 text-sm mt-0.5 font-mono">
                        {formatCurrency(totalRent)}
                      </p>
                    </div>
                  </div>

                  {/* Operational Details */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs py-1 border-y border-slate-100">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Suites</p>
                      <p className="font-bold text-slate-800 mt-0.5">{propUnits.length} Total</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Gross Area</p>
                      <p className="font-bold text-slate-800 mt-0.5">{prop.Total_Square_Feet ? `${prop.Total_Square_Feet.toLocaleString()} sf` : '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Manager</p>
                      <p className="font-bold text-slate-800 mt-0.5 truncate">{prop.Property_Manager?.split(' ')[0] || 'Direct'}</p>
                    </div>
                  </div>

                  {/* Amenities Tags */}
                  {prop.Amenities && prop.Amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {prop.Amenities.slice(0, 3).map((amenity, aIdx) => (
                        <span
                          key={aIdx}
                          className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold"
                        >
                          {amenity}
                        </span>
                      ))}
                      {prop.Amenities.length > 3 && (
                        <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-semibold">
                          +{prop.Amenities.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer View Units Button */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-semibold">{prop.Management_Fee_Percentage}% Mgt Fee</span>
                  <button
                    onClick={() => setActiveView('units')}
                    className="font-bold text-slate-900 hover:text-slate-700 flex items-center gap-1"
                  >
                    <span>View All {propUnits.length} Units</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-xl p-6 space-y-4 animate-in fade-in my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingProp ? 'Edit Property Asset Profile' : 'Register New Canadian Property Asset'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Property / Building Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Maple Leaf Luxury Tower"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-slate-900 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Property Asset Type</label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-slate-900 focus:outline-none"
                  >
                    <option value="Multi-Family Residential">Multi-Family Residential</option>
                    <option value="Luxury High-Rise Condominiums">Luxury High-Rise Condominiums</option>
                    <option value="Commercial Mixed-Use">Commercial Mixed-Use</option>
                    <option value="Townhome Complex">Townhome Complex</option>
                    <option value="Executive Suites">Executive Suites</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-slate-700 font-semibold block mb-1">Street Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-slate-900 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-slate-900 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Province</label>
                  <select
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-slate-900 focus:outline-none"
                  >
                    <option value="ON">Ontario (ON)</option>
                    <option value="BC">British Columbia (BC)</option>
                    <option value="AB">Alberta (AB)</option>
                    <option value="QC">Quebec (QC)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Postal Code</label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-slate-900 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Owner / Landlord</label>
                  <select
                    value={landlordId}
                    onChange={(e) => setLandlordId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-slate-900 focus:outline-none"
                  >
                    {landlords.map((l) => (
                      <option key={l.Landlord_ID} value={l.Landlord_ID}>
                        {l.Full_Name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Financial & Valuation */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Asset Valuation (CAD $)</label>
                  <input
                    type="number"
                    value={valuationCAD}
                    onChange={(e) => setValuationCAD(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Total Square Feet</label>
                  <input
                    type="number"
                    value={totalSquareFeet}
                    onChange={(e) => setTotalSquareFeet(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Management Fee (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={feePct}
                    onChange={(e) => setFeePct(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Images Section */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-slate-700 font-semibold block">Property Image Gallery (URLs)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    placeholder="Add an image URL (e.g. https://...)"
                    value={newImageInput}
                    onChange={(e) => setNewImageInput(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-slate-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddImage}
                    className="px-3 py-2 rounded-lg bg-slate-100 text-slate-800 border border-slate-300 hover:bg-slate-200 font-semibold"
                  >
                    Add Image
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {extraImages.map((img, idx) => (
                    <div key={idx} className="relative group/img h-16 w-24 rounded-lg overflow-hidden border border-slate-200">
                      <img src={img} alt="preview" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/70 text-white flex items-center justify-center text-xs opacity-0 group-hover/img:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Amenities Checklist */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-slate-700 font-semibold block">Building Amenities & Facilities</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {AVAILABLE_AMENITIES.map((item) => {
                    const isChecked = amenities.includes(item);
                    return (
                      <button
                        type="button"
                        key={item}
                        onClick={() => toggleAmenity(item)}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-colors ${
                          isChecked
                            ? 'bg-slate-900 text-white border-slate-950 font-bold'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span className={`h-3.5 w-3.5 rounded border flex items-center justify-center ${isChecked ? 'bg-white text-slate-900' : 'border-slate-300'}`}>
                          {isChecked && '✓'}
                        </span>
                        <span className="text-[11px] truncate">{item}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-slate-900 font-bold text-white hover:bg-slate-800 shadow-xs"
                >
                  Save Asset Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
