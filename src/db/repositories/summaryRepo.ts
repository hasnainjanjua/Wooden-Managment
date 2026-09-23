import { dbService } from '../sqlite';
import { DailySummary } from '../../types';

export const summaryRepo = {
  getDailySummary(date: string, endDate?: string): DailySummary {
    const isRange = Boolean(endDate && endDate !== date);

    // 1. Sales metrics
    const salesSql = isRange
      ? `SELECT 
          COALESCE(SUM(total_amount - discount_amount), 0) as total_sales,
          COALESCE(SUM(cash_received), 0) as cash_sales,
          COALESCE(SUM(balance_amount), 0) as udhaar_sales
         FROM sales_invoices 
         WHERE invoice_date BETWEEN ? AND ? AND is_void = 0`
      : `SELECT 
          COALESCE(SUM(total_amount - discount_amount), 0) as total_sales,
          COALESCE(SUM(cash_received), 0) as cash_sales,
          COALESCE(SUM(balance_amount), 0) as udhaar_sales
         FROM sales_invoices 
         WHERE invoice_date = ? AND is_void = 0`;
    const salesParams = isRange ? [date, endDate!] : [date];
    const salesRes = dbService.queryOne<{
      total_sales: number;
      cash_sales: number;
      udhaar_sales: number;
    }>(salesSql, salesParams);

    const total_sales_volume = salesRes?.total_sales || 0;
    const cash_sales_received = salesRes?.cash_sales || 0;
    const udhaar_sales = salesRes?.udhaar_sales || 0;

    // 2. CNC metrics
    const cncSql = isRange
      ? `SELECT 
          COALESCE(SUM(total_amount), 0) as total_cnc,
          COALESCE(SUM(paid_amount), 0) as cnc_cash
         FROM cnc_jobs 
         WHERE job_date BETWEEN ? AND ? AND is_void = 0`
      : `SELECT 
          COALESCE(SUM(total_amount), 0) as total_cnc,
          COALESCE(SUM(paid_amount), 0) as cnc_cash
         FROM cnc_jobs 
         WHERE job_date = ? AND is_void = 0`;
    const cncParams = isRange ? [date, endDate!] : [date];
    const cncRes = dbService.queryOne<{
      total_cnc: number;
      cnc_cash: number;
    }>(cncSql, cncParams);

    const total_cnc_volume = cncRes?.total_cnc || 0;
    const cnc_cash_received = cncRes?.cnc_cash || 0;

    // 3. Khata Wasooli received (excluding invoice spot cash to avoid double counting)
    const wasooliSql = isRange
      ? `SELECT COALESCE(SUM(credit), 0) as wasooli 
         FROM customer_ledger 
         WHERE entry_date BETWEEN ? AND ? 
           AND ref_type = 'WASOOLI' 
           AND is_void = 0
           AND (ref_id IS NULL OR ref_id NOT IN (SELECT id FROM sales_invoices WHERE invoice_date BETWEEN ? AND ? AND is_void = 0))`
      : `SELECT COALESCE(SUM(credit), 0) as wasooli 
         FROM customer_ledger 
         WHERE entry_date = ? 
           AND ref_type = 'WASOOLI' 
           AND is_void = 0
           AND (ref_id IS NULL OR ref_id NOT IN (SELECT id FROM sales_invoices WHERE invoice_date = ? AND is_void = 0))`;
    const wasooliParams = isRange ? [date, endDate!, date, endDate!] : [date, date];
    const wasooliRes = dbService.queryOne<{ wasooli: number }>(wasooliSql, wasooliParams);

    const khata_wasooli_received = wasooliRes?.wasooli || 0;

    // 4. Expenses
    const expSql = isRange
      ? `SELECT COALESCE(SUM(amount), 0) as total_exp 
         FROM expenses 
         WHERE expense_date BETWEEN ? AND ?`
      : `SELECT COALESCE(SUM(amount), 0) as total_exp 
         FROM expenses 
         WHERE expense_date = ?`;
    const expParams = isRange ? [date, endDate!] : [date];
    const expRes = dbService.queryOne<{ total_exp: number }>(expSql, expParams);
    const total_expenses = expRes?.total_exp || 0;

    // 5. Supplier Payments paid
    let total_supplier_payments = 0;
    try {
      const suppPaySql = isRange
        ? `SELECT COALESCE(SUM(debit), 0) as supp_pay 
           FROM supplier_ledger 
           WHERE entry_date BETWEEN ? AND ? AND ref_type = 'PAYMENT' AND is_void = 0`
        : `SELECT COALESCE(SUM(debit), 0) as supp_pay 
           FROM supplier_ledger 
           WHERE entry_date = ? AND ref_type = 'PAYMENT' AND is_void = 0`;
      const suppPayParams = isRange ? [date, endDate!] : [date];
      const suppPayRes = dbService.queryOne<{ supp_pay: number }>(suppPaySql, suppPayParams);
      total_supplier_payments = suppPayRes?.supp_pay || 0;
    } catch (_) {}

    // 6. Karigar Wage & Advance Payments paid
    let total_karigar_payments = 0;
    try {
      const karigarPaySql = isRange
        ? `SELECT COALESCE(SUM(amount), 0) as karigar_pay 
           FROM karigar_payments 
           WHERE pay_date BETWEEN ? AND ? AND is_void = 0`
        : `SELECT COALESCE(SUM(amount), 0) as karigar_pay 
           FROM karigar_payments 
           WHERE pay_date = ? AND is_void = 0`;
      const karigarPayParams = isRange ? [date, endDate!] : [date];
      const karigarPayRes = dbService.queryOne<{ karigar_pay: number }>(karigarPaySql, karigarPayParams);
      total_karigar_payments = karigarPayRes?.karigar_pay || 0;
    } catch (_) {}

    // 7. Inflow vs Outflow & Drawer Cash
    const total_cash_inflow = cash_sales_received + cnc_cash_received + khata_wasooli_received;
    const total_cash_outflow = total_expenses + total_supplier_payments + total_karigar_payments;
    const net_drawer_cash = total_cash_inflow - total_cash_outflow;

    // 8. Market Receivables (all outstanding customer balance)
    const marketRes = dbService.queryOne<{ market_debt: number }>(
      `SELECT COALESCE(SUM(debit) - SUM(credit), 0) as market_debt 
       FROM customer_ledger 
       WHERE is_void = 0`
    );
    const total_market_receivables = marketRes?.market_debt || 0;

    // 9. Total Supplier Payables (what we owe suppliers)
    let total_supplier_payables = 0;
    try {
      const suppDebtRes = dbService.queryOne<{ supp_debt: number }>(
        `SELECT COALESCE(SUM(credit) - SUM(debit), 0) as supp_debt 
         FROM supplier_ledger 
         WHERE is_void = 0`
      );
      total_supplier_payables = suppDebtRes?.supp_debt || 0;
    } catch (_) {}

    return {
      date,
      endDate: isRange ? endDate : undefined,
      total_sales_volume,
      cash_sales_received,
      udhaar_sales,
      total_cnc_volume,
      cnc_cash_received,
      khata_wasooli_received,
      total_cash_inflow,
      total_expenses,
      total_supplier_payments,
      total_karigar_payments,
      total_cash_outflow,
      net_drawer_cash,
      total_market_receivables,
      total_supplier_payables,
    };
  },

  getPeriodInvoices(startDate: string, endDate: string) {
    const sql = `
      SELECT 
        si.*, 
        c.name as customer_name, 
        c.phone as customer_phone
      FROM sales_invoices si
      LEFT JOIN customers c ON si.customer_id = c.id
      WHERE si.invoice_date BETWEEN ? AND ? AND si.is_void = 0
      ORDER BY si.id DESC;
    `;
    return dbService.query<any>(sql, [startDate, endDate]);
  },

  getPeriodCncJobs(startDate: string, endDate: string) {
    const sql = `
      SELECT 
        cj.*, 
        c.name as customer_name, 
        c.phone as customer_phone
      FROM cnc_jobs cj
      LEFT JOIN customers c ON cj.customer_id = c.id
      WHERE cj.job_date BETWEEN ? AND ? AND cj.is_void = 0
      ORDER BY cj.id DESC;
    `;
    return dbService.query<any>(sql, [startDate, endDate]);
  },

  getPeriodWasoolis(startDate: string, endDate: string) {
    const sql = `
      SELECT 
        cl.*, 
        c.name as customer_name, 
        c.phone as customer_phone
      FROM customer_ledger cl
      LEFT JOIN customers c ON cl.customer_id = c.id
      WHERE cl.entry_date BETWEEN ? AND ? 
        AND cl.ref_type = 'WASOOLI' 
        AND cl.is_void = 0
      ORDER BY cl.id DESC;
    `;
    return dbService.query<any>(sql, [startDate, endDate]);
  },

  getPeriodExpenses(startDate: string, endDate: string) {
    const sql = `
      SELECT *
      FROM expenses
      WHERE expense_date BETWEEN ? AND ?
      ORDER BY id DESC;
    `;
    return dbService.query<any>(sql, [startDate, endDate]);
  },
};