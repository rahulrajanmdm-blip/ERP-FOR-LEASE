import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Filter,
  Search,
  Download,
  Calendar,
  CreditCard,
  Building,
  User,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { RentTransaction } from '../../types';
import { InvoiceModal } from '../common/InvoiceModal';
import { ContraPaymentModal } from '../common/ContraPaymentModal';
import { CreateRentInvoiceModal } from '../common/CreateRentInvoiceModal';

export const BillingView: React.FC = () => {
  const {
    rentTransactions,
    properties,
    units,
    tenants,
    formatCurrency,
    generateMonthlyRentBatch,
    applyLateFeesToOverdue,
    currentMonth,
    hasPermission,
  } = useERP();

  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<RentTransaction | null>(null);
  const [batchMonthInput, setBatchMonthInput] = useState('2026-09');
  const [isContraModalOpen, setIsContraModalOpen] = useState(false);
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [contraTenantId, setContraTenantId] = useState<string | undefined>(undefined);

  // Calculations
  const filteredInvoices = rentTransactions.filter((inv) => {
    if (selectedMonth !== 'all' && inv.Period_Month !== selectedMonth) return false;
    if (selectedStatus !== 'all' && inv.Status !== selectedStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      const tenant = tenants.find((t) => t.Tenant_ID === inv.Tenant_ID);
      const prop = properties.find((p) => p.Property_ID === inv.Property_ID);
      return (
        inv.Rent_Txn_ID.toLowerCase().includes(q) ||
        tenant?.Full_Name.toLowerCase().includes(q) ||
        prop?.Property_Name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalBilled = filteredInvoices.reduce((acc, r) => acc + r.Amount_Billed, 0);
  const totalPaid = filteredInvoices.reduce((acc, r) => acc + r.Amount_Paid, 0);
  const totalBalance = filteredInvoices.reduce((acc, r) => acc + r.Balance, 0);
  const totalLateFees = filteredInvoices.reduce((acc, r) => acc + r.Late_Fee_Applied, 0);

  const handleRunBatch = () => {
    const result = generateMonthlyRentBatch(batchMonthInput);
    if (result.created > 0) {
      alert(`Successfully dispatched ${result.created} invoices for ${batchMonthInput} totaling ${formatCurrency(result.totalAmount)}.`);
    } else {
      alert(`All active leases are already billed for ${batchMonthInput}.`);
    }
  };

  const handleAssessLate = () => {
    const count = applyLateFeesToOverdue();
    if (count > 0) {
      alert(`Applied automated late fees to ${count} overdue accounts.`);
    } else {
      alert('No eligible overdue accounts without late fees found.');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Invoice ID', 'Period', 'Tenant', 'Property', 'Due Date', 'Billed', 'Paid', 'Balance', 'Late Fee', 'Status'];
    const rows = filteredInvoices.map((inv) => {
      const tenant = tenants.find((t) => t.Tenant_ID === inv.Tenant_ID);
      const prop = properties.find((p) => p.Property_ID === inv.Property_ID);
      return [
        inv.Rent_Txn_ID,
        inv.Period_Month,
        `"${tenant?.Full_Name || inv.Tenant_ID}"`,
        `"${prop?.Property_Name || inv.Property_ID}"`,
        inv.Due_Date,
        inv.Amount_Billed,
        inv.Amount_Paid,
        inv.Balance,
        inv.Late_Fee_Applied,
        inv.Status,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rent_Invoices_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const uniqueMonths = Array.from(new Set(rentTransactions.map((r) => r.Period_Month))).sort().reverse();

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl bg-white p-6 border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-700 text-white shadow-2xs">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 font-heading">
                Tenant Billing, Rent Invoicing & Payment Entries
              </h1>
              <p className="text-xs text-slate-500">
                Generate monthly rent cycles, create custom tenant invoices, and record consolidated payment entries
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Create Custom Rent Invoice */}
          <button
            onClick={() => setIsCreateInvoiceOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-red-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-red-800 transition-colors shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Create Rent Invoice</span>
          </button>

          {/* Main Action: Payment Entry */}
          {hasPermission('Can_Record_Contra_Payment') && (
            <button
              onClick={() => {
                setContraTenantId(undefined);
                setIsContraModalOpen(true);
              }}
              className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-800 transition-colors shadow-xs"
            >
              <CreditCard className="h-4 w-4 text-red-700" />
              <span>Record Payment Entry</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white p-1">
            <input
              type="month"
              value={batchMonthInput}
              onChange={(e) => setBatchMonthInput(e.target.value)}
              className="bg-transparent text-xs text-slate-800 px-2 py-0.5 focus:outline-none"
            />
            <button
              onClick={handleRunBatch}
              className="flex items-center gap-1 rounded bg-slate-100 hover:bg-slate-200 px-2.5 py-1 text-xs font-bold text-slate-800"
            >
              <Sparkles className="h-3 w-3 text-red-700" />
              <span>Run Batch</span>
            </button>
          </div>

          <button
            onClick={handleAssessLate}
            className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100"
          >
            <AlertTriangle className="h-3.5 w-3.5 text-amber-700" />
            <span>Assess Late Fees</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Financial Metrics Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Total Invoiced</span>
          <p className="text-2xl font-extrabold text-slate-900 font-heading mt-1">{formatCurrency(totalBilled)}</p>
          <span className="text-xs text-slate-500">{filteredInvoices.length} invoices generated</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700">Collections Received</span>
          <p className="text-2xl font-extrabold text-emerald-700 font-heading mt-1">{formatCurrency(totalPaid)}</p>
          <span className="text-xs text-slate-500">
            {totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 100}% collection efficiency
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-[10px] uppercase font-bold tracking-wider text-red-700">Outstanding Balance</span>
          <p className="text-2xl font-extrabold text-red-700 font-heading mt-1">{formatCurrency(totalBalance)}</p>
          <span className="text-xs text-slate-500">
            {filteredInvoices.filter((r) => r.Balance > 0).length} accounts pending
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700">Late Fees Charged</span>
          <p className="text-2xl font-extrabold text-amber-800 font-heading mt-1">{formatCurrency(totalLateFees)}</p>
          <span className="text-xs text-slate-500">Auto-assessed per lease rules</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search invoice #, resident, building..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-red-600 focus:outline-none w-64"
            />
          </div>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-red-600 focus:outline-none"
          >
            <option value="all">All Billing Cycles</option>
            {uniqueMonths.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-red-600 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Partial">Partial</option>
            <option value="Pending">Pending</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>

        <span className="text-xs text-slate-500 font-medium">{filteredInvoices.length} invoices matching</span>
      </div>

      {/* Invoices Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase font-bold text-[10px]">
                <th className="px-5 py-3.5">Invoice #</th>
                <th className="px-5 py-3.5">Period & Due</th>
                <th className="px-5 py-3.5">Resident</th>
                <th className="px-5 py-3.5">Property / Unit</th>
                <th className="px-5 py-3.5">Billed</th>
                <th className="px-5 py-3.5">Paid</th>
                <th className="px-5 py-3.5">Balance</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredInvoices.map((inv) => {
                const tenant = tenants.find((t) => t.Tenant_ID === inv.Tenant_ID);
                const prop = properties.find((p) => p.Property_ID === inv.Property_ID);
                const unit = units.find((u) => u.Unit_ID === inv.Unit_ID);

                const statusStyles = {
                  Paid: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                  Partial: 'bg-amber-50 text-amber-800 border-amber-200',
                  Pending: 'bg-blue-50 text-blue-800 border-blue-200',
                  Overdue: 'bg-red-50 text-red-800 border-red-200',
                };

                return (
                  <tr
                    key={inv.Rent_Txn_ID}
                    onClick={() => setSelectedInvoice(inv)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-4 font-mono font-bold text-red-700">
                      {inv.Rent_Txn_ID}
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">{inv.Period_Month}</p>
                      <p className="text-[10px] text-slate-500">Due {inv.Due_Date}</p>
                    </td>

                    <td className="px-5 py-4 font-medium text-slate-900">
                      {tenant?.Full_Name || inv.Tenant_ID}
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">{unit?.Unit_Number_Name}</p>
                      <p className="text-[10px] text-slate-500">{prop?.Property_Name}</p>
                    </td>

                    <td className="px-5 py-4 font-bold text-slate-900">
                      {formatCurrency(inv.Amount_Billed)}
                      {inv.Late_Fee_Applied > 0 && (
                        <span className="block text-[10px] text-amber-700 font-normal">
                          incl. ${inv.Late_Fee_Applied} late fee
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 font-bold text-emerald-700">
                      {formatCurrency(inv.Amount_Paid)}
                    </td>

                    <td className="px-5 py-4 font-extrabold">
                      <span className={inv.Balance > 0 ? 'text-red-700' : 'text-slate-400'}>
                        {formatCurrency(inv.Balance)}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${statusStyles[inv.Status]}`}>
                        {inv.Status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            setContraTenantId(inv.Tenant_ID);
                            setIsContraModalOpen(true);
                          }}
                          title="Record Payment Entry"
                          className="rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 px-2 py-1 text-[11px] font-bold text-red-800"
                        >
                          Payment Entry
                        </button>
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-slate-500">
                    No billing transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Single Invoice Modal */}
      {selectedInvoice && (
        <InvoiceModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

      {/* Payment Entry Multi-Split Modal */}
      {isContraModalOpen && (
        <ContraPaymentModal
          isOpen={isContraModalOpen}
          onClose={() => setIsContraModalOpen(false)}
          preselectedTenantId={contraTenantId}
        />
      )}

      {/* Create Custom Rent Invoice Modal */}
      {isCreateInvoiceOpen && (
        <CreateRentInvoiceModal
          isOpen={isCreateInvoiceOpen}
          onClose={() => setIsCreateInvoiceOpen(false)}
        />
      )}
    </div>
  );
};
