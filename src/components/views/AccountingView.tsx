import React, { useState } from 'react';
import {
  Scale,
  TrendingUp,
  Plus,
  FileSpreadsheet,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Calendar,
  Download,
  Printer,
  ShieldCheck,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { exportToExcel, exportToPDF, AuditReportData } from '../../utils/exportAuditReports';

export const AccountingView: React.FC = () => {
  const {
    coa,
    journals,
    currentUser,
    formatCurrency,
    postManualJournal,
    periods,
  } = useERP();

  const [activeTab, setActiveTab] = useState<'trial_balance' | 'income_statement' | 'journals' | 'coa'>('trial_balance');
  const [showPostModal, setShowPostModal] = useState(false);

  // Manual Journal Form
  const [description, setDescription] = useState('');
  const [debitAcc, setDebitAcc] = useState('1010');
  const [creditAcc, setCreditAcc] = useState('4000');
  const [amount, setAmount] = useState(500);
  const [memo, setMemo] = useState('');

  // Calculate live balances for each account from journal lines
  const calculateAccountBalance = (accountCode: string) => {
    let totalDebit = 0;
    let totalCredit = 0;

    journals.forEach((j) => {
      j.lines.forEach((l) => {
        if (l.Account_Code === accountCode) {
          totalDebit += l.Debit_Amount;
          totalCredit += l.Credit_Amount;
        }
      });
    });

    const account = coa.find((a) => a.Account_Code === accountCode);
    if (!account) return 0;

    if (account.Normal_Balance === 'Debit') {
      return totalDebit - totalCredit;
    } else {
      return totalCredit - totalDebit;
    }
  };

  // Trial Balance calculation
  let totalDebits = 0;
  let totalCredits = 0;

  journals.forEach((j) => {
    j.lines.forEach((l) => {
      totalDebits += l.Debit_Amount;
      totalCredits += l.Credit_Amount;
    });
  });

  const isTrialBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  // Income Statement
  const revenueAccounts = coa.filter((a) => a.Account_Type === 'Revenue');
  const expenseAccounts = coa.filter((a) => a.Account_Type === 'Expense');

  const totalRevenue = revenueAccounts.reduce((acc, a) => acc + calculateAccountBalance(a.Account_Code), 0);
  const totalExpenses = expenseAccounts.reduce((acc, a) => acc + calculateAccountBalance(a.Account_Code), 0);
  const netOperatingIncome = totalRevenue - totalExpenses;

  const handlePostJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (debitAcc === creditAcc) {
      alert('Debit and Credit accounts must be different.');
      return;
    }
    postManualJournal(new Date().toISOString().slice(0, 10), description, [
      { accountCode: debitAcc, debit: amount, credit: 0, memo },
      { accountCode: creditAcc, debit: 0, credit: amount, memo },
    ]);
    setShowPostModal(false);
    setDescription('');
    setMemo('');
  };

  // Quick Export Helpers
  const handleExportTrialBalanceExcel = () => {
    const reportData: AuditReportData = {
      title: 'General Ledger Trial Balance',
      subtitle: 'Official double-entry trial balance ledger audit extract',
      reportCode: 'AUD-TB-2026',
      generatedBy: currentUser.Full_Name,
      generatedAt: new Date().toLocaleString(),
      period: 'August 2026',
      propertyFilter: 'All Properties',
      headers: ['Account Code', 'Account Title', 'Type', 'Normal Balance', 'Debit ($)', 'Credit ($)'],
      rows: coa.map((a) => {
        const bal = calculateAccountBalance(a.Account_Code);
        const isDebit = a.Normal_Balance === 'Debit';
        return [
          a.Account_Code,
          a.Account_Name,
          a.Account_Type,
          a.Normal_Balance,
          isDebit && bal > 0 ? bal : 0,
          !isDebit && bal > 0 ? bal : 0,
        ];
      }),
      summaryRows: [
        { label: 'Total Footing Debits:', value: formatCurrency(totalDebits) },
        { label: 'Total Footing Credits:', value: formatCurrency(totalCredits) },
        { label: 'Audit Status:', value: isTrialBalanced ? 'BALANCED' : 'UNBALANCED' },
      ],
    };
    exportToExcel(reportData);
  };

  const handleExportTrialBalancePDF = () => {
    const reportData: AuditReportData = {
      title: 'General Ledger Trial Balance',
      subtitle: 'Official double-entry trial balance ledger audit extract',
      reportCode: 'AUD-TB-2026',
      generatedBy: currentUser.Full_Name,
      generatedAt: new Date().toLocaleString(),
      period: 'August 2026',
      propertyFilter: 'All Properties',
      headers: ['Account Code', 'Account Title', 'Type', 'Normal Balance', 'Debit ($)', 'Credit ($)'],
      rows: coa.map((a) => {
        const bal = calculateAccountBalance(a.Account_Code);
        const isDebit = a.Normal_Balance === 'Debit';
        return [
          a.Account_Code,
          a.Account_Name,
          a.Account_Type,
          a.Normal_Balance,
          isDebit && bal > 0 ? bal : 0,
          !isDebit && bal > 0 ? bal : 0,
        ];
      }),
      summaryRows: [
        { label: 'Total Footing Debits:', value: formatCurrency(totalDebits) },
        { label: 'Total Footing Credits:', value: formatCurrency(totalCredits) },
        { label: 'Audit Status:', value: isTrialBalanced ? 'BALANCED' : 'UNBALANCED' },
      ],
    };
    exportToPDF(reportData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl bg-white p-6 border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-700 text-white shadow-2xs">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 font-heading">
                Double-Entry Accounting & General Ledger
              </h1>
              <p className="text-xs text-slate-500">
                Real-time GAAP compliant General Ledger, Chart of Accounts, Trial Balance, and Income Statements
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportTrialBalanceExcel}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-700" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={handleExportTrialBalancePDF}
            className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-800 hover:bg-red-100 shadow-2xs"
          >
            <Download className="h-4 w-4 text-red-700" />
            <span>Export PDF</span>
          </button>
          <button
            onClick={() => setShowPostModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-red-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-red-800 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Post Manual Journal Entry</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        {[
          { id: 'trial_balance', label: 'Trial Balance & Audit', icon: Scale },
          { id: 'income_statement', label: 'Income Statement (P&L)', icon: TrendingUp },
          { id: 'journals', label: 'General Ledger Journals', icon: FileSpreadsheet },
          { id: 'coa', label: 'Chart of Accounts', icon: Layers },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
                isActive
                  ? 'bg-red-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Trial Balance */}
      {activeTab === 'trial_balance' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  isTrialBalanced
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                <Scale className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm font-heading">
                  {isTrialBalanced ? 'General Ledger Is Strictly Balanced' : 'Trial Balance Discrepancy Detected'}
                </h3>
                <p className="text-xs text-slate-500">
                  Total Debits equal Total Credits across all Chart of Accounts (0.00 Variance).
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Ledger Footing</span>
              <span className="text-base font-extrabold text-slate-900 font-mono">
                {formatCurrency(totalDebits)}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase font-bold text-[10px]">
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Account Title</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right">Debit ($)</th>
                  <th className="px-4 py-3 text-right">Credit ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {coa.map((a) => {
                  const bal = calculateAccountBalance(a.Account_Code);
                  const isDebit = a.Normal_Balance === 'Debit';

                  return (
                    <tr key={a.Account_Code} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-red-800">{a.Account_Code}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{a.Account_Name}</td>
                      <td className="px-4 py-3 text-slate-500">{a.Account_Type}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800">
                        {isDebit && bal > 0 ? formatCurrency(bal) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800">
                        {!isDebit && bal > 0 ? formatCurrency(bal) : '—'}
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-slate-50 font-extrabold text-slate-900 border-t-2 border-slate-300">
                  <td colSpan={3} className="px-4 py-3.5 text-right uppercase">
                    Trial Balance Footing:
                  </td>
                  <td className="px-4 py-3.5 text-right text-emerald-700 font-mono text-sm">
                    {formatCurrency(totalDebits)}
                  </td>
                  <td className="px-4 py-3.5 text-right text-emerald-700 font-mono text-sm">
                    {formatCurrency(totalCredits)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Income Statement */}
      {activeTab === 'income_statement' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-900 uppercase text-xs tracking-wider flex items-center gap-1.5">
                  <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                  <span>Operating Revenue</span>
                </span>
                <span className="font-bold text-emerald-700 text-sm font-mono">{formatCurrency(totalRevenue)}</span>
              </div>
              <div className="space-y-2 text-xs">
                {revenueAccounts.map((a) => (
                  <div key={a.Account_Code} className="flex justify-between text-slate-600">
                    <span>
                      {a.Account_Code} - {a.Account_Name}
                    </span>
                    <span className="font-semibold text-slate-900 font-mono">
                      {formatCurrency(calculateAccountBalance(a.Account_Code))}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-900 uppercase text-xs tracking-wider flex items-center gap-1.5">
                  <ArrowDownRight className="h-4 w-4 text-red-600" />
                  <span>Operating Expenses</span>
                </span>
                <span className="font-bold text-red-700 text-sm font-mono">{formatCurrency(totalExpenses)}</span>
              </div>
              <div className="space-y-2 text-xs">
                {expenseAccounts.map((a) => (
                  <div key={a.Account_Code} className="flex justify-between text-slate-600">
                    <span>
                      {a.Account_Code} - {a.Account_Name}
                    </span>
                    <span className="font-semibold text-red-700 font-mono">
                      ({formatCurrency(calculateAccountBalance(a.Account_Code))})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-red-200 bg-gradient-to-br from-red-900 to-red-950 p-6 space-y-5 flex flex-col justify-between text-white shadow-xs">
            <div className="space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-200">Profitability Summary</span>
              <h3 className="font-extrabold text-white text-lg font-heading">Net Operating Income (NOI)</h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-200">
                  <span>Gross Revenues:</span>
                  <span className="font-bold text-emerald-300 font-mono">{formatCurrency(totalRevenue)}</span>
                </div>
                <div className="flex justify-between text-slate-200">
                  <span>Total Expenses:</span>
                  <span className="font-bold text-red-300 font-mono">-{formatCurrency(totalExpenses)}</span>
                </div>
                <div className="pt-3 border-t border-red-800 flex justify-between items-center">
                  <span className="font-bold text-white">Net Operating Income:</span>
                  <span className="text-2xl font-extrabold text-emerald-300 font-mono">
                    {formatCurrency(netOperatingIncome)}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-red-950/60 p-3 text-xs text-red-200 border border-red-800">
              Operating Margin: <b className="text-white">{totalRevenue > 0 ? Math.round((netOperatingIncome / totalRevenue) * 100) : 0}%</b>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Journals */}
      {activeTab === 'journals' && (
        <div className="space-y-3">
          {journals.map((j) => (
            <div key={j.header.Journal_ID} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-red-800 text-xs bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                    {j.header.Journal_ID}
                  </span>
                  <span className="text-xs font-bold text-slate-900">{j.header.Description}</span>
                </div>
                <span className="text-[11px] text-slate-500 font-semibold">{j.header.Date}</span>
              </div>

              <div className="space-y-1.5 text-xs font-mono">
                {j.lines.map((l) => (
                  <div key={l.Line_ID} className="flex justify-between text-slate-700">
                    <span className={l.Debit_Amount > 0 ? 'text-slate-900 font-medium' : 'text-slate-500 pl-4'}>
                      {l.Account_Code} - {coa.find((c) => c.Account_Code === l.Account_Code)?.Account_Name}
                      {l.Memo && <span className="text-[10px] text-slate-400 italic ml-2">({l.Memo})</span>}
                    </span>
                    <div className="flex gap-4">
                      <span className="w-24 text-right text-emerald-700 font-semibold">
                        {l.Debit_Amount > 0 ? formatCurrency(l.Debit_Amount) : ''}
                      </span>
                      <span className="w-24 text-right text-red-700 font-semibold">
                        {l.Credit_Amount > 0 ? formatCurrency(l.Credit_Amount) : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Chart of Accounts */}
      {activeTab === 'coa' && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase font-bold text-[10px]">
                <th className="px-4 py-3">Account Code</th>
                <th className="px-4 py-3">Account Title</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Normal Balance</th>
                <th className="px-4 py-3 text-right">Net Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {coa.map((a) => {
                const bal = calculateAccountBalance(a.Account_Code);
                return (
                  <tr key={a.Account_Code} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-red-800">{a.Account_Code}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{a.Account_Name}</td>
                    <td className="px-4 py-3 text-slate-500">{a.Account_Type}</td>
                    <td className="px-4 py-3 text-slate-500">{a.Normal_Balance}</td>
                    <td className="px-4 py-3 text-right font-extrabold text-slate-900 font-mono">
                      {formatCurrency(Math.abs(bal))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Post Manual Journal Modal */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl p-6 space-y-4 animate-in fade-in">
            <h3 className="text-base font-bold text-slate-900 font-heading">Post Manual Journal Entry</h3>

            <form onSubmit={handlePostJournal} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Transaction Description</label>
                <input
                  type="text"
                  placeholder="e.g. Property insurance adjustment or bank charge"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-red-600 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Debit Account (+)</label>
                  <select
                    value={debitAcc}
                    onChange={(e) => setDebitAcc(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 font-mono"
                  >
                    {coa.map((a) => (
                      <option key={a.Account_Code} value={a.Account_Code}>
                        {a.Account_Code} - {a.Account_Name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Credit Account (-)</label>
                  <select
                    value={creditAcc}
                    onChange={(e) => setCreditAcc(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 font-mono"
                  >
                    {coa.map((a) => (
                      <option key={a.Account_Code} value={a.Account_Code}>
                        {a.Account_Code} - {a.Account_Name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 font-bold text-emerald-700"
                  required
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Memo / Supporting Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Bank Statement line item Ref #99210"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-red-700 font-bold text-white hover:bg-red-800"
                >
                  Post to General Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
