-- =============================================================================
-- AL MADINAH CNC & WOOD WORKS - COMPLETE SUPABASE POSTGRESQL SCHEMA
-- Project URL: https://anqzmsmknttmfqkgzihz.supabase.co
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/anqzmsmknttmfqkgzihz/sql/new
-- =============================================================================

-- Enable extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Shop Settings Master
CREATE TABLE IF NOT EXISTS shop_settings (
    id SERIAL PRIMARY KEY,
    shop_name TEXT NOT NULL DEFAULT 'AL MADINAH CNC AND WOOD WORKS',
    shop_name_urdu TEXT NOT NULL DEFAULT 'المدینہ سی این سی اینڈ ووڈ ورکس',
    owner_name TEXT NOT NULL DEFAULT 'Muhammad Ahmad',
    phone1 TEXT NOT NULL DEFAULT '0300-1234567',
    phone2 TEXT DEFAULT '',
    address TEXT NOT NULL DEFAULT 'Main Workshop Road, Wood Market',
    receipt_footer_urdu TEXT NOT NULL DEFAULT 'مال کٹا ہوا یا استعمال شدہ واپس نہیں ہوگا۔ شکریہ!',
    pin_enabled INTEGER DEFAULT 1,
    app_pin TEXT DEFAULT '1234',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. System Users & Admin Credentials
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT CHECK(role IN ('ADMIN', 'CASHIER', 'MANAGER')) DEFAULT 'ADMIN',
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Customers Master
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Catalog Items & Ready Stock
CREATE TABLE IF NOT EXISTS catalog_items (
    id SERIAL PRIMARY KEY,
    category TEXT NOT NULL CHECK(category IN ('DOOR', 'HARDWARE', 'SERVICE')),
    name TEXT NOT NULL,
    default_rate NUMERIC(12, 2) DEFAULT 0.0,
    stock_qty NUMERIC(12, 2) DEFAULT 0.0,
    min_stock_alert NUMERIC(12, 2) DEFAULT 5.0,
    is_active INTEGER DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Sales Invoices
CREATE TABLE IF NOT EXISTS sales_invoices (
    id SERIAL PRIMARY KEY,
    invoice_no TEXT UNIQUE NOT NULL,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_amount NUMERIC(12, 2) NOT NULL,
    discount_amount NUMERIC(12, 2) DEFAULT 0.0,
    cash_received NUMERIC(12, 2) NOT NULL,
    balance_amount NUMERIC(12, 2) NOT NULL,
    notes TEXT,
    is_void INTEGER DEFAULT 0,
    void_reason TEXT,
    voided_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Sales Invoice Items (line items with rate overrides)
CREATE TABLE IF NOT EXISTS sales_invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES sales_invoices(id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES catalog_items(id) ON DELETE SET NULL,
    item_name TEXT NOT NULL,
    quantity NUMERIC(12, 2) NOT NULL,
    rate NUMERIC(12, 2) NOT NULL,
    line_total NUMERIC(12, 2) NOT NULL
);

-- 7. CNC Job Register
CREATE TABLE IF NOT EXISTS cnc_jobs (
    id SERIAL PRIMARY KEY,
    job_no TEXT UNIQUE NOT NULL,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    customer_name_manual TEXT,
    job_description TEXT NOT NULL,
    size_specification TEXT,
    total_amount NUMERIC(12, 2) NOT NULL,
    paid_amount NUMERIC(12, 2) DEFAULT 0.0,
    remaining_amount NUMERIC(12, 2) NOT NULL,
    status TEXT CHECK(status IN ('Pending', 'In Progress', 'Completed')) DEFAULT 'Pending',
    notes TEXT,
    job_date DATE NOT NULL DEFAULT CURRENT_DATE,
    completed_at TIMESTAMPTZ,
    is_void INTEGER DEFAULT 0,
    void_reason TEXT,
    voided_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Customer Ledger (Single Source of Truth for Debt & Wasooli)
CREATE TABLE IF NOT EXISTS customer_ledger (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    ref_type TEXT NOT NULL CHECK(ref_type IN ('OPENING_BAL', 'SALE_INVOICE', 'CNC_JOB', 'WASOOLI', 'ADJUSTMENT')),
    ref_id INTEGER,
    description TEXT NOT NULL,
    debit NUMERIC(12, 2) DEFAULT 0.0,   -- Banam (Customer owes)
    credit NUMERIC(12, 2) DEFAULT 0.0,  -- Jama (Customer paid)
    is_void INTEGER DEFAULT 0,
    void_reason TEXT,
    original_entry_id INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Daily Expenses
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    payment_method TEXT DEFAULT 'CASH',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Suppliers Master
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    company_name TEXT,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Supplier Ledger
CREATE TABLE IF NOT EXISTS supplier_ledger (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    ref_type TEXT NOT NULL CHECK(ref_type IN ('OPENING_BAL', 'PURCHASE', 'PAYMENT', 'ADJUSTMENT')),
    description TEXT NOT NULL,
    bill_no TEXT,
    debit NUMERIC(12, 2) DEFAULT 0.0,   -- Payment made to vendor
    credit NUMERIC(12, 2) DEFAULT 0.0,  -- Purchase bill (we owe vendor)
    is_void INTEGER DEFAULT 0,
    void_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Inventory Transactions History
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL REFERENCES catalog_items(id) ON DELETE CASCADE,
    tx_date DATE NOT NULL DEFAULT CURRENT_DATE,
    tx_type TEXT NOT NULL CHECK(tx_type IN ('IN_PURCHASE', 'OUT_SALE', 'ADJUSTMENT')),
    quantity NUMERIC(12, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Karigar / Workshop Staff Master
CREATE TABLE IF NOT EXISTS karigars (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL,
    wage_type TEXT NOT NULL CHECK(wage_type IN ('DAILY', 'MONTHLY')) DEFAULT 'DAILY',
    daily_wage NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Karigar Attendance Log
CREATE TABLE IF NOT EXISTS karigar_attendance (
    id SERIAL PRIMARY KEY,
    karigar_id INTEGER NOT NULL REFERENCES karigars(id) ON DELETE CASCADE,
    att_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL CHECK(status IN ('PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE')),
    notes TEXT,
    UNIQUE(karigar_id, att_date)
);

-- 15. Karigar Wage & Advance Payments
CREATE TABLE IF NOT EXISTS karigar_payments (
    id SERIAL PRIMARY KEY,
    karigar_id INTEGER NOT NULL REFERENCES karigars(id) ON DELETE CASCADE,
    pay_date DATE NOT NULL DEFAULT CURRENT_DATE,
    pay_type TEXT NOT NULL CHECK(pay_type IN ('DAILY_WAGE', 'ADVANCE', 'MONTHLY_SALARY')),
    amount NUMERIC(12, 2) NOT NULL,
    notes TEXT,
    is_void INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Quotations (Kacha Estimates)
CREATE TABLE IF NOT EXISTS quotations (
    id SERIAL PRIMARY KEY,
    quote_no TEXT UNIQUE NOT NULL,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    quote_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE,
    total_amount NUMERIC(12, 2) NOT NULL,
    discount_amount NUMERIC(12, 2) DEFAULT 0.0,
    status TEXT CHECK(status IN ('PENDING', 'APPROVED', 'CONVERTED', 'EXPIRED', 'REJECTED')) DEFAULT 'PENDING',
    notes TEXT,
    converted_invoice_id INTEGER REFERENCES sales_invoices(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Quotation Items
CREATE TABLE IF NOT EXISTS quotation_items (
    id SERIAL PRIMARY KEY,
    quotation_id INTEGER NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES catalog_items(id) ON DELETE SET NULL,
    item_name TEXT NOT NULL,
    quantity NUMERIC(12, 2) NOT NULL,
    rate NUMERIC(12, 2) NOT NULL,
    line_total NUMERIC(12, 2) NOT NULL,
    notes TEXT
);

-- 18. Delivery Challans & Gate Passes
CREATE TABLE IF NOT EXISTS delivery_challans (
    id SERIAL PRIMARY KEY,
    challan_no TEXT UNIQUE NOT NULL,
    invoice_id INTEGER REFERENCES sales_invoices(id) ON DELETE SET NULL,
    cnc_job_id INTEGER REFERENCES cnc_jobs(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    destination_address TEXT,
    driver_name TEXT,
    driver_phone TEXT,
    vehicle_no TEXT,
    items_summary TEXT NOT NULL,
    total_bill_amount NUMERIC(12, 2) NOT NULL,
    advance_paid NUMERIC(12, 2) DEFAULT 0.0,
    cod_balance_due NUMERIC(12, 2) DEFAULT 0.0,
    status TEXT CHECK(status IN ('DISPATCHED', 'DELIVERED', 'RETURNED')) DEFAULT 'DISPATCHED',
    challan_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. Owner Drawings (Zati Kharcha)
CREATE TABLE IF NOT EXISTS owner_drawings (
    id SERIAL PRIMARY KEY,
    drawing_date DATE NOT NULL DEFAULT CURRENT_DATE,
    owner_name TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    source TEXT CHECK(source IN ('DRAWER', 'BANK')) DEFAULT 'DRAWER',
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) - ALLOW FRONTEND APP FULL ACCESS VIA ANON KEY
-- =============================================================================
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
        EXECUTE format('DROP POLICY IF EXISTS "Public full access policy" ON public.%I;', t);
        EXECUTE format('CREATE POLICY "Public full access policy" ON public.%I FOR ALL USING (true) WITH CHECK (true);', t);
    END LOOP;
END
$$;

-- =============================================================================
-- INITIAL SEED DATA
-- =============================================================================

-- Default Shop Settings
INSERT INTO shop_settings (id, shop_name, shop_name_urdu, owner_name, phone1, address)
VALUES (1, 'AL MADINAH CNC AND WOOD WORKS', 'المدینہ سی این سی اینڈ ووڈ ورکس', 'Muhammad Ahmad', '0300-1234567', 'Main Workshop Road, Wood Market')
ON CONFLICT (id) DO NOTHING;

-- Default Users
INSERT INTO users (username, password, full_name, role)
VALUES 
  ('admin', 'admin', 'Muhammad Ahmad (Owner)', 'ADMIN'),
  ('admin2', 'admin123', 'Ahmad Partner (Admin)', 'ADMIN')
ON CONFLICT (username) DO NOTHING;

-- Default Catalog Items
INSERT INTO catalog_items (category, name, default_rate, stock_qty, min_stock_alert, display_order)
VALUES
  ('DOOR', 'Wooden door', 18500, 10, 3, 1),
  ('DOOR', 'Fiber door', 8500, 15, 4, 2),
  ('DOOR', 'Pvc door', 6500, 20, 5, 3),
  ('DOOR', 'Upvc door', 11000, 8, 2, 4),
  ('DOOR', 'Hdx door', 9500, 12, 3, 5),
  ('DOOR', 'Hdf door', 8000, 14, 4, 6),
  ('DOOR', 'Mrx Door', 12500, 6, 2, 7),
  ('HARDWARE', 'Door handle lock big size', 2800, 25, 5, 10),
  ('HARDWARE', 'Door handle small size', 1650, 30, 5, 11),
  ('HARDWARE', 'Qabza 3”', 120, 100, 20, 12),
  ('HARDWARE', 'Qabza 4”', 180, 150, 20, 13),
  ('HARDWARE', 'Qabza 5”', 240, 80, 15, 14),
  ('HARDWARE', 'Chutki 8”', 220, 50, 10, 15),
  ('HARDWARE', 'Dastii', 350, 40, 10, 16),
  ('HARDWARE', 'Pvc door handle', 450, 60, 10, 17),
  ('HARDWARE', 'Screw 1”', 180, 200, 50, 18),
  ('HARDWARE', 'Screw 2”', 280, 200, 50, 19),
  ('HARDWARE', 'Screw 3”', 360, 150, 30, 20),
  ('HARDWARE', 'Door stoper', 250, 50, 10, 21),
  ('HARDWARE', 'Door Aral lock 8”', 1400, 20, 5, 22),
  ('SERVICE', 'Jali Cutting (Per Sqft)', 120, 0, 0, 30),
  ('SERVICE', '3D Door Relief Carving', 3500, 0, 0, 31)
ON CONFLICT DO NOTHING;
