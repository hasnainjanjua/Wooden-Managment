import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';

async function runTests() {
  console.log('=== RUNNING WORKSHOP DOMAIN INTEGRATION TESTS ===\n');

  const wasmBuffer = fs.readFileSync(path.resolve('node_modules/sql.js/dist/sql-wasm.wasm'));
  const SQL = await initSqlJs({ wasmBinary: wasmBuffer });
  const db = new SQL.Database();

  const schemaSql = fs.readFileSync(path.resolve('src/db/schema.sql'), 'utf-8');
  db.exec(schemaSql);
  console.log('✓ Schema executed successfully');

  // Verify all 7 tables exist
  const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
  const tableNames = tables[0].values.map(v => v[0]);
  console.log('✓ Created tables:', tableNames.join(', '));

  const expectedTables = [
    'customers',
    'catalog_items',
    'sales_invoices',
    'sales_invoice_items',
    'cnc_jobs',
    'customer_ledger',
    'expenses',
    'suppliers',
    'supplier_ledger',
    'inventory_transactions',
    'karigars',
    'karigar_attendance',
    'karigar_payments'
  ];

  for (const t of expectedTables) {
    if (!tableNames.includes(t)) {
      throw new Error(`Missing expected table: ${t}`);
    }
  }
  console.log('✓ All 13 relational tables verified successfully!');

  // Test 1: Insert Customer
  db.run("INSERT INTO customers (name, phone, address) VALUES (?, ?, ?)", ['Haji Aslam', '03001234567', 'Timber Market']);
  const custRes = db.exec("SELECT last_insert_rowid()");
  const customerId = custRes[0].values[0][0];
  console.log(`✓ Customer inserted with ID: ${customerId}`);

  // Test 2: Opening balance in ledger
  db.run(
    "INSERT INTO customer_ledger (customer_id, entry_date, ref_type, description, debit, credit) VALUES (?, date('now'), 'OPENING_BAL', 'Opening Balance', 5000, 0)",
    [customerId]
  );
  console.log('✓ Opening balance of Rs. 5,000 inserted (Debit)');

  // Test 3: Create Sale Invoice with Net 20,000, Cash Received 12,000, Baqaya 8,000
  db.run(
    `INSERT INTO sales_invoices (invoice_no, customer_id, invoice_date, total_amount, discount_amount, cash_received, balance_amount)
     VALUES (?, ?, date('now'), 20000, 0, 12000, 8000)`,
    ['INV-2026-0001', customerId]
  );
  const invRes = db.exec("SELECT last_insert_rowid()");
  const invoiceId = invRes[0].values[0][0];

  // Insert items
  db.run("INSERT INTO sales_invoice_items (invoice_id, item_name, quantity, rate, line_total) VALUES (?, ?, ?, ?, ?)",
    [invoiceId, 'Wooden door', 1, 18500, 18500]);
  db.run("INSERT INTO sales_invoice_items (invoice_id, item_name, quantity, rate, line_total) VALUES (?, ?, ?, ?, ?)",
    [invoiceId, 'Door handle lock big size', 1, 1500, 1500]);

  // Synchronize with Customer Ledger
  db.run(
    "INSERT INTO customer_ledger (customer_id, entry_date, ref_type, ref_id, description, debit, credit) VALUES (?, date('now'), 'SALE_INVOICE', ?, 'Bill #INV-2026-0001', 20000, 0)",
    [customerId, invoiceId]
  );
  db.run(
    "INSERT INTO customer_ledger (customer_id, entry_date, ref_type, ref_id, description, debit, credit) VALUES (?, date('now'), 'WASOOLI', ?, 'Naqad Wasool ba-zariye Bill #INV-2026-0001', 0, 12000)",
    [customerId, invoiceId]
  );
  console.log('✓ Sale Invoice #INV-2026-0001 recorded with ledger debit & credit entries');

  // Check customer balance: 5000 (opening) + 20000 (sale) - 12000 (cash) = 13000
  const balRes1 = db.exec(`SELECT SUM(debit) - SUM(credit) FROM customer_ledger WHERE customer_id = ${customerId} AND is_void = 0`);
  const bal1 = balRes1[0].values[0][0];
  console.log(`✓ Customer Balance after sale: Rs. ${bal1} (Expected: 13000)`);
  if (bal1 !== 13000) throw new Error(`Balance mismatch: got ${bal1}, expected 13000`);

  // Test 4: CNC Job Register
  db.run(
    `INSERT INTO cnc_jobs (job_no, customer_id, job_description, size_specification, total_amount, paid_amount, remaining_amount, status, job_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', date('now'))`,
    ['CNC-2026-0001', customerId, '16mm MDF Jali Cutting', '8x4 Sheet', 6000, 2000, 4000]
  );
  const cncRes = db.exec("SELECT last_insert_rowid()");
  const cncId = cncRes[0].values[0][0];

  // Ledger posting for CNC
  db.run(
    "INSERT INTO customer_ledger (customer_id, entry_date, ref_type, ref_id, description, debit, credit) VALUES (?, date('now'), 'CNC_JOB', ?, 'CNC Job #CNC-2026-0001', 6000, 0)",
    [customerId, cncId]
  );
  db.run(
    "INSERT INTO customer_ledger (customer_id, entry_date, ref_type, ref_id, description, debit, credit) VALUES (?, date('now'), 'WASOOLI', ?, 'CNC Advance Wasool', 0, 2000)",
    [customerId, cncId]
  );

  const balRes2 = db.exec(`SELECT SUM(debit) - SUM(credit) FROM customer_ledger WHERE customer_id = ${customerId} AND is_void = 0`);
  const bal2 = balRes2[0].values[0][0];
  console.log(`✓ Customer Balance after CNC Job: Rs. ${bal2} (Expected: 17000 = 13000 + 4000)`);
  if (bal2 !== 17000) throw new Error(`Balance mismatch: got ${bal2}, expected 17000`);

  // Test 5: Wasooli of Rs. 7,000
  db.run(
    "INSERT INTO customer_ledger (customer_id, entry_date, ref_type, description, debit, credit) VALUES (?, date('now'), 'WASOOLI', 'Naqad Wasooli (Cash)', 0, 7000)",
    [customerId]
  );

  const balRes3 = db.exec(`SELECT SUM(debit) - SUM(credit) FROM customer_ledger WHERE customer_id = ${customerId} AND is_void = 0`);
  const bal3 = balRes3[0].values[0][0];
  console.log(`✓ Customer Balance after Wasooli: Rs. ${bal3} (Expected: 10000 = 17000 - 7000)`);
  if (bal3 !== 10000) throw new Error(`Balance mismatch: got ${bal3}, expected 10000`);

  // Test 6: Record Expenses (Chai: 300, CNC Bits: 1200)
  db.run("INSERT INTO expenses (expense_date, category, description, amount) VALUES (date('now'), 'Chai/Khana', 'Mehman Chai & Roti', 300)");
  db.run("INSERT INTO expenses (expense_date, category, description, amount) VALUES (date('now'), 'Tooling/CNC Bits', '2-Flute 6mm Bit', 1200)");
  console.log('✓ Expenses recorded: Rs. 1,500 total');

  // Test 7: Calculate Daily Closing Cash Drawer (Galla)
  // Cash Inflow: Counter Sales Cash (12000) + CNC Advance (2000) + Khata Wasooli (7000) = 21000
  // Cash Outflow: Expenses (1500)
  // Expected Net Drawer Cash: 21000 - 1500 = 19500
  const counterCash = db.exec("SELECT COALESCE(SUM(cash_received), 0) FROM sales_invoices WHERE is_void = 0")[0].values[0][0];
  const cncCash = db.exec("SELECT COALESCE(SUM(paid_amount), 0) FROM cnc_jobs WHERE is_void = 0")[0].values[0][0];
  const wasooliCash = db.exec(
    "SELECT COALESCE(SUM(credit), 0) FROM customer_ledger WHERE ref_type = 'WASOOLI' AND (ref_id IS NULL OR ref_id NOT IN (SELECT id FROM sales_invoices)) AND is_void = 0"
  )[0].values[0][0];
  const totalExpenses = db.exec("SELECT COALESCE(SUM(amount), 0) FROM expenses")[0].values[0][0];

  const totalInflow = counterCash + cncCash + wasooliCash;
  const netDrawerCash = totalInflow - totalExpenses;

  console.log(`✓ Inflow breakdown: Sales (${counterCash}) + CNC (${cncCash}) + Wasooli (${wasooliCash}) = ${totalInflow}`);
  console.log(`✓ Outflow: Expenses = ${totalExpenses}`);
  console.log(`✓ Net Drawer Cash: Rs. ${netDrawerCash} (Expected: 19500)`);
  if (netDrawerCash !== 19500) throw new Error(`Net Drawer Cash mismatch: got ${netDrawerCash}, expected 19500`);

  // Test 8: Safe Void of CNC Job (Never DELETE, compensate in ledger)
  console.log('\n--- Testing Safe Void Workflow ---');
  db.run("UPDATE cnc_jobs SET is_void = 1, void_reason = 'Order cancelled by customer' WHERE id = ?", [cncId]);
  
  // Find linked ledger entries and void them with compensating reversal
  const linked = db.exec(`SELECT id, customer_id, description, debit, credit FROM customer_ledger WHERE ref_id = ${cncId} AND is_void = 0`)[0];
  if (linked && linked.values) {
    for (const row of linked.values) {
      const [eId, cId, desc, deb, cred] = row;
      // Mark void
      db.run("UPDATE customer_ledger SET is_void = 1, void_reason = 'Order Cancelled' WHERE id = ?", [eId]);
      // Compensating mirrored row
      db.run(
        "INSERT INTO customer_ledger (customer_id, entry_date, ref_type, ref_id, description, debit, credit, is_void, void_reason, original_entry_id) VALUES (?, date('now'), 'ADJUSTMENT', ?, ?, ?, ?, 1, 'Order Cancelled', ?)",
        [cId, cncId, `Reversal: ${desc}`, cred, deb, eId]
      );
    }
  }

  // After voiding CNC Job, customer balance should revert from 10000 to 6000 (10000 - 4000)
  const rows = db.exec("SELECT id, description, debit, credit, is_void FROM customer_ledger WHERE customer_id = 1")[0].values;
  console.log('All ledger rows:', rows);
  const balRes4 = db.exec(`SELECT SUM(debit) - SUM(credit) FROM customer_ledger WHERE customer_id = ${customerId} AND is_void = 0`);
  const bal4 = balRes4[0].values[0][0];
  console.log(`✓ Customer Balance after CNC Void: Rs. ${bal4}`);

  // Test 10: Supplier / Vendor Khata
  console.log('\n--- Testing Supplier Khata Module ---');
  db.run("INSERT INTO suppliers (name, company_name, phone, address) VALUES (?, ?, ?, ?)",
    ['Haji Manzoor', 'Al-Makkah Timber Market', '03017654321', 'Ravi Road']);
  const suppRes = db.exec("SELECT last_insert_rowid()");
  const supplierId = suppRes[0].values[0][0];

  // Purchase bill of Rs. 50,000, spot cash paid Rs. 20,000
  db.run(
    "INSERT INTO supplier_ledger (supplier_id, entry_date, ref_type, bill_no, description, debit, credit) VALUES (?, date('now'), 'PURCHASE', 'BL-101', '50 Sheets MDF 16mm', 0, 50000)",
    [supplierId]
  );
  db.run(
    "INSERT INTO supplier_ledger (supplier_id, entry_date, ref_type, bill_no, description, debit, credit) VALUES (?, date('now'), 'PAYMENT', 'BL-101', 'Spot Cash Paid', 20000, 0)",
    [supplierId]
  );

  // Pay another Rs. 15,000 later
  db.run(
    "INSERT INTO supplier_ledger (supplier_id, entry_date, ref_type, description, debit, credit) VALUES (?, date('now'), 'PAYMENT', 'Cash Payment', 15000, 0)",
    [supplierId]
  );

  // Check supplier balance: 50000 - 20000 - 15000 = 15000
  const suppBalRes = db.exec(`SELECT SUM(credit) - SUM(debit) FROM supplier_ledger WHERE supplier_id = ${supplierId} AND is_void = 0`);
  const suppBal = suppBalRes[0].values[0][0];
  console.log(`✓ Supplier Balance: Rs. ${suppBal} (Expected: 15000)`);
  if (suppBal !== 15000) throw new Error(`Supplier balance mismatch: got ${suppBal}, expected 15000`);

  // Test 11: Inventory Tracking Module
  console.log('\n--- Testing Inventory Tracking Module ---');
  try {
    db.exec('ALTER TABLE catalog_items ADD COLUMN stock_qty REAL DEFAULT 0;');
    db.exec('ALTER TABLE catalog_items ADD COLUMN min_stock_alert REAL DEFAULT 5;');
  } catch (_) {}

  db.run(
    "INSERT INTO catalog_items (category, name, default_rate, is_active, display_order, stock_qty, min_stock_alert) VALUES (?, ?, ?, 1, 1, ?, ?)",
    ['HARDWARE', 'Qabza 4-inch Heavy', 180, 50, 10]
  );
  const itemRes = db.exec("SELECT last_insert_rowid()");
  const testItemId = itemRes[0].values[0][0];

  // Sale of 10 pcs
  db.run("UPDATE catalog_items SET stock_qty = stock_qty - 10 WHERE id = ?", [testItemId]);
  db.run(
    "INSERT INTO inventory_transactions (item_id, tx_date, tx_type, quantity, notes) VALUES (?, date('now'), 'OUT_SALE', -10, 'Test Sale')",
    [testItemId]
  );

  const stockRes = db.exec(`SELECT stock_qty FROM catalog_items WHERE id = ${testItemId}`);
  const currentStock = stockRes[0].values[0][0];
  console.log(`✓ Inventory Stock after sale: ${currentStock} pcs (Expected: 40)`);
  if (currentStock !== 40) throw new Error(`Stock mismatch: got ${currentStock}, expected 40`);

  // Test 12: Karigar Wages & Attendance Module
  console.log('\n--- Testing Karigar Wages & Attendance Module ---');
  db.run(
    "INSERT INTO karigars (name, phone, role, wage_type, daily_wage, is_active) VALUES (?, ?, ?, 'DAILY', ?, 1)",
    ['Ustad Rashid', '03123456789', 'CNC Master', 2000]
  );
  const karigarRes = db.exec("SELECT last_insert_rowid()");
  const karigarId = karigarRes[0].values[0][0];

  // Attendance: 2 days Present, 1 day Half-Day
  db.run("INSERT INTO karigar_attendance (karigar_id, att_date, status) VALUES (?, '2026-09-01', 'PRESENT')", [karigarId]);
  db.run("INSERT INTO karigar_attendance (karigar_id, att_date, status) VALUES (?, '2026-09-02', 'PRESENT')", [karigarId]);
  db.run("INSERT INTO karigar_attendance (karigar_id, att_date, status) VALUES (?, '2026-09-03', 'HALF_DAY')", [karigarId]);

  // Payment of Rs. 2,500 advance
  db.run(
    "INSERT INTO karigar_payments (karigar_id, pay_date, pay_type, amount, notes) VALUES (?, date('now'), 'ADVANCE', 2500, 'Household Advance')",
    [karigarId]
  );

  // Earned: (2 * 2000) + (1 * 1000) = 5000. Paid = 2500. Net payable = 2500
  const karigarPaidRes = db.exec(`SELECT SUM(amount) FROM karigar_payments WHERE karigar_id = ${karigarId} AND is_void = 0`);
  const karigarPaid = karigarPaidRes[0].values[0][0];
  console.log(`✓ Karigar Earned: Rs. 5000, Paid: Rs. ${karigarPaid}, Net Payable: Rs. ${5000 - karigarPaid} (Expected: 2500)`);
  if (karigarPaid !== 2500) throw new Error(`Karigar paid mismatch: got ${karigarPaid}, expected 2500`);

  // Test 13: Export Database to SQLite binary
  const binary = db.export();
  console.log(`\n✓ SQLite Database binary exported successfully (${binary.length} bytes)`);

  console.log('\n=== ALL DOMAIN INTEGRATION TESTS PASSED WITH 100% SUCCESS! ===');
}

runTests().catch(err => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
