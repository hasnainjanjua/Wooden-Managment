import { dbService } from '../sqlite';
import { SalesInvoice, SalesInvoiceItem, CartItem } from '../../types';
import { ledgerRepo } from './ledgerRepo';

export const invoiceRepo = {
  getNextInvoiceNo(): string {
    const year = new Date().getFullYear();
    const row = dbService.queryOne<{ max_id: number }>(
      'SELECT MAX(id) as max_id FROM sales_invoices'
    );
    const nextNum = (row?.max_id || 0) + 1;
    return `INV-${year}-${String(nextNum).padStart(4, '0')}`;
  },

  create(
    invoiceData: {
      customer_id?: number | null;
      invoice_date: string;
      total_amount: number;
      discount_amount: number;
      cash_received: number;
      balance_amount: number;
      notes?: string;
    },
    items: CartItem[]
  ): { invoice: SalesInvoice; items: SalesInvoiceItem[] } {
    const invoice_no = this.getNextInvoiceNo();
    const netTotal = invoiceData.total_amount - invoiceData.discount_amount;

    const { lastInsertRowid: invoiceId } = dbService.run(
      `INSERT INTO sales_invoices 
       (invoice_no, customer_id, invoice_date, total_amount, discount_amount, cash_received, balance_amount, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invoice_no,
        invoiceData.customer_id || null,
        invoiceData.invoice_date,
        invoiceData.total_amount,
        invoiceData.discount_amount,
        invoiceData.cash_received,
        invoiceData.balance_amount,
        invoiceData.notes || null,
      ]
    );

    // Insert items
    const insertedItems: SalesInvoiceItem[] = [];
    const itemStmt = `
      INSERT INTO sales_invoice_items 
      (invoice_id, item_id, item_name, quantity, rate, line_total) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    for (const itm of items) {
      const { lastInsertRowid: itemId } = dbService.run(itemStmt, [
        invoiceId,
        itm.item_id || null,
        itm.item_name,
        itm.quantity,
        itm.rate,
        itm.line_total,
      ]);
      insertedItems.push({
        id: itemId,
        invoice_id: invoiceId,
        item_id: itm.item_id || null,
        item_name: itm.item_name,
        quantity: itm.quantity,
        rate: itm.rate,
        line_total: itm.line_total,
      });

      // Deduct stock if linked to a catalog item
      if (itm.item_id) {
        try {
          dbService.run(
            `UPDATE catalog_items SET stock_qty = COALESCE(stock_qty, 0) - ? WHERE id = ?`,
            [itm.quantity, itm.item_id]
          );
          dbService.run(
            `INSERT INTO inventory_transactions (item_id, tx_date, tx_type, quantity, notes)
             VALUES (?, ?, 'OUT_SALE', ?, ?)`,
            [itm.item_id, invoiceData.invoice_date, -itm.quantity, `Sale Bill #${invoice_no}`]
          );
        } catch (e) {
          console.error('Failed to deduct stock:', e);
        }
      }
    }

    // Customer ledger posting (Single source of truth)
    if (invoiceData.customer_id) {
      // 1. Post total net bill as Debit (Banam)
      dbService.run(
        `INSERT INTO customer_ledger 
         (customer_id, entry_date, ref_type, ref_id, description, debit, credit)
         VALUES (?, ?, 'SALE_INVOICE', ?, ?, ?, 0)`,
        [
          invoiceData.customer_id,
          invoiceData.invoice_date,
          invoiceId,
          `Sale Bill #${invoice_no} (${items.length} items)`,
          netTotal,
        ]
      );

      // 2. If down-payment was received on the spot, post Credit (Jama)
      if (invoiceData.cash_received > 0) {
        dbService.run(
          `INSERT INTO customer_ledger 
           (customer_id, entry_date, ref_type, ref_id, description, debit, credit)
           VALUES (?, ?, 'WASOOLI', ?, ?, 0, ?)`,
          [
            invoiceData.customer_id,
            invoiceData.invoice_date,
            invoiceId,
            `Naqad Wasool ba-zariye Bill #${invoice_no}`,
            invoiceData.cash_received,
          ]
        );
      }
    }

    const invoice = this.getById(invoiceId)!;
    return { invoice, items: insertedItems };
  },

  getAll(): SalesInvoice[] {
    const sql = `
      SELECT 
        si.*,
        c.name as customer_name,
        c.phone as customer_phone
      FROM sales_invoices si
      LEFT JOIN customers c ON si.customer_id = c.id
      ORDER BY si.id DESC
      LIMIT 150;
    `;
    return dbService.query<SalesInvoice>(sql);
  },

  getById(id: number): SalesInvoice | null {
    const sql = `
      SELECT 
        si.*,
        c.name as customer_name,
        c.phone as customer_phone
      FROM sales_invoices si
      LEFT JOIN customers c ON si.customer_id = c.id
      WHERE si.id = ?;
    `;
    return dbService.queryOne<SalesInvoice>(sql, [id]);
  },

  getItems(invoiceId: number): SalesInvoiceItem[] {
    return dbService.query<SalesInvoiceItem>(
      'SELECT * FROM sales_invoice_items WHERE invoice_id = ? ORDER BY id ASC',
      [invoiceId]
    );
  },

  voidInvoice(id: number, reason: string): void {
    const invoice = this.getById(id);
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.is_void) throw new Error('Invoice is already voided');

    // 1. Mark invoice as void
    dbService.run(
      `UPDATE sales_invoices 
       SET is_void = 1, void_reason = ?, voided_at = datetime('now') 
       WHERE id = ?`,
      [reason.trim(), id]
    );

    // 2. Compensate ledger entries tied to this invoice
    if (invoice.customer_id) {
      const linkedEntries = dbService.query<{ id: number }>(
        `SELECT id FROM customer_ledger 
         WHERE ref_id = ? AND ref_type IN ('SALE_INVOICE', 'WASOOLI') AND is_void = 0`,
        [id]
      );
      for (const entry of linkedEntries) {
        ledgerRepo.voidEntry(entry.id, `Mansookhi Bill #${invoice.invoice_no}: ${reason.trim()}`);
      }
    }

    // 3. Revert inventory quantities
    try {
      const items = this.getItems(id);
      for (const itm of items) {
        if (itm.item_id) {
          dbService.run(
            `UPDATE catalog_items SET stock_qty = COALESCE(stock_qty, 0) + ? WHERE id = ?`,
            [itm.quantity, itm.item_id]
          );
          dbService.run(
            `INSERT INTO inventory_transactions (item_id, tx_date, tx_type, quantity, notes)
             VALUES (?, date('now'), 'ADJUSTMENT', ?, ?)`,
            [itm.item_id, itm.quantity, `Reversal of Void Bill #${invoice.invoice_no}`]
          );
        }
      }
    } catch (e) {
      console.error('Failed to revert stock for voided invoice:', e);
    }
  }
};
