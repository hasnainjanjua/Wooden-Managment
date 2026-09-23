import { dbService } from '../sqlite';
import { CatalogCategory, CatalogItem } from '../../types';

export const catalogRepo = {
  getAll(): CatalogItem[] {
    const sql = `
      SELECT 
        id, 
        category, 
        name, 
        default_rate, 
        is_active, 
        display_order,
        COALESCE(stock_qty, 0) as stock_qty,
        COALESCE(min_stock_alert, 5) as min_stock_alert
      FROM catalog_items 
      ORDER BY category ASC, display_order ASC, name ASC;
    `;
    return dbService.query<CatalogItem>(sql);
  },

  getByCategory(category: CatalogCategory): CatalogItem[] {
    const sql = `
      SELECT 
        id, 
        category, 
        name, 
        default_rate, 
        is_active, 
        display_order,
        COALESCE(stock_qty, 0) as stock_qty,
        COALESCE(min_stock_alert, 5) as min_stock_alert
      FROM catalog_items 
      WHERE category = ? AND is_active = 1
      ORDER BY display_order ASC, name ASC;
    `;
    return dbService.query<CatalogItem>(sql, [category]);
  },

  create(
    category: CatalogCategory,
    name: string,
    default_rate: number,
    display_order = 0,
    initialStock = 0,
    minStockAlert = 5
  ): CatalogItem {
    const { lastInsertRowid } = dbService.run(
      'INSERT INTO catalog_items (category, name, default_rate, display_order, is_active, stock_qty, min_stock_alert) VALUES (?, ?, ?, ?, 1, ?, ?)',
      [category, name.trim(), default_rate, display_order, initialStock, minStockAlert]
    );

    if (initialStock > 0) {
      try {
        dbService.run(
          `INSERT INTO inventory_transactions (item_id, tx_date, tx_type, quantity, notes)
           VALUES (?, date('now'), 'IN_PURCHASE', ?, 'Opening / Initial Stock')`,
          [lastInsertRowid, initialStock]
        );
      } catch (_) {}
    }

    return dbService.queryOne<CatalogItem>(
      'SELECT *, COALESCE(stock_qty, 0) as stock_qty, COALESCE(min_stock_alert, 5) as min_stock_alert FROM catalog_items WHERE id = ?',
      [lastInsertRowid]
    )!;
  },

  update(id: number, name: string, default_rate: number, is_active: number, min_stock_alert?: number): void {
    if (min_stock_alert !== undefined) {
      dbService.run(
        'UPDATE catalog_items SET name = ?, default_rate = ?, is_active = ?, min_stock_alert = ? WHERE id = ?',
        [name.trim(), default_rate, is_active, min_stock_alert, id]
      );
    } else {
      dbService.run(
        'UPDATE catalog_items SET name = ?, default_rate = ?, is_active = ? WHERE id = ?',
        [name.trim(), default_rate, is_active, id]
      );
    }
  },

  delete(id: number): void {
    try {
      dbService.run('DELETE FROM inventory_transactions WHERE item_id = ?', [id]);
    } catch (_) {}
    dbService.run('DELETE FROM catalog_items WHERE id = ?', [id]);
  }
};
