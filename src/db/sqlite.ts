import type { Database } from 'sql.js';
import { SEED_DOORS, SEED_HARDWARE, SEED_SERVICES, SEED_CUSTOMERS } from './seedData';

const DB_STORAGE_KEY = 'wooden_workshop_sqlite_db';
const BACKUP_STORE_PREFIX = 'workshop_backup_';

// IndexedDB Helper for saving Uint8Array without base64 overhead
const IDB_NAME = 'WorkshopLocalDatabase';
const IDB_STORE = 'sqlite_storage';

function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveToIndexedDB(key: string, data: Uint8Array): Promise<void> {
  const db = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    const req = store.put(data, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function getFromIndexedDB(key: string): Promise<Uint8Array | null> {
  const db = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const store = tx.objectStore(IDB_STORE);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function getSqlJsFactory() {
  if (typeof (window as any) !== 'undefined' && typeof (window as any).initSqlJs === 'function') {
    return (window as any).initSqlJs;
  }
  const mod = await import('sql.js');
  return mod.default || mod;
}

class SQLiteService {
  private db: Database | null = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  public async init(): Promise<void> {
    if (this.isInitialized && this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        const initSql = await getSqlJsFactory();
        const SQL = await initSql({
          // Load local offline wasm file from public folder (works in both Web and Electron Desktop)
          locateFile: (file: string) => {
            if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
              return `./${file}`;
            }
            return `/${file}`;
          },
        });

        const savedDbBytes = await getFromIndexedDB(DB_STORAGE_KEY);
        if (savedDbBytes && savedDbBytes.length > 0) {
          try {
            this.db = new SQL.Database(savedDbBytes);
          } catch (e) {
            console.warn('Failed to load saved database, initializing new one', e);
            this.db = new SQL.Database();
          }
        } else {
          this.db = new SQL.Database();
        }

        this.applySchema();
        this.seedInitialData();
        await this.persist();
        await this.checkAndCreateDailyBackup();

        if (typeof window !== 'undefined') {
          window.addEventListener('beforeunload', () => {
            this.persist();
          });
          document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
              this.persist();
            }
          });
        }

        this.isInitialized = true;
      } catch (err) {
        console.error('Error initializing SQLite:', err);
        throw err;
      }
    })();

    return this.initPromise;
  }

  private applySchema(): void {
    if (!this.db) return;
    this.db.exec(`
      PRAGMA foreign_keys = ON;

      -- Customers Master
      CREATE TABLE IF NOT EXISTS customers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          phone TEXT,
          address TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Editable Catalog Items
      CREATE TABLE IF NOT EXISTS catalog_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          category TEXT NOT NULL CHECK(category IN ('DOOR', 'HARDWARE', 'SERVICE')),
          name TEXT NOT NULL,
          default_rate REAL DEFAULT 0.0,
          is_active INTEGER DEFAULT 1,
          display_order INTEGER DEFAULT 0
      );

      -- Sales Invoices
      CREATE TABLE IF NOT EXISTS sales_invoices (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          invoice_no TEXT UNIQUE NOT NULL,
          customer_id INTEGER,
          invoice_date DATE NOT NULL,
          total_amount REAL NOT NULL,
          discount_amount REAL DEFAULT 0.0,
          cash_received REAL NOT NULL,
          balance_amount REAL NOT NULL,
          notes TEXT,
          is_void INTEGER DEFAULT 0,
          void_reason TEXT,
          voided_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (customer_id) REFERENCES customers(id)
      );

      -- Sales Items (captures custom/overridden unit rate)
      CREATE TABLE IF NOT EXISTS sales_invoice_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          invoice_id INTEGER NOT NULL,
          item_id INTEGER,
          item_name TEXT NOT NULL,
          quantity REAL NOT NULL,
          rate REAL NOT NULL,
          line_total REAL NOT NULL,
          FOREIGN KEY (invoice_id) REFERENCES sales_invoices(id),
          FOREIGN KEY (item_id) REFERENCES catalog_items(id)
      );

      -- CNC Job Register
      CREATE TABLE IF NOT EXISTS cnc_jobs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          job_no TEXT UNIQUE NOT NULL,
          customer_id INTEGER,
          customer_name_manual TEXT,
          job_description TEXT NOT NULL,
          size_specification TEXT,
          total_amount REAL NOT NULL,
          paid_amount REAL DEFAULT 0.0,
          remaining_amount REAL NOT NULL,
          status TEXT CHECK(status IN ('Pending', 'In Progress', 'Completed')) DEFAULT 'Pending',
          notes TEXT,
          job_date DATE NOT NULL,
          completed_at DATETIME,
          is_void INTEGER DEFAULT 0,
          void_reason TEXT,
          voided_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (customer_id) REFERENCES customers(id)
      );

      -- Unified Immutable Customer Ledger (Single Source of Truth for Balance)
      CREATE TABLE IF NOT EXISTS customer_ledger (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customer_id INTEGER NOT NULL,
          entry_date DATE NOT NULL,
          ref_type TEXT NOT NULL CHECK(ref_type IN ('OPENING_BAL', 'SALE_INVOICE', 'CNC_JOB', 'WASOOLI', 'ADJUSTMENT')),
          ref_id INTEGER,
          description TEXT NOT NULL,
          debit REAL DEFAULT 0.0,   -- Banam (Customer owes)
          credit REAL DEFAULT 0.0,  -- Jama (Customer paid)
          is_void INTEGER DEFAULT 0,
          void_reason TEXT,
          original_entry_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (customer_id) REFERENCES customers(id)
      );

      -- Daily Expenses
      CREATE TABLE IF NOT EXISTS expenses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          expense_date DATE NOT NULL,
          category TEXT NOT NULL, -- 'Bijli', 'Chai/Khana', 'Mazdoori', 'Tooling/CNC Bits', 'Kiraya', 'Other'
          description TEXT NOT NULL,
          amount REAL NOT NULL,
          payment_method TEXT DEFAULT 'CASH',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Suppliers / Vendors Master
      CREATE TABLE IF NOT EXISTS suppliers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          company_name TEXT,
          phone TEXT,
          address TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Supplier Ledger (Immutable Source of Truth for Vendor Dues)
      CREATE TABLE IF NOT EXISTS supplier_ledger (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          supplier_id INTEGER NOT NULL,
          entry_date DATE NOT NULL,
          ref_type TEXT NOT NULL CHECK(ref_type IN ('OPENING_BAL', 'PURCHASE', 'PAYMENT', 'ADJUSTMENT')),
          description TEXT NOT NULL,
          bill_no TEXT,
          debit REAL DEFAULT 0.0,   -- Payment made to supplier
          credit REAL DEFAULT 0.0,  -- Purchase bill (we owe supplier)
          is_void INTEGER DEFAULT 0,
          void_reason TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
      );

      -- Inventory Transaction History
      CREATE TABLE IF NOT EXISTS inventory_transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          item_id INTEGER NOT NULL,
          tx_date DATE NOT NULL,
          tx_type TEXT NOT NULL CHECK(tx_type IN ('IN_PURCHASE', 'OUT_SALE', 'ADJUSTMENT')),
          quantity REAL NOT NULL,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (item_id) REFERENCES catalog_items(id)
      );

      -- Karigar / Staff Master
      CREATE TABLE IF NOT EXISTS karigars (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          phone TEXT,
          role TEXT NOT NULL,
          wage_type TEXT NOT NULL CHECK(wage_type IN ('DAILY', 'MONTHLY')) DEFAULT 'DAILY',
          daily_wage REAL NOT NULL DEFAULT 0.0,
          is_active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Karigar Attendance Sheet
      CREATE TABLE IF NOT EXISTS karigar_attendance (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          karigar_id INTEGER NOT NULL,
          att_date DATE NOT NULL,
          status TEXT NOT NULL CHECK(status IN ('PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE')),
          notes TEXT,
          UNIQUE(karigar_id, att_date),
          FOREIGN KEY (karigar_id) REFERENCES karigars(id)
      );

      -- Karigar Wage & Advance Payments
      CREATE TABLE IF NOT EXISTS karigar_payments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          karigar_id INTEGER NOT NULL,
          pay_date DATE NOT NULL,
          pay_type TEXT NOT NULL CHECK(pay_type IN ('DAILY_WAGE', 'ADVANCE', 'MONTHLY_SALARY')),
          amount REAL NOT NULL,
          notes TEXT,
          is_void INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (karigar_id) REFERENCES karigars(id)
      );

      -- System Users & Login Credentials
      CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          full_name TEXT NOT NULL,
          role TEXT CHECK(role IN ('ADMIN', 'CASHIER', 'MANAGER')) DEFAULT 'CASHIER',
          is_active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Quotations / Kacha Estimates (does not alter stock or khata until approved)
      CREATE TABLE IF NOT EXISTS quotations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          quote_no TEXT UNIQUE NOT NULL,
          customer_id INTEGER,
          customer_name TEXT NOT NULL,
          customer_phone TEXT,
          quote_date DATE NOT NULL,
          expiry_date DATE,
          total_amount REAL NOT NULL,
          discount_amount REAL DEFAULT 0.0,
          status TEXT CHECK(status IN ('PENDING', 'APPROVED', 'CONVERTED', 'EXPIRED', 'REJECTED')) DEFAULT 'PENDING',
          notes TEXT,
          converted_invoice_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (customer_id) REFERENCES customers(id),
          FOREIGN KEY (converted_invoice_id) REFERENCES sales_invoices(id)
      );

      CREATE TABLE IF NOT EXISTS quotation_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          quotation_id INTEGER NOT NULL,
          item_id INTEGER,
          item_name TEXT NOT NULL,
          quantity REAL NOT NULL,
          rate REAL NOT NULL,
          line_total REAL NOT NULL,
          notes TEXT,
          FOREIGN KEY (quotation_id) REFERENCES quotations(id),
          FOREIGN KEY (item_id) REFERENCES catalog_items(id)
      );

      -- Delivery Challans / Gate Passes
      CREATE TABLE IF NOT EXISTS delivery_challans (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          challan_no TEXT UNIQUE NOT NULL,
          invoice_id INTEGER,
          cnc_job_id INTEGER,
          customer_name TEXT NOT NULL,
          customer_phone TEXT,
          destination_address TEXT,
          driver_name TEXT,
          driver_phone TEXT,
          vehicle_no TEXT,
          items_summary TEXT NOT NULL,
          total_bill_amount REAL NOT NULL,
          advance_paid REAL DEFAULT 0.0,
          cod_balance_due REAL DEFAULT 0.0,
          status TEXT CHECK(status IN ('DISPATCHED', 'DELIVERED', 'RETURNED')) DEFAULT 'DISPATCHED',
          challan_date DATE NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Owner Personal Drawings (Zati Kharcha, separate from factory expenses)
      CREATE TABLE IF NOT EXISTS owner_drawings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          drawing_date DATE NOT NULL,
          owner_name TEXT NOT NULL,
          amount REAL NOT NULL,
          source TEXT CHECK(source IN ('DRAWER', 'BANK')) DEFAULT 'DRAWER',
          description TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Safe Column Migrations for Existing Databases
    try {
      this.db.exec('ALTER TABLE catalog_items ADD COLUMN stock_qty REAL DEFAULT 0;');
    } catch (_) {}
    try {
      this.db.exec('ALTER TABLE catalog_items ADD COLUMN min_stock_alert REAL DEFAULT 5;');
    } catch (_) {}
    try {
      this.db.exec('ALTER TABLE sales_invoices ADD COLUMN cash_paid REAL DEFAULT 0;');
    } catch (_) {}
    try {
      this.db.exec('ALTER TABLE sales_invoices ADD COLUMN bank_paid REAL DEFAULT 0;');
    } catch (_) {}
    try {
      this.db.exec('ALTER TABLE sales_invoices ADD COLUMN bank_name TEXT;');
    } catch (_) {}
    try {
      this.db.exec('ALTER TABLE cnc_jobs ADD COLUMN cash_paid REAL DEFAULT 0;');
    } catch (_) {}
    try {
      this.db.exec('ALTER TABLE cnc_jobs ADD COLUMN bank_paid REAL DEFAULT 0;');
    } catch (_) {}
    try {
      this.db.exec('ALTER TABLE cnc_jobs ADD COLUMN bank_name TEXT;');
    } catch (_) {}
  }

  private seedInitialData(): void {
    if (!this.db) return;

    // Check if catalog items exist
    const countRes = this.db.exec("SELECT COUNT(*) as count FROM catalog_items");
    const count = countRes[0]?.values[0]?.[0] as number || 0;

    if (count === 0) {
      let order = 1;
      const stmt = this.db.prepare(
        "INSERT INTO catalog_items (category, name, default_rate, is_active, display_order) VALUES (?, ?, ?, 1, ?)"
      );

      for (const d of SEED_DOORS) {
        stmt.run([d.category, d.name, d.default_rate, order++]);
      }
      for (const h of SEED_HARDWARE) {
        stmt.run([h.category, h.name, h.default_rate, order++]);
      }
      for (const s of SEED_SERVICES) {
        stmt.run([s.category, s.name, s.default_rate, order++]);
      }
      stmt.free();

      // Seed Customers
      const custStmt = this.db.prepare("INSERT INTO customers (name, phone, address) VALUES (?, ?, ?)");
      const ledgerStmt = this.db.prepare(`
        INSERT INTO customer_ledger (customer_id, entry_date, ref_type, description, debit, credit)
        VALUES (?, date('now'), 'OPENING_BAL', 'Sabqa Baqaya (Opening Balance)', ?, 0)
      `);

      for (const c of SEED_CUSTOMERS) {
        custStmt.run([c.name, c.phone, c.address]);
        const custIdRes = this.db.exec("SELECT last_insert_rowid()");
        const custId = custIdRes[0]?.values[0]?.[0] as number;

        if (c.opening_bal > 0) {
          ledgerStmt.run([custId, c.opening_bal]);
        }
      }
      custStmt.free();
      ledgerStmt.free();
    }

    // Check if suppliers exist
    const suppCountRes = this.db.exec("SELECT COUNT(*) as count FROM suppliers");
    const suppCount = (suppCountRes[0]?.values[0]?.[0] as number) || 0;
    if (suppCount === 0) {
      const sStmt = this.db.prepare("INSERT INTO suppliers (name, company_name, phone, address) VALUES (?, ?, ?, ?)");
      const sLedgerStmt = this.db.prepare(`
        INSERT INTO supplier_ledger (supplier_id, entry_date, ref_type, description, debit, credit)
        VALUES (?, date('now'), 'OPENING_BAL', 'Sabqa Dena (Opening Balance)', 0, ?)
      `);

      sStmt.run(['Haji Manzoor', 'Al-Makkah Timber Market', '0301-7654321', 'Timber Market, Shop 12']);
      const s1Res = this.db.exec("SELECT last_insert_rowid()");
      sLedgerStmt.run([s1Res[0]?.values[0]?.[0], 45000]);

      sStmt.run(['Babar Hardware', 'Pak Hardware & Locks Center', '0321-9876543', 'Hardware Bazaar']);
      const s2Res = this.db.exec("SELECT last_insert_rowid()");
      sLedgerStmt.run([s2Res[0]?.values[0]?.[0], 12500]);

      sStmt.free();
      sLedgerStmt.free();
    }

    // Check if karigars exist
    const kCountRes = this.db.exec("SELECT COUNT(*) as count FROM karigars");
    const kCount = (kCountRes[0]?.values[0]?.[0] as number) || 0;
    if (kCount === 0) {
      const kStmt = this.db.prepare("INSERT INTO karigars (name, phone, role, wage_type, daily_wage) VALUES (?, ?, ?, ?, ?)");
      kStmt.run(['Ustad Rashid', '0312-3456789', 'CNC Router Master', 'DAILY', 2500]);
      kStmt.run(['Muhammad Akram', '0345-6789012', 'Wood Carver & Polish Mistri', 'DAILY', 1800]);
      kStmt.run(['Ali Raza (Helper)', '0333-1122334', 'Workshop Helper', 'DAILY', 1200]);
      kStmt.free();
    }

    // Check if users exist
    const uCountRes = this.db.exec("SELECT COUNT(*) as count FROM users");
    const uCount = (uCountRes[0]?.values[0]?.[0] as number) || 0;
    if (uCount === 0) {
      const uStmt = this.db.prepare(
        "INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)"
      );
      uStmt.run(['admin', 'admin', 'Muhammad Ahmad (Admin 1 / مالک)', 'ADMIN']);
      uStmt.run(['admin2', 'admin123', 'Partner (Admin 2 / پارٹنر)', 'ADMIN']);
      uStmt.free();
    }

    // Clean up any cashier user
    try {
      this.db.exec("DELETE FROM users WHERE username = 'cashier'");
    } catch (_) {}

    // Initialize sample stock for items if 0
    try {
      this.db.exec("UPDATE catalog_items SET stock_qty = 50, min_stock_alert = 10 WHERE category = 'HARDWARE' AND (stock_qty IS NULL OR stock_qty = 0)");
      this.db.exec("UPDATE catalog_items SET stock_qty = 8, min_stock_alert = 2 WHERE category = 'DOOR' AND (stock_qty IS NULL OR stock_qty = 0)");
    } catch (_) {}
  }

  public async persist(): Promise<void> {
    if (!this.db) return;
    const data = this.db.export();
    await saveToIndexedDB(DB_STORAGE_KEY, data);
  }

  private async checkAndCreateDailyBackup(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const backupKey = `${BACKUP_STORE_PREFIX}${today}`;
    const existing = await getFromIndexedDB(backupKey);
    if (!existing && this.db) {
      const data = this.db.export();
      await saveToIndexedDB(backupKey, data);
    }
  }

  private sanitizeParams(params: any[] = []): any[] {
    return (params || []).map((p) => (p === undefined ? null : p));
  }

  public query<T = any>(sql: string, params: any[] = []): T[] {
    if (!this.db) throw new Error('Database not initialized');
    const safeParams = this.sanitizeParams(params);
    const stmt = this.db.prepare(sql);
    if (safeParams && safeParams.length > 0) {
      stmt.bind(safeParams);
    }
    const results: T[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as T);
    }
    stmt.free();
    return results;
  }

  public queryOne<T = any>(sql: string, params: any[] = []): T | null {
    const rows = this.query<T>(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  public run(sql: string, params: any[] = []): { lastInsertRowid: number; changes: number } {
    if (!this.db) throw new Error('Database not initialized');
    const safeParams = this.sanitizeParams(params);
    this.db.run(sql, safeParams);
    const rowidRes = this.db.exec("SELECT last_insert_rowid(), changes()");
    const lastInsertRowid = (rowidRes[0]?.values[0]?.[0] as number) || 0;
    const changes = (rowidRes[0]?.values[0]?.[1] as number) || 0;
    
    // Automatically persist changes asynchronously
    this.persist().catch(err => console.error('Failed to persist DB:', err));
    return { lastInsertRowid, changes };
  }

  public exportDatabase(): Uint8Array {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.export();
  }

  public async importDatabase(data: Uint8Array): Promise<void> {
    const initSql = await getSqlJsFactory();
    const SQL = await initSql({
      locateFile: (file: string) => `/${file}`,
    });
    this.db = new SQL.Database(data);
    this.applySchema();
    await this.persist();
  }
}

export const dbService = new SQLiteService();
