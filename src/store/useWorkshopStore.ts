import { create } from 'zustand';
import { dbService } from '../db/sqlite';
import { customerRepo } from '../db/repositories/customerRepo';
import { catalogRepo } from '../db/repositories/catalogRepo';
import { invoiceRepo } from '../db/repositories/invoiceRepo';
import { ledgerRepo } from '../db/repositories/ledgerRepo';
import { cncRepo } from '../db/repositories/cncRepo';
import { expenseRepo } from '../db/repositories/expenseRepo';
import { summaryRepo } from '../db/repositories/summaryRepo';
import { settingsRepo, DEFAULT_SETTINGS } from '../db/repositories/settingsRepo';
import { supplierRepo } from '../db/repositories/supplierRepo';
import { inventoryRepo } from '../db/repositories/inventoryRepo';
import { karigarRepo } from '../db/repositories/karigarRepo';
import { userRepo } from '../db/repositories/userRepo';
import { quotationRepo } from '../db/repositories/quotationRepo';
import { challanRepo } from '../db/repositories/challanRepo';
import { drawingRepo } from '../db/repositories/drawingRepo';
import { cloudSyncService, CloudSyncStatus } from '../db/cloudSyncService';
import { supabaseSyncService } from '../services/supabaseSyncService';
import {
  Customer,
  CatalogItem,
  SalesInvoice,
  SalesInvoiceItem,
  CncJob,
  CncStatus,
  CustomerLedgerEntry,
  Expense,
  ExpenseCategory,
  CartItem,
  DailySummary,
  ShopSettings,
  Supplier,
  SupplierLedgerEntry,
  Karigar,
  KarigarAttendance,
  KarigarPayment,
  AttendanceStatus,
  KarigarWageType,
  AuthUser,
  AuthSession,
  Quotation,
  QuotationItem,
  DeliveryChallan,
  OwnerDrawing,
  TimberCalcItem,
  WeeklyKarigarSummary,
} from '../types';
import { getTodayDate } from '../utils/currency';

const AUTH_SESSION_KEY = 'workshop_auth_session';

export type AppTab =
  | 'pos'
  | 'invoices'
  | 'quotations'
  | 'cnc'
  | 'khata'
  | 'expenses'
  | 'closing'
  | 'suppliers'
  | 'karigar'
  | 'stock'
  | 'catalog'
  | 'settings'
  | 'backup';

interface Toast {
  message: string;
  type: 'success' | 'error' | 'info';
}

interface WorkshopState {
  isDbReady: boolean;
  isLocked: boolean;
  activeTab: AppTab;
  toast: Toast | null;

  // User Auth & Session
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  usersList: AuthUser[];

  // Master Data
  customers: Customer[];
  catalogItems: CatalogItem[];
  invoices: SalesInvoice[];
  cncJobs: CncJob[];
  expenses: Expense[];
  dailySummary: DailySummary;

  // Supplier & Vendor State
  suppliers: Supplier[];
  selectedSupplierId: number | null;
  supplierLedgerEntries: SupplierLedgerEntry[];

  // Inventory & Stock State
  lowStockItems: CatalogItem[];

  // Karigar & Wages State
  karigars: Karigar[];
  selectedKarigarId: number | null;
  karigarAttendance: KarigarAttendance[];
  karigarPayments: KarigarPayment[];

  // POS State
  cart: CartItem[];
  selectedCustomerId: number | null;
  discountAmount: number;
  cashReceived: number;
  invoiceDate: string;
  invoiceNotes: string;

  // Khata Detailed View State
  selectedKhataCustomerId: number | null;
  customerLedgerEntries: (CustomerLedgerEntry & { running_balance: number })[];

  // Print Invoice State
  printInvoiceData: { invoice: SalesInvoice; items: SalesInvoiceItem[] } | null;
  printCncJobData: CncJob | null;

  // Shop Settings
  shopSettings: ShopSettings;
  updateShopSettings: (settings: ShopSettings) => void;

  // Void Modal State
  voidModalData: {
    isOpen: boolean;
    type: 'invoice' | 'cnc' | 'ledger';
    id: number;
    title: string;
  } | null;

  // Actions
  init: () => Promise<void>;
  refreshAll: () => void;
  fetchDailySummary: (date: string, endDate?: string) => void;
  setActiveTab: (tab: AppTab) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  clearToast: () => void;
  lockApp: () => void;
  unlockApp: (enteredPin: string) => boolean;
  updatePinSettings: (newPin: string, enabled: boolean) => void;

  // User Auth & Session Actions
  login: (username: string, password: string, rememberMe?: boolean) => { success: boolean; error?: string };
  logout: () => void;
  restoreSession: () => boolean;
  changeUserPassword: (userId: number, oldPassword: string, newPassword: string) => { success: boolean; error?: string };

  // POS Actions
  addToCart: (item: Partial<CatalogItem> & { name: string; default_rate: number }, customRate?: number) => void;
  updateCartItem: (index: number, updates: Partial<CartItem>) => void;
  removeFromCart: (index: number) => void;
  clearCart: () => void;
  setSelectedCustomerId: (id: number | null) => void;
  setDiscountAmount: (discount: number) => void;
  setCashReceived: (cash: number) => void;
  setInvoiceDate: (date: string) => void;
  setInvoiceNotes: (notes: string) => void;
  checkout: (printReceipt?: boolean) => Promise<{ success: boolean; invoiceId?: number; error?: string }>;
  reprintInvoice: (invoiceId: number) => void;

