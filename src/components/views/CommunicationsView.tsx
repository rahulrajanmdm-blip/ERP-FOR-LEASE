import React, { useState } from 'react';
import {
  FileText,
  Printer,
  CheckCircle2,
  Sparkles,
  Receipt,
  FileCheck,
  Users,
  Building2,
  Search,
  ChevronRight,
  ShieldCheck,
  Copy,
  Download,
  BookOpen,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';

type NoticeType =
  | 'payment_receipt'
  | 'rent_demand'
  | 'utility_statement'
  | 'lease_renewal_memo'
  | 'move_out_statement';

export const CommunicationsView: React.FC = () => {
  const {
    properties,
    tenants,
    units,
    leases,
    rentTransactions,
    utilitySplits,
    currentUser,
    formatCurrency,
    settings,
  } = useERP();

  const [selectedNotice, setSelectedNotice] = useState<NoticeType>('payment_receipt');
  const [selectedTenantId, setSelectedTenantId] = useState(tenants[0]?.Tenant_ID || '');
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  const notifyCopy = (msg: string) => {
    setCopiedNotification(msg);
    setTimeout(() => setCopiedNotification(null), 3000);
  };

  const selectedTenant = tenants.find((t) => t.Tenant_ID === selectedTenantId) || tenants[0];
  const activeLease = leases.find(
    (l) => l.Tenant_ID === selectedTenant?.Tenant_ID && (l.Status === 'Active' || l.Status === 'Pending Renewal')
  );
  const prop = properties.find((p) => p.Property_ID === activeLease?.Property_ID || p.Landlord_ID === selectedTenant?.Property_ID);
  const unit = units.find((u) => u.Unit_ID === activeLease?.Unit_ID);

  const openRent = rentTransactions.filter(
    (r) => r.Tenant_ID === selectedTenant?.Tenant_ID && r.Status !== 'Paid'
  );
  const totalRentDue = openRent.reduce((acc, r) => acc + r.Balance, 0);

  const openUtil = utilitySplits.filter(
    (u) => u.Tenant_ID === selectedTenant?.Tenant_ID && u.Payment_Status !== 'Paid'
  );
  const totalUtilDue = openUtil.reduce((acc, u) => acc + u.Allocated_Amount, 0);
  const totalBalanceDue = totalRentDue + totalUtilDue;

  // Generated text for internal records and PDF generation
  const generateNoticeContent = () => {
    if (!selectedTenant) return '';

    const today = new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });

    if (selectedNotice === 'payment_receipt') {
      return `DREAM DWELL ASSET MANAGEMENT
FINANCE & ACCOUNTING DEPARTMENT
OFFICIAL TRANSACTION RECEIPT & LEDGER VOUCHER

Date: ${today}
Voucher Ref: DD-RCP-${Math.floor(100000 + Math.random() * 900000)}
Resident: ${selectedTenant.Full_Name} (${selectedTenant.Tenant_ID})
Property: ${prop?.Property_Name || 'Dream Dwell Properties'} — ${unit?.Unit_Number_Name || 'Assigned Suite'}
Address: ${prop?.Address || 'King Street West'}, ${prop?.City || 'Toronto'}, ${prop?.Province || 'ON'}

ACCOUNTING SUMMARY:
------------------------------------------------------------
Monthly Contract Rent:       ${formatCurrency(activeLease?.Monthly_Rent || 2450)} CAD
Payment Method:              E-Transfer / Pre-Authorized Debit
Payment Status:              CLEARED & CREDITED TO GL 1010
Current Outstanding Balance: ${formatCurrency(totalBalanceDue)} CAD

Prepared by: ${currentUser.Full_Name} (Finance Department)
Dream Dwell Asset Management Inc., Canada`;
    }

    if (selectedNotice === 'rent_demand') {
      return `DREAM DWELL ASSET MANAGEMENT
NOTICE OF OVERDUE RENT & FORMAL STATEMENT OF ACCOUNT

Date of Notice: ${today}
Notice Number: DD-DEMAND-${Math.floor(1000 + Math.random() * 9000)}
To Resident: ${selectedTenant.Full_Name}
Suite / Unit: ${unit?.Unit_Number_Name || 'Suite'}
Building: ${prop?.Property_Name || 'Dream Dwell Building'}

STATEMENT OF OUTSTANDING DUES:
------------------------------------------------------------
Unpaid Rent Arrears:         ${formatCurrency(totalRentDue > 0 ? totalRentDue : 2450)} CAD
Unpaid Utility Recoveries:   ${formatCurrency(totalUtilDue)} CAD
Total Balance Overdue:       ${formatCurrency(totalBalanceDue > 0 ? totalBalanceDue : 2450)} CAD

In accordance with the provincial Residential Tenancies Act (Ontario / BC / Alberta), payment must be remitted promptly to avoid legal escalation and tenancy board filings.

Authorized by: Finance Department, Dream Dwell Asset Management`;
    }

    if (selectedNotice === 'utility_statement') {
      return `DREAM DWELL ASSET MANAGEMENT
RESIDENT UTILITY CONSUMPTION & RECOVERY STATEMENT

Billing Cycle: August 2026
Statement Date: ${today}
Resident: ${selectedTenant.Full_Name}
Suite: ${unit?.Unit_Number_Name || 'Suite'} — ${prop?.Property_Name || 'Dream Dwell Building'}

ALLOCATED UTILITY BREAKDOWN (CAD):
------------------------------------------------------------
Electricity / Hydro (Sub-metered):  ${formatCurrency(85.50)}
Natural Gas / Space Heating:        ${formatCurrency(42.30)}
City Water & Sewerage:              ${formatCurrency(38.00)}
Total Utility Recovery Billed:      ${formatCurrency(165.80)} CAD

Payment is consolidated with the monthly rent billing cycle.`;
    }

    if (selectedNotice === 'lease_renewal_memo') {
      return `DREAM DWELL ASSET MANAGEMENT
LEASE RENEWAL & RATE ADJUSTMENT PROPOSAL

Date: ${today}
Tenant: ${selectedTenant.Full_Name}
Unit: ${unit?.Unit_Number_Name || 'Suite'} — ${prop?.Property_Name || 'Property'}
Current Term End: ${activeLease?.Lease_End || '2026-12-31'}

RENEWAL PROPOSAL SUMMARY:
------------------------------------------------------------
Current In-Place Rent:       ${formatCurrency(activeLease?.Monthly_Rent || 2450)} / month
Proposed Renewal Term:       12 Months
Proposed Renewal Rate:       ${formatCurrency(Math.round((activeLease?.Monthly_Rent || 2450) * 1.025))} / month (Permissible Provincial Guideline)
Security Deposit on Hold:    ${formatCurrency(activeLease?.Deposit_Received || 2450)} CAD

Dream Dwell Asset Management Leasing & Finance Team`;
    }

    return `DREAM DWELL ASSET MANAGEMENT
MOVE-OUT SETTLEMENT & DEPOSIT RECONCILIATION

Date: ${today}
Tenant: ${selectedTenant.Full_Name}
Property: ${prop?.Property_Name || 'Building'} — Unit: ${unit?.Unit_Number_Name || 'Suite'}

FINAL ESCROW RECONCILIATION:
------------------------------------------------------------
Security Deposit Held in Escrow:    ${formatCurrency(activeLease?.Deposit_Received || 2450)} CAD
Accrued Statutory Interest:         ${formatCurrency(32.50)} CAD
Deductions (Repairs / Painting):   -${formatCurrency(0.00)} CAD
Final Utility Reconciliation:      -${formatCurrency(totalUtilDue)} CAD
Net Amount Refunded / Payable:      ${formatCurrency((activeLease?.Deposit_Received || 2450) + 32.50 - totalUtilDue)} CAD

Approved by Dream Dwell Finance Operations.`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateNoticeContent());
    notifyCopy('Notice copied to clipboard for official documentation.');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Resident Statements & Internal Document Center
              </h1>
              <p className="text-xs text-slate-500">
                Generate official Canadian tenant vouchers, payment receipts, formal rent demand notices, and lease memos
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-2xs"
          >
            <Copy className="h-4 w-4" />
            <span>Copy Document Text</span>
          </button>
        </div>
      </div>

      {copiedNotification && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{copiedNotification}</span>
        </div>
      )}

      {/* Notice Template Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { id: 'payment_receipt' as const, label: 'Payment Receipt Voucher', icon: <Receipt className="h-4 w-4" /> },
          { id: 'rent_demand' as const, label: 'Formal Rent Demand', icon: <FileCheck className="h-4 w-4" /> },
          { id: 'utility_statement' as const, label: 'Utility Recovery Statement', icon: <Sparkles className="h-4 w-4" /> },
          { id: 'lease_renewal_memo' as const, label: 'Lease Renewal Memo', icon: <BookOpen className="h-4 w-4" /> },
          { id: 'move_out_statement' as const, label: 'Move-Out Escrow Settlement', icon: <ShieldCheck className="h-4 w-4" /> },
        ].map((tpl) => {
          const isActive = selectedNotice === tpl.id;
          return (
            <button
              key={tpl.id}
              onClick={() => setSelectedNotice(tpl.id)}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                isActive
                  ? 'bg-slate-900 text-white border-slate-950 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={isActive ? 'text-white' : 'text-slate-500'}>{tpl.icon}</span>
              </div>
              <p className="font-bold text-xs mt-2 truncate">{tpl.label}</p>
            </button>
          );
        })}
      </div>

      {/* Selection and Preview Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Tenant Selection & Details */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900">Select Resident Account</h2>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Resident / Tenant</label>
              <select
                value={selectedTenantId}
                onChange={(e) => setSelectedTenantId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                {tenants.map((t) => (
                  <option key={t.Tenant_ID} value={t.Tenant_ID}>
                    {t.Full_Name} ({t.Tenant_ID})
                  </option>
                ))}
              </select>
            </div>

            {selectedTenant && (
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Property:</span>
                  <span className="font-bold text-slate-800">{prop?.Property_Name || 'Assigned Property'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Suite:</span>
                  <span className="font-bold text-slate-800">{unit?.Unit_Number_Name || 'Suite'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Monthly Contract Rent:</span>
                  <span className="font-mono font-bold text-slate-800">{formatCurrency(activeLease?.Monthly_Rent || 2450)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Outstanding Balance:</span>
                  <span className={`font-mono font-bold ${totalBalanceDue > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                    {formatCurrency(totalBalanceDue)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Formal Document Viewer */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">Document Statement Preview</h2>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Statement</span>
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
            {generateNoticeContent()}
          </div>
        </div>
      </div>
    </div>
  );
};
