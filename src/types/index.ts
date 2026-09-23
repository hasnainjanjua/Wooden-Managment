export type CatalogCategory = 'DOOR' | 'HARDWARE' | 'SERVICE';

export interface Customer {
  id: number;
  name: string;
  phone?: string;
  address?: string;
  created_at: string;
  current_balance?: number; // Calculated dynamically: SUM(debit) - SUM(credit)
}

export interface CatalogItem {
  id: number;
  category: CatalogCategory;
  name: string;
  default_rate: number;
  is_active: number; // 1 or 0
  display_order: number;
  stock_qty?: number;
  min_stock_alert?: number;
}

export interface SalesInvoice {
  id: number;
  invoice_no: string;
  customer_id?: number | null;
  invoice_date: string;
  total_amount: number;
  discount_amount: number;
  cash_received: number;
  balance_amount: number;
  notes?: string;
  is_void: number;
  void_reason?: string;
  voided_at?: string;
  created_at: string;
  customer_name?: string;
  customer_phone?: string;
}

export interface SalesInvoiceItem {
  id: number;
  invoice_id: number;
  item_id?: number | null;
  item_name: string;
  quantity: number;
  rate: number;
  line_total: number;
}

export type CncStatus = 'Pending' | 'In Progress' | 'Completed';

export interface CncJob {
  id: number;
  job_no: string;
  customer_id?: number | null;
  customer_name_manual?: string;
  job_description: string;
  size_specification?: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: CncStatus;
  notes?: string;
  job_date: string;
  completed_at?: string;
  is_void: number;
  void_reason?: string;
  voided_at?: string;
  created_at: string;
  customer_name?: string;
  customer_phone?: string;
}

export type LedgerRefType = 'OPENING_BAL' | 'SALE_INVOICE' | 'CNC_JOB' | 'WASOOLI' | 'ADJUSTMENT';

export interface CustomerLedgerEntry {
  id: number;
  customer_id: number;
  entry_date: string;
  ref_type: LedgerRefType;
  ref_id?: number | null;
  description: string;
  debit: number;   // Banam (Customer owes)
  credit: number;  // Jama (Customer paid)
  is_void: number;
  void_reason?: string;
  original_entry_id?: number | null;
  created_at: string;
  customer_name?: string;
}

export type ExpenseCategory = 'Bijli' | 'Chai/Khana' | 'Mazdoori' | 'Tooling/CNC Bits' | 'Kiraya' | 'Other';

export interface Expense {
  id: number;
  expense_date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  payment_method: string; // 'CASH'
  created_at: string;
}

export interface CartItem {
  item_id?: number;
  item_name: string;
  category?: CatalogCategory;
  quantity: number;
  rate: number;
  line_total: number;
}

export interface DailySummary {
  date: string;
  endDate?: string;
  total_sales_volume: number; // Cash + Udhaar
  cash_sales_received: number;
  udhaar_sales: number;
  total_cnc_volume: number;
  cnc_cash_received: number;
  khata_wasooli_received: number;
  total_cash_inflow: number; // cash_sales + cnc_cash + wasooli
  total_expenses: number;
  total_supplier_payments: number;
  total_karigar_payments: number;
  total_cash_outflow: number; // expenses + supplier payments + karigar payments
  net_drawer_cash: number; // total_cash_inflow - total_cash_outflow
  total_market_receivables: number; // All active customer debts
  total_supplier_payables: number; // What we owe suppliers
}

export interface ShopSettings {
  shop_name: string;
  urdu_title: string;
  tagline: string;
  phone1: string;
  phone2: string;
  address: string;
  receipt_footer: string;
  app_pin?: string;
  pin_enabled?: number;
}

// ============================================================================
// SUPPLIERS & VENDORS
// ============================================================================
export interface Supplier {
  id: number;
  name: string;
  company_name?: string;
  phone?: string;
  address?: string;
  created_at: string;
  current_balance?: number; // SUM(credit) - SUM(debit)
}

export type SupplierLedgerRefType = 'OPENING_BAL' | 'PURCHASE' | 'PAYMENT' | 'ADJUSTMENT';

export interface SupplierLedgerEntry {
  id: number;
  supplier_id: number;
  entry_date: string;
  ref_type: SupplierLedgerRefType;
  description: string;
  bill_no?: string;
  debit: number;   // Payment made to supplier (reduces debt)
  credit: number;  // Purchase bill / credit (we owe supplier)
  is_void: number;
  void_reason?: string;
  created_at: string;
  running_balance?: number;
}

