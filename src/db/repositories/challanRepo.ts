import { dbService } from '../sqlite';
import { DeliveryChallan } from '../../types';

export const challanRepo = {
  getAll(): DeliveryChallan[] {
    return dbService.query<DeliveryChallan>(`
      SELECT * FROM delivery_challans ORDER BY id DESC
    `);
  },

  getById(id: number): DeliveryChallan | null {
    const rows = dbService.query<DeliveryChallan>(
      `SELECT * FROM delivery_challans WHERE id = ?`,
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  },

  create(data: {
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
  }): DeliveryChallan {
    const dateStr = data.challan_date.replace(/-/g, '');
    const countRows = dbService.query<{ count: number }>(
      `SELECT COUNT(*) as count FROM delivery_challans WHERE challan_date = ?`,
      [data.challan_date]
    );
    const seq = ((countRows[0]?.count || 0) + 1).toString().padStart(3, '0');
    const challan_no = `GP-${dateStr}-${seq}`;

    dbService.run(
      `INSERT INTO delivery_challans (
        challan_no, invoice_id, cnc_job_id, customer_name, customer_phone,
        destination_address, driver_name, driver_phone, vehicle_no,
        items_summary, total_bill_amount, advance_paid, cod_balance_due,
        status, challan_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DISPATCHED', ?)`,
      [
        challan_no,
        data.invoice_id || null,
        data.cnc_job_id || null,
        data.customer_name,
        data.customer_phone || '',
        data.destination_address || '',
        data.driver_name || '',
        data.driver_phone || '',
        data.vehicle_no || '',
        data.items_summary,
        data.total_bill_amount,
        data.advance_paid,
        data.cod_balance_due,
        data.challan_date,
      ]
    );

    const insertedRows = dbService.query<{ id: number }>(
      `SELECT id FROM delivery_challans WHERE challan_no = ?`,
      [challan_no]
    );
    return this.getById(insertedRows[0].id)!;
  },

  updateStatus(id: number, status: DeliveryChallan['status']): void {
    dbService.run(`UPDATE delivery_challans SET status = ? WHERE id = ?`, [status, id]);
  },

  delete(id: number): void {
    dbService.run(`DELETE FROM delivery_challans WHERE id = ?`, [id]);
  },
};
