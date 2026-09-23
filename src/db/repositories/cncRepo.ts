import { dbService } from '../sqlite';
import { CncJob, CncStatus } from '../../types';
import { ledgerRepo } from './ledgerRepo';

export const cncRepo = {
  getNextJobNo(): string {
    const year = new Date().getFullYear();
    const row = dbService.queryOne<{ max_id: number }>(
      'SELECT MAX(id) as max_id FROM cnc_jobs'
    );
    const nextNum = (row?.max_id || 0) + 1;
    return `CNC-${year}-${String(nextNum).padStart(4, '0')}`;
  },

  getAll(): CncJob[] {
    const sql = `
      SELECT 
        cj.*,
        c.name as customer_name,
        c.phone as customer_phone
      FROM cnc_jobs cj
      LEFT JOIN customers c ON cj.customer_id = c.id
      ORDER BY cj.id DESC
      LIMIT 150;
    `;
    return dbService.query<CncJob>(sql);
  },

  getById(id: number): CncJob | null {
    const sql = `
      SELECT 
        cj.*,
        c.name as customer_name,
        c.phone as customer_phone
      FROM cnc_jobs cj
      LEFT JOIN customers c ON cj.customer_id = c.id
      WHERE cj.id = ?;
    `;
    return dbService.queryOne<CncJob>(sql, [id]);
  },

  create(job: {
    customer_id?: number | null;
    customer_name_manual?: string;
    job_description: string;
    size_specification?: string;
    total_amount: number;
    paid_amount: number;
    remaining_amount: number;
    status?: CncStatus;
    notes?: string;
    job_date: string;
  }): CncJob {
    const job_no = this.getNextJobNo();
    const status = job.status || 'Pending';

    const { lastInsertRowid: jobId } = dbService.run(
      `INSERT INTO cnc_jobs 
       (job_no, customer_id, customer_name_manual, job_description, size_specification, 
        total_amount, paid_amount, remaining_amount, status, notes, job_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        job_no,
        job.customer_id || null,
        job.customer_name_manual?.trim() || null,
        job.job_description.trim(),
        job.size_specification?.trim() || null,
        job.total_amount,
        job.paid_amount,
        job.remaining_amount,
        status,
        job.notes?.trim() || null,
        job.job_date,
      ]
    );

    // If attached to customer account, register to Khata ledger
    if (job.customer_id) {
      dbService.run(
        `INSERT INTO customer_ledger 
         (customer_id, entry_date, ref_type, ref_id, description, debit, credit)
         VALUES (?, ?, 'CNC_JOB', ?, ?, ?, 0)`,
        [
          job.customer_id,
          job.job_date,
          jobId,
          `CNC Job #${job_no} (${job.job_description})`,
          job.total_amount,
        ]
      );

      if (job.paid_amount > 0) {
        dbService.run(
          `INSERT INTO customer_ledger 
           (customer_id, entry_date, ref_type, ref_id, description, debit, credit)
           VALUES (?, ?, 'WASOOLI', ?, ?, 0, ?)`,
          [
            job.customer_id,
            job.job_date,
            jobId,
            `CNC Advance Wasool ba-zariye Job #${job_no}`,
            job.paid_amount,
          ]
        );
      }
    }

    return this.getById(jobId)!;
  },

  updateStatus(id: number, status: CncStatus): void {
    const completedAtSql = status === 'Completed' ? "datetime('now')" : 'NULL';
    dbService.run(
      `UPDATE cnc_jobs 
       SET status = ?, completed_at = ${completedAtSql} 
       WHERE id = ?`,
      [status, id]
    );
  },

  receivePayment(id: number, amount: number, notes = ''): void {
    const job = this.getById(id);
    if (!job) throw new Error('Job not found');

    const newPaid = job.paid_amount + amount;
    const newRemaining = Math.max(0, job.total_amount - newPaid);

    dbService.run(
      `UPDATE cnc_jobs 
       SET paid_amount = ?, remaining_amount = ? 
       WHERE id = ?`,
      [newPaid, newRemaining, id]
    );

    if (job.customer_id) {
      const desc = notes.trim()
        ? `CNC Wasooli (Job #${job.job_no}): ${notes.trim()}`
        : `CNC Baqaya Wasool (Job #${job.job_no})`;

      dbService.run(
        `INSERT INTO customer_ledger 
         (customer_id, entry_date, ref_type, ref_id, description, debit, credit)
         VALUES (?, date('now'), 'WASOOLI', ?, ?, 0, ?)`,
        [job.customer_id, id, desc, amount]
      );
    }
  },

  voidJob(id: number, reason: string): void {
    const job = this.getById(id);
    if (!job) throw new Error('Job not found');
    if (job.is_void) throw new Error('Job is already voided');

    dbService.run(
      `UPDATE cnc_jobs 
       SET is_void = 1, void_reason = ?, voided_at = datetime('now') 
       WHERE id = ?`,
      [reason.trim(), id]
    );

    if (job.customer_id) {
      const linkedEntries = dbService.query<{ id: number }>(
        `SELECT id FROM customer_ledger 
         WHERE ref_id = ? AND ref_type IN ('CNC_JOB', 'WASOOLI') AND is_void = 0`,
        [id]
      );
      for (const entry of linkedEntries) {
        ledgerRepo.voidEntry(entry.id, `Mansookhi CNC Job #${job.job_no}: ${reason.trim()}`);
      }
    }
  }
};