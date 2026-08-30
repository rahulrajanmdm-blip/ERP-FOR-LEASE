import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Database,
  ArrowRight,
  Sparkles,
  Building2,
  Users,
  DoorClosed,
  FileSignature,
  BookOpen,
  Receipt,
  RotateCcw,
  Layers,
  HelpCircle,
  Copy,
  Table,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { Property, Unit, Tenant, Lease, RentTransaction, Landlord } from '../../types';

type MigrationModule = 'properties' | 'units' | 'tenants' | 'leases' | 'rent_invoices' | 'journal_entries';

export const DataMigrationView: React.FC = () => {
  const {
    bulkImportData,
    properties,
    units,
    tenants,
    leases,
    landlords,
    rentTransactions,
    journals,
    formatCurrency,
    setActiveView,
  } = useERP();

  const [activeModule, setActiveModule] = useState<MigrationModule>('properties');
  const [pastedData, setPastedData] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [importStatus, setImportStatus] = useState<{
    status: 'idle' | 'parsed' | 'importing' | 'success' | 'error';
    message?: string;
    count?: number;
  }>({ status: 'idle' });

  // Starter sample templates for Google Sheets
  const TEMPLATES: Record<MigrationModule, { headers: string[]; sampleRows: string[][] }> = {
    properties: {
      headers: ['Property_Name', 'Address', 'City', 'Province', 'Postal_Code', 'Property_Type', 'Valuation_CAD', 'Property_Manager', 'Total_Square_Feet'],
      sampleRows: [
        ['Maple Leaf Tower', '100 King Street West', 'Toronto', 'ON', 'M5X 1A9', 'Luxury High-Rise Condominiums', '48500000', 'Sarah Jenkins', '145000'],
        ['Pacific Coast Residences', '888 Burrard Street', 'Vancouver', 'BC', 'V6Z 1X9', 'Multi-Family Residential', '32000000', 'Marcus Vance', '98000'],
        ['Calgary Corporate Suites', '400 3rd Avenue SW', 'Calgary', 'AB', 'T2P 4H2', 'Commercial Mixed-Use', '21500000', 'Elena Rostova', '65000'],
      ],
    },
    units: {
      headers: ['Property_ID', 'Unit_Number_Name', 'Unit_Type', 'Target_Rent', 'Bedrooms', 'Bathrooms', 'Square_Feet', 'Floor_Number', 'Current_Status'],
      sampleRows: [
        ['PROP-CAN-01', 'Suite 101', '1BR Modern', '2450', '1', '1', '620', '1', 'Occupied'],
        ['PROP-CAN-01', 'Suite 102', '2BR Corner', '3200', '2', '2', '890', '1', 'Vacant'],
        ['PROP-CAN-02', 'Unit 305', 'Studio Loft', '1950', '1', '1', '510', '3', 'Occupied'],
      ],
    },
    tenants: {
      headers: ['Full_Name', 'Email', 'Phone', 'Emergency_Contact', 'Status', 'Employer', 'Annual_Income', 'Credit_Score'],
      sampleRows: [
        ['David Miller', 'david.miller@torontotech.ca', '+1 (416) 555-0199', 'Jennifer Miller (416-555-0200)', 'Active', 'Shopify Canada', '115000', '785'],
        ['Sophie Tremblay', 'sophie.tremblay@montrealdesign.ca', '+1 (514) 555-0344', 'Luc Tremblay (514-555-0345)', 'Active', 'Ubisoft Montreal', '92000', '740'],
        ['Alexander Wright', 'alex.wright@vancouverlaw.ca', '+1 (604) 555-0781', 'Rachel Wright (604-555-0782)', 'Active', 'Blake, Cassels & Graydon', '140000', '810'],
      ],
    },
    leases: {
      headers: ['Tenant_ID', 'Property_ID', 'Unit_ID', 'Lease_Start', 'Lease_End', 'Monthly_Rent', 'Deposit_Required', 'Deposit_Received', 'Status'],
      sampleRows: [
        ['TNT-1001', 'PROP-CAN-01', 'UNIT-101', '2026-01-01', '2026-12-31', '2450', '2450', '2450', 'Active'],
        ['TNT-1002', 'PROP-CAN-02', 'UNIT-201', '2025-09-01', '2026-08-31', '3200', '3200', '3200', 'Pending Renewal'],
      ],
    },
    rent_invoices: {
      headers: ['Tenant_ID', 'Property_ID', 'Unit_ID', 'Period_Month', 'Due_Date', 'Amount_Billed', 'Amount_Paid', 'Balance', 'Status'],
      sampleRows: [
        ['TNT-1001', 'PROP-CAN-01', 'UNIT-101', '2026-08', '2026-08-01', '2450', '2450', '0', 'Paid'],
        ['TNT-1002', 'PROP-CAN-02', 'UNIT-201', '2026-08', '2026-08-01', '3200', '1500', '1700', 'Partial'],
      ],
    },
    journal_entries: {
      headers: ['Date', 'Description', 'Account_Code', 'Debit', 'Credit', 'Property_ID'],
      sampleRows: [
        ['2026-08-01', 'August Master Rent Billing', '1100', '48500', '0', 'PROP-CAN-01'],
        ['2026-08-01', 'August Master Rent Billing', '4100', '0', '48500', 'PROP-CAN-01'],
      ],
    },
  };

  // Parse CSV or Tab-Separated Data from Google Sheets
  const handleParsePastedData = () => {
    if (!pastedData.trim()) return;

    const lines = pastedData.trim().split(/\r?\n/);
    if (lines.length === 0) return;

    // Detect delimiter: tab (Google Sheets copy) or comma (CSV)
    const firstLine = lines[0];
    const delimiter = firstLine.includes('\t') ? '\t' : ',';

    const rawHeaders = firstLine.split(delimiter).map((h) => h.replace(/^["']|["']$/g, '').trim());
    setHeaders(rawHeaders);

    const rows: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      let cols: string[] = [];
      if (delimiter === '\t') {
        cols = line.split('\t').map((c) => c.replace(/^["']|["']$/g, '').trim());
      } else {
        // Basic CSV parsing
        cols = line.split(',').map((c) => c.replace(/^["']|["']$/g, '').trim());
      }

      const rowObj: Record<string, string> = {};
      rawHeaders.forEach((header, index) => {
        rowObj[header] = cols[index] !== undefined ? cols[index] : '';
      });
      rows.push(rowObj);
    }

    setParsedRows(rows);

    // Auto-map columns if header names match
    const initialMapping: Record<string, string> = {};
    const expectedHeaders = TEMPLATES[activeModule].headers;
    rawHeaders.forEach((h) => {
      const cleanH = h.toLowerCase().replace(/[^a-z0-9]/g, '');
      const match = expectedHeaders.find((exp) => exp.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanH);
      if (match) {
        initialMapping[h] = match;
      }
    });
    setColumnMapping(initialMapping);

    setImportStatus({
      status: 'parsed',
      count: rows.length,
      message: `Parsed ${rows.length} rows with ${rawHeaders.length} columns. Review column mapping below.`,
    });
  };

  // Load sample template into paste box
  const handleLoadSample = () => {
    const template = TEMPLATES[activeModule];
    const delimiter = '\t';
    const headerLine = template.headers.join(delimiter);
    const rowLines = template.sampleRows.map((r) => r.join(delimiter)).join('\n');
    setPastedData(`${headerLine}\n${rowLines}`);
  };

  // Download CSV Starter File
  const handleDownloadTemplate = () => {
    const template = TEMPLATES[activeModule];
    const csvContent = [
      template.headers.join(','),
      ...template.sampleRows.map((r) => r.map((val) => `"${val}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `DreamDwell_${activeModule}_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Execute the import into ERP Context
  const handleExecuteImport = () => {
    if (parsedRows.length === 0) return;

    setImportStatus({ status: 'importing' });

    try {
      const genId = (prefix: string) => `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;

      if (activeModule === 'properties') {
        const newProperties: Property[] = parsedRows.map((row, idx) => ({
          Property_ID: row['Property_ID'] || `PROP-IMP-${idx + 100}`,
          Property_Name: row['Property_Name'] || `Migrated Property ${idx + 1}`,
          Address: row['Address'] || 'Canadian Address',
          City: row['City'] || 'Toronto',
          Province: row['Province'] || 'ON',
          Postal_Code: row['Postal_Code'] || 'M5V 2T6',
          Landlord_ID: row['Landlord_ID'] || 'LL-101',
          Property_Status: 'Active',
          Management_Fee_Percentage: Number(row['Management_Fee_Percentage']) || 6.5,
          Property_Type: (row['Property_Type'] as any) || 'Multi-Family Residential',
          Year_Built: Number(row['Year_Built']) || 2021,
          Total_Square_Feet: Number(row['Total_Square_Feet']) || 85000,
          Valuation_CAD: Number(row['Valuation_CAD']) || 25000000,
          Property_Manager: row['Property_Manager'] || 'Sarah Jenkins',
          Amenities: ['Underground Parking', 'Smart Thermostat', 'Fitness Hub', 'Secure Parcel Lockers'],
          Created_At: new Date().toISOString(),
        }));

        const result = bulkImportData({ properties: newProperties });
        setImportStatus({ status: 'success', count: newProperties.length, message: result.message });
      } else if (activeModule === 'units') {
        const newUnits: Unit[] = parsedRows.map((row, idx) => ({
          Unit_ID: row['Unit_ID'] || `UNIT-IMP-${idx + 100}`,
          Property_ID: row['Property_ID'] || properties[0]?.Property_ID || 'PROP-CAN-01',
          Unit_Number_Name: row['Unit_Number_Name'] || `Suite ${idx + 101}`,
          Unit_Type: row['Unit_Type'] || '1BR Modern Suite',
          Target_Rent: Number(row['Target_Rent']) || 2200,
          Current_Status: (row['Current_Status'] as any) || 'Vacant',
          Bedrooms: Number(row['Bedrooms']) || 1,
          Bathrooms: Number(row['Bathrooms']) || 1,
          Square_Feet: Number(row['Square_Feet']) || 650,
          Floor_Number: Number(row['Floor_Number']) || 1,
          Amenities: ['In-suite Laundry', 'Balcony', 'Dishwasher'],
        }));

        const result = bulkImportData({ units: newUnits });
        setImportStatus({ status: 'success', count: newUnits.length, message: result.message });
      } else if (activeModule === 'tenants') {
        const newTenants: Tenant[] = parsedRows.map((row, idx) => ({
          Tenant_ID: row['Tenant_ID'] || `TNT-IMP-${idx + 100}`,
          Full_Name: row['Full_Name'] || `Resident ${idx + 1}`,
          Email: row['Email'] || `resident${idx + 1}@dreamdwell.ca`,
          Phone: row['Phone'] || '+1 (416) 555-0100',
          Emergency_Contact: row['Emergency_Contact'] || 'Contact (416-555-0101)',
          Status: 'Active',
          Employer: row['Employer'] || 'Canadian Employer Inc.',
          Annual_Income: Number(row['Annual_Income']) || 90000,
          Credit_Score: Number(row['Credit_Score']) || 750,
          Created_At: new Date().toISOString(),
        }));

        const result = bulkImportData({ tenants: newTenants });
        setImportStatus({ status: 'success', count: newTenants.length, message: result.message });
      } else if (activeModule === 'leases') {
        const newLeases: Lease[] = parsedRows.map((row, idx) => ({
          Lease_ID: row['Lease_ID'] || `LSE-IMP-${idx + 100}`,
          Tenant_ID: row['Tenant_ID'] || tenants[0]?.Tenant_ID || 'TNT-1001',
          Property_ID: row['Property_ID'] || properties[0]?.Property_ID || 'PROP-CAN-01',
          Unit_ID: row['Unit_ID'] || units[0]?.Unit_ID || 'UNIT-101',
          Lease_Start: row['Lease_Start'] || '2026-01-01',
          Lease_End: row['Lease_End'] || '2026-12-31',
          Monthly_Rent: Number(row['Monthly_Rent']) || 2500,
          Deposit_Required: Number(row['Deposit_Required']) || 2500,
          Deposit_Received: Number(row['Deposit_Received']) || 2500,
          Rent_Due_Day: 1,
          Grace_Period_Days: 5,
          Late_Fee_Amount: 50,
          Status: (row['Status'] as any) || 'Active',
          Auto_Renew: true,
        }));

        const result = bulkImportData({ leases: newLeases });
        setImportStatus({ status: 'success', count: newLeases.length, message: result.message });
      } else if (activeModule === 'rent_invoices') {
        const newInvoices: RentTransaction[] = parsedRows.map((row, idx) => ({
          Rent_Txn_ID: row['Rent_Txn_ID'] || `INV-IMP-${idx + 100}`,
          Tenant_ID: row['Tenant_ID'] || tenants[0]?.Tenant_ID || 'TNT-1001',
          Property_ID: row['Property_ID'] || properties[0]?.Property_ID || 'PROP-CAN-01',
          Unit_ID: row['Unit_ID'] || units[0]?.Unit_ID || 'UNIT-101',
          Period_Month: row['Period_Month'] || '2026-08',
          Due_Date: row['Due_Date'] || '2026-08-01',
          Amount_Billed: Number(row['Amount_Billed']) || 2500,
          Amount_Paid: Number(row['Amount_Paid']) || 0,
          Balance: Number(row['Balance']) || Number(row['Amount_Billed']) || 2500,
          Status: (row['Status'] as any) || 'Overdue',
          Created_At: new Date().toISOString(),
        }));

        const result = bulkImportData({ rentTransactions: newInvoices });
        setImportStatus({ status: 'success', count: newInvoices.length, message: result.message });
      }
    } catch (err: any) {
      setImportStatus({
        status: 'error',
        message: err.message || 'Import failed due to data format inconsistency.',
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-xs">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Google Sheets & Excel Data Migration Hub
              </h1>
              <p className="text-xs text-slate-500">
                Seamlessly import properties, units, tenant rosters, leases, and historical general ledger records into Dream Dwell ERP
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 transition-colors shadow-2xs"
          >
            <Download className="h-4 w-4 text-slate-600" />
            <span>Download CSV Template</span>
          </button>
        </div>
      </div>

      {/* Migration Target Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { id: 'properties' as const, label: 'Properties & Buildings', icon: <Building2 className="h-4 w-4" />, count: properties.length },
          { id: 'units' as const, label: 'Units & Space Inventory', icon: <DoorClosed className="h-4 w-4" />, count: units.length },
          { id: 'tenants' as const, label: 'Tenant Directory', icon: <Users className="h-4 w-4" />, count: tenants.length },
          { id: 'leases' as const, label: 'Lease Agreements', icon: <FileSignature className="h-4 w-4" />, count: leases.length },
          { id: 'rent_invoices' as const, label: 'Historical Rent Invoices', icon: <Receipt className="h-4 w-4" />, count: rentTransactions.length },
        ].map((mod) => {
          const isActive = activeModule === mod.id;
          return (
            <button
              key={mod.id}
              onClick={() => {
                setActiveModule(mod.id);
                setParsedRows([]);
                setPastedData('');
                setImportStatus({ status: 'idle' });
              }}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                isActive
                  ? 'bg-slate-900 text-white border-slate-950 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={isActive ? 'text-white' : 'text-slate-500'}>{mod.icon}</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {mod.count} Live
                </span>
              </div>
              <p className="font-bold text-xs mt-2 truncate">{mod.label}</p>
            </button>
          );
        })}
      </div>

      {/* Main Migration Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Paste or Upload {activeModule.replace('_', ' ').toUpperCase()} from Google Sheets
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Copy rows directly from your Google Sheet (Cmd+C / Ctrl+C) and paste below, or use the preloaded template.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadSample}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-2xs"
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              <span>Load Canadian Sample Data</span>
            </button>
          </div>
        </div>

        {/* Input Text Area */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
            <span>Data Input (Tab-Separated or CSV Format)</span>
            <span className="text-slate-400 font-normal">
              Expected columns: {TEMPLATES[activeModule].headers.join(', ')}
            </span>
          </label>
          <textarea
            rows={7}
            value={pastedData}
            onChange={(e) => setPastedData(e.target.value)}
            placeholder="Paste your copied rows from Google Sheets here..."
            className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
          />
        </div>

        {/* Parse & Import Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => {
              setPastedData('');
              setParsedRows([]);
              setImportStatus({ status: 'idle' });
            }}
            disabled={!pastedData}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Clear Input</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleParsePastedData}
              disabled={!pastedData.trim()}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-800 border border-slate-300 hover:bg-slate-200 disabled:opacity-40 transition-colors"
            >
              <Table className="h-3.5 w-3.5 text-slate-700" />
              <span>Preview & Map Columns</span>
            </button>

            {parsedRows.length > 0 && (
              <button
                onClick={handleExecuteImport}
                disabled={importStatus.status === 'importing'}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40 transition-all shadow-xs"
              >
                <Database className="h-3.5 w-3.5 text-emerald-400" />
                <span>
                  {importStatus.status === 'importing' ? 'Importing...' : `Commit ${parsedRows.length} Rows to ERP`}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Status Alert */}
        {importStatus.status === 'success' && (
          <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>{importStatus.message}</span>
            </div>
            <button
              onClick={() => setActiveView(activeModule === 'rent_invoices' ? 'billing' : activeModule)}
              className="flex items-center gap-1 text-emerald-800 hover:underline font-bold"
            >
              <span>View {activeModule} module</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {importStatus.status === 'error' && (
          <div className="flex items-center gap-2.5 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold animate-in fade-in">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
            <span>{importStatus.message}</span>
          </div>
        )}

        {/* Parsed Rows Preview Table */}
        {parsedRows.length > 0 && (
          <div className="mt-4 space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Table className="h-4 w-4 text-slate-700" />
                <h3 className="text-xs font-bold text-slate-800">
                  Data Preview ({parsedRows.length} records ready for ingestion)
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">Showing first {Math.min(parsedRows.length, 5)} rows</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-3 py-2.5 w-10">#</th>
                    {headers.map((h) => (
                      <th key={h} className="px-3 py-2.5">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {parsedRows.slice(0, 5).map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50/60">
                      <td className="px-3 py-2 text-slate-400 font-sans">{rIdx + 1}</td>
                      {headers.map((h) => (
                        <td key={h} className="px-3 py-2 text-slate-800 whitespace-nowrap">
                          {row[h] || <span className="text-slate-300 font-sans italic">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Migration Guides and Tips */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Canadian ASPE Standards</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            All valuations, monthly lease rents, utility allocations, and security deposits are normalized to Canadian Dollars (CAD) automatically.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
            <Layers className="h-4 w-4 text-sky-600" />
            <span>Relational Integrity</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            When importing leases or rent invoices, the system automatically checks matching Property IDs and Tenant IDs for consistent ledger reconciliation.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
            <BookOpen className="h-4 w-4 text-amber-600" />
            <span>Audit Trail Preserved</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Every batch migration is tagged with timestamp, operator email, and record count in the internal system audit log.
          </p>
        </div>
      </div>
    </div>
  );
};
