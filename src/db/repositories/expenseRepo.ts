import { dbService } from '../sqlite';
import { Expense, ExpenseCategory } from '../../types';

export const expenseRepo = {
  getByDate(date: string): Expense[] {
    const sql = `
      SELECT * FROM expenses 
      WHERE expense_date = ? 
      ORDER BY id DESC;
    `;
    return dbService.query<Expense>(sql, [date]);
  },

  getAll(): Expense[] {
    const sql = `
      SELECT * FROM expenses 
      ORDER BY expense_date DESC, id DESC 
      LIMIT 200;
    `;
    return dbService.query<Expense>(sql);
  },

  create(expense: {
    expense_date: string;
    category: ExpenseCategory;
    description: string;
    amount: number;
    payment_method?: string;
  }): Expense {
    const { lastInsertRowid } = dbService.run(
      `INSERT INTO expenses (expense_date, category, description, amount, payment_method)
       VALUES (?, ?, ?, ?, ?)`,
      [
        expense.expense_date,
        expense.category,
        expense.description.trim(),
        expense.amount,
        expense.payment_method || 'CASH',
      ]
    );

    return dbService.queryOne<Expense>('SELECT * FROM expenses WHERE id = ?', [lastInsertRowid])!;
  },

  delete(id: number): void {
    dbService.run('DELETE FROM expenses WHERE id = ?', [id]);
  }
};