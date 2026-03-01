import { Router, Request, Response } from 'express';
import db from '../db.js';

const router = Router();

// GET dashboard stats
router.get('/stats', (req: Request, res: Response) => {
    const today = new Date().toISOString().split('T')[0];

    const totalMembers = (db.prepare('SELECT COUNT(*) as count FROM members').get() as any).count;
    const activeMembers = (db.prepare('SELECT COUNT(*) as count FROM members WHERE expiry_date >= ?').get(today) as any).count;
    const expiredMembers = (db.prepare('SELECT COUNT(*) as count FROM members WHERE expiry_date < ?').get(today) as any).count;

    // Members expiring in the next 7 days
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    const expiringThisWeek = (db.prepare(
        'SELECT COUNT(*) as count FROM members WHERE expiry_date >= ? AND expiry_date <= ?'
    ).get(today, sevenDaysLater.toISOString().split('T')[0]) as any).count;

    // Monthly revenue (current month)
    const firstOfMonth = `${today.substring(0, 7)}-01`;
    const monthlyRevenue = (db.prepare(
        'SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE paid_at >= ?'
    ).get(firstOfMonth) as any).total;

    // Total revenue all time
    const totalRevenue = (db.prepare(
        'SELECT COALESCE(SUM(amount), 0) as total FROM payments'
    ).get() as any).total;

    res.json({
        totalMembers,
        activeMembers,
        expiredMembers,
        expiringThisWeek,
        monthlyRevenue,
        totalRevenue,
    });
});

// GET expiring soon members
router.get('/expiring', (req: Request, res: Response) => {
    const today = new Date().toISOString().split('T')[0];
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    const members = db.prepare(`
    SELECT id, name, phone, email, join_date as joinDate, expiry_date as expiryDate
    FROM members
    WHERE expiry_date >= ? AND expiry_date <= ?
    ORDER BY expiry_date ASC
  `).all(today, sevenDaysLater.toISOString().split('T')[0]);

    res.json(members);
});

// GET recent activity feed
router.get('/activity', (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 15;
    const activity = db.prepare(`
    SELECT al.*, m.name as member_name
    FROM activity_log al
    LEFT JOIN members m ON al.member_id = m.id
    ORDER BY al.created_at DESC
    LIMIT ?
  `).all(limit);
    res.json(activity);
});

// GET revenue chart data (last 12 months)
router.get('/revenue-chart', (req: Request, res: Response) => {
    const data = db.prepare(`
    SELECT 
      strftime('%Y-%m', paid_at) as month,
      SUM(amount) as revenue,
      COUNT(*) as payment_count
    FROM payments
    WHERE paid_at >= date('now', '-12 months')
    GROUP BY strftime('%Y-%m', paid_at)
    ORDER BY month ASC
  `).all();
    res.json(data);
});

export default router;
