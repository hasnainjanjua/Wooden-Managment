import { dbService } from '../sqlite';
import { Supplier, SupplierLedgerEntry } from '../../types';

export const supplierRepo = {
  getAll(): Supplier[] {
    const sql = `
      SELECT 
        s.id, 
        s.name, 
        s.company_name,
        s.phone, 
        s.address, 
        s.created_at,
        COALESCE(
          (SELECT SUM(credit) - SUM(debit) 
           FROM supplier_ledger 
           WHERE supplier_id = s.id AND is_void = 0), 
          0
        ) as current_balance
      FROM suppliers s
      ORDER BY s.name ASC;
    `;
    return dbService.query<Supplier>(sql);
  },

  getById(id: number): Supplier | null {
    const sql = `
      SELECT 
        s.id, 
        s.name, 
        s.company_name,
        s.phone, 
        s.address, 
        s.created_at,
        COALESCE(
          (SELECT SUM(credit) - SUM(debit) 
           FROM supplier_ledger 
           WHERE supplier_id = s.id AND is_void = 0), 
          0
        ) as current_balance
      FROM suppliers s
      WHERE s.id = ?;
    `;
    return dbService.queryOne<Supplier>(sql, [id]);
  },

  create(name: string, company_name = '', phone = '', address = '', openingBal = 0): Supplier {
    const { lastInsertRowid: supplierId } = dbService.run(
      'INSERT INTO suppliers (name, company_name, phone, address) VALUES (?, ?, ?, ?)',
      [name.trim(), company_name.trim(), phone.trim(), address.trim()]
    );

    if (openingBal > 0) {
      dbService.run(
        `INSERT INTO supplier_ledger 
         (supplier_id, entry_date, ref_type, description, debit, credit) 
         VALUES (?, date('now'), 'OPENING_BAL', 'Sabqa Dena (Opening Balance)', 0, ?)`,
        [supplierId, openingBal]
      );
    }

    return this.getById(supplierId)!;
  },

  update(id: number, name: string, company_name = '', phone = '', address = ''): void {
    dbService.run(
      'UPDATE suppliers SET name = ?, company_name = ?, phone = ?, address = ? WHERE id = ?',
      [name.trim(), company_name.trim(), phone.trim(), address.trim(), id]
    );
  },

  addPurchase(
    supplierId: number,
    billNo: string,
    totalAmount: number,
    cashPaid: number,
    description: string,
    date: string
  ): void {
    // 1. Credit the full bill to supplier
    dbService.run(
      `INSERT INTO supplier_ledger 
       (supplier_id, entry_date, ref_type, bill_no, description, debit, credit)
       VALUES (?, ?, 'PURCHASE', ?, ?, 0, ?)`,
      [supplierId, date, billNo.trim(), description.trim() || 'Purchased Material / Stock', totalAmount]
    );

    // 2. If cash was paid on the spot, record a debit payment
    if (cashPaid > 0) {
      dbService.run(
        `INSERT INTO supplier_ledger 
         (supplier_id, entry_date, ref_type, bill_no, description, debit, credit)
         VALUES (?, ?, 'PAYMENT', ?, ?, ?, 0)`,
        [supplierId, date, billNo.trim(), `Spot Cash Paid (Bill #${billNo.trim()})`, cashPaid]
      );
    }
  },

  addPayment(supplierId: number, amount: number, date: string, notes = ''): void {
    dbService.run(
      `INSERT INTO supplier_ledger 
       (supplier_id, entry_date, ref_type, description, debit, credit)
       VALUES (?, ?, 'PAYMENT', ?, ?, 0)`,
      [supplierId, date, notes.trim() || 'Naqad Adaigi (Cash Paid to Supplier)', amount]
    );
  },

  getLedger(supplierId: number): SupplierLedgerEntry[] {
    const sql = `
      SELECT 
        id, 
        supplier_id, 
        entry_date, 
        ref_type, 
        bill_no,
        description, 
        debit, 
        credit, 
        is_void, 
        void_reason, 
        created_at
      FROM supplier_ledger
      WHERE supplier_id = ?
      ORDER BY entry_date ASC, id ASC;
    `;
    const entries = dbService.query<SupplierLedgerEntry>(sql, [supplierId]);

    // Compute running balance: positive = We Owe Supplier
    let running = 0;
    return entries.map((entry) => {
      if (entry.is_void === 0) {
        running += entry.credit - entry.debit;
      }
      return {
        ...entry,
        running_balance: running,
      };
    });
  },

  voidEntry(id: number, reason: string): void {
    dbService.run(
      'UPDATE supplier_ledger SET is_void = 1, void_reason = ? WHERE id = ?',
      [reason.trim(), id]
    );
  },

  delete(id: number): void {
    dbService.run('DELETE FROM supplier_ledger WHERE supplier_id = ?', [id]);
    dbService.run('DELETE FROM suppliers WHERE id = ?', [id]);
  }
};
