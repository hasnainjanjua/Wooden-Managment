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

export interface SyncResult {
  success: boolean;
  message: string;
  counts?: { [table: string]: number };
}

export const supabaseSyncService = {
  isConfigured: () => isSupabaseConfigured(),
  getUrl: () => SUPABASE_URL,

  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!isSupabaseConfigured()) {
      return {
        success: false,
        message: 'Supabase Anon Key darj nahi ki gayi. Shop Settings mein ja kar Key save karein.',
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

  async pushAllToSupabase(): Promise<SyncResult> {
    if (!isSupabaseConfigured()) {
      return {
        success: false,
        message: 'Supabase Anon Key required. Please configure it in Shop Settings.',
      };
    }

    const client = getSupabase();
    const counts: { [table: string]: number } = {};

    try {
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

      return {
        success: true,
        message: 'Tamam local data Supabase Cloud par kamyabi se upload ho gaya!',
        counts,
      };
    } catch (err: any) {
      console.error('Supabase Push error:', err);
      return {
        success: false,
        message: `Upload Failed: ${err.message || err}`,
      };
    }
  },
};
