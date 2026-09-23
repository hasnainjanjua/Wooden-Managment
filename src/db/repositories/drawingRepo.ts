import { dbService } from '../sqlite';
import { OwnerDrawing } from '../../types';

export const drawingRepo = {
  getAll(): OwnerDrawing[] {
    return dbService.query<OwnerDrawing>(`
      SELECT * FROM owner_drawings ORDER BY id DESC
    `);
  },

  getByDateRange(startDate: string, endDate: string): OwnerDrawing[] {
    return dbService.query<OwnerDrawing>(
      `SELECT * FROM owner_drawings WHERE drawing_date BETWEEN ? AND ? ORDER BY id DESC`,
      [startDate, endDate]
    );
  },

  create(data: {
    drawing_date: string;
    owner_name: string;
    amount: number;
    source: 'DRAWER' | 'BANK';
    description: string;
  }): OwnerDrawing {
    dbService.run(
      `INSERT INTO owner_drawings (drawing_date, owner_name, amount, source, description)
       VALUES (?, ?, ?, ?, ?)`,
      [data.drawing_date, data.owner_name, data.amount, data.source, data.description]
    );
    const rows = dbService.query<OwnerDrawing>(
      `SELECT * FROM owner_drawings ORDER BY id DESC LIMIT 1`
    );
    return rows[0];
  },

  delete(id: number): void {
    dbService.run(`DELETE FROM owner_drawings WHERE id = ?`, [id]);
  },
};
