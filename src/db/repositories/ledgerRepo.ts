import { dbService } from '../sqlite';
import { CustomerLedgerEntry } from '../../types';

export const ledgerRepo = {
  getByCustomerId(customerId: number): (CustomerLedgerEntry & { running_balance: number })[] {
    const sql = `
      SELECT 
        cl.id,
        cl.customer_id,
        cl.entry_date,
        cl.ref_type,
        cl.ref_id,
        cl.description,
        cl.debit,
        cl.credit,
        cl.is_void,
        cl.void_reason,
        cl.original_entry_id,
        cl.created_at,
        c.name as customer_name
      FROM customer_ledger cl
      JOIN customers c ON cl.customer_id = c.id
      WHERE cl.customer_id = ?
      ORDER BY cl.entry_date ASC, cl.id ASC;
    `;
    const entries = dbService.query<CustomerLedgerEntry>(sql, [customerId]);
    
    // Calculate running balance
    let balance = 0;
    return entries.map(entry => {
      if (entry.is_void === 0) {
        balance += (entry.debit - entry.credit);
      }
      return {
        ...entry,
        running_balance: balance
      };
    });
  },

  getAll(): CustomerLedgerEntry[] {
    const sql = `
      SELECT 
        cl.*,
        c.name as customer_name
      FROM customer_ledger cl
      JOIN customers c ON cl.customer_id = c.id
      ORDER BY cl.id DESC
      LIMIT 200;
    `;
    return dbService.query<CustomerLedgerEntry>(sql);
  },

  addWasooli(customerId: number, amount: number, date: string, notes = ''): void {
    const desc = notes.trim() ? `Naqad Wasooli: ${notes.trim()}` : 'Naqad Wasooli (Cash Received)';
    dbService.run(
      `INSERT INTO customer_ledger 
       (customer_id, entry_date, ref_type, description, debit, credit) 
       VALUES (?, ?, 'WASOOLI', ?, 0, ?)`,
      [customerId, date, desc, amount]
    );
  },

  voidEntry(entryId: number, reason: string): void {
    const entry = dbService.queryOne<CustomerLedgerEntry>(
      'SELECT * FROM customer_ledger WHERE id = ?',
      [entryId]
    );
    if (!entry) throw new Error('Ledger entry not found');
    if (entry.is_void) throw new Error('Entry is already voided');

    // 1. Mark original entry as void
    dbService.run(
      'UPDATE customer_ledger SET is_void = 1, void_reason = ? WHERE id = ?',
      [reason.trim(), entryId]
    );

    // 2. Insert compensating reversal audit row (also flagged is_void = 1 so it doesn't double-cancel with WHERE is_void = 0)
    const revDesc = `[Reversal/Mansookh] ${entry.description} - Wajah: ${reason.trim()}`;
    dbService.run(
      `INSERT INTO customer_ledger 
       (customer_id, entry_date, ref_type, ref_id, description, debit, credit, is_void, void_reason, original_entry_id)
       VALUES (?, date('now'), 'ADJUSTMENT', ?, ?, ?, ?, 1, ?, ?)`,
      [
        entry.customer_id,
        entry.ref_id,
        revDesc,
        entry.credit, // Mirrored: original credit becomes debit
        entry.debit,  // Mirrored: original debit becomes credit
        reason.trim(),
        entryId
      ]
    );
  }
};