  // Customer & Khata Actions
  createCustomer: (name: string, phone?: string, address?: string, openingBal?: number) => Customer;
  updateCustomer: (id: number, name: string, phone?: string, address?: string) => void;
  deleteCustomer: (id: number) => void;
  selectKhataCustomer: (customerId: number | null) => void;
  submitWasooli: (customerId: number, amount: number, date: string, notes?: string) => void;

  // CNC Actions
  createCncJob: (job: {
    customer_id?: number | null;
    customer_name_manual?: string;
    job_description: string;
    size_specification?: string;
    total_amount: number;
    paid_amount: number;
    remaining_amount: number;
    status?: CncStatus;
    notes?: string;
    job_date: string;
  }) => CncJob;
  updateCncStatus: (id: number, status: CncStatus) => void;
  receiveCncPayment: (id: number, amount: number, notes?: string) => void;
  setPrintCncJobData: (job: CncJob | null) => void;

  // Expenses Actions
  addExpense: (expense_date: string, category: ExpenseCategory, description: string, amount: number) => void;
  deleteExpense: (id: number) => void;

  // Void Actions
  openVoidModal: (type: 'invoice' | 'cnc' | 'ledger', id: number, title: string) => void;
  closeVoidModal: () => void;
  executeVoid: (reason: string) => void;

  // Print Actions
  setPrintInvoiceData: (data: { invoice: SalesInvoice; items: SalesInvoiceItem[] } | null) => void;

  // Catalog Actions
  createCatalogItem: (category: CatalogItem['category'], name: string, default_rate: number, initialStock?: number, minStockAlert?: number) => void;
  updateCatalogItem: (id: number, name: string, default_rate: number, is_active: number) => void;
  deleteCatalogItem: (id: number) => void;

  // Supplier & Vendor Actions
  createSupplier: (name: string, company_name?: string, phone?: string, address?: string, openingBal?: number) => Supplier;
  updateSupplier: (id: number, name: string, company_name?: string, phone?: string, address?: string) => void;
  deleteSupplier: (id: number) => void;
  selectSupplier: (supplierId: number | null) => void;
  addSupplierPurchase: (supplierId: number, billNo: string, totalAmount: number, cashPaid: number, description: string, date: string) => void;
  addSupplierPayment: (supplierId: number, amount: number, date: string, notes?: string) => void;

  // Inventory & Stock Actions
  adjustStock: (itemId: number, quantityChange: number, txType: 'IN_PURCHASE' | 'OUT_SALE' | 'ADJUSTMENT', notes?: string) => void;
  adjustMultipleStock: (items: { itemId: number; quantityChange: number; notes?: string }[]) => void;

  // Karigar & Wages Actions
  createKarigar: (name: string, phone: string, role: string, wage_type: KarigarWageType, daily_wage: number) => Karigar;
  updateKarigar: (id: number, name: string, phone: string, role: string, wage_type: KarigarWageType, daily_wage: number, is_active: number) => void;
  deleteKarigar: (id: number) => void;
  selectKarigar: (karigarId: number | null) => void;
  saveKarigarAttendance: (karigarId: number, date: string, status: AttendanceStatus, notes?: string) => void;
  addKarigarPayment: (karigarId: number, date: string, pay_type: 'DAILY_WAGE' | 'ADVANCE' | 'MONTHLY_SALARY', amount: number, notes?: string) => void;
  getWeeklyKarigarSummary: (startDate: string, endDate: string) => WeeklyKarigarSummary[];

  // Quotations / Kacha Bill State & Actions
  quotations: Quotation[];
  printQuotationData: Quotation | null;
  loadQuotations: () => void;
  createQuotation: (data: {
    customer_id?: number | null;
    customer_name: string;
    customer_phone?: string;
    quote_date: string;
    expiry_date?: string;
    total_amount: number;
    discount_amount?: number;
    notes?: string;
    items: Array<{
      item_id?: number | null;
      item_name: string;
      quantity: number;
      rate: number;
      line_total: number;
      notes?: string;
    }>;
  }) => Quotation;
  convertQuotationToInvoice: (quotationId: number, cashReceived: number) => Promise<{ success: boolean; invoiceId?: number; error?: string }>;
  deleteQuotation: (id: number) => void;
  setPrintQuotationData: (quote: Quotation | null) => void;

  // Delivery Challan & Gate Pass State & Actions
  challans: DeliveryChallan[];
  loadChallans: () => void;
  createChallan: (data: {
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
    challan_date: string;
  }) => DeliveryChallan;
  updateChallanStatus: (id: number, status: DeliveryChallan['status']) => void;
  deleteChallan: (id: number) => void;

  // Owner Drawings (Zati Kharcha)
  drawings: OwnerDrawing[];
  loadDrawings: () => void;
  createDrawing: (data: {
    drawing_date: string;
    owner_name: string;
    amount: number;
    source: 'DRAWER' | 'BANK';
    description: string;
  }) => OwnerDrawing;
  deleteDrawing: (id: number) => void;

  // Timber / SFT Dimension Cart Integration
  addTimberItemToCart: (item: TimberCalcItem) => void;

