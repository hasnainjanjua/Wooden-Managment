import { dbService } from '../sqlite';
import { CatalogItem, InventoryTransaction } from '../../types';

export const inventoryRepo = {
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
      ORDER BY category ASC, name ASC;
    `;
    return dbService.query<CatalogItem>(sql);
  },

  adjustStock(
    itemId: number,
    quantityChange: number, // can be positive (add stock) or negative (deduct stock)
    txType: 'IN_PURCHASE' | 'OUT_SALE' | 'ADJUSTMENT',
    notes = ''
  ): void {
    // 1. Update catalog_items stock_qty
    dbService.run(
      `UPDATE catalog_items 
       SET stock_qty = COALESCE(stock_qty, 0) + ? 
       WHERE id = ?`,
      [quantityChange, itemId]
    );

    // 2. Log transaction
    dbService.run(
      `INSERT INTO inventory_transactions (item_id, tx_date, tx_type, quantity, notes)
       VALUES (?, date('now'), ?, ?, ?)`,
      [itemId, txType, quantityChange, notes.trim()]
    );
  },

  adjustMultipleStock(
    items: {
      itemId: number;
      quantityChange: number;
      txType?: 'IN_PURCHASE' | 'OUT_SALE' | 'ADJUSTMENT';
      notes?: string;
    }[]
  ): void {
    if (!items || items.length === 0) return;
    for (const item of items) {
      if (item.quantityChange === 0) continue;
      this.adjustStock(
        item.itemId,
        item.quantityChange,
        item.txType || (item.quantityChange > 0 ? 'IN_PURCHASE' : 'ADJUSTMENT'),
        item.notes || 'Bulk stock inward'
      );
    }
  },

  getLowStockItems(): CatalogItem[] {
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
      WHERE is_active = 1 AND COALESCE(stock_qty, 0) <= COALESCE(min_stock_alert, 5)
      ORDER BY stock_qty ASC;
    `;
    return dbService.query<CatalogItem>(sql);
  },

  getTransactions(itemId?: number): InventoryTransaction[] {
    let sql = `
      SELECT 
        t.id, 
        t.item_id, 
        c.name as item_name,
        t.tx_date, 
        t.tx_type, 
        t.quantity, 
        t.notes, 
        t.created_at
      FROM inventory_transactions t
      LEFT JOIN catalog_items c ON c.id = t.item_id
    `;
    const params: any[] = [];
    if (itemId) {
      sql += ' WHERE t.item_id = ?';
      params.push(itemId);
    }
    sql += ' ORDER BY t.id DESC LIMIT 100;';
    return dbService.query<InventoryTransaction>(sql, params);
  }
};
