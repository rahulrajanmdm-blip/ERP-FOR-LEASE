export type UserRole = 'Admin' | 'Finance' | 'Operations' | 'Landlord' | 'Tenant' | 'Auditor' | 'Custom';

export type PaymentMethod =
  | 'Interac e-Transfer'
  | 'Pre-Authorized Debit (PAD)'
  | 'Cheque / Post-Dated Cheque'
  | 'Interac Debit Card'
  | 'Credit Card (Visa / Mastercard)'
  | 'Bank Draft / Certified Cheque'
  | 'Cash / Branch Deposit'
  | 'Bank Transfer'
  | 'Credit Card'
  | 'Debit'
  | 'Cash'
  | 'Cheque'
  | 'ACH';

export type ViewTab =
  | 'dashboard'
  | 'properties'
  | 'units'
  | 'tenants'
  | 'landlords'
  | 'leases'
  | 'billing'
  | 'accounting'
  | 'reports'
  | 'upcoming_events'
  | 'data_migration'
  | 'utilities'
  | 'deposits'
  | 'maintenance'
  | 'team_rbac'
  | 'ai_assistant'
  | 'tenant_portal'
  | 'settings';

export interface UserPermissions {
  // View access
  canViewDashboard: boolean;
  canViewProperties: boolean;
  canViewUnits: boolean;
  canViewTenants: boolean;
  canViewLandlords: boolean;
  canViewLeases: boolean;
  canViewBilling: boolean;
  canViewMaintenance: boolean;
  canViewUtilities: boolean;
  canViewDeposits: boolean;
  canViewAccounting: boolean;
  canViewReports: boolean;
  canViewUpcomingEvents: boolean;
  canViewDataMigration: boolean;
  canViewTeam: boolean;
  canViewAIAssistant: boolean;
  canViewTenantPortal: boolean;
  canViewSettings: boolean;

  // Functional action permissions
  canCollectRent: boolean;
  canRecordContraPayment: boolean;
  canBatchGenerateInvoices: boolean;
  canPostManualJournals: boolean;
  canManageLeases: boolean;
  canManageMaintenance: boolean;
  canManageUtilities: boolean;
  canManageUsers: boolean;
  canSettleMoveOut: boolean;
  canExportReports: boolean;
  canImportSpreadsheets: boolean;
}

export interface User {
  User_ID: string;
  Email: string;
  Full_Name: string;
  Role: UserRole;
  Department?: string;
  Phone?: string;
  Is_Active: boolean;
  Created_At: string;
  Last_Login?: string;
  Associated_Tenant_ID?: string;
  Associated_Landlord_ID?: string;
  Permissions: UserPermissions;
}

export type UserAccount = User;

export interface Property {
  Property_ID: string;
  Property_Name: string;
  Address: string;
  City: string;
  Province: string;
  Postal_Code: string;
  Landlord_ID: string;
  Property_Status: 'Active' | 'Under Maintenance' | 'Inactive';
  Management_Fee_Percentage: number;
  Master_Rent_Amount?: number;
  Image_URL?: string;
  Images?: string[];
  Property_Type?: 'Multi-Family Residential' | 'Luxury High-Rise Condominiums' | 'Commercial Mixed-Use' | 'Townhome Complex' | 'Executive Suites';
  Year_Built?: number;
  Total_Square_Feet?: number;
  Valuation_CAD?: number;
  Property_Manager?: string;
  Amenities?: string[];
  Tax_Roll_Number?: string;
  Notes?: string;
  Created_At: string;
}

export interface Unit {
  Unit_ID: string;
  Property_ID: string;
  Unit_Number_Name: string;
  Unit_Type: string; // e.g. Studio, 1BR, 2BR, Penthouse
  Target_Rent: number;
  Current_Status: 'Vacant' | 'Occupied' | 'Maintenance' | 'Turnover' | 'Reserved';
  Bedrooms: number;
  Bathrooms: number;
  Square_Feet: number;
  Floor_Number: number;
  Amenities: string[];
  Notes?: string;
}

export interface Landlord {
  Landlord_ID: string;
  Full_Name: string;
  Email: string;
  Phone: string;
  Address: string;
  Payment_Method: 'Bank Transfer' | 'Direct Deposit' | 'Cheque' | 'Wire';
  Bank_Reference: string;
  Account_Number: string;
  Status: 'Active' | 'Inactive';
  Notes?: string;
}

export interface Tenant {
  Tenant_ID: string;
  Full_Name: string;
  Email: string;
  Phone: string;
  Emergency_Contact: string;
  Status: 'Active' | 'Prospect' | 'Inactive' | 'Evicted';
  Current_Property_ID?: string;
  Current_Unit_ID?: string;
  Credit_Score?: number;
  Employer?: string;
  Annual_Income?: number;
  Created_At: string;
  Notes?: string;
}

