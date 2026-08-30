import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  UserRole,
  UserPermissions,
  PaymentMethod,
  ViewTab,
  Property,
  Unit,
  Landlord,
  Tenant,
  Lease,
  RentTransaction,
  RentLineItem,
  DepositTransaction,
  WorkOrder,
  UtilityMaster,
  UtilityBill,
  UtilitySplit,
  CollectionRecord,
  ChartOfAccount,
  JournalHeader,
  JournalLine,
  AccountingPeriod,
  CommunicationMessage,
  SystemSettings,
  SystemAudit,
  MoveOutSettlement,
  ContraPaymentEntry,
  ContraPaymentSplit,
  GoogleMailMessage,
  GoogleMailTemplateType,
} from '../types';
import {
  INITIAL_SETTINGS,
  INITIAL_USERS,
  INITIAL_LANDLORDS,
  INITIAL_PROPERTIES,
  INITIAL_UNITS,
  INITIAL_TENANTS,
  INITIAL_LEASES,
  INITIAL_RENT_TRANSACTIONS,
  INITIAL_DEPOSITS,
  INITIAL_WORK_ORDERS,
  INITIAL_UTILITIES_MASTER,
  INITIAL_UTILITY_BILLS,
  INITIAL_UTILITY_SPLITS,
  INITIAL_COLLECTIONS,
  INITIAL_COA,
  INITIAL_JOURNALS,
  INITIAL_PERIODS,
  INITIAL_COMMUNICATIONS,
  INITIAL_CONTRA_PAYMENTS,
  INITIAL_GOOGLE_MAILS,
  DEFAULT_PERMISSIONS,
} from '../data/initialData';

interface ERPContextType {
  // State
  currentUser: User;
  users: User[];
  activeRole: UserRole;
  activeView: ViewTab;
  properties: Property[];
  units: Unit[];
  landlords: Landlord[];
  tenants: Tenant[];
  leases: Lease[];
  rentTransactions: RentTransaction[];
  depositTransactions: DepositTransaction[];
  workOrders: WorkOrder[];
  utilitiesMaster: UtilityMaster[];
  utilityBills: UtilityBill[];
  utilitySplits: UtilitySplit[];
  contraPayments: ContraPaymentEntry[];
  googleMails: GoogleMailMessage[];
  collections: CollectionRecord[];
  coa: ChartOfAccount[];
  journals: { header: JournalHeader; lines: JournalLine[] }[];
  periods: AccountingPeriod[];
  communications: CommunicationMessage[];
  settings: SystemSettings;
  auditLog: SystemAudit[];
  currentMonth: string;
  isMobileSimulatorOpen: boolean;

  // View & Role Switcher
  setActiveView: (view: ViewTab) => void;
  setActiveRole: (role: UserRole) => void;
  setCurrentUserById: (userId: string) => void;
  setIsMobileSimulatorOpen: (open: boolean) => void;

  // Permission Checks
  hasPermission: (permission: keyof UserPermissions) => boolean;
  canAccessView: (view: ViewTab) => boolean;

  // Lookups & Helpers
  getProperty: (id?: string) => Property | undefined;
  getUnit: (id?: string) => Unit | undefined;
  getTenant: (id?: string) => Tenant | undefined;
  getLandlord: (id?: string) => Landlord | undefined;
  getLease: (id?: string) => Lease | undefined;
  formatCurrency: (amount: number) => string;

  // User Management & RBAC
  addUser: (userData: Omit<User, 'User_ID' | 'Created_At'>) => string;
  updateUser: (user: User) => void;
  updateUserPermissions: (userId: string, permissions: Partial<UserPermissions>) => void;
  deleteUser: (userId: string) => void;

  // Billing & Payment Entry Actions
  generateMonthlyRentBatch: (month?: string) => { created: number; totalAmount: number };
  createCustomRentInvoice: (params: {
    tenantId: string;
    propertyId: string;
    unitId: string;
    leaseId?: string;
    periodMonth: string;
    dueDate: string;
    lineItems: { Description: string; Amount: number; Category: 'Base Rent' | 'Utility Charge' | 'Parking' | 'Late Fee' | 'Storage' | 'Pet Rent' | 'Other' }[];
    notes?: string;
  }) => string;
  recordRentPayment: (params: {
    rentTxnId: string;
    amountPaid: number;
    paymentMethod: PaymentMethod;
    reference?: string;
    paymentDate?: string;
    notes?: string;
  }) => { success: boolean; excess: number; journalId: string };
  recordContraPayment: (params: {
    tenantId: string;
    propertyId: string;
    unitId: string;
    totalReceivedAmount: number;
    depositBankAccount: string;
    paymentMethod: PaymentMethod;
    referenceNumber: string;
    notes?: string;
    paymentDate?: string;
    splits: ContraPaymentSplit[];
  }) => { success: boolean; contraId: string; journalId: string };
  applyLateFeesToOverdue: () => number;
  addCustomChargeToInvoice: (rentTxnId: string, description: string, amount: number, category: any) => void;

  // Maintenance Actions
  createWorkOrder: (ticket: Omit<WorkOrder, 'Ticket_ID' | 'Created_At' | 'Actual_Cost'>) => string;
  updateWorkOrderStatus: (ticketId: string, status: WorkOrder['Status'], actualCost?: number, techNotes?: string, rating?: number) => void;
  assignVendorToWorkOrder: (ticketId: string, vendorName: string, scheduledDate: string, estimatedCost: number) => void;

  // Lease Actions
  createLease: (leaseData: Omit<Lease, 'Lease_ID' | 'Created_At' | 'Status'>) => string;
  sendRenewalProposal: (leaseId: string, newMonthlyRent: number, newLeaseEnd: string) => void;
  acceptLeaseRenewal: (leaseId: string) => void;
  processMoveOutSettlement: (params: {
    leaseId: string;
    moveOutDate: string;
    damages: number;
    cleaningFee: number;
    unpaidRentDeduction: number;
    details: string;
  }) => MoveOutSettlement;

  // Property & Unit Actions
  addProperty: (property: Omit<Property, 'Property_ID' | 'Created_At'>) => string;
  updateProperty: (property: Property) => void;
  addUnit: (unit: Omit<Unit, 'Unit_ID'>) => string;
  updateUnit: (unit: Unit) => void;
  addTenant: (tenant: Omit<Tenant, 'Tenant_ID' | 'Created_At'>) => string;
  updateTenant: (tenant: Tenant) => void;
  addLandlord: (landlord: Omit<Landlord, 'Landlord_ID'>) => string;
  updateLandlord: (landlord: Landlord) => void;

  // Utilities Actions & Category Management
  addUtilityCategory: (category: Omit<UtilityMaster, 'Utility_ID'>) => string;
  updateUtilityCategory: (category: UtilityMaster) => void;
  createUtilityBill: (bill: Omit<UtilityBill, 'Utility_Bill_ID' | 'Created_At' | 'Status' | 'Created_By'>) => string;
  allocateUtilityBill: (utilityBillId: string, splits: { unitId: string; tenantId: string; amount: number }[]) => void;
  directTenantUtilityCharge: (params: {
    tenantId: string;
    propertyId: string;
    unitId: string;
    utilityName: string;
    amount: number;
    billDate: string;
    dueDate: string;
    memo?: string;
  }) => string;
  recordUtilityPayment: (splitId: string, amountPaid: number, paymentMethod: string, reference?: string) => void;

  // Accounting Actions
  postManualJournal: (date: string, description: string, lines: { accountCode: string; propertyId?: string; debit: number; credit: number; memo?: string }[]) => string;
  closeAccountingPeriod: (periodId: string) => void;
  reopenAccountingPeriod: (periodId: string) => void;
  createAccountingPeriod: (name: string, startDate: string, endDate: string) => void;

  // Google Mail Actions & Communications
  sendGoogleMail: (mail: Omit<GoogleMailMessage, 'Mail_ID' | 'Sent_At' | 'Status' | 'Sent_By'>) => string;
  batchSendGoogleMails: (mails: Omit<GoogleMailMessage, 'Mail_ID' | 'Sent_At' | 'Status' | 'Sent_By'>[]) => number;
  sendCommunication: (message: Omit<CommunicationMessage, 'Message_ID' | 'Sent_At' | 'Status' | 'Sent_By'>) => string;

  // Settings, System & Bulk Import
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
  resetDemoData: () => void;
  bulkImportData: (payload: {
    properties?: Property[];
    units?: Unit[];
    landlords?: Landlord[];
    tenants?: Tenant[];
    leases?: Lease[];
    rentTransactions?: RentTransaction[];
    journals?: { header: JournalHeader; lines: JournalLine[] }[];
  }) => { importedCount: number; message: string };
}

const ERPContext = createContext<ERPContextType | null>(null);

const STORAGE_KEY = 'DREAM_DWELL_ERP_DATA_V3';

