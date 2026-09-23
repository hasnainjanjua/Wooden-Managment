import { dbService } from '../sqlite';
import { ShopSettings } from '../../types';

export const DEFAULT_SETTINGS: ShopSettings = {
  shop_name: 'Al Madinah CNC and Wood Works',
  urdu_title: 'المدینہ سی این سی اینڈ ووڈ ورکس',
  tagline: 'Wooden Doors, Hardware, Polish & CNC Jali Cutting',
  phone1: '0300-1234567',
  phone2: '0321-9876543',
  address: 'Main Timber Market, Workshop Road',
  receipt_footer: 'سامان چیک کر کے وصول کریں۔ خریدا ہوا مال واپس نہیں ہوگا۔',
  app_pin: '1234',
  pin_enabled: 1,
};

export const settingsRepo = {
  initTable(): void {
    dbService.run(`
      CREATE TABLE IF NOT EXISTS shop_settings (
        id INTEGER PRIMARY KEY,
        shop_name TEXT NOT NULL,
        urdu_title TEXT NOT NULL,
        tagline TEXT,
        phone1 TEXT,
        phone2 TEXT,
        address TEXT,
        receipt_footer TEXT,
        app_pin TEXT DEFAULT '1234',
        pin_enabled INTEGER DEFAULT 1
      )
    `);

    // Safely migrate existing databases if columns don't exist
    try {
      dbService.run("ALTER TABLE shop_settings ADD COLUMN app_pin TEXT DEFAULT '1234'");
    } catch (_) {}
    try {
      dbService.run("ALTER TABLE shop_settings ADD COLUMN pin_enabled INTEGER DEFAULT 1");
    } catch (_) {}

    const existing = dbService.queryOne('SELECT COUNT(*) as cnt FROM shop_settings');
    if ((existing?.cnt || 0) === 0) {
      dbService.run(
        `INSERT INTO shop_settings (id, shop_name, urdu_title, tagline, phone1, phone2, address, receipt_footer, app_pin, pin_enabled)
         VALUES (1, ?, ?, ?, ?, ?, ?, ?, '1234', 1)`,
        [
          DEFAULT_SETTINGS.shop_name,
          DEFAULT_SETTINGS.urdu_title,
          DEFAULT_SETTINGS.tagline,
          DEFAULT_SETTINGS.phone1,
          DEFAULT_SETTINGS.phone2,
          DEFAULT_SETTINGS.address,
          DEFAULT_SETTINGS.receipt_footer,
        ]
      );
    }
  },

  get(): ShopSettings {
    this.initTable();
    const row = dbService.queryOne<ShopSettings>('SELECT * FROM shop_settings WHERE id = 1');
    return {
      ...DEFAULT_SETTINGS,
      ...row,
      app_pin: row?.app_pin || '1234',
      pin_enabled: row?.pin_enabled !== undefined ? row.pin_enabled : 1,
    };
  },

  update(settings: ShopSettings): void {
    this.initTable();
    dbService.run(
      `UPDATE shop_settings SET 
        shop_name = ?, 
        urdu_title = ?, 
        tagline = ?, 
        phone1 = ?, 
        phone2 = ?, 
        address = ?, 
        receipt_footer = ?,
        app_pin = ?,
        pin_enabled = ?
       WHERE id = 1`,
      [
        settings.shop_name.trim(),
        settings.urdu_title.trim(),
        settings.tagline.trim(),
        settings.phone1.trim(),
        settings.phone2.trim(),
        settings.address.trim(),
        settings.receipt_footer.trim(),
        settings.app_pin?.trim() || '1234',
        settings.pin_enabled !== undefined ? settings.pin_enabled : 1,
      ]
    );
  },

  updatePin(pin: string, enabled = 1): void {
    this.initTable();
    dbService.run('UPDATE shop_settings SET app_pin = ?, pin_enabled = ? WHERE id = 1', [pin.trim(), enabled]);
  },
};
