import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../../gym.db');

export function runPhase7Tests() {
    console.log('--- Running Phase 7 Invoice Tests ---');
    let passed = 0;
    let failed = 0;

    function assert(condition: boolean, message: string) {
        if (condition) {
            console.log(`✅ PASS: ${message}`);
            passed++;
        } else {
            console.error(`❌ FAIL: ${message}`);
            failed++;
        }
    }

    try {
        // 1. Check if invoices table exists
        const invoicesTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='invoices'").get();
        assert(!!invoicesTable, 'invoices table exists');

        // 2. Check if invoice_settings table exists
        const settingsTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='invoice_settings'").get();
        assert(!!settingsTable, 'invoice_settings table exists');

        // 3. Verify member schema updates
        const memberCols = db.prepare("PRAGMA table_info(members)").all() as any[];
        const colNames = memberCols.map(c => c.name);
        assert(colNames.includes('address'), 'members table has address column');
        assert(colNames.includes('emergency_contact'), 'members table has emergency_contact column');
        assert(colNames.includes('gender'), 'members table has gender column');
        assert(colNames.includes('blood_group'), 'members table has blood_group column');

        // 4. Test invoice auto-generation logic
        // Create a mock user, plan, and payment
        db.prepare("INSERT INTO members (id, name, phone, email, dob, join_date, expiry_date, created_at) VALUES ('test_member_1', 'Test Member', '1234567890', 'test@test.com', '1990-01-01', '2023-01-01', '2024-01-01', '2023-01-01')").run();
        db.prepare("INSERT INTO plans (id, name, duration_months, price) VALUES ('test_plan_1', 'Monthly Plan', 1, 1500)").run();

        // Ensure invoice settings are seeded
        const settingsCount = db.prepare("SELECT COUNT(*) as count FROM invoice_settings").get() as any;
        if (settingsCount.count === 0) {
            db.prepare("INSERT INTO invoice_settings (key, value) VALUES ('gym_name', 'Gym Manager')").run();
            db.prepare("INSERT INTO invoice_settings (key, value) VALUES ('gym_address', '')").run();
            db.prepare("INSERT INTO invoice_settings (key, value) VALUES ('gym_gstin', '')").run();
            db.prepare("INSERT INTO invoice_settings (key, value) VALUES ('gst_enabled', 'true')").run();
            db.prepare("INSERT INTO invoice_settings (key, value) VALUES ('gst_rate', '18')").run();
            db.prepare("INSERT INTO invoice_settings (key, value) VALUES ('next_invoice_number', '1')").run();
        }

        // Instead of using the express routes, simulate the logic inside the database
        // The payment route calls createInvoiceForPayment directly
        const { createInvoiceForPayment } = await import('../routes/invoice.routes.js');

        db.prepare("INSERT INTO payments (id, member_id, plan_id, amount, method, date) VALUES ('test_payment_1', 'test_member_1', 'test_plan_1', 1500, 'Cash', '2023-01-01')").run();

        const generatedInvoice = createInvoiceForPayment('test_payment_1');
        assert(generatedInvoice !== null, 'creating invoice for payment returns an invoice object');
        assert(generatedInvoice.total === 1500, 'invoice total matches payment amount');
        assert(generatedInvoice.subtotal < 1500, 'invoice subtotal is calculated correctly (GST back-calc)');
        assert(generatedInvoice.invoice_number.startsWith('INV-'), 'invoice number format is correct');
        assert(generatedInvoice.method === 'Cash', 'invoice method matches payment');

        // 5. Check if invoice can be retrieved from db
        const savedInvoice = db.prepare("SELECT * FROM invoices WHERE id = ?").get(generatedInvoice.id) as any;
        assert(savedInvoice !== undefined, 'invoice was saved to database');
        assert(savedInvoice.member_name === 'Test Member', 'invoice captured member name correctly');

        // Cleanup mock data
        db.prepare("DELETE FROM invoices WHERE id = ?").run(generatedInvoice.id);
        db.prepare("DELETE FROM payments WHERE id = 'test_payment_1'").run();
        db.prepare("DELETE FROM plans WHERE id = 'test_plan_1'").run();
        db.prepare("DELETE FROM members WHERE id = 'test_member_1'").run();

    } catch (err: any) {
        console.error('Test error:', err);
        assert(false, `Test execution failed: ${err.message}`);
    }

    console.log(`\nPhase 7 Results: ${passed} passed, ${failed} failed`);
    if (failed > 0) {
        console.error('Some Phase 7 tests failed.');
        process.exit(1);
    } else {
        console.log('All Phase 7 tests passed successfully!');
    }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runPhase7Tests();
}