export const ERPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Try loading from localStorage or fallback to initial data
  const loadInitial = <T,>(key: string, fallback: T): T => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_${key}`);
      return saved ? JSON.parse(saved) : fallback;
    } catch (e) {
      return fallback;
    }
  };

  const [activeRole, setActiveRoleState] = useState<UserRole>(() => loadInitial('role', 'Admin'));
  const [activeView, setActiveViewState] = useState<ViewTab>(() => loadInitial('view', 'dashboard'));
  const [users, setUsers] = useState<User[]>(() => loadInitial('users', INITIAL_USERS));
  const [currentUserId, setCurrentUserId] = useState<string>(() => loadInitial('currentUserId', 'USR-ADMIN'));
  const [isMobileSimulatorOpen, setIsMobileSimulatorOpen] = useState<boolean>(false);
  const [settings, setSettings] = useState<SystemSettings>(() => loadInitial('settings', INITIAL_SETTINGS));
  const [properties, setProperties] = useState<Property[]>(() => loadInitial('properties', INITIAL_PROPERTIES));
  const [units, setUnits] = useState<Unit[]>(() => loadInitial('units', INITIAL_UNITS));
  const [landlords, setLandlords] = useState<Landlord[]>(() => loadInitial('landlords', INITIAL_LANDLORDS));
  const [tenants, setTenants] = useState<Tenant[]>(() => loadInitial('tenants', INITIAL_TENANTS));
  const [leases, setLeases] = useState<Lease[]>(() => loadInitial('leases', INITIAL_LEASES));
  const [rentTransactions, setRentTransactions] = useState<RentTransaction[]>(() => loadInitial('rentTransactions', INITIAL_RENT_TRANSACTIONS));
  const [depositTransactions, setDepositTransactions] = useState<DepositTransaction[]>(() => loadInitial('depositTransactions', INITIAL_DEPOSITS));
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(() => loadInitial('workOrders', INITIAL_WORK_ORDERS));
  const [utilitiesMaster, setUtilitiesMaster] = useState<UtilityMaster[]>(() => loadInitial('utilitiesMaster', INITIAL_UTILITIES_MASTER));
  const [utilityBills, setUtilityBills] = useState<UtilityBill[]>(() => loadInitial('utilityBills', INITIAL_UTILITY_BILLS));
  const [utilitySplits, setUtilitySplits] = useState<UtilitySplit[]>(() => loadInitial('utilitySplits', INITIAL_UTILITY_SPLITS));
  const [contraPayments, setContraPayments] = useState<ContraPaymentEntry[]>(() => loadInitial('contraPayments', INITIAL_CONTRA_PAYMENTS));
  const [googleMails, setGoogleMails] = useState<GoogleMailMessage[]>(() => loadInitial('googleMails', INITIAL_GOOGLE_MAILS));
  const [collections, setCollections] = useState<CollectionRecord[]>(() => loadInitial('collections', INITIAL_COLLECTIONS));
  const [coa, setCOA] = useState<ChartOfAccount[]>(() => loadInitial('coa', INITIAL_COA));
  const [journals, setJournals] = useState<{ header: JournalHeader; lines: JournalLine[] }[]>(() => loadInitial('journals', INITIAL_JOURNALS));
  const [periods, setPeriods] = useState<AccountingPeriod[]>(() => loadInitial('periods', INITIAL_PERIODS));
  const [communications, setCommunications] = useState<CommunicationMessage[]>(() => loadInitial('communications', INITIAL_COMMUNICATIONS));
  const [auditLog, setAuditLog] = useState<SystemAudit[]>(() => loadInitial('auditLog', []));

  // Current month string "2026-08"
  const currentMonth = '2026-08';

  // Active user matches selected role or explicit user ID
  const currentUser: User = users.find((u) => u.User_ID === currentUserId) || users.find((u) => u.Role === activeRole) || users[0];

  // Save to localStorage when state changes
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_role`, JSON.stringify(activeRole));
      localStorage.setItem(`${STORAGE_KEY}_view`, JSON.stringify(activeView));
      localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(users));
      localStorage.setItem(`${STORAGE_KEY}_currentUserId`, JSON.stringify(currentUserId));
      localStorage.setItem(`${STORAGE_KEY}_settings`, JSON.stringify(settings));
      localStorage.setItem(`${STORAGE_KEY}_properties`, JSON.stringify(properties));
      localStorage.setItem(`${STORAGE_KEY}_units`, JSON.stringify(units));
      localStorage.setItem(`${STORAGE_KEY}_landlords`, JSON.stringify(landlords));
      localStorage.setItem(`${STORAGE_KEY}_tenants`, JSON.stringify(tenants));
      localStorage.setItem(`${STORAGE_KEY}_leases`, JSON.stringify(leases));
      localStorage.setItem(`${STORAGE_KEY}_rentTransactions`, JSON.stringify(rentTransactions));
      localStorage.setItem(`${STORAGE_KEY}_depositTransactions`, JSON.stringify(depositTransactions));
      localStorage.setItem(`${STORAGE_KEY}_workOrders`, JSON.stringify(workOrders));
      localStorage.setItem(`${STORAGE_KEY}_utilitiesMaster`, JSON.stringify(utilitiesMaster));
      localStorage.setItem(`${STORAGE_KEY}_utilityBills`, JSON.stringify(utilityBills));
      localStorage.setItem(`${STORAGE_KEY}_utilitySplits`, JSON.stringify(utilitySplits));
      localStorage.setItem(`${STORAGE_KEY}_contraPayments`, JSON.stringify(contraPayments));
      localStorage.setItem(`${STORAGE_KEY}_googleMails`, JSON.stringify(googleMails));
      localStorage.setItem(`${STORAGE_KEY}_collections`, JSON.stringify(collections));
      localStorage.setItem(`${STORAGE_KEY}_coa`, JSON.stringify(coa));
      localStorage.setItem(`${STORAGE_KEY}_journals`, JSON.stringify(journals));
      localStorage.setItem(`${STORAGE_KEY}_periods`, JSON.stringify(periods));
      localStorage.setItem(`${STORAGE_KEY}_communications`, JSON.stringify(communications));
      localStorage.setItem(`${STORAGE_KEY}_auditLog`, JSON.stringify(auditLog));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
  }, [
    activeRole,
    activeView,
    users,
    currentUserId,
    settings,
    properties,
    units,
    landlords,
    tenants,
    leases,
    rentTransactions,
    depositTransactions,
    workOrders,
    utilitiesMaster,
    utilityBills,
    utilitySplits,
    contraPayments,
    googleMails,
    collections,
    coa,
    journals,
    periods,
    communications,
    auditLog,
  ]);

  const setActiveRole = (role: UserRole) => {
    setActiveRoleState(role);
    const matchingUser = users.find((u) => u.Role === role);
    if (matchingUser) {
      setCurrentUserId(matchingUser.User_ID);
    }
    if (role === 'Tenant') {
      setActiveViewState('tenant_portal');
    } else if (activeView === 'tenant_portal') {
      setActiveViewState('dashboard');
    }
  };

  const setCurrentUserById = (userId: string) => {
    const u = users.find((x) => x.User_ID === userId);
    if (u) {
      setCurrentUserId(u.User_ID);
      setActiveRoleState(u.Role);
      if (u.Role === 'Tenant') {
        setActiveViewState('tenant_portal');
      }
    }
  };

  const setActiveView = (view: ViewTab) => {
    setActiveViewState(view);
  };

  // Helper generators
  const genId = (prefix: string) => `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;

  const logAudit = (action: SystemAudit['Action'], module: string, recordId: string, details: string) => {
    const newEntry: SystemAudit = {
      Audit_ID: genId('AUD'),
      Timestamp: new Date().toISOString(),
      User_Email: currentUser.Email,
      Action: action,
      Module: module,
      Record_ID: recordId,
      Details: details,
    };
    setAuditLog((prev) => [newEntry, ...prev.slice(0, 499)]);
  };

  // Permission Verification
  const hasPermission = (permissionKey: keyof UserPermissions): boolean => {
    if (!currentUser) return false;
    if (currentUser.Role === 'Admin') return true; // Admin has master override
    if (!currentUser.Permissions) {
      return DEFAULT_PERMISSIONS[currentUser.Role]?.[permissionKey] ?? false;
    }
    return Boolean(currentUser.Permissions[permissionKey]);
  };

  const canAccessView = (view: ViewTab): boolean => {
    if (!currentUser) return false;
    if (currentUser.Role === 'Admin') return true;
    const p = currentUser.Permissions || DEFAULT_PERMISSIONS[currentUser.Role];
    if (!p) return false;

    switch (view) {
      case 'dashboard': return p.canViewDashboard;
      case 'properties': return p.canViewProperties;
      case 'units': return p.canViewUnits;
      case 'tenants': return p.canViewTenants;
      case 'landlords': return p.canViewLandlords;
      case 'leases': return p.canViewLeases;
      case 'billing': return p.canViewBilling;
      case 'maintenance': return p.canViewMaintenance;
      case 'utilities': return p.canViewUtilities;
      case 'deposits': return p.canViewDeposits;
      case 'accounting': return p.canViewAccounting;
      case 'reports': return p.canViewReports;
      case 'upcoming_events': return p.canViewUpcomingEvents ?? true;
      case 'data_migration': return p.canViewDataMigration ?? true;
      case 'team_rbac': return p.canViewTeam;
      case 'ai_assistant': return p.canViewAIAssistant;
      case 'tenant_portal': return p.canViewTenantPortal;
      case 'settings': return p.canViewSettings;
      default: return true;
    }
  };

  // User Management
  const addUser = (userData: Omit<User, 'User_ID' | 'Created_At'>) => {
    const id = genId('USR');
    const defaultPerms = DEFAULT_PERMISSIONS[userData.Role] || DEFAULT_PERMISSIONS.Custom;
    const newUser: User = {
      ...userData,
      User_ID: id,
      Created_At: new Date().toISOString(),
      Permissions: userData.Permissions || { ...defaultPerms },
    };
    setUsers((prev) => [...prev, newUser]);
    logAudit('CREATE', 'Users & RBAC', id, `Created user account ${userData.Full_Name} (${userData.Role})`);
    return id;
  };

  const updateUser = (updatedUser: User) => {
    setUsers((prev) => prev.map((u) => (u.User_ID === updatedUser.User_ID ? updatedUser : u)));
    logAudit('UPDATE', 'Users & RBAC', updatedUser.User_ID, `Updated user profile ${updatedUser.Full_Name}`);
  };

  const updateUserPermissions = (userId: string, permissions: Partial<UserPermissions>) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.User_ID === userId) {
          const current = u.Permissions || DEFAULT_PERMISSIONS[u.Role];
          const merged: UserPermissions = { ...current, ...permissions };
          return { ...u, Permissions: merged };
        }
        return u;
      })
    );
    logAudit('UPDATE', 'Users & RBAC', userId, `Updated RBAC security permissions matrix`);
  };

  const deleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.User_ID !== userId));
    logAudit('DELETE', 'Users & RBAC', userId, `Deleted user account`);
  };

  // Lookups
  const getProperty = (id?: string) => properties.find((p) => p.Property_ID === id);
  const getUnit = (id?: string) => units.find((u) => u.Unit_ID === id);
  const getTenant = (id?: string) => tenants.find((t) => t.Tenant_ID === id);
  const getLandlord = (id?: string) => landlords.find((l) => l.Landlord_ID === id);
  const getLease = (id?: string) => leases.find((l) => l.Lease_ID === id);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: settings.CURRENCY || 'CAD',
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  // Internal Double-Entry Journal poster
  const postInternalJournal = (
    date: string,
    description: string,
    refType: JournalHeader['Reference_Type'],
    refId: string,
    lines: { accountCode: string; propertyId?: string; unitId?: string; tenantId?: string; debit: number; credit: number; memo?: string }[]
  ): string => {
    const totalDebit = lines.reduce((acc, l) => acc + (l.debit || 0), 0);
    const totalCredit = lines.reduce((acc, l) => acc + (l.credit || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      console.warn(`Unbalanced Journal Entry: Debit $${totalDebit} != Credit $${totalCredit}`);
    }

    const journalId = genId('JRN');
    const header: JournalHeader = {
      Journal_ID: journalId,
      Date: date,
      Description: description,
      Reference_Type: refType,
      Reference_ID: refId,
      Created_By: currentUser.Email,
      Status: 'POSTED',
      Period_ID: 'PER-2026',
      Created_At: new Date().toISOString(),
    };

    const journalLines: JournalLine[] = lines.map((l, idx) => ({
      Line_ID: `${journalId}-L${idx + 1}`,
      Journal_ID: journalId,
      Account_Code: l.accountCode,
      Property_ID: l.propertyId,
      Unit_ID: l.unitId,
      Tenant_ID: l.tenantId,
      Debit_Amount: l.debit || 0,
      Credit_Amount: l.credit || 0,
      Memo: l.memo,
    }));

    setJournals((prev) => [{ header, lines: journalLines }, ...prev]);
    return journalId;
  };

  // --- 1. BILLING & INVOICING ACTIONS ---
  const generateMonthlyRentBatch = (month = currentMonth) => {
    const activeLeases = leases.filter((l) => l.Status === 'Active' || l.Status === 'Pending Renewal');
    let count = 0;
    let totalBilled = 0;

    const newInvoices: RentTransaction[] = [];

    activeLeases.forEach((l) => {
      // Check if invoice already exists for this lease & month
      const exists = rentTransactions.some((r) => r.Lease_ID === l.Lease_ID && r.Period_Month === month);
      if (!exists) {
        const invId = `INV-${month}-${Math.floor(100 + Math.random() * 900)}`;
        const dueDate = `${month}-01`;
        const baseAmount = l.Monthly_Rent;

        const lineItems = [
          { Description: `Monthly Base Rent - ${month}`, Amount: baseAmount, Category: 'Base Rent' as const },
        ];

        const invoice: RentTransaction = {
          Rent_Txn_ID: invId,
          Lease_ID: l.Lease_ID,
          Tenant_ID: l.Tenant_ID,
          Property_ID: l.Property_ID,
          Unit_ID: l.Unit_ID,
          Period_Month: month,
          Due_Date: dueDate,
          Amount_Billed: baseAmount,
          Amount_Paid: 0,
          Balance: baseAmount,
          Late_Fee_Applied: 0,
          Status: 'Unpaid',
          Line_Items: lineItems,
          Created_By: currentUser.Full_Name,
          Created_At: new Date().toISOString(),
        };

        // Post Journal: Debit 1100 (AR Rent), Credit 4000 (Rent Revenue)
        const jId = postInternalJournal(
          dueDate,
          `Auto-Generated Rent Charge - ${l.Lease_ID} (${month})`,
          'Rent_Charge',
          invId,
          [
            { accountCode: '1100', propertyId: l.Property_ID, unitId: l.Unit_ID, tenantId: l.Tenant_ID, debit: baseAmount, credit: 0, memo: 'AR Rent Receivable' },
            { accountCode: '4000', propertyId: l.Property_ID, unitId: l.Unit_ID, tenantId: l.Tenant_ID, debit: 0, credit: baseAmount, memo: 'Residential Rent Revenue' },
          ]
        );
        invoice.Journal_Ref_ID = jId;

        newInvoices.push(invoice);
        count++;
        totalBilled += baseAmount;
      }
    });

    if (newInvoices.length > 0) {
      setRentTransactions((prev) => [...newInvoices, ...prev]);
      logAudit('GENERATE', 'Billing', month, `Generated ${count} invoices totalling ${formatCurrency(totalBilled)}`);
    }

    return { created: count, totalAmount: totalBilled };
  };

  const createCustomRentInvoice = ({
    tenantId,
    propertyId,
    unitId,
    leaseId,
    periodMonth,
    dueDate,
    lineItems,
    notes = '',
  }: {
    tenantId: string;
    propertyId: string;
    unitId: string;
    leaseId?: string;
    periodMonth: string;
    dueDate: string;
    lineItems: { Description: string; Amount: number; Category: 'Base Rent' | 'Utility Charge' | 'Parking' | 'Late Fee' | 'Storage' | 'Pet Rent' | 'Other' }[];
    notes?: string;
  }) => {
    const totalAmount = lineItems.reduce((acc, item) => acc + (Number(item.Amount) || 0), 0);
    const invId = `INV-${periodMonth}-${Math.floor(1000 + Math.random() * 9000)}`;

    const associatedLease = leaseId ? leases.find((l) => l.Lease_ID === leaseId) : leases.find((l) => l.Tenant_ID === tenantId && (l.Status === 'Active' || l.Status === 'Pending Renewal'));

    const invoice: RentTransaction = {
      Rent_Txn_ID: invId,
      Lease_ID: associatedLease?.Lease_ID || leaseId || 'LEASE-CUSTOM',
      Tenant_ID: tenantId,
      Property_ID: propertyId,
      Unit_ID: unitId,
      Period_Month: periodMonth,
      Due_Date: dueDate,
      Amount_Billed: totalAmount,
      Amount_Paid: 0,
      Balance: totalAmount,
      Late_Fee_Applied: 0,
      Status: 'Unpaid',
      Line_Items: lineItems,
      Created_By: currentUser.Full_Name,
      Created_At: new Date().toISOString(),
    };

    // Post General Ledger Journal: Debit 1100 AR Rent, Credit 4000/4010 Revenue
    const jId = postInternalJournal(
      dueDate,
      `Custom Tenant Rent Invoice - ${invId} (${periodMonth})`,
      'Rent_Charge',
      invId,
      [
        { accountCode: '1100', propertyId, unitId, tenantId, debit: totalAmount, credit: 0, memo: `AR Custom Invoicing - ${invId}` },
        { accountCode: '4000', propertyId, unitId, tenantId, debit: 0, credit: totalAmount, memo: `Rental & Supplemental Revenue (${periodMonth})` },
      ]
    );
    invoice.Journal_Ref_ID = jId;

    setRentTransactions((prev) => [invoice, ...prev]);
    logAudit('CREATE', 'Billing', invId, `Created custom rent invoice for ${formatCurrency(totalAmount)} against Tenant ${tenantId}`);

    return invId;
  };

  const recordRentPayment = ({
    rentTxnId,
    amountPaid,
    paymentMethod,
    reference = `PMT-${Date.now().toString().slice(-6)}`,
    paymentDate = '2026-08-30',
    notes = '',
  }: {
    rentTxnId: string;
    amountPaid: number;
    paymentMethod: PaymentMethod;
    reference?: string;
    paymentDate?: string;
    notes?: string;
  }) => {
    const inv = rentTransactions.find((r) => r.Rent_Txn_ID === rentTxnId);
    if (!inv) return { success: false, excess: 0, journalId: '' };

    const remainingBal = inv.Balance;
    const appliedToInvoice = Math.min(remainingBal, amountPaid);
    const excess = Math.max(0, amountPaid - remainingBal);

    const newAmountPaid = inv.Amount_Paid + appliedToInvoice;
    const newBalance = Math.max(0, inv.Balance - appliedToInvoice);
    const newStatus: RentTransaction['Status'] = newBalance <= 0 ? 'Paid' : 'Partial';

    // Account mapping based on payment method
    const debitAccount = paymentMethod === 'Cash / Branch Deposit' || paymentMethod === 'Cash' ? '1000' : '1010';

    // Post Journal:
    // Debit Bank/Cash (Total Paid)
    // Credit 1100 AR Rent (Applied)
    // Credit 2300 Prepaid/Unearned (Excess if any)
    const journalLines = [
      { accountCode: debitAccount, propertyId: inv.Property_ID, unitId: inv.Unit_ID, tenantId: inv.Tenant_ID, debit: amountPaid, credit: 0, memo: `Collection via ${paymentMethod}` },
      { accountCode: '1100', propertyId: inv.Property_ID, unitId: inv.Unit_ID, tenantId: inv.Tenant_ID, debit: 0, credit: appliedToInvoice, memo: `Clear AR for ${inv.Rent_Txn_ID}` },
    ];
    if (excess > 0) {
      journalLines.push({
        accountCode: '2300',
        propertyId: inv.Property_ID,
        unitId: inv.Unit_ID,
        tenantId: inv.Tenant_ID,
        debit: 0,
        credit: excess,
        memo: 'Tenant Excess Payment Credit',
      });
    }

    const journalId = postInternalJournal(
      paymentDate,
      `Rent Payment Collection - ${inv.Rent_Txn_ID}`,
      'Collection',
      rentTxnId,
      journalLines
    );

    // Update invoice
    setRentTransactions((prev) =>
      prev.map((r) =>
        r.Rent_Txn_ID === rentTxnId
          ? {
              ...r,
              Amount_Paid: newAmountPaid,
              Balance: newBalance,
              Payment_Date: paymentDate,
              Payment_Method: paymentMethod,
              Reference: reference,
              Status: newStatus,
            }
          : r
      )
    );

    // Add Collection Record
    const colId = genId('COL');
    const collection: CollectionRecord = {
      Collection_ID: colId,
      Collection_Date: paymentDate,
      Tenant_ID: inv.Tenant_ID,
      Property_ID: inv.Property_ID,
      Unit_ID: inv.Unit_ID,
      Collection_Type: 'Rent',
      Amount: amountPaid,
      Payment_Method: paymentMethod as any,
      Reference: reference,
      Applied_To: rentTxnId,
      Notes: notes || `Payment for period ${inv.Period_Month}`,
      Journal_Ref_ID: journalId,
      Created_By: currentUser.Email,
      Created_At: new Date().toISOString(),
    };
    setCollections((prev) => [collection, ...prev]);

    logAudit('POST', 'Collections', colId, `Collected ${formatCurrency(amountPaid)} from Tenant ${inv.Tenant_ID} for ${inv.Rent_Txn_ID}`);

    // Auto-generate Payment Receipt
    const tenant = getTenant(inv.Tenant_ID);
    if (tenant?.Email) {
      const gMailId = genId('GMAIL');
      const newMail: GoogleMailMessage = {
        Mail_ID: gMailId,
        Tenant_ID: inv.Tenant_ID,
        Recipient_Name: tenant.Full_Name,
        Recipient_Email: tenant.Email,
        Template_Type: 'Payment_Confirmation',
        Subject: `Payment Receipt — Confirmation #${reference} (${formatCurrency(amountPaid)})`,
        Html_Body: `
          <div style="font-family: sans-serif; color: #1f2937;">
            <h2 style="color: #991b1b; margin-bottom: 4px;">Dream Dwell Asset Management Inc.</h2>
            <p style="font-size: 14px; color: #6b7280; margin-top: 0;">Official Payment Confirmation Receipt</p>
            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
            <p>Dear <strong>${tenant.Full_Name}</strong>,</p>
            <p>Thank you for your payment. We have successfully recorded your transaction as follows:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
              <tr style="background-color: #f9fafb;"><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Invoice Number</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${inv.Rent_Txn_ID}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Payment Date</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${paymentDate}</td></tr>
              <tr style="background-color: #f9fafb;"><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Payment Method</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${paymentMethod} (${reference})</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Amount Paid</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold; color: #047857;">${formatCurrency(amountPaid)}</td></tr>
              <tr style="background-color: #f9fafb;"><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Remaining Balance</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${formatCurrency(newBalance)}</td></tr>
            </table>
            <p style="font-size: 13px; color: #4b5563;">If you have any questions or require statement adjustments, please contact our property desk.</p>
          </div>
        `,
        Status: 'Sent',
        Sent_At: new Date().toISOString(),
        Sent_By: currentUser.Full_Name,
        Has_Attachment: true,
        Attachment_Name: `Receipt-${reference}.pdf`,
        Trigger_Event: `Payment on ${inv.Rent_Txn_ID}`,
        Tracking_Ref: reference,
      };
      setGoogleMails((prev) => [newMail, ...prev]);
    }

    return { success: true, excess, journalId };
  };

  // --- PAYMENT ENTRY MULTI-SPLIT ACTION ---
  const recordContraPayment = ({
    tenantId,
    propertyId,
    unitId,
    totalReceivedAmount,
    depositBankAccount,
    paymentMethod,
    referenceNumber,
    notes = '',
    paymentDate = '2026-08-30',
    splits,
  }: {
    tenantId: string;
    propertyId: string;
    unitId: string;
    totalReceivedAmount: number;
    depositBankAccount: string;
    paymentMethod: PaymentMethod;
    referenceNumber: string;
    notes?: string;
    paymentDate?: string;
    splits: ContraPaymentSplit[];
  }) => {
    const sumSplits = splits.reduce((acc, s) => acc + (Number(s.Amount) || 0), 0);
    const contraId = genId('PMT');
    const tenant = getTenant(tenantId);
    const prop = getProperty(propertyId);
    const unit = getUnit(unitId);

    // Build Journal Lines
    // 1. Debit Bank Account
    const debitAccountCode = depositBankAccount.includes('1000') ? '1000' : '1010';
    const journalLines: any[] = [
      {
        accountCode: debitAccountCode,
        propertyId,
        unitId,
        tenantId,
        debit: totalReceivedAmount,
        credit: 0,
        memo: `Payment Entry Deposit - Ref #${referenceNumber} (${paymentMethod})`,
      },
    ];

    // 2. Process Splits & Credit Corresponding Accounts
    splits.forEach((split) => {
      const splitAmount = Number(split.Amount) || 0;
      if (splitAmount <= 0) return;

      let targetAccount = split.Account_Code || '4000';
      let lineMemo = `Payment Allocation: ${split.Description}`;

      if (split.Target_Type === 'Rent_Invoice') {
        targetAccount = split.Account_Code || '1100'; // Clear AR Rent
        lineMemo = `Rent Payment Allocation - ${split.Target_ID || 'Lease'}`;
        if (split.Target_ID) {
          setRentTransactions((prev) =>
            prev.map((r) => {
              if (r.Rent_Txn_ID === split.Target_ID) {
                const newPaid = r.Amount_Paid + splitAmount;
                const newBal = Math.max(0, r.Balance - splitAmount);
                return {
                  ...r,
                  Amount_Paid: newPaid,
                  Balance: newBal,
                  Status: newBal <= 0 ? 'Paid' : 'Partial',
                  Payment_Date: paymentDate,
                  Payment_Method: paymentMethod,
                  Reference: referenceNumber,
                };
              }
              return r;
            })
          );
        }
      } else if (split.Target_Type === 'Utility_Bill') {
        targetAccount = split.Account_Code || '1110'; // Clear Utility Recovery AR
        lineMemo = `Utility Recovery Allocation - ${split.Description}`;
        if (split.Target_ID) {
          setUtilitySplits((prev) =>
            prev.map((u) => {
              if (u.Split_ID === split.Target_ID) {
                const newPaid = u.Amount_Paid + splitAmount;
                const newBal = Math.max(0, u.Allocated_Amount - newPaid);
                return {
                  ...u,
                  Amount_Paid: newPaid,
                  Balance: newBal,
                  Status: newBal <= 0 ? 'Paid' : 'Partial',
                  Payment_Date: paymentDate,
                };
              }
              return u;
            })
          );
        }
      } else if (split.Target_Type === 'Late_Fee') {
        targetAccount = split.Account_Code || '4020';
        lineMemo = `Late Fee Recovery`;
      } else if (split.Target_Type === 'Parking') {
        targetAccount = split.Account_Code || '4030';
        lineMemo = `Parking Recovery`;
      }

      journalLines.push({
        accountCode: targetAccount,
        propertyId,
        unitId,
        tenantId,
        debit: 0,
        credit: splitAmount,
        memo: lineMemo,
      });
    });

    // If totalReceived exceeds splits, credit excess to Prepaid (2300)
    const excess = Math.max(0, totalReceivedAmount - sumSplits);
    if (excess > 0.01) {
      journalLines.push({
        accountCode: '2300',
        propertyId,
        unitId,
        tenantId,
        debit: 0,
        credit: excess,
        memo: 'Tenant Unapplied Excess / Prepaid',
      });
    }

    // Post Journal
    const jrnId = postInternalJournal(
      paymentDate,
      `Payment Entry (${tenant?.Full_Name || tenantId}) - Ref #${referenceNumber}`,
      'Collection',
      contraId,
      journalLines
    );

    // Create Payment Record
    const contraEntry: ContraPaymentEntry = {
      Contra_ID: contraId,
      Date: paymentDate,
      Tenant_ID: tenantId,
      Property_ID: propertyId,
      Unit_ID: unitId,
      Total_Received_Amount: totalReceivedAmount,
      Deposit_Bank_Account: depositBankAccount,
      Payment_Method: paymentMethod,
      Reference_Number: referenceNumber,
      Splits: splits,
      Journal_Ref_ID: jrnId,
      Notes: notes,
      Created_By: currentUser.Full_Name,
      Created_At: new Date().toISOString(),
    };

    setContraPayments((prev) => [contraEntry, ...prev]);

    // Create Collection Entry for summary
    const colId = genId('COL');
    const colRecord: CollectionRecord = {
      Collection_ID: colId,
      Collection_Date: paymentDate,
      Tenant_ID: tenantId,
      Property_ID: propertyId,
      Unit_ID: unitId,
      Collection_Type: 'Rent',
      Amount: totalReceivedAmount,
      Payment_Method: paymentMethod as any,
      Reference: referenceNumber,
      Applied_To: contraId,
      Notes: `Combined Payment Entry: ${splits.map((s) => `${s.Description} ($${s.Amount})`).join(', ')}`,
      Journal_Ref_ID: jrnId,
      Created_By: currentUser.Email,
      Created_At: new Date().toISOString(),
    };
    setCollections((prev) => [colRecord, ...prev]);

    // Generate Payment Receipt with Split Breakdown
    if (tenant?.Email) {
      const gMailId = genId('GMAIL');
      const splitsRows = splits
        .map(
          (s) => `
            <tr>
              <td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>${s.Description}</strong> (${s.Target_Type.replace('_', ' ')})</td>
              <td style="padding: 8px; border: 1px solid #e5e7eb; color: #4b5563;">${s.Target_ID || 'Direct Ledger'}</td>
              <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right; font-weight: bold;">${formatCurrency(s.Amount)}</td>
            </tr>
          `
        )
        .join('');

      const newMail: GoogleMailMessage = {
        Mail_ID: gMailId,
        Tenant_ID: tenantId,
        Recipient_Name: tenant.Full_Name,
        Recipient_Email: tenant.Email,
        Template_Type: 'Payment_Confirmation',
        Subject: `Consolidated Payment Receipt — Ref #${referenceNumber} (${formatCurrency(totalReceivedAmount)})`,
        Html_Body: `
          <div style="font-family: sans-serif; color: #1f2937; max-width: 600px;">
            <div style="background-color: #991b1b; padding: 16px; border-radius: 8px 8px 0 0; color: white;">
              <h2 style="margin: 0; font-size: 20px;">Dream Dwell Asset Management Inc.</h2>
              <p style="margin: 4px 0 0; opacity: 0.9; font-size: 13px;">Official Consolidated Payment Receipt</p>
            </div>
            <div style="border: 1px solid #e5e7eb; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
              <p>Dear <strong>${tenant.Full_Name}</strong>,</p>
              <p>We confirm receipt of your total payment of <strong>${formatCurrency(totalReceivedAmount)}</strong> deposited at <strong>${depositBankAccount}</strong>.</p>
              <p style="font-size: 13px; color: #6b7280;">Itemized ledger breakdown of this single consolidated deposit:</p>
              
              <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px;">
                <thead>
                  <tr style="background-color: #f3f4f6;">
                    <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left;">Category / Description</th>
                    <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left;">Target Inv/Split</th>
                    <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${splitsRows}
                  <tr style="background-color: #fef2f2; font-weight: bold;">
                    <td colspan="2" style="padding: 8px; border: 1px solid #e5e7eb; color: #991b1b;">Total Bank Deposit Received</td>
                    <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right; color: #991b1b;">${formatCurrency(totalReceivedAmount)}</td>
                  </tr>
                </tbody>
              </table>

              <p style="font-size: 12px; color: #6b7280; margin-top: 16px;">
                Transaction Ref: <strong>${referenceNumber}</strong> | Property: <strong>${prop?.Property_Name || ''} (${unit?.Unit_Number_Name || ''})</strong><br />
                General Ledger Journal Reference: <strong>${jrnId}</strong>
              </p>
            </div>
          </div>
        `,
        Status: 'Sent',
        Sent_At: new Date().toISOString(),
        Sent_By: currentUser.Full_Name,
        Has_Attachment: true,
        Attachment_Name: `Receipt-${referenceNumber}.pdf`,
        Trigger_Event: `Payment Entry #${contraId}`,
        Tracking_Ref: referenceNumber,
      };

      setGoogleMails((prev) => [newMail, ...prev]);
    }

    logAudit(
      'POST',
      'Contra Payments',
      contraId,
      `Recorded Contra entry of ${formatCurrency(totalReceivedAmount)} with ${splits.length} splits for ${tenant?.Full_Name}`
    );

    return { success: true, contraId, journalId: jrnId };
  };

  const applyLateFeesToOverdue = () => {
    let count = 0;
    const feeAmount = settings.DEFAULT_LATE_FEE || 50;

    setRentTransactions((prev) =>
      prev.map((inv) => {
        if (inv.Status === 'Overdue' && inv.Late_Fee_Applied === 0 && inv.Balance > 0) {
          count++;
          const updatedLineItems = [
            ...inv.Line_Items,
            { Description: 'Late Payment Administrative Assessment Fee', Amount: feeAmount, Category: 'Late Fee' as const },
          ];
          const newBilled = inv.Amount_Billed + feeAmount;
          const newBalance = inv.Balance + feeAmount;

          // Post Journal for late fee: Debit 1100 AR, Credit 4020 Late Fee Income
          postInternalJournal(
            '2026-08-30',
            `Late Fee Assessment - ${inv.Rent_Txn_ID}`,
            'Rent_Charge',
            inv.Rent_Txn_ID,
            [
              { accountCode: '1100', propertyId: inv.Property_ID, unitId: inv.Unit_ID, tenantId: inv.Tenant_ID, debit: feeAmount, credit: 0, memo: 'Late Fee AR' },
              { accountCode: '4020', propertyId: inv.Property_ID, unitId: inv.Unit_ID, tenantId: inv.Tenant_ID, debit: 0, credit: feeAmount, memo: 'Late Fee Revenue' },
            ]
          );

          return {
            ...inv,
            Amount_Billed: newBilled,
            Balance: newBalance,
            Late_Fee_Applied: feeAmount,
            Line_Items: updatedLineItems,
          };
        }
        return inv;
      })
    );

    if (count > 0) {
      logAudit('UPDATE', 'Billing', 'LateFees', `Assessed ${formatCurrency(feeAmount)} late fees on ${count} overdue invoices`);
    }
    return count;
  };

  const addCustomChargeToInvoice = (rentTxnId: string, description: string, amount: number, category: any) => {
    setRentTransactions((prev) =>
      prev.map((inv) => {
        if (inv.Rent_Txn_ID === rentTxnId) {
          const updatedItems = [...inv.Line_Items, { Description: description, Amount: amount, Category: category }];
          const newBilled = inv.Amount_Billed + amount;
          const newBalance = inv.Balance + amount;

          postInternalJournal(
            '2026-08-30',
            `Supplemental Charge (${description}) - ${inv.Rent_Txn_ID}`,
            'Rent_Charge',
            inv.Rent_Txn_ID,
            [
              { accountCode: '1100', propertyId: inv.Property_ID, unitId: inv.Unit_ID, tenantId: inv.Tenant_ID, debit: amount, credit: 0, memo: description },
              { accountCode: '4030', propertyId: inv.Property_ID, unitId: inv.Unit_ID, tenantId: inv.Tenant_ID, debit: 0, credit: amount, memo: category },
            ]
          );

          return {
            ...inv,
            Amount_Billed: newBilled,
            Balance: newBalance,
            Status: newBalance > 0 ? (inv.Amount_Paid > 0 ? 'Partial' : 'Unpaid') : 'Paid',
            Line_Items: updatedItems,
          };
        }
        return inv;
      })
    );
  };

  // --- 2. MAINTENANCE ACTIONS ---
  const createWorkOrder = (ticketData: Omit<WorkOrder, 'Ticket_ID' | 'Created_At' | 'Actual_Cost'>) => {
    const id = genId('TKT');
    const newTicket: WorkOrder = {
      ...ticketData,
      Ticket_ID: id,
      Actual_Cost: 0,
      Created_At: new Date().toISOString(),
    };

    setWorkOrders((prev) => [newTicket, ...prev]);

    // If Priority is Emergency, optionally set unit to Maintenance
    if (ticketData.Priority === 'Emergency') {
      setUnits((prev) =>
        prev.map((u) => (u.Unit_ID === ticketData.Unit_ID ? { ...u, Current_Status: 'Maintenance' } : u))
      );
    }

    logAudit('CREATE', 'Maintenance', id, `Work order submitted: ${ticketData.Title} (${ticketData.Priority})`);
    return id;
  };

  const updateWorkOrderStatus = (
    ticketId: string,
    status: WorkOrder['Status'],
    actualCost?: number,
    techNotes?: string,
    rating?: number
  ) => {
    setWorkOrders((prev) =>
      prev.map((t) => {
        if (t.Ticket_ID === ticketId) {
          const finalCost = actualCost !== undefined ? actualCost : t.Actual_Cost;
          const completedDate = status === 'Completed' ? new Date().toISOString().slice(0, 10) : t.Completed_Date;

          // If completed with cost > 0, post double-entry repair expense journal
          if (status === 'Completed' && finalCost > 0 && t.Status !== 'Completed') {
            postInternalJournal(
              completedDate || '2026-08-30',
              `Work Order Expense - ${t.Ticket_ID}: ${t.Title}`,
              'Work_Order_Expense',
              ticketId,
              [
                { accountCode: '5020', propertyId: t.Property_ID, unitId: t.Unit_ID, tenantId: t.Tenant_ID, debit: finalCost, credit: 0, memo: 'Repairs & Maintenance Expense' },
                { accountCode: '1010', propertyId: t.Property_ID, unitId: t.Unit_ID, debit: 0, credit: finalCost, memo: 'Payment from Operating Bank' },
              ]
            );
          }

          // If unit was under maintenance and now completed, restore to Occupied if leased or Vacant
          if (status === 'Completed') {
            const hasLease = leases.some((l) => l.Unit_ID === t.Unit_ID && (l.Status === 'Active' || l.Status === 'Pending Renewal'));
            setUnits((uList) =>
              uList.map((u) => (u.Unit_ID === t.Unit_ID && u.Current_Status === 'Maintenance' ? { ...u, Current_Status: hasLease ? 'Occupied' : 'Vacant' } : u))
            );
          }

          return {
            ...t,
            Status: status,
            Actual_Cost: finalCost,
            Technician_Notes: techNotes !== undefined ? techNotes : t.Technician_Notes,
            Tenant_Feedback_Rating: rating !== undefined ? rating : t.Tenant_Feedback_Rating,
            Completed_Date: completedDate,
          };
        }
        return t;
      })
    );

    logAudit('UPDATE', 'Maintenance', ticketId, `Status changed to ${status}`);
  };

  const assignVendorToWorkOrder = (
    ticketId: string,
    vendorName: string,
    scheduledDate: string,
    estimatedCost: number
  ) => {
    setWorkOrders((prev) =>
      prev.map((t) =>
        t.Ticket_ID === ticketId
          ? {
              ...t,
              Assigned_Vendor_Name: vendorName,
              Scheduled_Date: scheduledDate,
              Estimated_Cost: estimatedCost,
              Status: t.Status === 'New' ? 'Assigned' : t.Status,
            }
          : t
      )
    );
    logAudit('UPDATE', 'Maintenance', ticketId, `Assigned vendor ${vendorName} for ${scheduledDate}`);
  };

  // --- 3. LEASE EXPIRATION & RENEWAL ACTIONS ---
  const createLease = (leaseData: Omit<Lease, 'Lease_ID' | 'Created_At' | 'Status'>) => {
    const id = genId('LEASE');
    const newLease: Lease = {
      ...leaseData,
      Lease_ID: id,
      Status: 'Active',
      Created_At: new Date().toISOString(),
    };

    setLeases((prev) => [newLease, ...prev]);

    // Update Unit to Occupied and Tenant to Active
    setUnits((prev) => prev.map((u) => (u.Unit_ID === leaseData.Unit_ID ? { ...u, Current_Status: 'Occupied' } : u)));
    setTenants((prev) =>
      prev.map((t) =>
        t.Tenant_ID === leaseData.Tenant_ID
          ? { ...t, Status: 'Active', Current_Property_ID: leaseData.Property_ID, Current_Unit_ID: leaseData.Unit_ID }
          : t
      )
    );

    // Auto-create Deposit Transaction
    if (leaseData.Deposit_Required > 0) {
      const depId = genId('DEP');
      const depTxn: DepositTransaction = {
        Deposit_Txn_ID: depId,
        Lease_ID: id,
        Tenant_ID: leaseData.Tenant_ID,
        Property_ID: leaseData.Property_ID,
        Unit_ID: leaseData.Unit_ID,
        Txn_Type: 'Charge',
        Due_Amount: leaseData.Deposit_Required,
        Paid_Amount: leaseData.Deposit_Received || 0,
        Refund_Amount: 0,
        Balance: Math.max(0, leaseData.Deposit_Required - (leaseData.Deposit_Received || 0)),
        Txn_Date: leaseData.Lease_Start,
        Status: (leaseData.Deposit_Received || 0) >= leaseData.Deposit_Required ? 'Received' : 'Receivable',
        Created_By: currentUser.Email,
      };
      setDepositTransactions((prev) => [depTxn, ...prev]);

      // Post deposit hold liability journal: Debit 1020 Trust Bank, Credit 2200 Deposit Liability
      if ((leaseData.Deposit_Received || 0) > 0) {
        postInternalJournal(
          leaseData.Lease_Start,
          `Security Deposit Received - Lease ${id}`,
          'Deposit_Charge',
          depId,
          [
            { accountCode: '1020', propertyId: leaseData.Property_ID, unitId: leaseData.Unit_ID, tenantId: leaseData.Tenant_ID, debit: leaseData.Deposit_Received, credit: 0, memo: 'Trust Account Deposit Hold' },
            { accountCode: '2200', propertyId: leaseData.Property_ID, unitId: leaseData.Unit_ID, tenantId: leaseData.Tenant_ID, debit: 0, credit: leaseData.Deposit_Received, memo: 'Tenant Security Deposit Liability' },
          ]
        );
      }
    }

    logAudit('CREATE', 'Leasing', id, `New lease created for Tenant ${leaseData.Tenant_ID} at ${formatCurrency(leaseData.Monthly_Rent)}/mo`);
    return id;
  };

  const sendRenewalProposal = (leaseId: string, newMonthlyRent: number, newLeaseEnd: string) => {
    const l = leases.find((x) => x.Lease_ID === leaseId);
    if (!l) return;

    const tenant = getTenant(l.Tenant_ID);
    const prop = getProperty(l.Property_ID);

    setLeases((prev) =>
      prev.map((item) =>
        item.Lease_ID === leaseId
          ? {
              ...item,
              Status: 'Pending Renewal',
              Renewal_Proposal: {
                New_Monthly_Rent: newMonthlyRent,
                New_Lease_End: newLeaseEnd,
                Notice_Sent_Date: new Date().toISOString().slice(0, 10),
                Status: 'Sent',
              },
            }
          : item
      )
    );

    // Auto dispatch communication message
    const msgId = genId('MSG');
    const message: CommunicationMessage = {
      Message_ID: msgId,
      Recipient_Type: 'Tenant',
      Recipient_ID: l.Tenant_ID,
      Recipient_Name: tenant?.Full_Name || 'Valued Resident',
      Channel: 'Email',
      Template_Type: 'Renewal_Offer',
      Subject: `Lease Renewal Proposal & Term Extension — ${prop?.Property_Name}`,
      Body: `Dear ${tenant?.Full_Name || 'Resident'},\n\nYour current lease for Suite ${getUnit(l.Unit_ID)?.Unit_Number_Name} expires on ${l.Lease_End}. We are delighted to offer a 1-year renewal extension with a proposed monthly rent of ${formatCurrency(newMonthlyRent)} effective upon expiration through ${newLeaseEnd}.\n\nPlease review and confirm through your tenant portal.\n\nWarm regards,\n${settings.COMPANY_NAME}`,
      Sent_At: new Date().toISOString(),
      Status: 'Sent',
      Sent_By: currentUser.Full_Name,
    };

    setCommunications((prev) => [message, ...prev]);
    logAudit('NOTIFY', 'Leasing', leaseId, `Sent renewal proposal to ${tenant?.Full_Name} at ${formatCurrency(newMonthlyRent)}/mo`);
  };

  const acceptLeaseRenewal = (leaseId: string) => {
    setLeases((prev) =>
      prev.map((item) => {
        if (item.Lease_ID === leaseId && item.Renewal_Proposal) {
          return {
            ...item,
            Monthly_Rent: item.Renewal_Proposal.New_Monthly_Rent,
            Lease_End: item.Renewal_Proposal.New_Lease_End,
            Status: 'Renewed',
            Renewal_Proposal: {
              ...item.Renewal_Proposal,
              Status: 'Accepted',
            },
          };
        }
        return item;
      })
    );
    logAudit('UPDATE', 'Leasing', leaseId, `Lease renewal executed and term extended`);
  };

  const processMoveOutSettlement = ({
    leaseId,
    moveOutDate,
    damages,
    cleaningFee,
    unpaidRentDeduction,
    details,
  }: {
    leaseId: string;
    moveOutDate: string;
    damages: number;
    cleaningFee: number;
    unpaidRentDeduction: number;
    details: string;
  }): MoveOutSettlement => {
    const l = leases.find((x) => x.Lease_ID === leaseId);
    const depositHeld = l?.Deposit_Received || 0;
    const totalDeductions = damages + cleaningFee + unpaidRentDeduction;
    const netRefund = Math.max(0, depositHeld - totalDeductions);

    const settlementId = genId('SETTL');
    const settlement: MoveOutSettlement = {
      Settlement_ID: settlementId,
      Lease_ID: leaseId,
      Tenant_ID: l?.Tenant_ID || '',
      Property_ID: l?.Property_ID || '',
      Unit_ID: l?.Unit_ID || '',
      Move_Out_Date: moveOutDate,
      Security_Deposit_Held: depositHeld,
      Unpaid_Rent_Deduction: unpaidRentDeduction,
      Unpaid_Utilities_Deduction: 0,
      Damages_Deduction: damages,
      Cleaning_Fee_Deduction: cleaningFee,
      Deduction_Details: details,
      Net_Refund_Amount: netRefund,
      Status: 'Refunded',
      Settlement_Date: new Date().toISOString().slice(0, 10),
      Created_By: currentUser.Email,
    };

    // Update Lease to Ended
    setLeases((prev) => prev.map((item) => (item.Lease_ID === leaseId ? { ...item, Status: 'Ended' } : item)));

    // Update Unit to Turnover
    if (l) {
      setUnits((prev) => prev.map((u) => (u.Unit_ID === l.Unit_ID ? { ...u, Current_Status: 'Turnover' } : u)));
      setTenants((prev) =>
        prev.map((t) => (t.Tenant_ID === l.Tenant_ID ? { ...t, Status: 'Inactive', Current_Unit_ID: undefined } : t))
      );
    }

    // Post Move-Out Settlement Journal:
    // Debit 2200 Deposit Liability (depositHeld)
    // Credit 1020 Trust Bank (netRefund)
    // Credit 4020 Other Income / Turnover Recovery (damages + cleaning)
    // Credit 1100 AR Rent (unpaidRentDeduction)
    const journalLines: any[] = [
      { accountCode: '2200', propertyId: l?.Property_ID, unitId: l?.Unit_ID, tenantId: l?.Tenant_ID, debit: depositHeld, credit: 0, memo: 'Release Security Deposit Liability' },
    ];
    if (netRefund > 0) {
      journalLines.push({ accountCode: '1020', propertyId: l?.Property_ID, unitId: l?.Unit_ID, debit: 0, credit: netRefund, memo: 'Refund paid to tenant' });
    }
    if (damages + cleaningFee > 0) {
      journalLines.push({ accountCode: '4020', propertyId: l?.Property_ID, unitId: l?.Unit_ID, debit: 0, credit: damages + cleaningFee, memo: 'Deductions for turnover/damages' });
    }
    if (unpaidRentDeduction > 0) {
      journalLines.push({ accountCode: '1100', propertyId: l?.Property_ID, unitId: l?.Unit_ID, tenantId: l?.Tenant_ID, debit: 0, credit: unpaidRentDeduction, memo: 'Offset AR Rent balance' });
    }

    postInternalJournal(
      moveOutDate,
      `Move-Out Security Deposit Settlement - Lease ${leaseId}`,
      'Refund',
      settlementId,
      journalLines
    );

    logAudit('POST', 'Leasing', settlementId, `Move-out completed for Lease ${leaseId}. Refund: ${formatCurrency(netRefund)}, Deductions: ${formatCurrency(totalDeductions)}`);

    return settlement;
  };

  // --- 4. CRUD FOR PROPERTIES, UNITS, TENANTS, LANDLORDS ---
  const addProperty = (propData: Omit<Property, 'Property_ID' | 'Created_At'>) => {
    const id = genId('PROP');
    const newProp: Property = {
      ...propData,
      Property_ID: id,
      Created_At: new Date().toISOString(),
    };
    setProperties((prev) => [...prev, newProp]);
    logAudit('CREATE', 'Properties', id, `Added property ${propData.Property_Name}`);
    return id;
  };

  const updateProperty = (prop: Property) => {
    setProperties((prev) => prev.map((p) => (p.Property_ID === prop.Property_ID ? prop : p)));
    logAudit('UPDATE', 'Properties', prop.Property_ID, `Updated property details`);
  };

  const addUnit = (unitData: Omit<Unit, 'Unit_ID'>) => {
    const id = genId('UNIT');
    const newUnit: Unit = {
      ...unitData,
      Unit_ID: id,
    };
    setUnits((prev) => [...prev, newUnit]);
    logAudit('CREATE', 'Units', id, `Added unit ${unitData.Unit_Number_Name}`);
    return id;
  };

  const updateUnit = (unit: Unit) => {
    setUnits((prev) => prev.map((u) => (u.Unit_ID === unit.Unit_ID ? unit : u)));
    logAudit('UPDATE', 'Units', unit.Unit_ID, `Updated unit details`);
  };

  const addTenant = (tenantData: Omit<Tenant, 'Tenant_ID' | 'Created_At'>) => {
    const id = genId('TEN');
    const newTenant: Tenant = {
      ...tenantData,
      Tenant_ID: id,
      Created_At: new Date().toISOString(),
    };
    setTenants((prev) => [...prev, newTenant]);
    logAudit('CREATE', 'Tenants', id, `Added tenant ${tenantData.Full_Name}`);
    return id;
  };

  const updateTenant = (tenant: Tenant) => {
    setTenants((prev) => prev.map((t) => (t.Tenant_ID === tenant.Tenant_ID ? tenant : t)));
    logAudit('UPDATE', 'Tenants', tenant.Tenant_ID, `Updated tenant profile`);
  };

  const addLandlord = (landlordData: Omit<Landlord, 'Landlord_ID'>) => {
    const id = genId('LAND');
    const newLandlord: Landlord = {
      ...landlordData,
      Landlord_ID: id,
    };
    setLandlords((prev) => [...prev, newLandlord]);
    logAudit('CREATE', 'Landlords', id, `Added landlord ${landlordData.Full_Name}`);
    return id;
  };

  const updateLandlord = (landlord: Landlord) => {
    setLandlords((prev) => prev.map((l) => (l.Landlord_ID === landlord.Landlord_ID ? landlord : l)));
    logAudit('UPDATE', 'Landlords', landlord.Landlord_ID, `Updated landlord profile`);
  };

  // --- 5. UTILITY ACTIONS & MASTER CATEGORIES ---
  const addUtilityCategory = (categoryData: Omit<UtilityMaster, 'Utility_ID'>) => {
    const id = genId('UTIL');
    const newCategory: UtilityMaster = {
      ...categoryData,
      Utility_ID: id,
    };
    setUtilitiesMaster((prev) => [...prev, newCategory]);
    logAudit('CREATE', 'Utilities Master', id, `Added utility tariff category ${categoryData.Utility_Name}`);
    return id;
  };

  const updateUtilityCategory = (category: UtilityMaster) => {
    setUtilitiesMaster((prev) => prev.map((u) => (u.Utility_ID === category.Utility_ID ? category : u)));
    logAudit('UPDATE', 'Utilities Master', category.Utility_ID, `Updated utility category ${category.Utility_Name}`);
  };

  const createUtilityBill = (billData: Omit<UtilityBill, 'Utility_Bill_ID' | 'Created_At' | 'Status' | 'Created_By'>) => {
    const id = genId('UBILL');
    const newBill: UtilityBill = {
      ...billData,
      Utility_Bill_ID: id,
      Status: 'Open',
      Created_By: currentUser.Email,
      Created_At: new Date().toISOString(),
    };
    setUtilityBills((prev) => [newBill, ...prev]);

    // Post bill expense journal: Debit 5010 Master Utilities Expense, Credit 2000 AP
    postInternalJournal(
      billData.Bill_Date,
      `Master Utility Bill - ${billData.Vendor} (${billData.Utility_Name})`,
      'Utility_Billing',
      id,
      [
        { accountCode: '5010', propertyId: billData.Property_ID, debit: billData.Master_Amount, credit: 0, memo: 'Master utility expense' },
        { accountCode: '2000', propertyId: billData.Property_ID, debit: 0, credit: billData.Master_Amount, memo: 'Accounts Payable - Utility Vendor' },
      ]
    );

    logAudit('CREATE', 'Utilities', id, `Logged utility bill ${billData.Bill_Reference} for ${formatCurrency(billData.Master_Amount)}`);
    return id;
  };

  const allocateUtilityBill = (
    utilityBillId: string,
    splits: { unitId: string; tenantId: string; amount: number }[]
  ) => {
    const bill = utilityBills.find((b) => b.Utility_Bill_ID === utilityBillId);
    if (!bill) return;

    const newSplits: UtilitySplit[] = splits.map((s) => ({
      Split_ID: genId('USPL'),
      Utility_Bill_ID: utilityBillId,
      Utility_Name: bill.Utility_Name,
      Property_ID: bill.Property_ID,
      Unit_ID: s.unitId,
      Tenant_ID: s.tenantId,
      Allocated_Amount: s.amount,
      Amount_Paid: 0,
      Balance: s.amount,
      Status: 'Unpaid',
      Created_By: currentUser.Email,
    }));

    const totalAllocated = splits.reduce((acc, s) => acc + s.amount, 0);

    // Post Journal: Debit 1110 AR Utilities Recovery, Credit 4010 Utility Recovery Revenue
    const jId = postInternalJournal(
      bill.Bill_Date,
      `Utility Sub-meter Allocation - ${bill.Utility_Name}`,
      'Utility_Billing',
      utilityBillId,
      [
        { accountCode: '1110', propertyId: bill.Property_ID, debit: totalAllocated, credit: 0, memo: 'Utility Recovery Receivable' },
        { accountCode: '4010', propertyId: bill.Property_ID, debit: 0, credit: totalAllocated, memo: 'Utility Recovery Revenue' },
      ]
    );

    newSplits.forEach((s) => (s.Journal_Ref_ID = jId));

    setUtilitySplits((prev) => [...newSplits, ...prev]);
    setUtilityBills((prev) =>
      prev.map((b) => (b.Utility_Bill_ID === utilityBillId ? { ...b, Status: 'Allocated' } : b))
    );

    logAudit('UPDATE', 'Utilities', utilityBillId, `Allocated ${formatCurrency(totalAllocated)} across ${splits.length} units`);
  };

  const directTenantUtilityCharge = ({
    tenantId,
    propertyId,
    unitId,
    utilityName,
    amount,
    billDate,
    dueDate,
    memo = '',
  }: {
    tenantId: string;
    propertyId: string;
    unitId: string;
    utilityName: string;
    amount: number;
    billDate: string;
    dueDate: string;
    memo?: string;
  }) => {
    const splitId = genId('USPL');
    const newSplit: UtilitySplit = {
      Split_ID: splitId,
      Utility_Bill_ID: `DIRECT-UTIL-${billDate}`,
      Utility_Name: utilityName,
      Property_ID: propertyId,
      Unit_ID: unitId,
      Tenant_ID: tenantId,
      Allocated_Amount: amount,
      Amount_Paid: 0,
      Balance: amount,
      Status: 'Unpaid',
      Created_By: currentUser.Email,
    };

    // Post Journal Entry: Debit 1110 AR Utility Recovery, Credit 4010 Utility Recovery Revenue
    const jId = postInternalJournal(
      billDate,
      `Direct Utility Charge (${utilityName}) - Tenant ${tenantId}`,
      'Utility_Billing',
      splitId,
      [
        { accountCode: '1110', propertyId, unitId, tenantId, debit: amount, credit: 0, memo: memo || `Direct ${utilityName} Recovery` },
        { accountCode: '4010', propertyId, unitId, tenantId, debit: 0, credit: amount, memo: `${utilityName} Recovery Revenue` },
      ]
    );
    newSplit.Journal_Ref_ID = jId;

    setUtilitySplits((prev) => [newSplit, ...prev]);
    logAudit('CREATE', 'Utilities', splitId, `Added direct utility charge of ${formatCurrency(amount)} (${utilityName}) to tenant ${tenantId}`);
    return splitId;
  };

  const recordUtilityPayment = (splitId: string, amountPaid: number, paymentMethod: string, reference = '') => {
    setUtilitySplits((prev) =>
      prev.map((u) => {
        if (u.Split_ID === splitId) {
          const newPaid = u.Amount_Paid + amountPaid;
          const newBal = Math.max(0, u.Allocated_Amount - newPaid);
          const newStatus = newBal <= 0 ? 'Paid' : 'Partial';

          postInternalJournal(
            '2026-08-30',
            `Utility Payment Collection - ${u.Split_ID}`,
            'Collection',
            splitId,
            [
              { accountCode: '1010', propertyId: u.Property_ID, unitId: u.Unit_ID, tenantId: u.Tenant_ID, debit: amountPaid, credit: 0, memo: 'Utility collection deposit' },
              { accountCode: '1110', propertyId: u.Property_ID, unitId: u.Unit_ID, tenantId: u.Tenant_ID, debit: 0, credit: amountPaid, memo: 'Clear Utility Receivable' },
            ]
          );

          return {
            ...u,
            Amount_Paid: newPaid,
            Balance: newBal,
            Status: newStatus,
            Payment_Date: '2026-08-30',
          };
        }
        return u;
      })
    );
  };

  // --- 6. ACCOUNTING ACTIONS ---
  const postManualJournal = (
    date: string,
    description: string,
    lines: { accountCode: string; propertyId?: string; debit: number; credit: number; memo?: string }[]
  ) => {
    const jId = postInternalJournal(date, description, 'Manual', genId('MAN'), lines);
    logAudit('POST', 'Accounting', jId, `Manual journal entry posted: ${description}`);
    return jId;
  };

  const closeAccountingPeriod = (periodId: string) => {
    setPeriods((prev) =>
      prev.map((p) =>
        p.Period_ID === periodId
          ? {
              ...p,
              Status: 'Closed',
              Closed_By: currentUser.Email,
              Closed_At: new Date().toISOString(),
            }
          : p
      )
    );
    logAudit('UPDATE', 'Accounting', periodId, `Closed accounting period ${periodId}`);
  };

  const reopenAccountingPeriod = (periodId: string) => {
    setPeriods((prev) =>
      prev.map((p) => (p.Period_ID === periodId ? { ...p, Status: 'OPEN', Closed_By: undefined, Closed_At: undefined } : p))
    );
    logAudit('UPDATE', 'Accounting', periodId, `Reopened accounting period ${periodId}`);
  };

  const createAccountingPeriod = (name: string, startDate: string, endDate: string) => {
    const id = genId('PER');
    const newPeriod: AccountingPeriod = {
      Period_ID: id,
      Period_Name: name,
      Start_Date: startDate,
      End_Date: endDate,
      Status: 'OPEN',
    };
    setPeriods((prev) => [...prev, newPeriod]);
    logAudit('CREATE', 'Accounting', id, `Created period ${name}`);
  };

  // --- 7. GOOGLE MAIL & COMMUNICATIONS ---
  const sendGoogleMail = (
    mailData: Omit<GoogleMailMessage, 'Mail_ID' | 'Sent_At' | 'Status' | 'Sent_By'>
  ) => {
    const id = genId('GMAIL');
    const newMail: GoogleMailMessage = {
      ...mailData,
      Mail_ID: id,
      Sent_At: new Date().toISOString(),
      Status: 'Sent',
      Sent_By: currentUser.Full_Name,
    };
    setGoogleMails((prev) => [newMail, ...prev]);
    logAudit('NOTIFY', 'Google Workspace Mail', id, `Dispatched email "${mailData.Subject}" to ${mailData.Recipient_Email}`);
    return id;
  };

  const batchSendGoogleMails = (
    mails: Omit<GoogleMailMessage, 'Mail_ID' | 'Sent_At' | 'Status' | 'Sent_By'>[]
  ) => {
    const prepared = mails.map((m) => ({
      ...m,
      Mail_ID: genId('GMAIL'),
      Sent_At: new Date().toISOString(),
      Status: 'Sent' as const,
      Sent_By: currentUser.Full_Name,
    }));
    setGoogleMails((prev) => [...prepared, ...prev]);
    logAudit('NOTIFY', 'Google Workspace Mail', 'BATCH', `Dispatched batch of ${prepared.length} automated emails`);
    return prepared.length;
  };

  const sendCommunication = (
    msgData: Omit<CommunicationMessage, 'Message_ID' | 'Sent_At' | 'Status' | 'Sent_By'>
  ) => {
    const id = genId('MSG');
    const newMsg: CommunicationMessage = {
      ...msgData,
      Message_ID: id,
      Sent_At: new Date().toISOString(),
      Status: 'Sent',
      Sent_By: currentUser.Full_Name,
    };
    setCommunications((prev) => [newMsg, ...prev]);
    logAudit('NOTIFY', 'Communications', id, `Sent message: "${msgData.Subject}" to ${msgData.Recipient_Name}`);
    return id;
  };

  // --- 8. SETTINGS & RESET ---
  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    logAudit('UPDATE', 'Settings', 'Config', `System configuration updated`);
  };

  const resetDemoData = () => {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(STORAGE_KEY)) {
        localStorage.removeItem(key);
      }
    });
    setProperties(INITIAL_PROPERTIES);
    setUnits(INITIAL_UNITS);
    setLandlords(INITIAL_LANDLORDS);
    setTenants(INITIAL_TENANTS);
    setLeases(INITIAL_LEASES);
    setRentTransactions(INITIAL_RENT_TRANSACTIONS);
    setDepositTransactions(INITIAL_DEPOSITS);
    setWorkOrders(INITIAL_WORK_ORDERS);
    setUtilitiesMaster(INITIAL_UTILITIES_MASTER);
    setUtilityBills(INITIAL_UTILITY_BILLS);
    setUtilitySplits(INITIAL_UTILITY_SPLITS);
    setContraPayments(INITIAL_CONTRA_PAYMENTS);
    setGoogleMails(INITIAL_GOOGLE_MAILS);
    setCollections(INITIAL_COLLECTIONS);
    setCOA(INITIAL_COA);
    setJournals(INITIAL_JOURNALS);
    setPeriods(INITIAL_PERIODS);
    setCommunications(INITIAL_COMMUNICATIONS);
    setSettings(INITIAL_SETTINGS);
    setAuditLog([]);
    setActiveViewState('dashboard');
    setActiveRoleState('Admin');
  };

  const bulkImportData = (payload: {
    properties?: Property[];
    units?: Unit[];
    landlords?: Landlord[];
    tenants?: Tenant[];
    leases?: Lease[];
    rentTransactions?: RentTransaction[];
    journals?: { header: JournalHeader; lines: JournalLine[] }[];
  }) => {
    let totalImported = 0;

    if (payload.landlords && payload.landlords.length > 0) {
      setLandlords((prev) => {
        const existingIds = new Set(prev.map((x) => x.Landlord_ID));
        const newOnes = payload.landlords!.filter((x) => !existingIds.has(x.Landlord_ID));
        const updated = prev.map((x) => {
          const match = payload.landlords!.find((n) => n.Landlord_ID === x.Landlord_ID);
          return match || x;
        });
        return [...updated, ...newOnes];
      });
      totalImported += payload.landlords.length;
    }

    if (payload.properties && payload.properties.length > 0) {
      setProperties((prev) => {
        const existingIds = new Set(prev.map((x) => x.Property_ID));
        const newOnes = payload.properties!.filter((x) => !existingIds.has(x.Property_ID));
        const updated = prev.map((x) => {
          const match = payload.properties!.find((n) => n.Property_ID === x.Property_ID);
          return match || x;
        });
        return [...updated, ...newOnes];
      });
      totalImported += payload.properties.length;
    }

    if (payload.units && payload.units.length > 0) {
      setUnits((prev) => {
        const existingIds = new Set(prev.map((x) => x.Unit_ID));
        const newOnes = payload.units!.filter((x) => !existingIds.has(x.Unit_ID));
        const updated = prev.map((x) => {
          const match = payload.units!.find((n) => n.Unit_ID === x.Unit_ID);
          return match || x;
        });
        return [...updated, ...newOnes];
      });
      totalImported += payload.units.length;
    }

    if (payload.tenants && payload.tenants.length > 0) {
      setTenants((prev) => {
        const existingIds = new Set(prev.map((x) => x.Tenant_ID));
        const newOnes = payload.tenants!.filter((x) => !existingIds.has(x.Tenant_ID));
        const updated = prev.map((x) => {
          const match = payload.tenants!.find((n) => n.Tenant_ID === x.Tenant_ID);
          return match || x;
        });
        return [...updated, ...newOnes];
      });
      totalImported += payload.tenants.length;
    }

    if (payload.leases && payload.leases.length > 0) {
      setLeases((prev) => {
        const existingIds = new Set(prev.map((x) => x.Lease_ID));
        const newOnes = payload.leases!.filter((x) => !existingIds.has(x.Lease_ID));
        const updated = prev.map((x) => {
          const match = payload.leases!.find((n) => n.Lease_ID === x.Lease_ID);
          return match || x;
        });
        return [...updated, ...newOnes];
      });
      totalImported += payload.leases.length;
    }

    if (payload.rentTransactions && payload.rentTransactions.length > 0) {
      setRentTransactions((prev) => {
        const existingIds = new Set(prev.map((x) => x.Rent_Txn_ID));
        const newOnes = payload.rentTransactions!.filter((x) => !existingIds.has(x.Rent_Txn_ID));
        const updated = prev.map((x) => {
          const match = payload.rentTransactions!.find((n) => n.Rent_Txn_ID === x.Rent_Txn_ID);
          return match || x;
        });
        return [...updated, ...newOnes];
      });
      totalImported += payload.rentTransactions.length;
    }

    if (payload.journals && payload.journals.length > 0) {
      setJournals((prev) => [...payload.journals!, ...prev]);
      totalImported += payload.journals.length;
    }

    logAudit('CREATE', 'Migration', 'BULK-IMPORT', `Imported ${totalImported} records from Google Sheets/CSV migration`);

    return {
      importedCount: totalImported,
      message: `Successfully migrated ${totalImported} records into Dream Dwell Asset ERP.`,
    };
  };

  return (
    <ERPContext.Provider
      value={{
        currentUser,
        users,
        activeRole,
        activeView,
        properties,
        units,
        landlords,
        tenants,
        leases,
        rentTransactions,
        depositTransactions,
        workOrders,
        utilitiesMaster,
        utilityBills,
        utilitySplits,
        contraPayments,
        googleMails,
        collections,
        coa,
        journals,
        periods,
        communications,
        settings,
        auditLog,
        currentMonth,
        isMobileSimulatorOpen,

        setActiveView,
        setActiveRole,
        setCurrentUserById,
        setIsMobileSimulatorOpen,

        hasPermission,
        canAccessView,

        getProperty,
        getUnit,
        getTenant,
        getLandlord,
        getLease,
        formatCurrency,

        addUser,
        updateUser,
        updateUserPermissions,
        deleteUser,

        generateMonthlyRentBatch,
        createCustomRentInvoice,
        recordRentPayment,
        recordContraPayment,
        applyLateFeesToOverdue,
        addCustomChargeToInvoice,

        createWorkOrder,
        updateWorkOrderStatus,
        assignVendorToWorkOrder,

        createLease,
        sendRenewalProposal,
        acceptLeaseRenewal,
        processMoveOutSettlement,

        addProperty,
        updateProperty,
        addUnit,
        updateUnit,
        addTenant,
        updateTenant,
        addLandlord,
        updateLandlord,

        addUtilityCategory,
        updateUtilityCategory,
        createUtilityBill,
        allocateUtilityBill,
        directTenantUtilityCharge,
        recordUtilityPayment,

        postManualJournal,
        closeAccountingPeriod,
        reopenAccountingPeriod,
        createAccountingPeriod,

        sendGoogleMail,
        batchSendGoogleMails,
        sendCommunication,
        updateSettings,
        resetDemoData,
        bulkImportData,
      }}
    >
      {children}
    </ERPContext.Provider>
  );
};

export const useERP = () => {
  const context = useContext(ERPContext);
  if (!context) {
    throw new Error('useERP must be used within an ERPProvider');
  }
  return context;
};
