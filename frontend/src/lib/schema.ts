import { getDb } from './db';

export async function initDb() {
  const db = getDb();

  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS employees (
      emp_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      pan TEXT UNIQUE,
      bank_account TEXT,
      ifsc TEXT,
      state TEXT DEFAULT 'Maharashtra',
      date_of_joining TEXT,
      annual_ctc REAL,
      monthly_gross REAL,
      tax_regime TEXT DEFAULT 'NEW',
      role TEXT,
      designation TEXT,
      department TEXT,
      address TEXT,
      manager_name TEXT,
      roles_responsibilities TEXT,
      employee_type TEXT DEFAULT 'EM',
      end_date TEXT,
      no_ctc INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS salary_history (
      history_id INTEGER PRIMARY KEY AUTOINCREMENT,
      emp_id TEXT NOT NULL,
      change_type TEXT NOT NULL,
      old_salary REAL,
      new_salary REAL,
      old_designation TEXT,
      new_designation TEXT,
      old_role TEXT,
      new_role TEXT,
      reason TEXT,
      effective_date TEXT,
      created_by TEXT,
      created_at TEXT,
      FOREIGN KEY (emp_id) REFERENCES employees(emp_id)
    );

    CREATE TABLE IF NOT EXISTS payroll_runs (
      run_id INTEGER PRIMARY KEY AUTOINCREMENT,
      emp_id TEXT,
      month TEXT,
      annual_ctc REAL,
      monthly_gross REAL,
      lop_days REAL DEFAULT 0,
      lop_deduction REAL DEFAULT 0,
      bonus_amount REAL DEFAULT 0,
      adjusted_gross REAL,
      pt REAL,
      tds REAL,
      pf REAL,
      esic REAL,
      net_pay REAL,
      status TEXT DEFAULT 'DRAFT',
      pf_applicable INTEGER,
      esic_applicable INTEGER,
      created_at TEXT,
      FOREIGN KEY (emp_id) REFERENCES employees(emp_id)
    );

    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    INSERT OR IGNORE INTO config VALUES ('pf_enabled', '0');
    INSERT OR IGNORE INTO config VALUES ('esic_enabled', '0');
    INSERT OR IGNORE INTO config VALUES ('company_name', 'Newrro Tech LLP');
  `);

  // Run migrations for older schemas
  const migrations = [
    { column: 'employee_type', type: "TEXT DEFAULT 'EM'" },
    { column: 'end_date', type: 'TEXT' },
    { column: 'no_ctc', type: 'INTEGER DEFAULT 0' },
    { column: 'email', type: 'TEXT' },
    { column: 'phone', type: 'TEXT' },
    { column: 'role', type: 'TEXT' },
    { column: 'designation', type: 'TEXT' },
    { column: 'department', type: 'TEXT' },
    { column: 'address', type: 'TEXT' },
    { column: 'manager_name', type: 'TEXT' },
    { column: 'roles_responsibilities', type: 'TEXT' },
    { column: 'created_at', type: 'TEXT' },
    { column: 'updated_at', type: 'TEXT' },
  ];

  for (const { column, type } of migrations) {
    try {
      await db.execute(`ALTER TABLE employees ADD COLUMN ${column} ${type}`);
    } catch {
      // Column already exists
    }
  }

  // Migrations for payroll_runs table
  const payrollMigrations = [
    { column: 'lop_days', type: 'REAL DEFAULT 0' },
    { column: 'lop_deduction', type: 'REAL DEFAULT 0' },
    { column: 'lop_reason', type: 'TEXT' },
    { column: 'bonus_amount', type: 'REAL DEFAULT 0' },
    { column: 'bonus_reason', type: 'TEXT' },
    { column: 'adjusted_gross', type: 'REAL' },
  ];

  // Create pending_candidates table
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS pending_candidates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      position TEXT NOT NULL,
      department TEXT,
      joining_date TEXT,
      end_date TEXT,
      annual_ctc REAL,
      reporting_to TEXT,
      responsibilities TEXT,
      employee_type TEXT DEFAULT 'EM',
      created_at TEXT,
      status TEXT DEFAULT 'pending',
      -- Fields to be filled when accepting
      pan TEXT,
      bank_account TEXT,
      ifsc TEXT,
      state TEXT DEFAULT 'Maharashtra',
      role TEXT,
      designation TEXT,
      manager_name TEXT,
      roles_responsibilities TEXT,
      no_ctc INTEGER DEFAULT 0
    );
  `);

  // Migrations for pending_candidates table
  const pendingMigrations = [
    { column: 'end_date', type: 'TEXT' },
  ];

  for (const { column, type } of pendingMigrations) {
    try {
      await db.execute(`ALTER TABLE pending_candidates ADD COLUMN ${column} ${type}`);
    } catch {
      // Column already exists
    }
  }

  for (const { column, type } of payrollMigrations) {
    try {
      await db.execute(`ALTER TABLE payroll_runs ADD COLUMN ${column} ${type}`);
    } catch {
      // Column already exists
    }
  }
}
