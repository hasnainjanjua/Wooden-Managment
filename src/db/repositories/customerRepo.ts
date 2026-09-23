import { dbService } from '../sqlite';
import { Customer } from '../../types';

export const customerRepo = {
  getAll(): Customer[] {
    const sql = `
      SELECT 
        c.id, 
        c.name, 
        c.phone, 
        c.address, 
        c.created_at,
        COALESCE(
          (SELECT SUM(debit) - SUM(credit) 
           FROM customer_ledger 
           WHERE customer_id = c.id AND is_void = 0), 
          0
        ) as current_balance
      FROM customers c
      ORDER BY c.name ASC;
    `;
    return dbService.query<Customer>(sql);
  },

  getById(id: number): Customer | null {
    const sql = `
      SELECT 
        c.id, 
        c.name, 
        c.phone, 
        c.address, 
        c.created_at,
        COALESCE(
          (SELECT SUM(debit) - SUM(credit) 
           FROM customer_ledger 
           WHERE customer_id = c.id AND is_void = 0), 
          0
        ) as current_balance
      FROM customers c
      WHERE c.id = ?;
    `;
    return dbService.queryOne<Customer>(sql, [id]);
  },

  create(name: string, phone = '', address = '', openingBalance = 0): Customer {
    const { lastInsertRowid: customerId } = dbService.run(
      'INSERT INTO customers (name, phone, address) VALUES (?, ?, ?)',
      [name.trim(), phone.trim(), address.trim()]
    );

    if (openingBalance > 0) {
      dbService.run(
        `INSERT INTO customer_ledger 
         (customer_id, entry_date, ref_type, description, debit, credit) 
         VALUES (?, date('now'), 'OPENING_BAL', 'Sabqa Baqaya (Opening Balance)', ?, 0)`,
        [customerId, openingBalance]
      );
    }

    return this.getById(customerId)!;
  },

  update(id: number, name: string, phone = '', address = ''): void {
    dbService.run(
      'UPDATE customers SET name = ?, phone = ?, address = ? WHERE id = ?',
      [name.trim(), phone.trim(), address.trim(), id]
    );
  },

  delete(id: number): void {
    dbService.run('UPDATE sales_invoices SET customer_id = NULL WHERE customer_id = ?', [id]);
    dbService.run('UPDATE cnc_jobs SET customer_id = NULL WHERE customer_id = ?', [id]);
    dbService.run('DELETE FROM customer_ledger WHERE customer_id = ?', [id]);
    dbService.run('DELETE FROM customers WHERE id = ?', [id]);
  }
};
