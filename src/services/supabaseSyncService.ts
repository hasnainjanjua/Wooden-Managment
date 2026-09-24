import { getSupabase, isSupabaseConfigured, SUPABASE_URL } from './supabaseClient';
import { dbService } from '../db/sqlite';
import { customerRepo } from '../db/repositories/customerRepo';
import { catalogRepo } from '../db/repositories/catalogRepo';
import { invoiceRepo } from '../db/repositories/invoiceRepo';
import { cncRepo } from '../db/repositories/cncRepo';
import { ledgerRepo } from '../db/repositories/ledgerRepo';
import { expenseRepo } from '../db/repositories/expenseRepo';
import { supplierRepo } from '../db/repositories/supplierRepo';
import { karigarRepo } from '../db/repositories/karigarRepo';
import { quotationRepo } from '../db/repositories/quotationRepo';
import { challanRepo } from '../db/repositories/challanRepo';
import { drawingRepo } from '../db/repositories/drawingRepo';
import { settingsRepo } from '../db/repositories/settingsRepo';
import { userRepo } from '../db/repositories/userRepo';

export interface SyncResult {
  success: boolean;
  message: string;
  counts?: { [table: string]: number };
}

let _autoSyncTimer: any = null;
let _isAutoSyncing = false;
let _lastSyncTimestamp: string | null = null;
let _syncStatus: 'IDLE' | 'SYNCING' | 'SYNCED' | 'OFFLINE' = 'IDLE';

