import { dbService } from '../sqlite';
import { Karigar, KarigarAttendance, KarigarPayment, AttendanceStatus, KarigarWageType } from '../../types';

export const karigarRepo = {
  getAll(): Karigar[] {
    const sql = `
      SELECT id, name, phone, role, wage_type, daily_wage, is_active, created_at
      FROM karigars
      ORDER BY is_active DESC, name ASC;
    `;
    return dbService.query<Karigar>(sql);
  },

  getById(id: number): Karigar | null {
    const sql = `
      SELECT id, name, phone, role, wage_type, daily_wage, is_active, created_at
      FROM karigars
      WHERE id = ?;
    `;
    return dbService.queryOne<Karigar>(sql, [id]);
  },

  create(
    name: string,
    phone = '',
    role = 'Karigar',
    wage_type: KarigarWageType = 'DAILY',
    daily_wage = 0
  ): Karigar {
    const { lastInsertRowid } = dbService.run(
      'INSERT INTO karigars (name, phone, role, wage_type, daily_wage, is_active) VALUES (?, ?, ?, ?, ?, 1)',
      [name.trim(), phone.trim(), role.trim(), wage_type, daily_wage]
    );
    return this.getById(lastInsertRowid)!;
  },

  update(
    id: number,
    name: string,
    phone = '',
    role = 'Karigar',
    wage_type: KarigarWageType = 'DAILY',
    daily_wage = 0,
    is_active = 1
  ): void {
    dbService.run(
      'UPDATE karigars SET name = ?, phone = ?, role = ?, wage_type = ?, daily_wage = ?, is_active = ? WHERE id = ?',
      [name.trim(), phone.trim(), role.trim(), wage_type, daily_wage, is_active, id]
    );
  },

  getAttendanceByDate(date: string): KarigarAttendance[] {
    const sql = `
      SELECT 
        a.id, 
        a.karigar_id, 
        k.name as karigar_name,
        a.att_date, 
        a.status, 
        a.notes
      FROM karigar_attendance a
      JOIN karigars k ON k.id = a.karigar_id
      WHERE a.att_date = ?;
    `;
    return dbService.query<KarigarAttendance>(sql, [date]);
  },

  saveAttendance(karigarId: number, date: string, status: AttendanceStatus, notes = ''): void {
    dbService.run(
      `INSERT INTO karigar_attendance (karigar_id, att_date, status, notes)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(karigar_id, att_date) 
       DO UPDATE SET status = excluded.status, notes = excluded.notes;`,
      [karigarId, date, status, notes.trim()]
    );
  },

  addPayment(
    karigarId: number,
    date: string,
    pay_type: 'DAILY_WAGE' | 'ADVANCE' | 'MONTHLY_SALARY',
    amount: number,
    notes = ''
  ): void {
    dbService.run(
      `INSERT INTO karigar_payments (karigar_id, pay_date, pay_type, amount, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [karigarId, date, pay_type, amount, notes.trim()]
    );
  },

  getPayments(karigarId?: number): KarigarPayment[] {
    let sql = `
      SELECT 
        p.id, 
        p.karigar_id, 
        k.name as karigar_name,
        p.pay_date, 
        p.pay_type, 
        p.amount, 
        p.notes, 
        p.is_void, 
        p.created_at
      FROM karigar_payments p
      JOIN karigars k ON k.id = p.karigar_id
    `;
    const params: any[] = [];
    if (karigarId) {
      sql += ' WHERE p.karigar_id = ?';
      params.push(karigarId);
    }
    sql += ' ORDER BY p.pay_date DESC, p.id DESC LIMIT 100;';
    return dbService.query<KarigarPayment>(sql, params);
  },

  getKarigarSummary(
    karigarId: number,
    fromDate?: string,
    toDate?: string
  ): {
    total_present: number;
    total_half_day: number;
    total_absent: number;
    total_leave: number;
    total_earned: number;
    total_paid: number;
    net_payable: number;
  } {
    const karigar = this.getById(karigarId);
    if (!karigar) {
      return {
        total_present: 0,
        total_half_day: 0,
        total_absent: 0,
        total_leave: 0,
        total_earned: 0,
        total_paid: 0,
        net_payable: 0,
      };
    }

    let attSql = 'SELECT status, COUNT(*) as cnt FROM karigar_attendance WHERE karigar_id = ?';
    const attParams: any[] = [karigarId];
    if (fromDate) {
      attSql += ' AND att_date >= ?';
      attParams.push(fromDate);
    }
    if (toDate) {
      attSql += ' AND att_date <= ?';
      attParams.push(toDate);
    }
    attSql += ' GROUP BY status;';

    const attRows = dbService.query<{ status: AttendanceStatus; cnt: number }>(attSql, attParams);
    let total_present = 0;
    let total_half_day = 0;
    let total_absent = 0;
    let total_leave = 0;

    for (const r of attRows) {
      if (r.status === 'PRESENT') total_present = r.cnt;
      else if (r.status === 'HALF_DAY') total_half_day = r.cnt;
      else if (r.status === 'ABSENT') total_absent = r.cnt;
      else if (r.status === 'LEAVE') total_leave = r.cnt;
    }

    // Earned: Full day = 100% daily wage, Half day = 50% daily wage
    const total_earned = (total_present * karigar.daily_wage) + (total_half_day * (karigar.daily_wage / 2));

    // Paid amount
    let paySql = 'SELECT COALESCE(SUM(amount), 0) as total FROM karigar_payments WHERE karigar_id = ? AND is_void = 0';
    const payParams: any[] = [karigarId];
    if (fromDate) {
      paySql += ' AND pay_date >= ?';
      payParams.push(fromDate);
    }
    if (toDate) {
      paySql += ' AND pay_date <= ?';
      payParams.push(toDate);
    }

    const payRes = dbService.queryOne<{ total: number }>(paySql, payParams);
    const total_paid = payRes?.total || 0;
    const net_payable = total_earned - total_paid;

    return {
      total_present,
      total_half_day,
      total_absent,
      total_leave,
      total_earned,
      total_paid,
      net_payable,
    };
  },

  delete(id: number): void {
    dbService.run('DELETE FROM karigar_attendance WHERE karigar_id = ?', [id]);
    dbService.run('DELETE FROM karigar_payments WHERE karigar_id = ?', [id]);
    dbService.run('DELETE FROM karigars WHERE id = ?', [id]);
  }
};
