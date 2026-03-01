import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { createInvoiceForPayment } from './invoice.routes.js';

const router = Router();

// ═══ SPECIFIC ROUTES FIRST (before /:id param catch-all) ═══

// GET revenue summary
router.get('/summary', (req: Request, res: Response) => {
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;

    const totalRevenue = (db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM payments').get() as any).total;
    const thisMonthRevenue = (db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE strftime('%Y-%m', paid_at) = ?").get(thisMonth) as any).total;
    const lastMonthRevenue = (db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE strftime('%Y-%m', paid_at) = ?").get(lastMonthStr) as any).total;
    const totalPayments = (db.prepare('SELECT COUNT(*) as count FROM payments').get() as any).count;
    const thisMonthPayments = (db.prepare("SELECT COUNT(*) as count FROM payments WHERE strftime('%Y-%m', paid_at) = ?").get(thisMonth) as any).count;

    // Method breakdown
    const methods = db.prepare("SELECT method, COUNT(*) as count, SUM(amount) as total FROM payments GROUP BY method ORDER BY total DESC").all();

    res.json({ totalRevenue, thisMonthRevenue, lastMonthRevenue, totalPayments, thisMonthPayments, methods });
});

// GET all plans
router.get('/plans', (req: Request, res: Response) => {
    const plans = db.prepare('SELECT * FROM plans ORDER BY duration_months ASC').all();
    res.json(plans);
});

// POST create/update plan
router.post('/plans', (req: Request, res: Response) => {
    const { id, name, durationMonths, price } = req.body;
    const planId = id || uuidv4();

    db.prepare(
        'INSERT OR REPLACE INTO plans (id, name, duration_months, price) VALUES (?, ?, ?, ?)'
    ).run(planId, name, durationMonths, price);

    res.json({ id: planId, name, duration_months: durationMonths, price });
});

// DELETE plan
router.delete('/plans/:id', (req: Request, res: Response) => {
    db.prepare('DELETE FROM plans WHERE id = ?').run(req.params.id);
    res.status(204).send();
});

// ═══ PARAMETERIZED ROUTES ═══

// GET all payments (with optional member_id filter)
router.get('/', (req: Request, res: Response) => {
    const memberId = req.query.member_id as string;

    let query = `
    SELECT p.*, m.name as member_name, pl.name as plan_name
    FROM payments p
    LEFT JOIN members m ON p.member_id = m.id
    LEFT JOIN plans pl ON p.plan_id = pl.id
  `;
    const params: any[] = [];

    if (memberId) {
        query += ' WHERE p.member_id = ?';
        params.push(memberId);
    }

    query += ' ORDER BY p.paid_at DESC';

    const payments = db.prepare(query).all(...params);
    res.json(payments);
});

// POST record a new payment
router.post('/', (req: Request, res: Response) => {
    const { memberId, planId, amount, method, notes } = req.body;
    const id = uuidv4();

    // Record payment
    db.prepare(
        'INSERT INTO payments (id, member_id, plan_id, amount, method, notes) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, memberId, planId || null, amount, method || 'Cash', notes || '');

    // If a plan is selected, auto-extend the member's expiry date
    if (planId) {
        const plan = db.prepare('SELECT duration_months FROM plans WHERE id = ?').get(planId) as any;
        if (plan) {
            const member = db.prepare('SELECT expiry_date FROM members WHERE id = ?').get(memberId) as any;
            if (member) {
                const currentExpiry = new Date(member.expiry_date);
                const today = new Date();
                const baseDate = currentExpiry > today ? currentExpiry : today;
                baseDate.setMonth(baseDate.getMonth() + plan.duration_months);
                const newExpiry = baseDate.toISOString().split('T')[0];

                db.prepare('UPDATE members SET expiry_date = ? WHERE id = ?').run(newExpiry, memberId);
            }
        }
    }

    // Get member name for activity log
    const member = db.prepare('SELECT name FROM members WHERE id = ?').get(memberId) as any;

    // Log activity
    db.prepare(
        'INSERT INTO activity_log (type, description, member_id) VALUES (?, ?, ?)'
    ).run('payment_received', `Payment of ₹${amount} received from "${member?.name || 'Unknown'}"`, memberId);

    // Auto-generate invoice
    createInvoiceForPayment(id);

    const payment = db.prepare(`
    SELECT p.*, m.name as member_name, pl.name as plan_name
    FROM payments p
    LEFT JOIN members m ON p.member_id = m.id
    LEFT JOIN plans pl ON p.plan_id = pl.id
    WHERE p.id = ?
  `).get(id);

    res.status(201).json(payment);
});

// DELETE payment (must be AFTER specific routes like /summary and /plans)
router.delete('/:id', (req: Request, res: Response) => {
    db.prepare('DELETE FROM payments WHERE id = ?').run(req.params.id);
    res.status(204).send();
});

export default router;
