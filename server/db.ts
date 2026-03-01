import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const DB_PATH = path.join(ROOT_DIR, 'gym_manager.db');
const DATA_FILE = path.join(ROOT_DIR, 'data.json');

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT DEFAULT '',
    dob TEXT DEFAULT '',
    join_date TEXT NOT NULL,
    expiry_date TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    duration_months INTEGER NOT NULL,
    price REAL NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    plan_id TEXT REFERENCES plans(id),
    amount REAL NOT NULL,
    method TEXT NOT NULL DEFAULT 'Cash',
    paid_at TEXT DEFAULT (datetime('now')),
    notes TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS message_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS message_log (
    id TEXT PRIMARY KEY,
    member_id TEXT REFERENCES members(id) ON DELETE SET NULL,
    phone TEXT NOT NULL,
    template_id TEXT REFERENCES message_templates(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'sent',
    sent_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    member_id TEXT REFERENCES members(id) ON DELETE SET NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'staff',
    phone TEXT DEFAULT '',
    email TEXT DEFAULT '',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS classes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    trainer_id TEXT REFERENCES users(id),
    day_of_week TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    max_capacity INTEGER DEFAULT 30,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS class_bookings (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    booking_date TEXT NOT NULL,
    status TEXT DEFAULT 'booked',
    checked_in_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(class_id, member_id, booking_date)
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id TEXT PRIMARY KEY,
    member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    check_in_time TEXT DEFAULT (datetime('now')),
    check_out_time TEXT,
    method TEXT DEFAULT 'manual',
    class_id TEXT REFERENCES classes(id),
    notes TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    invoice_number TEXT UNIQUE NOT NULL,
    payment_id TEXT NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    member_name TEXT NOT NULL,
    member_phone TEXT DEFAULT '',
    member_email TEXT DEFAULT '',
    plan_name TEXT DEFAULT '',
    subtotal REAL NOT NULL,
    gst_rate REAL DEFAULT 18.0,
    gst_amount REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL,
    method TEXT DEFAULT 'Cash',
    notes TEXT DEFAULT '',
    gym_name TEXT DEFAULT 'Gym Manager',
    gym_address TEXT DEFAULT '',
    gym_gstin TEXT DEFAULT '',
    issued_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS invoice_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// Migration: add new member fields if they don't exist
const memberColumns = db.prepare("PRAGMA table_info(members)").all() as any[];
const colNames = memberColumns.map((c: any) => c.name);
if (!colNames.includes('address')) db.exec("ALTER TABLE members ADD COLUMN address TEXT DEFAULT ''");
if (!colNames.includes('emergency_contact')) db.exec("ALTER TABLE members ADD COLUMN emergency_contact TEXT DEFAULT ''");
if (!colNames.includes('emergency_phone')) db.exec("ALTER TABLE members ADD COLUMN emergency_phone TEXT DEFAULT ''");
if (!colNames.includes('gender')) db.exec("ALTER TABLE members ADD COLUMN gender TEXT DEFAULT ''");
if (!colNames.includes('blood_group')) db.exec("ALTER TABLE members ADD COLUMN blood_group TEXT DEFAULT ''");

// Seed invoice settings
const invSettingsCount = db.prepare('SELECT COUNT(*) as count FROM invoice_settings').get() as any;
if (invSettingsCount.count === 0) {
  db.prepare("INSERT INTO invoice_settings (key, value) VALUES ('gym_name', 'Gym Manager')").run();
  db.prepare("INSERT INTO invoice_settings (key, value) VALUES ('gym_address', '')").run();
  db.prepare("INSERT INTO invoice_settings (key, value) VALUES ('gym_gstin', '')").run();
  db.prepare("INSERT INTO invoice_settings (key, value) VALUES ('gst_enabled', 'true')").run();
  db.prepare("INSERT INTO invoice_settings (key, value) VALUES ('gst_rate', '18')").run();
  db.prepare("INSERT INTO invoice_settings (key, value) VALUES ('next_invoice_number', '1')").run();
}

// Seed default owner if no users exist
import bcrypt from 'bcryptjs';
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
if (userCount.count === 0) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare(
    'INSERT INTO users (id, username, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)'
  ).run('user-owner', 'admin', hash, 'Gym Owner', 'owner');
  console.log('Default owner user created: admin / admin123');
}

// Seed default plans if none exist
const planCount = db.prepare('SELECT COUNT(*) as count FROM plans').get() as any;
if (planCount.count === 0) {
  const insertPlan = db.prepare('INSERT INTO plans (id, name, duration_months, price) VALUES (?, ?, ?, ?)');
  insertPlan.run('plan-monthly', 'Monthly', 1, 500);
  insertPlan.run('plan-quarterly', 'Quarterly', 3, 1200);
  insertPlan.run('plan-half-yearly', 'Half Yearly', 6, 2200);
  insertPlan.run('plan-yearly', 'Yearly', 12, 4000);
}

// Seed default message templates if none exist
const templateCount = db.prepare('SELECT COUNT(*) as count FROM message_templates').get() as any;
if (templateCount.count === 0) {
  const insertTemplate = db.prepare('INSERT INTO message_templates (id, name, content) VALUES (?, ?, ?)');
  insertTemplate.run('tpl-expiry', 'Expiry Reminder', 'Hello {name}, your gym membership expired on {expiry_date}. Please renew it to continue enjoying our services.');
  insertTemplate.run('tpl-welcome', 'Welcome Message', 'Welcome to the gym, {name}! Your membership is active until {expiry_date}. Stay fit! 💪');
  insertTemplate.run('tpl-birthday', 'Birthday Wish', 'Happy Birthday, {name}! 🎂 Wishing you a fantastic year of health and fitness!');
}

// Migrate data from data.json if it exists and members table is empty
const memberCount = db.prepare('SELECT COUNT(*) as count FROM members').get() as any;
if (memberCount.count === 0 && fs.existsSync(DATA_FILE)) {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const data = JSON.parse(raw);
    if (data.members && data.members.length > 0) {
      const insertMember = db.prepare(
        'INSERT OR IGNORE INTO members (id, name, phone, email, join_date, expiry_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      );
      const insertMany = db.transaction((members: any[]) => {
        for (const m of members) {
          insertMember.run(m.id, m.name, m.phone, m.email || '', m.joinDate, m.expiryDate, m.createdAt || new Date().toISOString());
        }
      });
      insertMany(data.members);
      console.log(`Migrated ${data.members.length} members from data.json to SQLite`);
    }
  } catch (err) {
    console.error('Failed to migrate data.json:', err);
  }
}

export default db;
