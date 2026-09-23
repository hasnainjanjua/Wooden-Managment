import { dbService } from '../sqlite';
import { Quotation, QuotationItem } from '../../types';

export const quotationRepo = {
  getAll(): Quotation[] {
    const rows = dbService.query<any>(`
      SELECT q.*, c.name as customer_name_joined
      FROM quotations q
      LEFT JOIN customers c ON q.customer_id = c.id
      ORDER BY q.id DESC
    `);

    return rows.map((r) => {
      const items = dbService.query<QuotationItem>(
        `SELECT * FROM quotation_items WHERE quotation_id = ? ORDER BY id ASC`,
        [r.id]
      );
      return {
        ...r,
        customer_name: r.customer_name || r.customer_name_joined || 'Walk-in Customer',
        items,
      };
    });
  },

  getById(id: number): Quotation | null {
    const rows = dbService.query<any>(
      `SELECT q.*, c.name as customer_name_joined, c.phone as customer_phone_joined
       FROM quotations q
       LEFT JOIN customers c ON q.customer_id = c.id
       WHERE q.id = ?`,
      [id]
    );
    if (rows.length === 0) return null;
    const r = rows[0];
    const items = dbService.query<QuotationItem>(
      `SELECT * FROM quotation_items WHERE quotation_id = ? ORDER BY id ASC`,
      [r.id]
    );
    return {
      ...r,
      customer_name: r.customer_name || r.customer_name_joined || 'Walk-in Customer',
      customer_phone: r.customer_phone || r.customer_phone_joined || '',
      items,
    };
  },

  create(data: {
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
  }): Quotation {
    // Generate sequential Quote number: QT-YYYYMMDD-XXXX
    const dateStr = data.quote_date.replace(/-/g, '');
    const countRows = dbService.query<{ count: number }>(
      `SELECT COUNT(*) as count FROM quotations WHERE quote_date = ?`,
      [data.quote_date]
    );
    const seq = ((countRows[0]?.count || 0) + 1).toString().padStart(3, '0');
    const quote_no = `QT-${dateStr}-${seq}`;

    dbService.run(
      `INSERT INTO quotations (
        quote_no, customer_id, customer_name, customer_phone,
        quote_date, expiry_date, total_amount, discount_amount,
        status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)`,
      [
        quote_no,
        data.customer_id || null,
        data.customer_name,
        data.customer_phone || '',
        data.quote_date,
        data.expiry_date || null,
        data.total_amount,
        data.discount_amount || 0,
        data.notes || '',
      ]
    );

    const insertedRows = dbService.query<{ id: number }>(
      `SELECT id FROM quotations WHERE quote_no = ?`,
      [quote_no]
    );
    const quoteId = insertedRows[0].id;

    for (const item of data.items) {
      dbService.run(
        `INSERT INTO quotation_items (
          quotation_id, item_id, item_name, quantity, rate, line_total, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          quoteId,
          item.item_id || null,
          item.item_name,
          item.quantity,
          item.rate,
          item.line_total,
          item.notes || '',
        ]
      );
    }

    return this.getById(quoteId)!;
  },

  updateStatus(id: number, status: Quotation['status'], convertedInvoiceId?: number): void {
    dbService.run(
      `UPDATE quotations SET status = ?, converted_invoice_id = ? WHERE id = ?`,
      [status, convertedInvoiceId || null, id]
    );
  },

  delete(id: number): void {
    dbService.run(`DELETE FROM quotation_items WHERE quotation_id = ?`, [id]);
    dbService.run(`DELETE FROM quotations WHERE id = ?`, [id]);
  },
};