// ============================================================================
// INVENTORY & STOCK
// ============================================================================
export interface InventoryTransaction {
  id: number;
  item_id: number;
  item_name?: string;
  tx_date: string;
  tx_type: 'IN_PURCHASE' | 'OUT_SALE' | 'ADJUSTMENT';
  quantity: number;
  notes?: string;
  created_at: string;
}

// ============================================================================
// KARIGAR WAGES & ATTENDANCE
// ============================================================================
export type KarigarWageType = 'DAILY' | 'MONTHLY';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE';

export interface Karigar {
  id: number;
  name: string;
  phone?: string;
  role: string;
  wage_type: KarigarWageType;
  daily_wage: number;
  is_active: number;
  created_at: string;
}

export interface KarigarAttendance {
  id: number;
  karigar_id: number;
  karigar_name?: string;
  att_date: string;
  status: AttendanceStatus;
  notes?: string;
}

export interface KarigarPayment {
  id: number;
  karigar_id: number;
  karigar_name?: string;
  pay_date: string;
  pay_type: 'DAILY_WAGE' | 'ADVANCE' | 'MONTHLY_SALARY';
  amount: number;
  notes?: string;
  is_void: number;
  created_at: string;
}

// ============================================================================
// USER AUTHENTICATION & SESSIONS
// ============================================================================
export type UserRole = 'ADMIN' | 'CASHIER' | 'MANAGER';

export interface User {
  id: number;
  username: string;
  password?: string;
  full_name: string;
  role: UserRole;
  is_active: number;
  created_at: string;
}

export type AuthUser = Omit<User, 'password'>;

export interface AuthSession {
  user: AuthUser;
  loginTime: string;
  token?: string;
}

// ============================================================================
// QUOTATIONS / KACHA BILL
// ============================================================================
export type QuotationStatus = 'PENDING' | 'APPROVED' | 'CONVERTED' | 'EXPIRED' | 'REJECTED';

export interface Quotation {
  id: number;
  quote_no: string;
  customer_id?: number | null;
  customer_name: string;
  customer_phone?: string;
  quote_date: string;
  expiry_date?: string;
  total_amount: number;
  discount_amount: number;
  status: QuotationStatus;
  notes?: string;
  converted_invoice_id?: number | null;
  created_at: string;
  items?: QuotationItem[];
}

export interface QuotationItem {
  id?: number;
  quotation_id?: number;
  item_id?: number | null;
  item_name: string;
  quantity: number;
  rate: number;
  line_total: number;
  notes?: string;
}

// ============================================================================
// DELIVERY CHALLAN & GATE PASS
// ============================================================================
export interface DeliveryChallan {
  id: number;
  challan_no: string;
  invoice_id?: number | null;
  cnc_job_id?: number | null;
  customer_name: string;
  customer_phone?: string;
  destination_address?: string;
  driver_name?: string;
  driver_phone?: string;
  vehicle_no?: string;
  items_summary: string;
  total_bill_amount: number;
  advance_paid: number;
  cod_balance_due: number;
  status: 'DISPATCHED' | 'DELIVERED' | 'RETURNED';
  challan_date: string;
  created_at: string;
}

// ============================================================================
// OWNER DRAWINGS (ZATI KHARCHA)
// ============================================================================
export interface OwnerDrawing {
  id: number;
  drawing_date: string;
  owner_name: string;
  amount: number;
  source: 'DRAWER' | 'BANK';
  description: string;
  created_at: string;
}

// ============================================================================
// TIMBER & SHEET CALCULATOR
// ============================================================================
export interface TimberCalcItem {
  type: 'CFT' | 'SFT' | 'RFT';
  title: string;
  description: string;
  dimensions: {
    lengthFt: number;
    lengthIn?: number;
    widthIn?: number;
    thicknessIn?: number;
  };
  quantity: number;
  totalUnits: number; // Total CFT, SFT or RFT
  unitRate: number;
  totalPrice: number;
}

// ============================================================================
// WEEKLY KARIGAR SUMMARY
// ============================================================================
export interface WeeklyKarigarSummary {
  karigar_id: number;
  karigar_name: string;
  role: string;
  daily_wage: number;
  wage_type: KarigarWageType;
  days_present: number;
  days_half: number;
  days_absent: number;
  earned_wages: number;
  advance_taken: number;
  net_payable: number;
}