export interface Lease {
  Lease_ID: string;
  Tenant_ID: string;
  Property_ID: string;
  Unit_ID: string;
  Lease_Start: string;
  Lease_End: string;
  Monthly_Rent: number;
  Deposit_Required: number;
  Deposit_Received: number;
  Rent_Due_Day: number; // 1-31 (typically 1st of month)
  Grace_Period_Days: number; // e.g. 5 days
  Late_Fee_Amount: number; // e.g. 50
  Status: 'Active' | 'Pending Renewal' | 'Renewed' | 'Ended' | 'Terminated';
  Drive_Folder_URL?: string;
  Auto_Renew: boolean;
  Renewal_Proposal?: {
    New_Monthly_Rent: number;
    New_Lease_End: string;
    Notice_Sent_Date: string;
    Status: 'Sent' | 'Accepted' | 'Declined' | 'Negotiating';
  };
  Created_At: string;
  Notes?: string;
}

export interface RentLineItem {
  Description: string;
  Amount: number;
  Category: 'Base Rent' | 'Utility Charge' | 'Parking' | 'Late Fee' | 'Storage' | 'Pet Rent' | 'Other';
}

export interface RentTransaction {
  Rent_Txn_ID: string;
  Lease_ID: string;
  Tenant_ID: string;
  Property_ID: string;
  Unit_ID: string;
  Period_Month: string; // YYYY-MM
  Due_Date: string;
  Amount_Billed: number;
  Amount_Paid: number;
  Balance: number;
  Late_Fee_Applied: number;
  Payment_Date?: string;
  Payment_Method?: PaymentMethod;
  Reference?: string;
  Status: 'Unpaid' | 'Partial' | 'Paid' | 'Overdue';
  Journal_Ref_ID?: string;
  Line_Items: RentLineItem[];
  Created_By: string;
  Created_At: string;
}

export interface DepositTransaction {
  Deposit_Txn_ID: string;
  Lease_ID: string;
  Tenant_ID: string;
  Property_ID: string;
  Unit_ID: string;
  Txn_Type: 'Charge' | 'Payment' | 'Deduction' | 'Refund';
  Due_Amount: number;
  Paid_Amount: number;
  Refund_Amount: number;
  Balance: number;
  Txn_Date: string;
  Status: 'Receivable' | 'Received' | 'Partially Refunded' | 'Fully Refunded';
  Journal_Ref_ID?: string;
  Reference?: string;
  Created_By: string;
}

export interface WorkOrder {
  Ticket_ID: string;
  Property_ID: string;
  Unit_ID: string;
  Tenant_ID?: string;
  Title: string;
  Description: string;
  Category: 'Plumbing' | 'Electrical' | 'HVAC' | 'Appliance' | 'Structural' | 'Pest Control' | 'Turnover / Cleaning' | 'Other';
  Priority: 'Emergency' | 'High' | 'Medium' | 'Low';
  Status: 'New' | 'Assigned' | 'In Progress' | 'Awaiting Parts' | 'Completed' | 'Cancelled';
  Assigned_Vendor_ID?: string;
  Assigned_Vendor_Name?: string;
  Estimated_Cost: number;
  Actual_Cost: number;
  Cost_Chargeable_To: 'Property Owner / Operating' | 'Tenant' | 'Warranty / Landlord';
  Scheduled_Date?: string;
  Completed_Date?: string;
  Before_Photos?: string[];
  After_Photos?: string[];
  Technician_Notes?: string;
  Tenant_Feedback_Rating?: number;
  Created_By: string;
  Created_At: string;
}

export interface UtilityMaster {
  Utility_ID: string;
  Utility_Name: string;
  Default_Vendor: string;
  Allocation_Method: 'RUBS_SqFt' | 'Equal_Per_Unit' | 'Sub_Meter' | 'Per_Occupant' | 'Fixed_Charge';
  Rate_Per_Unit?: number;
  Account_Code?: string;
  Status: 'Active' | 'Inactive';
}

export interface ContraPaymentSplit {
  Target_Type: 'Rent_Invoice' | 'Utility_Bill' | 'Parking' | 'Late_Fee' | 'Custom';
  Target_ID?: string;
  Description: string;
  Amount: number;
  Account_Code: string;
}

export interface ContraPaymentEntry {
  Contra_ID: string;
  Date: string;
  Tenant_ID: string;
  Property_ID: string;
  Unit_ID: string;
  Total_Received_Amount: number;
  Deposit_Bank_Account: string; // e.g. 1010 Operating Cash
  Payment_Method: PaymentMethod;
  Reference_Number: string;
  Notes?: string;
  Splits: ContraPaymentSplit[];
  Journal_Ref_ID?: string;
  Created_By: string;
  Created_At: string;
}

export type GoogleMailTemplateType =
  | 'Payment_Confirmation'
  | 'Welcome_Onboarding'
  | 'Move_In_Clearance'
  | 'Move_Out_Refund'
  | 'Overdue_Rent_Reminder'
  | 'Lease_Renewal_Offer'
  | 'Custom';

export type GoogleMailTemplate = GoogleMailTemplateType;

export interface GoogleMailMessage {
  Mail_ID: string;
  Recipient_Email: string;
  Recipient_Name: string;
  Tenant_ID?: string;
  Template_Type: GoogleMailTemplateType;
  Subject: string;
  Html_Body: string;
  Status: 'Sent' | 'Delivered' | 'Opened' | 'Draft';
  Sent_At: string;
  Sent_By: string;
  Has_Attachment: boolean;
  Attachment_Name?: string;
  Trigger_Event?: string;
  Tracking_Ref?: string;
}