export const supabaseSyncService = {
  isConfigured: () => isSupabaseConfigured(),
  getUrl: () => SUPABASE_URL,

  getSyncStatus() {
    return {
      status: _syncStatus,
      lastSyncTimestamp: _lastSyncTimestamp,
      isAutoSyncing: _isAutoSyncing,
      isConfigured: isSupabaseConfigured(),
    };
  },

  triggerAutoSync(delayMs = 3000) {
    if (!isSupabaseConfigured()) return;
    if (_autoSyncTimer) clearTimeout(_autoSyncTimer);
    _autoSyncTimer = setTimeout(() => {
      this.pushAllToSupabaseQuietly();
    }, delayMs);
  },

  async pushAllToSupabaseQuietly(): Promise<void> {
    if (!isSupabaseConfigured() || _isAutoSyncing) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      _syncStatus = 'OFFLINE';
      return;
    }

    _isAutoSyncing = true;
    _syncStatus = 'SYNCING';

    try {
      const res = await this.pushAllToSupabase();
      if (res.success) {
        _syncStatus = 'SYNCED';
        _lastSyncTimestamp = new Date().toISOString();
      } else {
        _syncStatus = 'OFFLINE';
      }
    } catch (_) {
      _syncStatus = 'OFFLINE';
    } finally {
      _isAutoSyncing = false;
    }
  },

  async syncOnStartup(): Promise<void> {
    if (!isSupabaseConfigured()) return;
    try {
      _syncStatus = 'SYNCING';
      // 1. Pull latest cloud records down into local SQLite
      await this.pullAllFromSupabase();
      // 2. Push any local offline records back up
      await this.pushAllToSupabaseQuietly();
      _syncStatus = 'SYNCED';
      _lastSyncTimestamp = new Date().toISOString();
    } catch (e) {
      console.warn('Startup cloud sync notice:', e);
      _syncStatus = 'OFFLINE';
    }
  },

  initAutoSync() {
    if (typeof window !== 'undefined') {
      // Run two-way sync on initial startup
      setTimeout(() => {
        this.syncOnStartup();
      }, 1000);

      // When coming back online
      window.addEventListener('online', () => {
        this.syncOnStartup();
      });

      // Background periodic check every 60 seconds
      setInterval(() => {
        this.triggerAutoSync(500);
      }, 60000);
    }
  },

  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!isSupabaseConfigured()) {
      return {
        success: false,
        message: 'Supabase Cloud Database key configured nahi hai.',
      };
    }

    try {
      const client = getSupabase();
      const { data, error } = await client
        .from('shop_settings')
        .select('id, shop_name')
        .limit(1);

      if (error) {
        return {
          success: false,
          message: `Supabase Connection Error: ${error.message}`,
        };
      }

      return {
        success: true,
        message: 'Supabase Cloud Database ke sath kamyabi se rabta qayam ho gaya!',
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Connection Failed: ${err.message || err}`,
      };
    }
  },

  /**
   * PULL: Downloads all data from Supabase Cloud and upserts into local SQLite.
   * Essential for mobile phones or any newly connected devices to populate immediately!
   */
  async pullAllFromSupabase(): Promise<SyncResult> {
    if (!isSupabaseConfigured()) {
      return { success: false, message: 'Supabase is not configured' };
    }

    const client = getSupabase();
    const counts: { [table: string]: number } = {};

    try {
      await dbService.init();
      // 0. Shop Settings
      const { data: remoteSettings } = await client
        .from('shop_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (remoteSettings) {
        settingsRepo.update({
          shop_name: remoteSettings.shop_name || 'AL MADINAH CNC AND WOOD WORKS',
          urdu_title: remoteSettings.shop_name_urdu || 'المدینہ سی این سی اینڈ ووڈ ورکس',
          tagline: 'High Quality Timber, Wooden Doors, Chowkat & 3D/2D CNC Designing',
          phone1: remoteSettings.phone1 || '0300-1234567',
          phone2: remoteSettings.phone2 || '',
          address: remoteSettings.address || '',
          receipt_footer: remoteSettings.receipt_footer_urdu || '',
          pin_enabled: remoteSettings.pin_enabled ?? 1,
          app_pin: remoteSettings.app_pin || '1234',
        });
        counts['shop_settings'] = 1;
      }

      // 1. Users
      const { data: remoteUsers } = await client.from('users').select('*');
      if (remoteUsers && remoteUsers.length > 0) {
        for (const u of remoteUsers) {
          dbService.run(
            `INSERT OR REPLACE INTO users (id, username, password, full_name, role, is_active, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [u.id, u.username, u.password, u.full_name, u.role, u.is_active ?? 1, u.created_at]
          );
        }
        counts['users'] = remoteUsers.length;
      }

      // 2. Customers
      const { data: remoteCustomers } = await client.from('customers').select('*');
      if (remoteCustomers && remoteCustomers.length > 0) {
        for (const c of remoteCustomers) {
          dbService.run(
            `INSERT OR REPLACE INTO customers (id, name, phone, address, created_at)
             VALUES (?, ?, ?, ?, ?)`,
            [c.id, c.name, c.phone, c.address, c.created_at]
          );
        }
        counts['customers'] = remoteCustomers.length;
      }

      // 3. Catalog Items
      const { data: remoteCatalog } = await client.from('catalog_items').select('*');
      if (remoteCatalog && remoteCatalog.length > 0) {
        for (const item of remoteCatalog) {
          dbService.run(
            `INSERT OR REPLACE INTO catalog_items (id, category, name, default_rate, stock_qty, min_stock_alert, is_active, display_order)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              item.id,
              item.category,
              item.name,
              item.default_rate,
              item.stock_qty,
              item.min_stock_alert,
              item.is_active,
              item.display_order,
            ]
          );
        }
        counts['catalog_items'] = remoteCatalog.length;
      }

      // 4. Sales Invoices
      const { data: remoteInvoices } = await client.from('sales_invoices').select('*');
      if (remoteInvoices && remoteInvoices.length > 0) {
        for (const inv of remoteInvoices) {
          dbService.run(
            `INSERT OR REPLACE INTO sales_invoices (id, invoice_no, customer_id, invoice_date, total_amount, discount_amount, cash_received, balance_amount, notes, is_void, void_reason, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              inv.id,
              inv.invoice_no,
              inv.customer_id,
              inv.invoice_date,
              inv.total_amount,
              inv.discount_amount,
              inv.cash_received,
              inv.balance_amount,
              inv.notes,
              inv.is_void,
              inv.void_reason,
              inv.created_at,
            ]
          );
        }
        counts['sales_invoices'] = remoteInvoices.length;
      }

      // 5. Sales Invoice Items
      const { data: remoteInvoiceItems } = await client.from('sales_invoice_items').select('*');
      if (remoteInvoiceItems && remoteInvoiceItems.length > 0) {
        for (const it of remoteInvoiceItems) {
          dbService.run(
            `INSERT OR REPLACE INTO sales_invoice_items (id, invoice_id, item_id, item_name, quantity, rate, line_total)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [it.id, it.invoice_id, it.item_id, it.item_name, it.quantity, it.rate, it.line_total]
          );
        }
        counts['sales_invoice_items'] = remoteInvoiceItems.length;
      }

      // 6. CNC Jobs
      const { data: remoteCnc } = await client.from('cnc_jobs').select('*');
      if (remoteCnc && remoteCnc.length > 0) {
        for (const j of remoteCnc) {
          dbService.run(
            `INSERT OR REPLACE INTO cnc_jobs (id, job_no, customer_id, customer_name_manual, job_description, size_specification, total_amount, paid_amount, remaining_amount, status, notes, job_date, is_void, void_reason, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              j.id,
              j.job_no,
              j.customer_id,
              j.customer_name_manual,
              j.job_description,
              j.size_specification,
              j.total_amount,
              j.paid_amount,
              j.remaining_amount,
              j.status,
              j.notes,
              j.job_date,
              j.is_void,
              j.void_reason,
              j.created_at,
            ]
          );
        }
        counts['cnc_jobs'] = remoteCnc.length;
      }

      // 7. Customer Ledger Entries
      const { data: remoteLedger } = await client.from('customer_ledger').select('*');
      if (remoteLedger && remoteLedger.length > 0) {
        for (const l of remoteLedger) {
          dbService.run(
            `INSERT OR REPLACE INTO customer_ledger (id, customer_id, entry_date, ref_type, ref_id, description, debit, credit, is_void, void_reason, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              l.id,
              l.customer_id,
              l.entry_date,
              l.ref_type,
              l.ref_id,
              l.description,
              l.debit,
              l.credit,
              l.is_void,
              l.void_reason,
              l.created_at,
            ]
          );
        }
        counts['customer_ledger'] = remoteLedger.length;
      }

      // 8. Daily Expenses
      const { data: remoteExpenses } = await client.from('expenses').select('*');
      if (remoteExpenses && remoteExpenses.length > 0) {
        for (const e of remoteExpenses) {
          dbService.run(
            `INSERT OR REPLACE INTO expenses (id, expense_date, category, description, amount, payment_method, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [e.id, e.expense_date, e.category, e.description, e.amount, e.payment_method || 'CASH', e.created_at]
          );
        }
        counts['expenses'] = remoteExpenses.length;
      }

      // 9. Suppliers
      const { data: remoteSuppliers } = await client.from('suppliers').select('*');
      if (remoteSuppliers && remoteSuppliers.length > 0) {
        for (const s of remoteSuppliers) {
          dbService.run(
            `INSERT OR REPLACE INTO suppliers (id, name, company_name, phone, address, created_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [s.id, s.name, s.company_name, s.phone, s.address, s.created_at]
          );
        }
        counts['suppliers'] = remoteSuppliers.length;
      }

      // 10. Karigars
      const { data: remoteKarigars } = await client.from('karigars').select('*');
      if (remoteKarigars && remoteKarigars.length > 0) {
        for (const k of remoteKarigars) {
          dbService.run(
            `INSERT OR REPLACE INTO karigars (id, name, phone, role, wage_type, daily_wage, is_active, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [k.id, k.name, k.phone, k.role, k.wage_type, k.daily_wage, k.is_active, k.created_at]
          );
        }
        counts['karigars'] = remoteKarigars.length;
      }

      // 11. Quotations
      const { data: remoteQuotes } = await client.from('quotations').select('*');
      if (remoteQuotes && remoteQuotes.length > 0) {
        for (const q of remoteQuotes) {
          dbService.run(
            `INSERT OR REPLACE INTO quotations (id, quote_no, customer_id, customer_name, customer_phone, quote_date, expiry_date, total_amount, discount_amount, status, notes, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              q.id,
              q.quote_no,
              q.customer_id,
              q.customer_name,
              q.customer_phone,
              q.quote_date,
              q.expiry_date,
              q.total_amount,
              q.discount_amount,
              q.status,
              q.notes,
              q.created_at,
            ]
          );
        }
        counts['quotations'] = remoteQuotes.length;
      }

      // 12. Supplier Ledger
      const { data: remoteSuppLedger } = await client.from('supplier_ledger').select('*');
      if (remoteSuppLedger && remoteSuppLedger.length > 0) {
        for (const sl of remoteSuppLedger) {
          dbService.run(
            `INSERT OR REPLACE INTO supplier_ledger (id, supplier_id, entry_date, ref_type, description, bill_no, debit, credit, is_void, void_reason, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [sl.id, sl.supplier_id, sl.entry_date, sl.ref_type, sl.description, sl.bill_no, sl.debit, sl.credit, sl.is_void, sl.void_reason, sl.created_at]
          );
        }
        counts['supplier_ledger'] = remoteSuppLedger.length;
      }

      // 13. Karigar Attendance
      const { data: remoteAttendance } = await client.from('karigar_attendance').select('*');
      if (remoteAttendance && remoteAttendance.length > 0) {
        for (const a of remoteAttendance) {
          dbService.run(
            `INSERT OR REPLACE INTO karigar_attendance (id, karigar_id, att_date, status, notes)
             VALUES (?, ?, ?, ?, ?)`,
            [a.id, a.karigar_id, a.att_date, a.status, a.notes]
          );
        }
        counts['karigar_attendance'] = remoteAttendance.length;
      }

      // 14. Karigar Payments
      const { data: remotePayments } = await client.from('karigar_payments').select('*');
      if (remotePayments && remotePayments.length > 0) {
        for (const p of remotePayments) {
          dbService.run(
            `INSERT OR REPLACE INTO karigar_payments (id, karigar_id, pay_date, pay_type, amount, notes, is_void, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [p.id, p.karigar_id, p.pay_date, p.pay_type, p.amount, p.notes, p.is_void, p.created_at]
          );
        }
        counts['karigar_payments'] = remotePayments.length;
      }

      // 15. Quotation Items
      const { data: remoteQuoteItems } = await client.from('quotation_items').select('*');
      if (remoteQuoteItems && remoteQuoteItems.length > 0) {
        for (const qi of remoteQuoteItems) {
          dbService.run(
            `INSERT OR REPLACE INTO quotation_items (id, quotation_id, item_id, item_name, quantity, rate, line_total, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [qi.id, qi.quotation_id, qi.item_id, qi.item_name, qi.quantity, qi.rate, qi.line_total, qi.notes]
          );
        }
        counts['quotation_items'] = remoteQuoteItems.length;
      }

      // Refresh Workshop Store UI after pulling
      if (typeof window !== 'undefined' && (window as any).__workshopStore) {
        (window as any).__workshopStore.getState().refreshAll();
      }

      return {
        success: true,
        message: 'Cloud data kamyabi se local database mein download ho gaya!',
        counts,
      };
    } catch (err: any) {
      console.warn('Supabase pull notice:', err);
      return {
        success: false,
        message: `Cloud Pull Notice: ${err.message || err}`,
      };
    }
  },

  /**
   * PUSH: Uploads local SQLite data up to Supabase Cloud
   */
  async pushAllToSupabase(): Promise<SyncResult> {
    if (!isSupabaseConfigured()) {
      return {
        success: false,
        message: 'Supabase is not configured yet.',
      };
    }

    const client = getSupabase();
    const counts: { [table: string]: number } = {};

    try {
      await dbService.init();
      // 0. Shop Settings
      try {
        const settings = settingsRepo.get();
        if (settings) {
          await client.from('shop_settings').upsert({
            id: 1,
            shop_name: settings.shop_name,
            shop_name_urdu: settings.urdu_title,
            owner_name: (settings as any).owner_name || 'Muhammad Ahmad',
            phone1: settings.phone1,
            phone2: settings.phone2 || '',
            address: settings.address,
            receipt_footer_urdu: settings.receipt_footer,
            pin_enabled: settings.pin_enabled ?? 1,
            app_pin: settings.app_pin || '1234',
            updated_at: new Date().toISOString(),
          });
          counts['shop_settings'] = 1;
        }
      } catch (e) {
        console.warn('Shop settings cloud sync notice:', e);
      }

      // 1. Customers
      const customers = customerRepo.getAll();
      if (customers.length > 0) {
        const { error } = await client.from('customers').upsert(
          customers.map((c) => ({
            id: c.id,
            name: c.name,
            phone: c.phone || null,
            address: c.address || null,
            created_at: c.created_at || new Date().toISOString(),
          }))
        );
        if (error) throw new Error(`Customers sync error: ${error.message}`);
        counts['customers'] = customers.length;
      }

      // 2. Catalog Items
      const items = catalogRepo.getAll();
      if (items.length > 0) {
        const { error } = await client.from('catalog_items').upsert(
          items.map((i) => ({
            id: i.id,
            category: i.category,
            name: i.name,
            default_rate: i.default_rate,
            stock_qty: i.stock_qty || 0,
            min_stock_alert: i.min_stock_alert || 5,
            is_active: i.is_active,
            display_order: i.display_order || 0,
          }))
        );
        if (error) throw new Error(`Catalog items sync error: ${error.message}`);
        counts['catalog_items'] = items.length;
      }

      // 3. Sales Invoices
      const invoices = invoiceRepo.getAll();
      if (invoices.length > 0) {
        const { error } = await client.from('sales_invoices').upsert(
          invoices.map((inv) => ({
            id: inv.id,
            invoice_no: inv.invoice_no,
            customer_id: inv.customer_id || null,
            invoice_date: inv.invoice_date,
            total_amount: inv.total_amount,
            discount_amount: inv.discount_amount || 0,
            cash_received: inv.cash_received,
            balance_amount: inv.balance_amount,
            notes: inv.notes || null,
            is_void: inv.is_void || 0,
            void_reason: inv.void_reason || null,
            voided_at: inv.voided_at || null,
            created_at: inv.created_at || new Date().toISOString(),
          }))
        );
        if (error) throw new Error(`Invoices sync error: ${error.message}`);
        counts['sales_invoices'] = invoices.length;
      }

      // 4. CNC Jobs
      const jobs = cncRepo.getAll();
      if (jobs.length > 0) {
        const { error } = await client.from('cnc_jobs').upsert(
          jobs.map((j) => ({
            id: j.id,
            job_no: j.job_no,
            customer_id: j.customer_id || null,
            customer_name_manual: j.customer_name_manual || null,
            job_description: j.job_description,
            size_specification: j.size_specification || null,
            total_amount: j.total_amount,
            paid_amount: j.paid_amount || 0,
            remaining_amount: j.remaining_amount,
            status: j.status,
            notes: j.notes || null,
            job_date: j.job_date,
            is_void: j.is_void || 0,
            void_reason: j.void_reason || null,
            created_at: j.created_at || new Date().toISOString(),
          }))
        );
        if (error) throw new Error(`CNC Jobs sync error: ${error.message}`);
        counts['cnc_jobs'] = jobs.length;
      }

      // 5. Daily Expenses
      const expenses = expenseRepo.getAll();
      if (expenses.length > 0) {
        const { error } = await client.from('expenses').upsert(
          expenses.map((e) => ({
            id: e.id,
            expense_date: e.expense_date,
            category: e.category,
            description: e.description,
            amount: e.amount,
            payment_method: e.payment_method || 'CASH',
            created_at: e.created_at || new Date().toISOString(),
          }))
        );
        if (error) throw new Error(`Expenses sync error: ${error.message}`);
        counts['expenses'] = expenses.length;
      }

      // 6. Suppliers
      const suppliers = supplierRepo.getAll();
      if (suppliers.length > 0) {
        const { error } = await client.from('suppliers').upsert(
          suppliers.map((s) => ({
            id: s.id,
            name: s.name,
            company_name: s.company_name || null,
            phone: s.phone || null,
            address: s.address || null,
            created_at: s.created_at || new Date().toISOString(),
          }))
        );
        if (error) throw new Error(`Suppliers sync error: ${error.message}`);
        counts['suppliers'] = suppliers.length;
      }

      // 7. Karigars
      const karigars = karigarRepo.getAll();
      if (karigars.length > 0) {
        const { error } = await client.from('karigars').upsert(
          karigars.map((k) => ({
            id: k.id,
            name: k.name,
            phone: k.phone || null,
            role: k.role,
            wage_type: k.wage_type,
            daily_wage: k.daily_wage,
            is_active: k.is_active,
            created_at: k.created_at || new Date().toISOString(),
          }))
        );
        if (error) throw new Error(`Karigars sync error: ${error.message}`);
        counts['karigars'] = karigars.length;
      }

      // 8. Quotations
      const quotes = quotationRepo.getAll();
      if (quotes.length > 0) {
        const { error } = await client.from('quotations').upsert(
          quotes.map((q) => ({
            id: q.id,
            quote_no: q.quote_no,
            customer_id: q.customer_id || null,
            customer_name: q.customer_name,
            customer_phone: q.customer_phone || null,
            quote_date: q.quote_date,
            expiry_date: q.expiry_date || null,
            total_amount: q.total_amount,
            discount_amount: q.discount_amount || 0,
            status: q.status,
            notes: q.notes || null,
            created_at: q.created_at || new Date().toISOString(),
          }))
        );
        if (error) throw new Error(`Quotations sync error: ${error.message}`);
        counts['quotations'] = quotes.length;
      }

      // 9. Sales Invoice Items
      const invoiceItems = dbService.query<any>('SELECT * FROM sales_invoice_items');
      if (invoiceItems && invoiceItems.length > 0) {
        const { error } = await client.from('sales_invoice_items').upsert(
          invoiceItems.map((it) => ({
            id: it.id,
            invoice_id: it.invoice_id,
            item_id: it.item_id || null,
            item_name: it.item_name,
            quantity: it.quantity,
            rate: it.rate,
            line_total: it.line_total,
          }))
        );
        if (error) throw new Error(`Invoice items sync error: ${error.message}`);
        counts['sales_invoice_items'] = invoiceItems.length;
      }

      // 10. Customer Ledger
      const customerLedger = dbService.query<any>('SELECT * FROM customer_ledger');
      if (customerLedger && customerLedger.length > 0) {
        const { error } = await client.from('customer_ledger').upsert(
          customerLedger.map((l) => ({
            id: l.id,
            customer_id: l.customer_id,
            entry_date: l.entry_date,
            ref_type: l.ref_type,
            ref_id: l.ref_id || null,
            description: l.description,
            debit: l.debit || 0,
            credit: l.credit || 0,
            is_void: l.is_void || 0,
            void_reason: l.void_reason || null,
            created_at: l.created_at || new Date().toISOString(),
          }))
        );
        if (error) throw new Error(`Customer ledger sync error: ${error.message}`);
        counts['customer_ledger'] = customerLedger.length;
      }

      // 11. Supplier Ledger
      const supplierLedger = dbService.query<any>('SELECT * FROM supplier_ledger');
      if (supplierLedger && supplierLedger.length > 0) {
        const { error } = await client.from('supplier_ledger').upsert(
          supplierLedger.map((sl) => ({
            id: sl.id,
            supplier_id: sl.supplier_id,
            entry_date: sl.entry_date,
            ref_type: sl.ref_type,
            description: sl.description,
            bill_no: sl.bill_no || null,
            debit: sl.debit || 0,
            credit: sl.credit || 0,
            is_void: sl.is_void || 0,
            void_reason: sl.void_reason || null,
            created_at: sl.created_at || new Date().toISOString(),
          }))
        );
        if (error) throw new Error(`Supplier ledger sync error: ${error.message}`);
        counts['supplier_ledger'] = supplierLedger.length;
      }

      // 12. Karigar Attendance
      const attendance = dbService.query<any>('SELECT * FROM karigar_attendance');
      if (attendance && attendance.length > 0) {
        const { error } = await client.from('karigar_attendance').upsert(
          attendance.map((a) => ({
            id: a.id,
            karigar_id: a.karigar_id,
            att_date: a.att_date,
            status: a.status,
            notes: a.notes || null,
          }))
        );
        if (error) throw new Error(`Karigar attendance sync error: ${error.message}`);
        counts['karigar_attendance'] = attendance.length;
      }

      // 13. Karigar Payments
      const payments = dbService.query<any>('SELECT * FROM karigar_payments');
      if (payments && payments.length > 0) {
        const { error } = await client.from('karigar_payments').upsert(
          payments.map((p) => ({
            id: p.id,
            karigar_id: p.karigar_id,
            pay_date: p.pay_date,
            pay_type: p.pay_type,
            amount: p.amount,
            notes: p.notes || null,
            is_void: p.is_void || 0,
            created_at: p.created_at || new Date().toISOString(),
          }))
        );
        if (error) throw new Error(`Karigar payments sync error: ${error.message}`);
        counts['karigar_payments'] = payments.length;
      }

      // 14. Quotation Items
      const quoteItems = dbService.query<any>('SELECT * FROM quotation_items');
      if (quoteItems && quoteItems.length > 0) {
        const { error } = await client.from('quotation_items').upsert(
          quoteItems.map((qi) => ({
            id: qi.id,
            quotation_id: qi.quotation_id,
            item_id: qi.item_id || null,
            item_name: qi.item_name,
            quantity: qi.quantity,
            rate: qi.rate,
            line_total: qi.line_total,
            notes: qi.notes || null,
          }))
        );
        if (error) throw new Error(`Quotation items sync error: ${error.message}`);
        counts['quotation_items'] = quoteItems.length;
      }

      return {
        success: true,
        message: 'Tamam local data Supabase Cloud par kamyabi se auto-sync ho gaya!',
        counts,
      };
    } catch (err: any) {
      console.warn('Supabase auto-sync note:', err);
      return {
        success: false,
        message: `Auto-Sync Notice: ${err.message || err}`,
      };
    }
  },
};
