import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Filter,
  FileText,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Building2,
  Layers,
  Scale,
  CreditCard,
  Printer,
  Search,
  BookOpen,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Sparkles,
  Users,
  Briefcase,
  SlidersHorizontal,
  Zap,
  DoorClosed,
  AlertTriangle,
  Receipt,
  FileCheck,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import {
  AuditReportData,
  exportToExcel,
  exportToPDF,
  exportMasterAuditExcelPackage,
} from '../../utils/exportAuditReports';

type ReportCategory =
  | 'rent_receivable'
  | 'rent_payable'
  | 'utility_receivable'
  | 'utility_payable'
  | 'vacancy_roll'
  | 'rent_roll'
  | 'income_statement'
  | 'general_ledger';

type FilterMode = 'period' | 'as_on';

export const ReportsView: React.FC = () => {
  const {
    properties,
    units,
    tenants,
    landlords,
    leases,
    rentTransactions,
    depositTransactions,
    contraPayments,
    coa,
    journals,
    utilitiesMaster,
    utilityBills,
    utilitySplits,
    currentUser,
    formatCurrency,
    settings,
  } = useERP();

  const [activeReport, setActiveReport] = useState<ReportCategory>('rent_receivable');
  const [filterMode, setFilterMode] = useState<FilterMode>('period');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('2026-08');
  const [asOnDate, setAsOnDate] = useState<string>('2026-08-30');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [exportNotification, setExportNotification] = useState<string | null>(null);

  const notifyExport = (msg: string) => {
    setExportNotification(msg);
    setTimeout(() => setExportNotification(null), 4000);
  };

  const currentDate = filterMode === 'as_on' ? new Date(asOnDate) : new Date('2026-08-30');

  // -------------------------------------------------------------
  // 1. REPORT: Rent Receivable & AR Aging Report
  // -------------------------------------------------------------
  const rentReceivableData = useMemo(() => {
    return rentTransactions
      .filter((r) => (selectedPropertyId === 'all' ? true : r.Property_ID === selectedPropertyId))
      .filter((r) => {
        if (filterMode === 'period') {
          return r.Period_Month === selectedPeriod;
        } else {
          return new Date(r.Due_Date) <= new Date(asOnDate);
        }
      })
      .map((r) => {
        const prop = properties.find((p) => p.Property_ID === r.Property_ID);
        const unit = units.find((u) => u.Unit_ID === r.Unit_ID);
        const tenant = tenants.find((t) => t.Tenant_ID === r.Tenant_ID);

        const dueDate = new Date(r.Due_Date);
        const daysPastDue = Math.max(0, Math.ceil((currentDate.getTime() - dueDate.getTime()) / 86400000));

        let agingBucket: 'Current (0-30)' | '31-60 Days' | '61-90 Days' | '90+ Days' = 'Current (0-30)';
        if (daysPastDue > 90) agingBucket = '90+ Days';
        else if (daysPastDue > 60) agingBucket = '61-90 Days';
        else if (daysPastDue > 30) agingBucket = '31-60 Days';

        return {
          txnId: r.Rent_Txn_ID,
          propertyName: prop?.Property_Name || 'Unknown Property',
          unitName: unit?.Unit_Number_Name || r.Unit_ID,
          tenantName: tenant?.Full_Name || 'Unknown Resident',
          period: r.Period_Month,
          dueDate: r.Due_Date,
          daysPastDue,
          agingBucket,
          amountBilled: r.Amount_Billed,
          amountPaid: r.Amount_Paid,
          balance: r.Balance,
          status: r.Status,
        };
      })
      .filter((item) => {
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        return (
          item.propertyName.toLowerCase().includes(q) ||
          item.unitName.toLowerCase().includes(q) ||
          item.tenantName.toLowerCase().includes(q) ||
          item.status.toLowerCase().includes(q)
        );
      });
  }, [rentTransactions, properties, units, tenants, selectedPropertyId, selectedPeriod, asOnDate, filterMode, currentDate, searchTerm]);

  // -------------------------------------------------------------
  // 2. REPORT: Rent Payable & Landlord Remittance Schedule
  // -------------------------------------------------------------
  const rentPayableData = useMemo(() => {
    return properties
      .filter((p) => (selectedPropertyId === 'all' ? true : p.Property_ID === selectedPropertyId))
      .map((p) => {
        const landlord = landlords.find((l) => l.Landlord_ID === p.Landlord_ID);
        const propTxns = rentTransactions.filter(
          (r) =>
            r.Property_ID === p.Property_ID &&
            (filterMode === 'period' ? r.Period_Month === selectedPeriod : new Date(r.Due_Date) <= new Date(asOnDate))
        );

        const totalCollected = propTxns.reduce((acc, r) => acc + r.Amount_Paid, 0);
        const feePercentage = p.Management_Fee_Percentage || 6.5;
        const managementFee = totalCollected * (feePercentage / 100);
        const contraDeductions = contraPayments
          .filter((c) => c.Property_ID === p.Property_ID && c.Status === 'Settled')
          .reduce((acc, c) => acc + c.Amount, 0);

        const netPayable = Math.max(0, totalCollected - managementFee - contraDeductions);

        return {
          propertyId: p.Property_ID,
          propertyName: p.Property_Name,
          landlordName: landlord?.Full_Name || 'Direct Asset Holding',
          landlordEmail: landlord?.Email || '—',
          grossCollected: totalCollected,
          managementFeePct: feePercentage,
          managementFeeAmount: managementFee,
          contraDeductions,
          netRemittancePayable: netPayable,
          disbursementStatus: netPayable > 0 ? 'Pending Batch Run' : 'Settled',
        };
      })
      .filter((item) => {
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        return (
          item.propertyName.toLowerCase().includes(q) ||
          item.landlordName.toLowerCase().includes(q)
        );
      });
  }, [properties, landlords, rentTransactions, contraPayments, selectedPropertyId, selectedPeriod, asOnDate, filterMode, searchTerm]);

  // -------------------------------------------------------------
  // 3. REPORT: Utility Recovery Receivable (Tenant Sub-metering)
  // -------------------------------------------------------------
  const utilityReceivableData = useMemo(() => {
    return utilitySplits
      .map((s) => {
        const bill = utilityBills.find((b) => b.Utility_Bill_ID === s.Utility_Bill_ID);
        const prop = properties.find((p) => p.Property_ID === bill?.Property_ID);
        const unit = units.find((u) => u.Unit_ID === s.Unit_ID);
        const tenant = tenants.find((t) => t.Tenant_ID === s.Tenant_ID);

        if (selectedPropertyId !== 'all' && bill?.Property_ID !== selectedPropertyId) return null;
        if (filterMode === 'period' && bill?.Period_Month !== selectedPeriod) return null;
        if (filterMode === 'as_on' && bill && new Date(bill.Due_Date) > new Date(asOnDate)) return null;

        return {
          splitId: s.Split_ID,
          propertyName: prop?.Property_Name || 'Canadian Asset',
          unitName: unit?.Unit_Number_Name || s.Unit_ID,
          tenantName: tenant?.Full_Name || 'Resident',
          utilityType: bill?.Utility_Type || 'Hydro / Electric',
          provider: bill?.Provider_Name || 'Toronto Hydro',
          period: bill?.Period_Month || '2026-08',
          allocatedAmount: s.Allocated_Amount,
          status: s.Payment_Status,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .filter((item) => {
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        return (
          item.propertyName.toLowerCase().includes(q) ||
          item.unitName.toLowerCase().includes(q) ||
          item.tenantName.toLowerCase().includes(q) ||
          item.utilityType.toLowerCase().includes(q)
        );
      });
  }, [utilitySplits, utilityBills, properties, units, tenants, selectedPropertyId, selectedPeriod, asOnDate, filterMode, searchTerm]);

  // -------------------------------------------------------------
  // 4. REPORT: Master Utility Payables (Direct Vendor Liabilities)
  // -------------------------------------------------------------
  const utilityPayableData = useMemo(() => {
    return utilityBills
      .filter((b) => (selectedPropertyId === 'all' ? true : b.Property_ID === selectedPropertyId))
      .filter((b) => {
        if (filterMode === 'period') {
          return b.Period_Month === selectedPeriod;
        } else {
          return new Date(b.Due_Date) <= new Date(asOnDate);
        }
      })
      .map((b) => {
        const prop = properties.find((p) => p.Property_ID === b.Property_ID);
        const daysLeft = Math.ceil((new Date(b.Due_Date).getTime() - currentDate.getTime()) / 86400000);

        return {
          billId: b.Utility_Bill_ID,
          propertyName: prop?.Property_Name || 'Building Master Account',
          providerName: b.Provider_Name,
          utilityType: b.Utility_Type,
          invoiceNumber: b.Invoice_Number,
          period: b.Period_Month,
          dueDate: b.Due_Date,
          totalAmount: b.Total_Amount,
          status: b.Status,
          daysLeft,
        };
      })
      .filter((item) => {
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        return (
          item.propertyName.toLowerCase().includes(q) ||
          item.providerName.toLowerCase().includes(q) ||
          item.invoiceNumber.toLowerCase().includes(q) ||
          item.utilityType.toLowerCase().includes(q)
        );
      });
  }, [utilityBills, properties, selectedPropertyId, selectedPeriod, asOnDate, filterMode, currentDate, searchTerm]);

  // -------------------------------------------------------------
  // 5. REPORT: Vacancy & Space Turnover Roll
  // -------------------------------------------------------------
  const vacancyRollData = useMemo(() => {
    return units
      .filter((u) => (selectedPropertyId === 'all' ? true : u.Property_ID === selectedPropertyId))
      .map((u) => {
        const prop = properties.find((p) => p.Property_ID === u.Property_ID);
        const activeLease = leases.find(
          (l) => l.Unit_ID === u.Unit_ID && (l.Status === 'Active' || l.Status === 'Pending Renewal')
        );
        const isVacant = !activeLease || u.Current_Status === 'Vacant' || u.Current_Status === 'Turnover';

        return {
          unitId: u.Unit_ID,
          unitName: u.Unit_Number_Name,
          propertyName: prop?.Property_Name || 'Canadian Asset',
          propertyType: prop?.Property_Type || 'Residential',
          sqFt: u.Square_Footage,
          bedrooms: u.Bedrooms,
          targetRent: u.Target_Rent,
          actualRent: activeLease?.Monthly_Rent || 0,
          currentStatus: u.Current_Status,
          isVacant,
          potentialLostRevenue: isVacant ? u.Target_Rent : 0,
        };
      })
      .filter((item) => {
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        return (
          item.propertyName.toLowerCase().includes(q) ||
          item.unitName.toLowerCase().includes(q) ||
          item.currentStatus.toLowerCase().includes(q)
        );
      });
  }, [units, properties, leases, selectedPropertyId, searchTerm]);

  // -------------------------------------------------------------
  // 6. REPORT: Master Rent Roll
  // -------------------------------------------------------------
  const masterRentRollData = useMemo(() => {
    return units
      .filter((u) => (selectedPropertyId === 'all' ? true : u.Property_ID === selectedPropertyId))
      .map((u) => {
        const prop = properties.find((p) => p.Property_ID === u.Property_ID);
        const activeLease = leases.find(
          (l) => l.Unit_ID === u.Unit_ID && (l.Status === 'Active' || l.Status === 'Pending Renewal')
        );
        const tenant = activeLease ? tenants.find((t) => t.Tenant_ID === activeLease.Tenant_ID) : null;
        const currentInv = rentTransactions.find(
          (r) => r.Unit_ID === u.Unit_ID && (filterMode === 'period' ? r.Period_Month === selectedPeriod : true)
        );

        return {
          propertyId: u.Property_ID,
          propertyName: prop?.Property_Name || 'Unknown Property',
          unitId: u.Unit_ID,
          unitName: u.Unit_Number_Name,
          sqFt: u.Square_Footage,
          tenantName: tenant?.Full_Name || 'VACANT',
          tenantEmail: tenant?.Email || '—',
          leaseTerm: activeLease ? `${activeLease.Lease_Start} to ${activeLease.Lease_End}` : '—',
          monthlyRent: activeLease?.Monthly_Rent || u.Target_Rent,
          depositHeld: activeLease?.Deposit_Received || 0,
          currentBilled: currentInv?.Amount_Billed || (activeLease ? activeLease.Monthly_Rent : 0),
          currentPaid: currentInv?.Amount_Paid || 0,
          currentBalance: currentInv?.Balance || 0,
          status: u.Current_Status,
        };
      })
      .filter((item) => {
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        return (
          item.propertyName.toLowerCase().includes(q) ||
          item.unitName.toLowerCase().includes(q) ||
          item.tenantName.toLowerCase().includes(q)
        );
      });
  }, [units, properties, leases, tenants, rentTransactions, selectedPropertyId, selectedPeriod, filterMode, searchTerm]);

  // -------------------------------------------------------------
  // 7. REPORT: Statement of Operations / Income Statement
  // -------------------------------------------------------------
  const incomeStatementData = useMemo(() => {
    let rentalRevenue = 0;
    let lateFeeRevenue = 0;
    let utilityRecovery = 0;
    let managementFeeExpense = 0;
    let repairsExpense = 0;
    let utilityExpense = 0;
    let legalExpense = 0;

    journals.forEach((j) => {
      j.lines.forEach((l) => {
        if (l.Account_Code === '4100') rentalRevenue += l.Credit_Amount - l.Debit_Amount;
        if (l.Account_Code === '4200') lateFeeRevenue += l.Credit_Amount - l.Debit_Amount;
        if (l.Account_Code === '4300') utilityRecovery += l.Credit_Amount - l.Debit_Amount;
        if (l.Account_Code === '5100') managementFeeExpense += l.Debit_Amount - l.Credit_Amount;
        if (l.Account_Code === '5200') repairsExpense += l.Debit_Amount - l.Credit_Amount;
        if (l.Account_Code === '5300') utilityExpense += l.Debit_Amount - l.Credit_Amount;
        if (l.Account_Code === '5400') legalExpense += l.Debit_Amount - l.Credit_Amount;
      });
    });

    const totalOperatingRevenue = rentalRevenue + lateFeeRevenue + utilityRecovery;
    const totalOperatingExpenses = managementFeeExpense + repairsExpense + utilityExpense + legalExpense;
    const netOperatingIncome = totalOperatingRevenue - totalOperatingExpenses;

    return {
      rentalRevenue,
      lateFeeRevenue,
      utilityRecovery,
      totalOperatingRevenue,
      managementFeeExpense,
      repairsExpense,
      utilityExpense,
      legalExpense,
      totalOperatingExpenses,
      netOperatingIncome,
    };
  }, [journals]);

  // -------------------------------------------------------------
  // 8. REPORT: General Ledger Trial Balance
  // -------------------------------------------------------------
  const trialBalanceData = useMemo(() => {
    let totalDebit = 0;
    let totalCredit = 0;

    const rows = coa.map((a) => {
      let accDebit = 0;
      let accCredit = 0;

      journals.forEach((j) => {
        j.lines.forEach((l) => {
          if (l.Account_Code === a.Account_Code) {
            accDebit += l.Debit_Amount;
            accCredit += l.Credit_Amount;
          }
        });
      });

      const netDebit = a.Normal_Balance === 'Debit' ? Math.max(0, accDebit - accCredit) : 0;
      const netCredit = a.Normal_Balance === 'Credit' ? Math.max(0, accCredit - accDebit) : 0;

      totalDebit += netDebit;
      totalCredit += netCredit;

      return {
        code: a.Account_Code,
        name: a.Account_Name,
        type: a.Account_Type,
        debit: netDebit,
        credit: netCredit,
      };
    });

    return {
      rows,
      totalDebit,
      totalCredit,
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
    };
  }, [coa, journals]);

  // -------------------------------------------------------------
  // Export Handlers
  // -------------------------------------------------------------
  const handleExportCurrentReport = (format: 'excel' | 'pdf') => {
    let reportData: AuditReportData;
    const periodLabel = filterMode === 'period' ? `Period: ${selectedPeriod}` : `As on: ${asOnDate}`;

    if (activeReport === 'rent_receivable') {
      const totalBilled = rentReceivableData.reduce((a, b) => a + b.amountBilled, 0);
      const totalPaid = rentReceivableData.reduce((a, b) => a + b.amountPaid, 0);
      const totalBalance = rentReceivableData.reduce((a, b) => a + b.balance, 0);

      reportData = {
        title: 'Rent Receivable & Accounts Receivable Aging',
        subtitle: 'Comprehensive tenant receivable schedule with past due aging breakdowns',
        reportCode: 'DD-FIN-AR-01',
        generatedBy: currentUser.Full_Name,
        generatedAt: new Date().toLocaleString(),
        period: periodLabel,
        asOnDate: filterMode === 'as_on' ? asOnDate : undefined,
        propertyFilter: selectedPropertyId === 'all' ? 'All Canadian Properties' : selectedPropertyId,
        headers: ['Unit', 'Tenant Name', 'Property', 'Due Date', 'Days Overdue', 'Aging Bracket', 'Billed ($)', 'Paid ($)', 'Balance ($)', 'Status'],
        rows: rentReceivableData.map((r) => [
          r.unitName,
          r.tenantName,
          r.propertyName,
          r.dueDate,
          r.daysPastDue,
          r.agingBucket,
          r.amountBilled,
          r.amountPaid,
          r.balance,
          r.status,
        ]),
        summaryRows: [
          { label: 'Total Billed Gross:', value: formatCurrency(totalBilled) },
          { label: 'Total Collections Settled:', value: formatCurrency(totalPaid) },
          { label: 'Net Outstanding AR Balance:', value: formatCurrency(totalBalance) },
        ],
      };
    } else if (activeReport === 'rent_payable') {
      const totalGross = rentPayableData.reduce((a, b) => a + b.grossCollected, 0);
      const totalFee = rentPayableData.reduce((a, b) => a + b.managementFeeAmount, 0);
      const totalRemit = rentPayableData.reduce((a, b) => a + b.netRemittancePayable, 0);

      reportData = {
        title: 'Landlord Remittance & Rent Payable Schedule',
        subtitle: 'Statement of collected rents, asset management fee deductions, and net disbursements',
        reportCode: 'DD-FIN-AP-01',
        generatedBy: currentUser.Full_Name,
        generatedAt: new Date().toLocaleString(),
        period: periodLabel,
        asOnDate: filterMode === 'as_on' ? asOnDate : undefined,
        propertyFilter: selectedPropertyId === 'all' ? 'All Canadian Properties' : selectedPropertyId,
        headers: ['Property Name', 'Asset Owner / Landlord', 'Gross Collected ($)', 'Mgt Fee %', 'Mgt Fee Deducted ($)', 'Contra Deductions ($)', 'Net Payable to Owner ($)', 'Status'],
        rows: rentPayableData.map((r) => [
          r.propertyName,
          r.landlordName,
          r.grossCollected,
          `${r.managementFeePct}%`,
          r.managementFeeAmount,
          r.contraDeductions,
          r.netRemittancePayable,
          r.disbursementStatus,
        ]),
        summaryRows: [
          { label: 'Total Rents Collected:', value: formatCurrency(totalGross) },
          { label: 'Total Management Fees Earned:', value: formatCurrency(totalFee) },
          { label: 'Total Net Remittance Payable:', value: formatCurrency(totalRemit) },
        ],
      };
    } else if (activeReport === 'utility_receivable') {
      const totalAllocated = utilityReceivableData.reduce((a, b) => a + b.allocatedAmount, 0);

      reportData = {
        title: 'Tenant Utility Recovery Receivable Report',
        subtitle: 'Sub-metered and allocated utility receivables billed to residents',
        reportCode: 'DD-FIN-UTIL-REC',
        generatedBy: currentUser.Full_Name,
        generatedAt: new Date().toLocaleString(),
        period: periodLabel,
        asOnDate: filterMode === 'as_on' ? asOnDate : undefined,
        propertyFilter: selectedPropertyId === 'all' ? 'All Canadian Properties' : selectedPropertyId,
        headers: ['Unit', 'Tenant Name', 'Property', 'Utility Type', 'Supplier', 'Billing Period', 'Allocated Amount ($)', 'Payment Status'],
        rows: utilityReceivableData.map((u) => [
          u.unitName,
          u.tenantName,
          u.propertyName,
          u.utilityType,
          u.provider,
          u.period,
          u.allocatedAmount,
          u.status,
        ]),
        summaryRows: [
          { label: 'Total Utility Billed to Tenants:', value: formatCurrency(totalAllocated) },
        ],
      };
    } else if (activeReport === 'utility_payable') {
      const totalUtilityBills = utilityPayableData.reduce((a, b) => a + b.totalAmount, 0);

      reportData = {
        title: 'Master Utility Payables & Vendor Liabilities',
        subtitle: 'Master building utility invoices from Toronto Hydro, Enbridge, and municipal water',
        reportCode: 'DD-FIN-UTIL-PAY',
        generatedBy: currentUser.Full_Name,
        generatedAt: new Date().toLocaleString(),
        period: periodLabel,
        asOnDate: filterMode === 'as_on' ? asOnDate : undefined,
        propertyFilter: selectedPropertyId === 'all' ? 'All Canadian Properties' : selectedPropertyId,
        headers: ['Building Property', 'Provider Name', 'Utility Type', 'Invoice #', 'Billing Period', 'Due Date', 'Invoice Amount ($)', 'Status'],
        rows: utilityPayableData.map((u) => [
          u.propertyName,
          u.providerName,
          u.utilityType,
          u.invoiceNumber,
          u.period,
          u.dueDate,
          u.totalAmount,
          u.status,
        ]),
        summaryRows: [
          { label: 'Total Utility Invoices Payable:', value: formatCurrency(totalUtilityBills) },
        ],
      };
    } else if (activeReport === 'vacancy_roll') {
      const vacantCount = vacancyRollData.filter((v) => v.isVacant).length;
      const totalLostRent = vacancyRollData.reduce((a, b) => a + b.potentialLostRevenue, 0);

      reportData = {
        title: 'Vacancy & Space Occupancy Schedule',
        subtitle: 'Turnover tracking, vacant suite inventory, and potential lost rent analysis',
        reportCode: 'DD-FIN-VAC-01',
        generatedBy: currentUser.Full_Name,
        generatedAt: new Date().toLocaleString(),
        period: periodLabel,
        asOnDate: filterMode === 'as_on' ? asOnDate : undefined,
        propertyFilter: selectedPropertyId === 'all' ? 'All Canadian Properties' : selectedPropertyId,
        headers: ['Unit', 'Property Name', 'Asset Type', 'Area (Sq Ft)', 'Bedrooms', 'Market Target Rent ($)', 'Current Status', 'Potential Lost Rent ($)'],
        rows: vacancyRollData.map((v) => [
          v.unitName,
          v.propertyName,
          v.propertyType,
          v.sqFt,
          v.bedrooms,
          v.targetRent,
          v.currentStatus,
          v.potentialLostRevenue,
        ]),
        summaryRows: [
          { label: 'Total Suites Analyzed:', value: vacancyRollData.length },
          { label: 'Vacant Suites Count:', value: vacantCount },
          { label: 'Monthly Potential Lost Revenue:', value: formatCurrency(totalLostRent) },
        ],
      };
    } else if (activeReport === 'income_statement') {
      reportData = {
        title: 'Statement of Operations (Income Statement)',
        subtitle: 'Statement of revenues, property operating expenses, and Net Operating Income (NOI)',
        reportCode: 'DD-FIN-IS-01',
        generatedBy: currentUser.Full_Name,
        generatedAt: new Date().toLocaleString(),
        period: periodLabel,
        asOnDate: filterMode === 'as_on' ? asOnDate : undefined,
        propertyFilter: selectedPropertyId === 'all' ? 'All Canadian Properties' : selectedPropertyId,
        headers: ['Category / Account Description', 'Period Amount ($CAD)', 'Notes'],
        rows: [
          ['Rental Revenue (4100)', incomeStatementData.rentalRevenue, 'Gross tenant lease collections'],
          ['Late Fees & Penalties (4200)', incomeStatementData.lateFeeRevenue, 'Late payment charges'],
          ['Utility Recoveries (4300)', incomeStatementData.utilityRecovery, 'Sub-metered resident reimbursements'],
          ['--- TOTAL OPERATING REVENUES ---', incomeStatementData.totalOperatingRevenue, 'Gross Operating Revenue'],
          ['Asset Management Fees (5100)', incomeStatementData.managementFeeExpense, 'Property management fees'],
          ['Repairs & Maintenance (5200)', incomeStatementData.repairsExpense, 'Facility work orders & maintenance'],
          ['Master Utilities Expense (5300)', incomeStatementData.utilityExpense, 'Hydro, gas, water charges'],
          ['Legal & Professional Fees (5400)', incomeStatementData.legalExpense, 'Advisory & paralegal expenses'],
          ['--- TOTAL OPERATING EXPENSES ---', incomeStatementData.totalOperatingExpenses, 'Operating Overhead'],
          ['--- NET OPERATING INCOME (NOI) ---', incomeStatementData.netOperatingIncome, 'Net Property Operating Return'],
        ],
        summaryRows: [
          { label: 'Gross Operating Revenue:', value: formatCurrency(incomeStatementData.totalOperatingRevenue) },
          { label: 'Gross Operating Expenses:', value: formatCurrency(incomeStatementData.totalOperatingExpenses) },
          { label: 'Net Operating Income (NOI):', value: formatCurrency(incomeStatementData.netOperatingIncome) },
        ],
      };
    } else {
      // General Ledger Trial Balance
      reportData = {
        title: 'General Ledger Trial Balance',
        subtitle: 'Trial balance of all balance sheet and income statement accounts in CAD',
        reportCode: 'DD-FIN-TB-01',
        generatedBy: currentUser.Full_Name,
        generatedAt: new Date().toLocaleString(),
        period: periodLabel,
        asOnDate: filterMode === 'as_on' ? asOnDate : undefined,
        propertyFilter: 'Master Enterprise Ledger',
        headers: ['Account Code', 'Account Name', 'Type', 'Debit ($CAD)', 'Credit ($CAD)'],
        rows: trialBalanceData.rows.map((r) => [r.code, r.name, r.type, r.debit, r.credit]),
        summaryRows: [
          { label: 'Total Debits:', value: formatCurrency(trialBalanceData.totalDebit) },
          { label: 'Total Credits:', value: formatCurrency(trialBalanceData.totalCredit) },
          { label: 'Ledger Balancing Status:', value: trialBalanceData.isBalanced ? 'Balanced (Zero Discrepancy)' : 'Out of Balance' },
        ],
      };
    }

    if (format === 'excel') {
      exportToExcel(reportData);
      notifyExport(`Exported ${reportData.title} to Excel (.xlsx)`);
    } else {
      exportToPDF(reportData);
      notifyExport(`Exported ${reportData.title} to PDF`);
    }
  };

  const handleExportMasterPackage = () => {
    const periodLabel = filterMode === 'period' ? `Period: ${selectedPeriod}` : `As on: ${asOnDate}`;

    // 1. Rent Receivable
    const totalBilled = rentReceivableData.reduce((a, b) => a + b.amountBilled, 0);
    const totalPaid = rentReceivableData.reduce((a, b) => a + b.amountPaid, 0);
    const totalBalance = rentReceivableData.reduce((a, b) => a + b.balance, 0);
    const repAR: AuditReportData = {
      title: 'Rent Receivable & AR Aging',
      subtitle: 'Schedule of tenant accounts receivable with aging analysis',
      reportCode: 'DD-FIN-AR-01',
      generatedBy: currentUser.Full_Name,
      generatedAt: new Date().toLocaleString(),
      period: periodLabel,
      asOnDate: filterMode === 'as_on' ? asOnDate : undefined,
      propertyFilter: selectedPropertyId === 'all' ? 'All Canadian Properties' : selectedPropertyId,
      headers: ['Unit', 'Tenant Name', 'Property', 'Due Date', 'Days Overdue', 'Aging Bracket', 'Billed ($)', 'Paid ($)', 'Balance ($)', 'Status'],
      rows: rentReceivableData.map((r) => [r.unitName, r.tenantName, r.propertyName, r.dueDate, r.daysPastDue, r.agingBucket, r.amountBilled, r.amountPaid, r.balance, r.status]),
      summaryRows: [
        { label: 'Total Billed Gross:', value: formatCurrency(totalBilled) },
        { label: 'Total Collections Settled:', value: formatCurrency(totalPaid) },
        { label: 'Net Outstanding AR Balance:', value: formatCurrency(totalBalance) },
      ],
    };

    // 2. Rent Payable
    const totalGross = rentPayableData.reduce((a, b) => a + b.grossCollected, 0);
    const totalFee = rentPayableData.reduce((a, b) => a + b.managementFeeAmount, 0);
    const totalRemit = rentPayableData.reduce((a, b) => a + b.netRemittancePayable, 0);
    const repAP: AuditReportData = {
      title: 'Landlord Rent Remittance & Payables',
      subtitle: 'Statement of collected rents, asset management fee deductions, and net disbursements',
      reportCode: 'DD-FIN-AP-01',
      generatedBy: currentUser.Full_Name,
      generatedAt: new Date().toLocaleString(),
      period: periodLabel,
      asOnDate: filterMode === 'as_on' ? asOnDate : undefined,
      propertyFilter: selectedPropertyId === 'all' ? 'All Canadian Properties' : selectedPropertyId,
      headers: ['Property Name', 'Asset Owner / Landlord', 'Gross Collected ($)', 'Mgt Fee %', 'Mgt Fee Deducted ($)', 'Contra Deductions ($)', 'Net Payable ($)', 'Status'],
      rows: rentPayableData.map((r) => [r.propertyName, r.landlordName, r.grossCollected, `${r.managementFeePct}%`, r.managementFeeAmount, r.contraDeductions, r.netRemittancePayable, r.disbursementStatus]),
      summaryRows: [
        { label: 'Total Rents Collected:', value: formatCurrency(totalGross) },
        { label: 'Total Management Fees Earned:', value: formatCurrency(totalFee) },
        { label: 'Total Net Remittance Payable:', value: formatCurrency(totalRemit) },
      ],
    };

    // 3. Utility Receivable
    const totalAllocated = utilityReceivableData.reduce((a, b) => a + b.allocatedAmount, 0);
    const repUtilRec: AuditReportData = {
      title: 'Tenant Utility Recovery Receivable',
      subtitle: 'Sub-metered and allocated utility receivables billed to residents',
      reportCode: 'DD-FIN-UTIL-REC',
      generatedBy: currentUser.Full_Name,
      generatedAt: new Date().toLocaleString(),
      period: periodLabel,
      asOnDate: filterMode === 'as_on' ? asOnDate : undefined,
      propertyFilter: selectedPropertyId === 'all' ? 'All Canadian Properties' : selectedPropertyId,
      headers: ['Unit', 'Tenant Name', 'Property', 'Utility Type', 'Supplier', 'Billing Period', 'Allocated ($)', 'Status'],
      rows: utilityReceivableData.map((u) => [u.unitName, u.tenantName, u.propertyName, u.utilityType, u.provider, u.period, u.allocatedAmount, u.status]),
      summaryRows: [{ label: 'Total Utility Billed to Tenants:', value: formatCurrency(totalAllocated) }],
    };

    // 4. Utility Payable
    const totalUtilityBills = utilityPayableData.reduce((a, b) => a + b.totalAmount, 0);
    const repUtilPay: AuditReportData = {
      title: 'Master Utility Payables',
      subtitle: 'Master building utility invoices from Toronto Hydro, Enbridge, and municipal water',
      reportCode: 'DD-FIN-UTIL-PAY',
      generatedBy: currentUser.Full_Name,
      generatedAt: new Date().toLocaleString(),
      period: periodLabel,
      asOnDate: filterMode === 'as_on' ? asOnDate : undefined,
      propertyFilter: selectedPropertyId === 'all' ? 'All Canadian Properties' : selectedPropertyId,
      headers: ['Building Property', 'Provider Name', 'Utility Type', 'Invoice #', 'Billing Period', 'Due Date', 'Invoice Amount ($)', 'Status'],
      rows: utilityPayableData.map((u) => [u.propertyName, u.providerName, u.utilityType, u.invoiceNumber, u.period, u.dueDate, u.totalAmount, u.status]),
      summaryRows: [{ label: 'Total Utility Invoices Payable:', value: formatCurrency(totalUtilityBills) }],
    };

    // 5. Vacancy Roll
    const repVac: AuditReportData = {
      title: 'Vacancy & Space Occupancy Schedule',
      subtitle: 'Turnover tracking, vacant suite inventory, and potential lost rent analysis',
      reportCode: 'DD-FIN-VAC-01',
      generatedBy: currentUser.Full_Name,
      generatedAt: new Date().toLocaleString(),
      period: periodLabel,
      asOnDate: filterMode === 'as_on' ? asOnDate : undefined,
      propertyFilter: selectedPropertyId === 'all' ? 'All Canadian Properties' : selectedPropertyId,
      headers: ['Unit', 'Property Name', 'Asset Type', 'Area (Sq Ft)', 'Bedrooms', 'Market Target Rent ($)', 'Current Status', 'Potential Lost Rent ($)'],
      rows: vacancyRollData.map((v) => [v.unitName, v.propertyName, v.propertyType, v.sqFt, v.bedrooms, v.targetRent, v.currentStatus, v.potentialLostRevenue]),
      summaryRows: [
        { label: 'Total Suites Analyzed:', value: vacancyRollData.length },
        { label: 'Vacant Suites Count:', value: vacancyRollData.filter((v) => v.isVacant).length },
        { label: 'Monthly Potential Lost Revenue:', value: formatCurrency(vacancyRollData.reduce((a, b) => a + b.potentialLostRevenue, 0)) },
      ],
    };

    // 6. Master Rent Roll
    const repRentRoll: AuditReportData = {
      title: 'Master Rent Roll',
      subtitle: 'Comprehensive portfolio unit inventory and in-place lease schedule',
      reportCode: 'DD-FIN-RR-01',
      generatedBy: currentUser.Full_Name,
      generatedAt: new Date().toLocaleString(),
      period: periodLabel,
      asOnDate: filterMode === 'as_on' ? asOnDate : undefined,
      propertyFilter: selectedPropertyId === 'all' ? 'All Canadian Properties' : selectedPropertyId,
      headers: ['Property', 'Suite #', 'Occupant Tenant', 'Lease Period', 'Monthly Rent ($)', 'Deposit Held ($)', 'Current Paid ($)', 'Balance ($)', 'Status'],
      rows: masterRentRollData.map((r) => [r.propertyName, r.unitName, r.tenantName, r.leaseTerm, r.monthlyRent, r.depositHeld, r.currentPaid, r.currentBalance, r.status]),
    };

    // 7. Statement of Operations (Income Statement)
    const repIS: AuditReportData = {
      title: 'Statement of Operations (Income Statement)',
      subtitle: 'Statement of revenues, property operating expenses, and Net Operating Income (NOI)',
      reportCode: 'DD-FIN-IS-01',
      generatedBy: currentUser.Full_Name,
      generatedAt: new Date().toLocaleString(),
      period: periodLabel,
      asOnDate: filterMode === 'as_on' ? asOnDate : undefined,
      propertyFilter: selectedPropertyId === 'all' ? 'All Canadian Properties' : selectedPropertyId,
      headers: ['Category / Account Description', 'Period Amount ($CAD)', 'Notes'],
      rows: [
        ['Rental Revenue (4100)', incomeStatementData.rentalRevenue, 'Gross tenant lease collections'],
        ['Late Fees & Penalties (4200)', incomeStatementData.lateFeeRevenue, 'Late payment charges'],
        ['Utility Recoveries (4300)', incomeStatementData.utilityRecovery, 'Sub-metered resident reimbursements'],
        ['--- TOTAL OPERATING REVENUES ---', incomeStatementData.totalOperatingRevenue, 'Gross Operating Revenue'],
        ['Asset Management Fees (5100)', incomeStatementData.managementFeeExpense, 'Property management fees'],
        ['Repairs & Maintenance (5200)', incomeStatementData.repairsExpense, 'Facility work orders & maintenance'],
        ['Master Utilities Expense (5300)', incomeStatementData.utilityExpense, 'Hydro, gas, water charges'],
        ['Legal & Professional Fees (5400)', incomeStatementData.legalExpense, 'Advisory & paralegal expenses'],
        ['--- TOTAL OPERATING EXPENSES ---', incomeStatementData.totalOperatingExpenses, 'Operating Overhead'],
        ['--- NET OPERATING INCOME (NOI) ---', incomeStatementData.netOperatingIncome, 'Net Property Operating Return'],
      ],
      summaryRows: [
        { label: 'Gross Operating Revenue:', value: formatCurrency(incomeStatementData.totalOperatingRevenue) },
        { label: 'Gross Operating Expenses:', value: formatCurrency(incomeStatementData.totalOperatingExpenses) },
        { label: 'Net Operating Income (NOI):', value: formatCurrency(incomeStatementData.netOperatingIncome) },
      ],
    };

    // 8. General Ledger Trial Balance
    const repTB: AuditReportData = {
      title: 'General Ledger Trial Balance',
      subtitle: 'Trial balance of all balance sheet and income statement accounts in CAD',
      reportCode: 'DD-FIN-TB-01',
      generatedBy: currentUser.Full_Name,
      generatedAt: new Date().toLocaleString(),
      period: periodLabel,
      asOnDate: filterMode === 'as_on' ? asOnDate : undefined,
      propertyFilter: 'Master Enterprise Ledger',
      headers: ['Account Code', 'Account Name', 'Type', 'Debit ($CAD)', 'Credit ($CAD)'],
      rows: trialBalanceData.rows.map((r) => [r.code, r.name, r.type, r.debit, r.credit]),
      summaryRows: [
        { label: 'Total Debits:', value: formatCurrency(trialBalanceData.totalDebit) },
        { label: 'Total Credits:', value: formatCurrency(trialBalanceData.totalCredit) },
        { label: 'Ledger Balancing Status:', value: trialBalanceData.isBalanced ? 'Balanced (Zero Discrepancy)' : 'Out of Balance' },
      ],
    };

    exportMasterAuditExcelPackage([repAR, repAP, repUtilRec, repUtilPay, repVac, repRentRoll, repIS, repTB]);
    notifyExport('Master Multi-Sheet Financial Package exported successfully.');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Corporate Financial & Asset Management Reports
              </h1>
              <p className="text-xs text-slate-500">
                Generate period-wise and as-on financial statements, receivables, payables, and vacancy rolls for Dream Dwell
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleExportCurrentReport('excel')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-700" />
            <span>Export Excel (.xlsx)</span>
          </button>
          <button
            onClick={() => handleExportCurrentReport('pdf')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <Download className="h-4 w-4 text-slate-700" />
            <span>Export PDF</span>
          </button>
          <button
            onClick={handleExportMasterPackage}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition-all"
          >
            <Layers className="h-4 w-4 text-emerald-400" />
            <span>Master Financial Workbook</span>
          </button>
        </div>
      </div>

      {exportNotification && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{exportNotification}</span>
        </div>
      )}

      {/* Report Categories Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {[
          { id: 'rent_receivable' as const, label: 'Rent Receivable', icon: <Receipt className="h-3.5 w-3.5" /> },
          { id: 'rent_payable' as const, label: 'Rent Payable', icon: <DollarSign className="h-3.5 w-3.5" /> },
          { id: 'utility_receivable' as const, label: 'Utility Receivable', icon: <Zap className="h-3.5 w-3.5" /> },
          { id: 'utility_payable' as const, label: 'Utility Payable', icon: <CreditCard className="h-3.5 w-3.5" /> },
          { id: 'vacancy_roll' as const, label: 'Vacancy Roll', icon: <DoorClosed className="h-3.5 w-3.5" /> },
          { id: 'rent_roll' as const, label: 'Master Rent Roll', icon: <Building2 className="h-3.5 w-3.5" /> },
          { id: 'income_statement' as const, label: 'Income Statement', icon: <TrendingUp className="h-3.5 w-3.5" /> },
          { id: 'general_ledger' as const, label: 'Trial Balance', icon: <Scale className="h-3.5 w-3.5" /> },
        ].map((rep) => {
          const isActive = activeReport === rep.id;
          return (
            <button
              key={rep.id}
              onClick={() => setActiveReport(rep.id)}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                isActive
                  ? 'bg-slate-900 text-white border-slate-950 font-bold shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-center mb-1 text-slate-500">
                <span className={isActive ? 'text-white' : 'text-slate-600'}>{rep.icon}</span>
              </div>
              <p className="text-[11px] leading-tight truncate">{rep.label}</p>
            </button>
          );
        })}
      </div>

      {/* Advanced Filter Bar: Period-Wise vs As On Date */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Generation Filter Mode Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
              <span>Generation Filter:</span>
            </span>

            <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200">
              <button
                onClick={() => setFilterMode('period')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  filterMode === 'period'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Period-Wise
              </button>
              <button
                onClick={() => setFilterMode('as_on')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  filterMode === 'as_on'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                As On Date
              </button>
            </div>
          </div>

          {/* Dynamic Filter Inputs */}
          <div className="flex flex-wrap items-center gap-3">
            {filterMode === 'period' ? (
              <div className="flex items-center gap-1.5">
                <label className="text-xs text-slate-500 font-medium">Reporting Month:</label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                >
                  <option value="2026-08">August 2026</option>
                  <option value="2026-07">July 2026</option>
                  <option value="2026-06">June 2026</option>
                  <option value="2026-05">May 2026</option>
                  <option value="2026-04">April 2026</option>
                  <option value="2026-03">March 2026</option>
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <label className="text-xs text-slate-500 font-medium">As of Cutoff Date:</label>
                <input
                  type="date"
                  value={asOnDate}
                  onChange={(e) => setAsOnDate(e.target.value)}
                  className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>
            )}

            {/* Property Filter */}
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-slate-500 font-medium">Property:</label>
              <select
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                <option value="all">All Canadian Properties</option>
                {properties.map((p) => (
                  <option key={p.Property_ID} value={p.Property_ID}>
                    {p.Property_Name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Search Filter */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search report rows by name, unit, account code, or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
        </div>
      </div>

      {/* Main Report Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Header Details */}
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              {activeReport === 'rent_receivable' && 'Rent Receivable & Accounts Receivable Aging'}
              {activeReport === 'rent_payable' && 'Landlord Remittance & Rent Payable Schedule'}
              {activeReport === 'utility_receivable' && 'Tenant Utility Recovery Receivable Report'}
              {activeReport === 'utility_payable' && 'Master Utility Payables & Vendor Liabilities'}
              {activeReport === 'vacancy_roll' && 'Vacancy & Space Occupancy Schedule'}
              {activeReport === 'rent_roll' && 'Master Rent Roll & Occupancy Schedule'}
              {activeReport === 'income_statement' && 'Statement of Operations (Income Statement)'}
              {activeReport === 'general_ledger' && 'General Ledger Trial Balance'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {filterMode === 'period' ? `Reporting Period: ${selectedPeriod}` : `Calculated As On: ${asOnDate}`} • Currency: CAD ($)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
              Dream Dwell Asset Management Canada
            </span>
          </div>
        </div>

        {/* 1. VIEW: Rent Receivable */}
        {activeReport === 'rent_receivable' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Suite / Unit</th>
                  <th className="px-4 py-3">Tenant Name</th>
                  <th className="px-4 py-3">Property</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3 text-center">Days Past Due</th>
                  <th className="px-4 py-3">Aging Bracket</th>
                  <th className="px-4 py-3 text-right">Billed ($)</th>
                  <th className="px-4 py-3 text-right">Paid ($)</th>
                  <th className="px-4 py-3 text-right">Balance ($)</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rentReceivableData.map((row) => (
                  <tr key={row.txnId} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-bold text-slate-900">{row.unitName}</td>
                    <td className="px-4 py-3 text-slate-800">{row.tenantName}</td>
                    <td className="px-4 py-3 text-slate-600">{row.propertyName}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">{row.dueDate}</td>
                    <td className="px-4 py-3 text-center font-bold font-mono">
                      {row.daysPastDue > 0 ? (
                        <span className="text-rose-600">+{row.daysPastDue}d</span>
                      ) : (
                        <span className="text-slate-400">0d</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          row.agingBucket === '90+ Days'
                            ? 'bg-rose-100 text-rose-800 border-rose-200'
                            : row.agingBucket === '61-90 Days'
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : row.agingBucket === '31-60 Days'
                            ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {row.agingBucket}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-800">{formatCurrency(row.amountBilled)}</td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-700 font-semibold">{formatCurrency(row.amountPaid)}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-rose-700">{formatCurrency(row.balance)}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          row.status === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : row.status === 'Partial'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. VIEW: Rent Payable */}
        {activeReport === 'rent_payable' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Property Asset</th>
                  <th className="px-4 py-3">Asset Owner / Landlord</th>
                  <th className="px-4 py-3 text-right">Gross Collected ($)</th>
                  <th className="px-4 py-3 text-center">Mgt Fee %</th>
                  <th className="px-4 py-3 text-right">Fee Deducted ($)</th>
                  <th className="px-4 py-3 text-right">Contra Deductions ($)</th>
                  <th className="px-4 py-3 text-right">Net Remittance ($)</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rentPayableData.map((row) => (
                  <tr key={row.propertyId} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-bold text-slate-900">{row.propertyName}</td>
                    <td className="px-4 py-3 text-slate-800">{row.landlordName}</td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-700 font-semibold">{formatCurrency(row.grossCollected)}</td>
                    <td className="px-4 py-3 text-center font-bold">{row.managementFeePct}%</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">-{formatCurrency(row.managementFeeAmount)}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">
                      {row.contraDeductions > 0 ? `-${formatCurrency(row.contraDeductions)}` : '$0.00'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">{formatCurrency(row.netRemittancePayable)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        {row.disbursementStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. VIEW: Utility Receivable */}
        {activeReport === 'utility_receivable' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Suite / Unit</th>
                  <th className="px-4 py-3">Tenant Name</th>
                  <th className="px-4 py-3">Property</th>
                  <th className="px-4 py-3">Utility Type</th>
                  <th className="px-4 py-3">Utility Provider</th>
                  <th className="px-4 py-3">Period</th>
                  <th className="px-4 py-3 text-right">Allocated Amount ($)</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {utilityReceivableData.map((row) => (
                  <tr key={row.splitId} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-bold text-slate-900">{row.unitName}</td>
                    <td className="px-4 py-3 text-slate-800">{row.tenantName}</td>
                    <td className="px-4 py-3 text-slate-600">{row.propertyName}</td>
                    <td className="px-4 py-3 font-semibold text-slate-700">{row.utilityType}</td>
                    <td className="px-4 py-3 text-slate-500">{row.provider}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">{row.period}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">{formatCurrency(row.allocatedAmount)}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          row.status === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. VIEW: Utility Payable */}
        {activeReport === 'utility_payable' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Building Property</th>
                  <th className="px-4 py-3">Provider Name</th>
                  <th className="px-4 py-3">Utility Type</th>
                  <th className="px-4 py-3">Invoice #</th>
                  <th className="px-4 py-3">Period</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3 text-right">Invoice Total ($)</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {utilityPayableData.map((row) => (
                  <tr key={row.billId} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-bold text-slate-900">{row.propertyName}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{row.providerName}</td>
                    <td className="px-4 py-3 text-slate-600">{row.utilityType}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{row.invoiceNumber}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{row.period}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{row.dueDate}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">{formatCurrency(row.totalAmount)}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          row.status === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. VIEW: Vacancy Roll */}
        {activeReport === 'vacancy_roll' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Suite / Unit</th>
                  <th className="px-4 py-3">Property Asset</th>
                  <th className="px-4 py-3">Asset Type</th>
                  <th className="px-4 py-3 text-center">Gross Area (Sq Ft)</th>
                  <th className="px-4 py-3 text-center">Bedrooms</th>
                  <th className="px-4 py-3 text-right">Market Target Rent ($)</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Monthly Lost Rent ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vacancyRollData.map((row) => (
                  <tr key={row.unitId} className={`hover:bg-slate-50/70 ${row.isVacant ? 'bg-amber-50/20' : ''}`}>
                    <td className="px-4 py-3 font-bold text-slate-900">{row.unitName}</td>
                    <td className="px-4 py-3 text-slate-800">{row.propertyName}</td>
                    <td className="px-4 py-3 text-slate-600">{row.propertyType}</td>
                    <td className="px-4 py-3 text-center font-mono">{row.sqFt} sf</td>
                    <td className="px-4 py-3 text-center font-bold">{row.bedrooms}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800">{formatCurrency(row.targetRent)}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          row.currentStatus === 'Occupied'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : row.currentStatus === 'Vacant'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {row.currentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-rose-700">
                      {row.isVacant ? formatCurrency(row.potentialLostRevenue) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 6. VIEW: Master Rent Roll */}
        {activeReport === 'rent_roll' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Property</th>
                  <th className="px-4 py-3">Suite #</th>
                  <th className="px-4 py-3">Occupant Tenant</th>
                  <th className="px-4 py-3">Lease Period</th>
                  <th className="px-4 py-3 text-right">Monthly Rent ($)</th>
                  <th className="px-4 py-3 text-right">Deposit Held ($)</th>
                  <th className="px-4 py-3 text-right">Current Paid ($)</th>
                  <th className="px-4 py-3 text-right">Balance ($)</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {masterRentRollData.map((row) => (
                  <tr key={row.unitId} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-semibold text-slate-900">{row.propertyName}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">{row.unitName}</td>
                    <td className="px-4 py-3 text-slate-700">{row.tenantName}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">{row.leaseTerm}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900">{formatCurrency(row.monthlyRent)}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">{formatCurrency(row.depositHeld)}</td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-700">{formatCurrency(row.currentPaid)}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-rose-700">{formatCurrency(row.currentBalance)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 7. VIEW: Statement of Operations / Income Statement */}
        {activeReport === 'income_statement' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Revenues Card */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 space-y-3">
                <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                  <span>Operating Revenues (CAD $)</span>
                </h3>
                <div className="space-y-2 text-xs divide-y divide-slate-200/80">
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-600">Rental Income (4100)</span>
                    <span className="font-mono font-bold text-slate-900">{formatCurrency(incomeStatementData.rentalRevenue)}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-slate-600">Late Fees & Charges (4200)</span>
                    <span className="font-mono font-bold text-slate-900">{formatCurrency(incomeStatementData.lateFeeRevenue)}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-slate-600">Utility Recoveries (4300)</span>
                    <span className="font-mono font-bold text-slate-900">{formatCurrency(incomeStatementData.utilityRecovery)}</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-slate-300 font-extrabold text-emerald-800 text-sm">
                    <span>Total Operating Revenue</span>
                    <span className="font-mono">{formatCurrency(incomeStatementData.totalOperatingRevenue)}</span>
                  </div>
                </div>
              </div>

              {/* Expenses Card */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 space-y-3">
                <h3 className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowDownRight className="h-4 w-4 text-rose-600" />
                  <span>Operating Expenses (CAD $)</span>
                </h3>
                <div className="space-y-2 text-xs divide-y divide-slate-200/80">
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-600">Management Fees (5100)</span>
                    <span className="font-mono font-bold text-slate-900">{formatCurrency(incomeStatementData.managementFeeExpense)}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-slate-600">Repairs & Maintenance (5200)</span>
                    <span className="font-mono font-bold text-slate-900">{formatCurrency(incomeStatementData.repairsExpense)}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-slate-600">Master Utilities Expense (5300)</span>
                    <span className="font-mono font-bold text-slate-900">{formatCurrency(incomeStatementData.utilityExpense)}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-slate-600">Legal & Advisory (5400)</span>
                    <span className="font-mono font-bold text-slate-900">{formatCurrency(incomeStatementData.legalExpense)}</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-slate-300 font-extrabold text-rose-800 text-sm">
                    <span>Total Operating Expenses</span>
                    <span className="font-mono">{formatCurrency(incomeStatementData.totalOperatingExpenses)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Operating Income Banner */}
            <div className="rounded-xl border border-slate-900 bg-slate-900 text-white p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-300">Net Operating Income (NOI)</p>
                <p className="text-2xl font-black text-white mt-0.5 font-mono">{formatCurrency(incomeStatementData.netOperatingIncome)}</p>
                <p className="text-[11px] text-emerald-400 mt-0.5">
                  Operating Margin: {((incomeStatementData.netOperatingIncome / (incomeStatementData.totalOperatingRevenue || 1)) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="text-xs text-right text-slate-400">
                <p>Prepared in accordance with</p>
                <p className="text-white font-bold">Canadian ASPE Accounting Standards</p>
              </div>
            </div>
          </div>
        )}

        {/* 8. VIEW: General Ledger Trial Balance */}
        {activeReport === 'general_ledger' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Account Code</th>
                  <th className="px-4 py-3">Account Title</th>
                  <th className="px-4 py-3">Classification</th>
                  <th className="px-4 py-3 text-right">Debit ($CAD)</th>
                  <th className="px-4 py-3 text-right">Credit ($CAD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {trialBalanceData.rows.map((row) => (
                  <tr key={row.code} className="hover:bg-slate-50/70 font-sans">
                    <td className="px-4 py-2.5 font-bold text-slate-900 font-mono">{row.code}</td>
                    <td className="px-4 py-2.5 font-semibold text-slate-800">{row.name}</td>
                    <td className="px-4 py-2.5 text-slate-500">{row.type}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-slate-900">
                      {row.debit > 0 ? formatCurrency(row.debit) : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-slate-900">
                      {row.credit > 0 ? formatCurrency(row.credit) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-bold text-xs">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-slate-900 uppercase">
                    Trial Balance Totals (Balancing Check: {trialBalanceData.isBalanced ? '✓ ZERO DISCREPANCY' : '⚠️ UNBALANCED'})
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-900">{formatCurrency(trialBalanceData.totalDebit)}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-900">{formatCurrency(trialBalanceData.totalCredit)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