export interface UtilityBill {
  Utility_Bill_ID: string;
  Property_ID: string;
  Utility_ID: string;
  Utility_Name: string;
  Bill_Date: string;
  Due_Date: string;
  Vendor: string;
  Master_Amount: number;
  Bill_Reference: string;
  Status: 'Open' | 'Allocated' | 'Paid';
  Notes?: string;
  Created_By: string;
  Created_At: string;
}

export interface UtilitySplit {
  Split_ID: string;
  Utility_Bill_ID: string;
  Utility_Name: string;
  Property_ID: string;
  Unit_ID: string;
  Tenant_ID: string;
  Allocated_Amount: number;
  Amount_Paid: number;
  Balance: number;
  Payment_Date?: string;
  Status: 'Unpaid' | 'Partial' | 'Paid';
  Journal_Ref_ID?: string;
  Created_By: string;
}

export interface CollectionRecord {
  Collection_ID: string;
  Collection_Date: string;
  Tenant_ID: string;
  Property_ID: string;
  Unit_ID: string;
  Collection_Type: 'Rent' | 'Utility' | 'Deposit' | 'Late Fee' | 'Maintenance' | 'Other';
  Amount: number;
  Payment_Method: 'Bank Transfer' | 'Credit Card' | 'Cash' | 'Cheque' | 'ACH';
  Reference: string;
  Applied_To: string; // Rent_Txn_ID or Split_ID etc.
  Notes?: string;
  Journal_Ref_ID?: string;
  Created_By: string;
  Created_At: string;
}

export interface ChartOfAccount {
  Account_Code: string;
  Account_Name: string;
  Account_Type: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  Account_Group: string;
  Normal_Balance: 'Debit' | 'Credit';
  Is_Control_Account: boolean;
  Is_Active: boolean;
  Current_Balance?: number;
}

export interface JournalHeader {
  Journal_ID: string;
  Date: string;
  Description: string;
  Reference_Type: 'Rent_Charge' | 'Collection' | 'Utility_Billing' | 'Deposit_Charge' | 'Deposit_Collection' | 'Refund' | 'Work_Order_Expense' | 'Manual';
  Reference_ID: string;
  Created_By: string;
  Status: 'POSTED' | 'DRAFT';
  Period_ID: string;
  Created_At: string;
}

export interface JournalLine {
  Line_ID: string;
  Journal_ID: string;
  Account_Code: string;
  Property_ID?: string;
  Unit_ID?: string;
  Tenant_ID?: string;
  Debit_Amount: number;
  Credit_Amount: number;
  Memo?: string;
}

export interface AccountingPeriod {
  Period_ID: string;
  Period_Name: string;
  Start_Date: string;
  End_Date: string;
  Status: 'OPEN' | 'Closed';
  Closed_By?: string;
  Closed_At?: string;
}

export interface CommunicationMessage {
  Message_ID: string;
  Recipient_Type: 'Tenant' | 'Landlord' | 'All Tenants' | 'Property Broadcast';
  Recipient_ID: string;
  Recipient_Name: string;
  Channel: 'Email' | 'SMS' | 'In-App Portal';
  Template_Type: 'Rent_Reminder' | 'Overdue_Warning' | 'Lease_Expiring' | 'Renewal_Offer' | 'Maintenance_Update' | 'General_Announcement';
  Subject: string;
  Body: string;
  Sent_At: string;
  Status: 'Sent' | 'Delivered' | 'Read' | 'Failed';
  Sent_By: string;
}

export interface MoveOutSettlement {
  Settlement_ID: string;
  Lease_ID: string;
  Tenant_ID: string;
  Property_ID: string;
  Unit_ID: string;
  Move_Out_Date: string;
  Security_Deposit_Held: number;
  Unpaid_Rent_Deduction: number;
  Unpaid_Utilities_Deduction: number;
  Damages_Deduction: number;
  Cleaning_Fee_Deduction: number;
  Deduction_Details: string;
  Net_Refund_Amount: number;
  Status: 'Draft' | 'Approved' | 'Refunded';
  Settlement_Date: string;
  Created_By: string;
}

export interface SystemAudit {
  Audit_ID: string;
  Timestamp: string;
  User_Email: string;
  Action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ARCHIVE' | 'POST' | 'GENERATE' | 'NOTIFY';
  Module: string;
  Record_ID: string;
  Details: string;
}

export interface SystemSettings {
  COMPANY_NAME: string;
  COMPANY_EMAIL: string;
  COMPANY_PHONE: string;
  COMPANY_ADDRESS: string;
  CURRENCY: string;
  CURRENCY_SYMBOL: string;
  DEFAULT_GRACE_PERIOD_DAYS: number;
  DEFAULT_LATE_FEE: number;
  AUTOMATED_BILLING_DAY: number;
  LEASE_EXPIRY_NOTIFICATION_DAYS: number[]; // e.g. [90, 60, 30]
  AUTO_SEND_OVERDUE_NOTICES: boolean;
}
