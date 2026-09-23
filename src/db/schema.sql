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