  // Cloud Sync
  cloudSyncStatus: CloudSyncStatus;
  syncWithCloud: () => Promise<boolean>;
  saveCloudConfig: (endpoint: string, isEnabled: boolean) => void;

  // Backup & Restore
  exportDatabaseFile: () => void;
  importDatabaseFile: (file: File) => Promise<void>;
}

export const useWorkshopStore = create<WorkshopState>((set, get) => ({
  isDbReady: false,
  activeTab: 'pos',
  toast: null,

  // User Auth & Session State
  currentUser: null,
  isAuthenticated: false,
  usersList: [],

  customers: [],
  catalogItems: [],
  invoices: [],
  cncJobs: [],
  expenses: [],
  dailySummary: {
    date: getTodayDate(),
    total_sales_volume: 0,
    cash_sales_received: 0,
    udhaar_sales: 0,
    total_cnc_volume: 0,
    cnc_cash_received: 0,
    khata_wasooli_received: 0,
    total_cash_inflow: 0,
    total_expenses: 0,
    total_supplier_payments: 0,
    total_karigar_payments: 0,
    total_cash_outflow: 0,
    net_drawer_cash: 0,
    total_market_receivables: 0,
    total_supplier_payables: 0,
  },

  suppliers: [],
  selectedSupplierId: null,
  supplierLedgerEntries: [],

  lowStockItems: [],

  karigars: [],
  selectedKarigarId: null,
  karigarAttendance: [],
  karigarPayments: [],

  cart: [],
  selectedCustomerId: null,
  discountAmount: 0,
  cashReceived: 0,
  invoiceDate: getTodayDate(),
  invoiceNotes: '',

  selectedKhataCustomerId: null,
  customerLedgerEntries: [],
  printInvoiceData: null,
  printCncJobData: null,
  shopSettings: DEFAULT_SETTINGS,
  voidModalData: null,
  isLocked: false,

  // New Upgrades State
  quotations: [],
  printQuotationData: null,
  challans: [],
  drawings: [],
  cloudSyncStatus: cloudSyncService.getStatus(),

  init: async () => {
    try {
      await dbService.init();
      userRepo.initTable();
      const settings = settingsRepo.get();
      const usersList = userRepo.getAll();

      // Check for persistent session in localStorage
      let activeUser: AuthUser | null = null;
      try {
        const rawSession = localStorage.getItem(AUTH_SESSION_KEY);
        if (rawSession) {
          const parsed = JSON.parse(rawSession);
          if (parsed && parsed.user && parsed.user.id) {
            const dbUser = userRepo.getById(parsed.user.id);
            if (dbUser && dbUser.is_active === 1) {
              activeUser = dbUser;
            }
          }
        }
      } catch (e) {
        console.warn('Failed to parse saved session:', e);
      }

      set({
        isDbReady: true,
        shopSettings: settings,
        usersList,
        currentUser: activeUser,
        isAuthenticated: Boolean(activeUser),
        isLocked: false,
        cloudSyncStatus: cloudSyncService.getStatus(),
      });
      get().refreshAll();
    } catch (err: any) {
      console.error('Failed to init DB:', err);
      get().showToast('Database Error: ' + (err.message || 'Check console'), 'error');
    }
  },

  refreshAll: () => {
    if (!get().isDbReady) return;
    try {
      const today = getTodayDate();
      const customers = customerRepo.getAll();
      const catalogItems = catalogRepo.getAll();
      const invoices = invoiceRepo.getAll();
      const cncJobs = cncRepo.getAll();
      const expenses = expenseRepo.getByDate(today);
      const dailySummary = summaryRepo.getDailySummary(today);
      const shopSettings = settingsRepo.get();
      const suppliers = supplierRepo.getAll();
      const karigars = karigarRepo.getAll();
      const lowStockItems = inventoryRepo.getLowStockItems();
      const karigarAttendance = karigarRepo.getAttendanceByDate(today);
      const karigarPayments = karigarRepo.getPayments();
      const quotations = quotationRepo.getAll();
      const challans = challanRepo.getAll();
      const drawings = drawingRepo.getAll();

      let customerLedgerEntries = get().customerLedgerEntries;
      if (get().selectedKhataCustomerId) {
        customerLedgerEntries = ledgerRepo.getByCustomerId(get().selectedKhataCustomerId!);
      }

      let supplierLedgerEntries = get().supplierLedgerEntries;
      if (get().selectedSupplierId) {
        supplierLedgerEntries = supplierRepo.getLedger(get().selectedSupplierId!);
      }

      set({
        customers,
        catalogItems,
        invoices,
        cncJobs,
        expenses,
        dailySummary,
        customerLedgerEntries,
        shopSettings,
        suppliers,
        karigars,
        lowStockItems,
        karigarAttendance,
        karigarPayments,
        supplierLedgerEntries,
        quotations,
        challans,
        drawings,
        cloudSyncStatus: cloudSyncService.getStatus(),
      });
      // Trigger background auto-sync to Supabase
      supabaseSyncService.triggerAutoSync();
    } catch (err) {
      console.error('Error refreshing data:', err);
    }
  },

  fetchDailySummary: (date: string, endDate?: string) => {
    try {
      const summary = summaryRepo.getDailySummary(date, endDate);
      set({ dailySummary: summary });
    } catch (err: any) {
      console.error('Fetch summary error:', err);
      get().showToast('Summary load karne mein masla: ' + err.message, 'error');
    }
  },

  updateShopSettings: (settings: ShopSettings) => {
    try {
      settingsRepo.update(settings);
      set({ shopSettings: settings });
      get().showToast('Dukan ki settings mehfooz ho gayin!', 'success');
    } catch (err: any) {
      console.error('Settings update error:', err);
      get().showToast('Settings update error: ' + err.message, 'error');
    }
  },

  lockApp: () => set({ isLocked: true }),

  unlockApp: (enteredPin: string) => {
    const correctPin = get().shopSettings.app_pin || '1234';
    if (enteredPin.trim() === correctPin.trim()) {
      set({ isLocked: false });
      return true;
    }
    return false;
  },

  updatePinSettings: (newPin: string, enabled: boolean) => {
    try {
      settingsRepo.updatePin(newPin, enabled ? 1 : 0);
      set((state) => ({
        shopSettings: {
          ...state.shopSettings,
          app_pin: newPin,
          pin_enabled: enabled ? 1 : 0,
        },
      }));
      get().showToast('Security PIN ki settings kamyabi se save ho gayin!', 'success');
    } catch (err: any) {
      console.error('PIN update error:', err);
      get().showToast('PIN save karne mein masla: ' + err.message, 'error');
    }
  },

  // User Auth & Session Implementations
  login: (username: string, password: string, rememberMe = true) => {
    try {
      const verified = userRepo.verifyCredentials(username, password);
      if (!verified) {
        return {
          success: false,
          error: 'Ghalt username ya password! Baraye meherbani dobara check karein.',
        };
      }

      if (rememberMe) {
        try {
          const sessionData: AuthSession = {
            user: verified,
            loginTime: new Date().toISOString(),
          };
          localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(sessionData));
        } catch (e) {
          console.warn('Could not save session to localStorage:', e);
        }
      }

      set({
        currentUser: verified,
        isAuthenticated: true,
        isLocked: false,
      });

      get().showToast(`Khushamdeed, ${verified.full_name}!`, 'success');
      return { success: true };
    } catch (err: any) {
      console.error('Login error:', err);
      return { success: false, error: err.message || 'Login failed' };
    }
  },

  logout: () => {
    try {
      localStorage.removeItem(AUTH_SESSION_KEY);
    } catch (_) {}

    set({
      currentUser: null,
      isAuthenticated: false,
      isLocked: false,
    });
    get().showToast('Aap kamyabi se Log out ho chuke hain.', 'info');
  },

  restoreSession: () => {
    try {
      const rawSession = localStorage.getItem(AUTH_SESSION_KEY);
      if (!rawSession) return false;
      const parsed: AuthSession = JSON.parse(rawSession);
      if (parsed && parsed.user && parsed.user.id) {
        const freshUser = userRepo.getById(parsed.user.id);
        if (freshUser && freshUser.is_active === 1) {
          set({ currentUser: freshUser, isAuthenticated: true });
          return true;
        }
      }
    } catch (e) {
      console.warn('Failed to restore session:', e);
    }
    return false;
  },

  changeUserPassword: (userId: number, oldPassword: string, newPassword: string) => {
    try {
      const user = userRepo.getById(userId);
      if (!user) return { success: false, error: 'User nahi mila' };

      const verified = userRepo.verifyCredentials(user.username, oldPassword);
      if (!verified) {
        return { success: false, error: 'Purana password ghalt hai!' };
      }

      if (!newPassword || newPassword.trim().length < 3) {
        return { success: false, error: 'Naya password kam az kam 3 hindsay hona chahiye' };
      }

      userRepo.changePassword(userId, newPassword);
      get().showToast('Password kamyabi se tabdeel ho gaya!', 'success');
      return { success: true };
    } catch (err: any) {
      console.error('Change password error:', err);
      return { success: false, error: err.message };
    }
  },

  reprintInvoice: (invoiceId: number) => {
    try {
      const invoice = invoiceRepo.getById(invoiceId);
      if (!invoice) return;
      const items = invoiceRepo.getItems(invoiceId);
      set({ printInvoiceData: { invoice, items } });
    } catch (err: any) {
      console.error('Reprint error:', err);
      get().showToast('Invoice reprint error: ' + err.message, 'error');
    }
  },

  setPrintCncJobData: (job: CncJob | null) => set({ printCncJobData: job }),

  setActiveTab: (tab) => set({ activeTab: tab }),

  showToast: (message, type = 'success') => {
    set({ toast: { message, type } });
    setTimeout(() => {
      const current = get().toast;
      if (current?.message === message) {
        set({ toast: null });
      }
    }, 4000);
  },

  clearToast: () => set({ toast: null }),

  // POS Cart Actions
  addToCart: (item, customRate) => {
    const rate = customRate !== undefined ? customRate : item.default_rate;
    const cart = [...get().cart];
    const existingIndex = cart.findIndex(c => c.item_name.toLowerCase() === item.name.toLowerCase() && c.rate === rate);

    if (existingIndex >= 0) {
      const existing = cart[existingIndex];
      const newQty = existing.quantity + 1;
      cart[existingIndex] = {
        ...existing,
        quantity: newQty,
        line_total: newQty * existing.rate,
      };
    } else {
      cart.push({
        item_id: item.id,
        item_name: item.name,
        category: item.category,
        quantity: 1,
        rate: rate,
        line_total: rate,
      });
    }

    set({ cart });
  },

  updateCartItem: (index, updates) => {
    const cart = [...get().cart];
    if (!cart[index]) return;
    const item = { ...cart[index], ...updates };
    item.line_total = item.quantity * item.rate;
    cart[index] = item;
    set({ cart });
  },

  removeFromCart: (index) => {
    const cart = get().cart.filter((_, i) => i !== index);
    set({ cart });
  },

  clearCart: () => {
    set({
      cart: [],
      selectedCustomerId: null,
      discountAmount: 0,
      cashReceived: 0,
      invoiceDate: getTodayDate(),
      invoiceNotes: '',
    });
  },

  setSelectedCustomerId: (id) => set({ selectedCustomerId: id }),
  setDiscountAmount: (discount) => set({ discountAmount: discount }),
  setCashReceived: (cash) => set({ cashReceived: cash }),
  setInvoiceDate: (date) => set({ invoiceDate: date }),
  setInvoiceNotes: (notes) => set({ invoiceNotes: notes }),

  checkout: async (printReceipt = false) => {
    const { cart, selectedCustomerId, discountAmount, cashReceived, invoiceDate, invoiceNotes } = get();

    if (cart.length === 0) {
      get().showToast('Cart is empty! Baraye meherbani item shamil karein.', 'error');
      return { success: false, error: 'Empty cart' };
    }

    const subtotal = cart.reduce((sum, item) => sum + item.line_total, 0);
    const netTotal = Math.max(0, subtotal - discountAmount);
    const balance = Math.max(0, netTotal - cashReceived);

    // Rule: If balance > 0 (Baqaya / Udhaar), customer selection is strictly mandatory!
    if (balance > 0 && !selectedCustomerId) {
      get().showToast('Baqaya (Udhaar) ke liye Customer muntakhib karna lazmi hai!', 'error');
      return { success: false, error: 'Customer required for credit' };
    }

    try {
      const { invoice, items } = invoiceRepo.create(
        {
          customer_id: selectedCustomerId,
          invoice_date: invoiceDate,
          total_amount: subtotal,
          discount_amount: discountAmount,
          cash_received: cashReceived,
          balance_amount: balance,
          notes: invoiceNotes,
        },
        cart
      );

      get().showToast(`Bill #${invoice.invoice_no} mehfooz ho gaya!`, 'success');
      get().refreshAll();

      if (printReceipt) {
        set({ printInvoiceData: { invoice, items } });
      }

      get().clearCart();
      return { success: true, invoiceId: invoice.id };
    } catch (err: any) {
      console.error('Invoice creation error:', err);
      get().showToast('Bill save karne mein masla: ' + err.message, 'error');
      return { success: false, error: err.message };
    }
  },

  // Customer Actions
  createCustomer: (name, phone = '', address = '', openingBal = 0) => {
    const cust = customerRepo.create(name, phone, address, openingBal);
    get().refreshAll();
    get().showToast(`Customer '${cust.name}' ban gaya!`, 'success');
    return cust;
  },

  updateCustomer: (id, name, phone = '', address = '') => {
    customerRepo.update(id, name, phone, address);
    get().refreshAll();
    get().showToast(`Customer '${name}' ki maloomat update ho gayin!`, 'success');
  },

  deleteCustomer: (id: number) => {
    try {
      customerRepo.delete(id);
      if (get().selectedKhataCustomerId === id) {
        set({ selectedKhataCustomerId: null, customerLedgerEntries: [] });
      }
      get().refreshAll();
      get().showToast('Customer kamyabi se delete ho gaya!', 'info');
    } catch (err: any) {
      console.error('Delete customer error:', err);
      get().showToast('Customer delete karne mein masla: ' + err.message, 'error');
    }
  },

  selectKhataCustomer: (customerId) => {
    if (!customerId) {
      set({ selectedKhataCustomerId: null, customerLedgerEntries: [] });
      return;
    }
    const entries = ledgerRepo.getByCustomerId(customerId);
    set({ selectedKhataCustomerId: customerId, customerLedgerEntries: entries });
  },

  submitWasooli: (customerId, amount, date, notes = '') => {
    if (amount <= 0) {
      get().showToast('Wasooli rakam durust darj karein', 'error');
      return;
    }
    ledgerRepo.addWasooli(customerId, amount, date, notes);
    get().refreshAll();
    get().showToast(`Rs. ${amount.toLocaleString()} ki Wasooli darj ho gayi!`, 'success');
  },

  // CNC Actions
  createCncJob: (job) => {
    const created = cncRepo.create(job);
    get().refreshAll();
    get().showToast(`CNC Job #${created.job_no} create ho gaya!`, 'success');
    return created;
  },

  updateCncStatus: (id, status) => {
    cncRepo.updateStatus(id, status);
    get().refreshAll();
    get().showToast(`CNC Job status '${status}' kar diya gaya!`, 'info');
  },

  receiveCncPayment: (id, amount, notes = '') => {
    cncRepo.receivePayment(id, amount, notes);
    get().refreshAll();
    get().showToast(`CNC Payment Rs. ${amount.toLocaleString()} wasool ho gayi!`, 'success');
  },

  // Expenses Actions
  addExpense: (expense_date, category, description, amount) => {
    if (amount <= 0) {
      get().showToast('Kharcha rakam 0 se zyada honi chahiye', 'error');
      return;
    }
    expenseRepo.create({
      expense_date,
      category,
      description,
      amount,
      payment_method: 'CASH',
    });
    get().refreshAll();
    get().showToast(`Kharcha Rs. ${amount.toLocaleString()} darj ho gaya!`, 'success');
  },

  deleteExpense: (id) => {
    expenseRepo.delete(id);
    get().refreshAll();
    get().showToast('Kharcha hazf ho gaya', 'info');
  },

  // Safe Void Actions
  openVoidModal: (type, id, title) => {
    set({
      voidModalData: {
        isOpen: true,
        type,
        id,
        title,
      },
    });
  },

  closeVoidModal: () => set({ voidModalData: null }),

  executeVoid: (reason) => {
    const modalData = get().voidModalData;
    if (!modalData) return;
    if (!reason.trim()) {
      get().showToast('Mansookhi (Void) ki wajah likhna lazmi hai', 'error');
      return;
    }

    try {
      if (modalData.type === 'invoice') {
        invoiceRepo.voidInvoice(modalData.id, reason);
      } else if (modalData.type === 'cnc') {
        cncRepo.voidJob(modalData.id, reason);
      } else if (modalData.type === 'ledger') {
        ledgerRepo.voidEntry(modalData.id, reason);
      }

      get().showToast(`Entry #${modalData.title} kamyabi se Mansookh (Void) ho gayi!`, 'success');
      get().closeVoidModal();
      get().refreshAll();
    } catch (err: any) {
      console.error('Void error:', err);
      get().showToast('Void karne mein ghalti: ' + err.message, 'error');
    }
  },

  setPrintInvoiceData: (data) => set({ printInvoiceData: data }),

  // Catalog Actions
  createCatalogItem: (category, name, default_rate, initialStock = 0, minStockAlert = 5) => {
    catalogRepo.create(category, name, default_rate, initialStock, minStockAlert);
    get().refreshAll();
    get().showToast(`Item '${name}' shamil ho gaya!`, 'success');
  },

  updateCatalogItem: (id, name, default_rate, is_active) => {
    catalogRepo.update(id, name, default_rate, is_active);
    get().refreshAll();
    get().showToast(`Item '${name}' update ho gaya!`, 'success');
  },

  deleteCatalogItem: (id: number) => {
    try {
      catalogRepo.delete(id);
      get().refreshAll();
      get().showToast('Item kamyabi se delete ho gaya!', 'info');
    } catch (err: any) {
      console.error('Delete item error:', err);
      get().showToast('Item delete karne mein masla: ' + err.message, 'error');
    }
  },

  // Supplier Actions
  createSupplier: (name, company_name = '', phone = '', address = '', openingBal = 0) => {
    const s = supplierRepo.create(name, company_name, phone, address, openingBal);
    get().refreshAll();
    get().showToast(`Supplier '${s.name}' shamil ho gaya!`, 'success');
    return s;
  },

  updateSupplier: (id, name, company_name = '', phone = '', address = '') => {
    supplierRepo.update(id, name, company_name, phone, address);
    get().refreshAll();
    get().showToast(`Supplier '${name}' update ho gaya!`, 'success');
  },

  deleteSupplier: (id: number) => {
    try {
      supplierRepo.delete(id);
      if (get().selectedSupplierId === id) {
        set({ selectedSupplierId: null, supplierLedgerEntries: [] });
      }
      get().refreshAll();
      get().showToast('Supplier kamyabi se delete ho gaya!', 'info');
    } catch (err: any) {
      console.error('Delete supplier error:', err);
      get().showToast('Supplier delete karne mein masla: ' + err.message, 'error');
    }
  },

  selectSupplier: (supplierId) => {
    if (!supplierId) {
      set({ selectedSupplierId: null, supplierLedgerEntries: [] });
      return;
    }
    const entries = supplierRepo.getLedger(supplierId);
    set({ selectedSupplierId: supplierId, supplierLedgerEntries: entries });
  },

  addSupplierPurchase: (supplierId, billNo, totalAmount, cashPaid, description, date) => {
    supplierRepo.addPurchase(supplierId, billNo, totalAmount, cashPaid, description, date);
    get().refreshAll();
    get().showToast(`Khareedari Bill #${billNo} darj ho gaya!`, 'success');
  },

  addSupplierPayment: (supplierId, amount, date, notes = '') => {
    supplierRepo.addPayment(supplierId, amount, date, notes);
    get().refreshAll();
    get().showToast(`Rs. ${amount.toLocaleString()} ki payment darj ho gayi!`, 'success');
  },

  // Inventory & Stock Actions
  adjustStock: (itemId, quantityChange, txType, notes = '') => {
    inventoryRepo.adjustStock(itemId, quantityChange, txType, notes);
    get().refreshAll();
    get().showToast('Stock quantity update ho gayi!', 'success');
  },

  adjustMultipleStock: (items) => {
    try {
      const valid = items.filter((i) => i.quantityChange !== 0);
      if (valid.length === 0) {
        get().showToast('Koi stock quantity darj nahi ki gayi', 'error');
        return;
      }
      inventoryRepo.adjustMultipleStock(
        valid.map((i) => ({
          itemId: i.itemId,
          quantityChange: i.quantityChange,
          notes: i.notes || 'Bulk Stock Inward',
        }))
      );
      get().refreshAll();
      get().showToast(`${valid.length} items ka stock kamyabi se update ho gaya!`, 'success');
    } catch (err: any) {
      console.error('Bulk stock error:', err);
      get().showToast('Stock save karne mein masla: ' + err.message, 'error');
    }
  },

  // Karigar Actions
  createKarigar: (name, phone, role, wage_type, daily_wage) => {
    const k = karigarRepo.create(name, phone, role, wage_type, daily_wage);
    get().refreshAll();
    get().showToast(`Karigar '${k.name}' shamil ho gaya!`, 'success');
    return k;
  },

  updateKarigar: (id, name, phone, role, wage_type, daily_wage, is_active) => {
    karigarRepo.update(id, name, phone, role, wage_type, daily_wage, is_active);
    get().refreshAll();
    get().showToast(`Karigar '${name}' update ho gaya!`, 'success');
  },

  deleteKarigar: (id: number) => {
    try {
      karigarRepo.delete(id);
      if (get().selectedKarigarId === id) {
        set({ selectedKarigarId: null });
      }
      get().refreshAll();
      get().showToast('Karigar kamyabi se delete ho gaya!', 'info');
    } catch (err: any) {
      console.error('Delete karigar error:', err);
      get().showToast('Karigar delete karne mein masla: ' + err.message, 'error');
    }
  },

  selectKarigar: (karigarId) => {
    set({ selectedKarigarId: karigarId });
  },

  saveKarigarAttendance: (karigarId, date, status, notes = '') => {
    karigarRepo.saveAttendance(karigarId, date, status, notes);
    get().refreshAll();
    get().showToast('Hazri update ho gayi!', 'info');
  },

  addKarigarPayment: (karigarId, date, pay_type, amount, notes = '') => {
    karigarRepo.addPayment(karigarId, date, pay_type, amount, notes);
    get().refreshAll();
    get().showToast(`Rs. ${amount.toLocaleString()} ki payment darj ho gayi!`, 'success');
  },

  getWeeklyKarigarSummary: (startDate: string, endDate: string) => {
    const karigars = karigarRepo.getAll().filter((k) => k.is_active === 1);
    const summary: WeeklyKarigarSummary[] = [];

    for (const k of karigars) {
      const attRows = dbService.query<{ status: AttendanceStatus }>(
        `SELECT status FROM karigar_attendance WHERE karigar_id = ? AND att_date BETWEEN ? AND ?`,
        [k.id, startDate, endDate]
      );
      let days_present = 0;
      let days_half = 0;
      let days_absent = 0;
      for (const row of attRows) {
        if (row.status === 'PRESENT') days_present++;
        else if (row.status === 'HALF_DAY') days_half++;
        else if (row.status === 'ABSENT') days_absent++;
      }

      const earned_wages = Math.round(
        days_present * k.daily_wage + days_half * k.daily_wage * 0.5
      );

      const payRows = dbService.query<{ pay_type: string; amount: number }>(
        `SELECT pay_type, amount FROM karigar_payments WHERE karigar_id = ? AND is_void = 0 AND pay_date BETWEEN ? AND ?`,
        [k.id, startDate, endDate]
      );
      let advance_taken = 0;
      let wage_paid = 0;
      for (const p of payRows) {
        if (p.pay_type === 'ADVANCE') advance_taken += p.amount;
        else wage_paid += p.amount;
      }

      const net_payable = Math.max(0, earned_wages - advance_taken - wage_paid);

      summary.push({
        karigar_id: k.id,
        karigar_name: k.name,
        role: k.role,
        daily_wage: k.daily_wage,
        wage_type: k.wage_type,
        days_present,
        days_half,
        days_absent,
        earned_wages,
        advance_taken,
        net_payable,
      });
    }

    return summary;
  },

  // Quotations Actions
  loadQuotations: () => {
    set({ quotations: quotationRepo.getAll() });
  },

  createQuotation: (data) => {
    const q = quotationRepo.create(data);
    get().refreshAll();
    get().showToast(`Quotation #${q.quote_no} ban gaya!`, 'success');
    return q;
  },

  convertQuotationToInvoice: async (quotationId: number, cashReceived: number) => {
    try {
      const q = quotationRepo.getById(quotationId);
      if (!q) return { success: false, error: 'Quotation nahi mila' };

      const invoiceDate = getTodayDate();
      let customerId: number | null = q.customer_id || null;

      // If customer_id is not linked but a customer name is provided, find or create the customer
      if (
        !customerId &&
        q.customer_name &&
        q.customer_name.trim().toLowerCase() !== 'walk-in' &&
        q.customer_name.trim().toLowerCase() !== 'walk-in customer'
      ) {
        const allCust = customerRepo.getAll();
        const existing = allCust.find(
          (c) =>
            c.name.trim().toLowerCase() === q.customer_name.trim().toLowerCase() ||
            (q.customer_phone && c.phone && c.phone.trim() === q.customer_phone.trim())
        );
        if (existing) {
          customerId = existing.id;
        } else {
          try {
            const newCust = customerRepo.create(q.customer_name, q.customer_phone || '');
            customerId = newCust.id;
          } catch (e) {
            console.warn('Auto customer create notice:', e);
          }
        }
      }

      const totalAmount = Number(q.total_amount) || 0;
      const discountAmount = Number(q.discount_amount) || 0;
      const netBill = totalAmount - discountAmount;
      const cash = Number(cashReceived) || 0;
      const balanceAmount = Math.max(0, netBill - cash);

      const cartItems: CartItem[] = (q.items || []).map((it) => ({
        item_id: it.item_id || undefined,
        item_name: it.item_name || 'Item',
        quantity: Number(it.quantity) || 1,
        rate: Number(it.rate) || 0,
        line_total: Number(it.line_total) || 0,
      }));

      // Create invoice (this also handles item insertion, stock deduction, and customer ledger)
      const { invoice } = invoiceRepo.create(
        {
          customer_id: customerId,
          invoice_date: invoiceDate,
          total_amount: totalAmount,
          discount_amount: discountAmount,
          cash_received: cash,
          balance_amount: balanceAmount,
          notes: `Converted from Quotation #${q.quote_no}. ${q.notes || ''}`.trim(),
        },
        cartItems
      );

      // Update quotation status
      quotationRepo.updateStatus(quotationId, 'CONVERTED', invoice.id);

      get().refreshAll();
      get().showToast(`Quotation kamyabi se Invoice #${invoice.invoice_no} ban gaya!`, 'success');
      return { success: true, invoiceId: invoice.id };
    } catch (err: any) {
      console.error('Convert quotation error:', err);
      get().showToast('Convert error: ' + err.message, 'error');
      return { success: false, error: err.message };
    }
  },

  deleteQuotation: (id: number) => {
    quotationRepo.delete(id);
    get().refreshAll();
    get().showToast('Quotation delete ho gaya!', 'info');
  },

  setPrintQuotationData: (quote) => set({ printQuotationData: quote }),

  // Challans Actions
  loadChallans: () => {
    set({ challans: challanRepo.getAll() });
  },

  createChallan: (data) => {
    const c = challanRepo.create(data);
    get().refreshAll();
    get().showToast(`Gate Pass #${c.challan_no} ban gaya!`, 'success');
    return c;
  },

  updateChallanStatus: (id, status) => {
    challanRepo.updateStatus(id, status);
    get().refreshAll();
    get().showToast('Challan status update ho gaya!', 'success');
  },

  deleteChallan: (id) => {
    challanRepo.delete(id);
    get().refreshAll();
    get().showToast('Challan delete ho gaya!', 'info');
  },

  // Owner Drawings Actions
  loadDrawings: () => {
    set({ drawings: drawingRepo.getAll() });
  },

  createDrawing: (data) => {
    const d = drawingRepo.create(data);
    get().refreshAll();
    get().showToast(`Drawing Rs. ${data.amount.toLocaleString()} mehfooz ho gayi!`, 'success');
    return d;
  },

  deleteDrawing: (id) => {
    drawingRepo.delete(id);
    get().refreshAll();
    get().showToast('Drawing delete ho gayi!', 'info');
  },

  // Timber Dimension to Cart
  addTimberItemToCart: (item: TimberCalcItem) => {
    const cart = [...get().cart];
    cart.push({
      item_name: `${item.title} (${item.description})`,
      quantity: item.quantity,
      rate: Math.round(item.totalPrice / (item.quantity || 1)),
      line_total: item.totalPrice,
    });
    set({ cart });
    get().showToast(`${item.title} bill me shamil ho gaya!`, 'success');
  },

  // Cloud Sync
  syncWithCloud: async () => {
    const success = await cloudSyncService.syncWithRemote();
    set({ cloudSyncStatus: cloudSyncService.getStatus() });
    if (success) {
      get().showToast('Cloud Sync Kamyab! Remote server par sync ho gaya.', 'success');
    } else {
      get().showToast(
        'Cloud Sync masla: ' + (get().cloudSyncStatus.errorMessage || 'Check endpoint'),
        'error'
      );
    }
    return success;
  },

  saveCloudConfig: (endpoint: string, isEnabled: boolean) => {
    cloudSyncService.saveConfig(endpoint, isEnabled);
    set({ cloudSyncStatus: cloudSyncService.getStatus() });
    get().showToast('Cloud Sync settings update ho gayin!', 'success');
  },

  // Backup & Restore
  exportDatabaseFile: () => {
    try {
      const data = dbService.exportDatabase();
      const blob = new Blob([data as unknown as BlobPart], { type: 'application/x-sqlite3' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      a.href = url;
      a.download = `workshop_backup_${timestamp}.sqlite`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      get().showToast('Database Backup file download ho gayi!', 'success');
    } catch (err: any) {
      console.error('Backup error:', err);
      get().showToast('Backup error: ' + err.message, 'error');
    }
  },

  importDatabaseFile: async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const data = new Uint8Array(buffer);
      await dbService.importDatabase(data);
      get().refreshAll();
      get().showToast('Database kamyabi se Restore ho gaya!', 'success');
    } catch (err: any) {
      console.error('Restore error:', err);
      get().showToast('Restore error: ' + err.message, 'error');
    }
  },
}));
