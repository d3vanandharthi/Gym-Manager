import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { AuthRequest, requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// POST /api/checkin — quick check-in by member ID or phone
router.post('/', requireAuth, (req: AuthRequest, res: Response) => {
    const { memberId, phone } = req.body;

    let member: any;
    if (memberId) {
        member = db.prepare('SELECT * FROM members WHERE id = ?').get(memberId);
    } else if (phone) {
        member = db.prepare('SELECT * FROM members WHERE phone = ?').get(phone);
    } else {
        return res.status(400).json({ error: 'memberId or phone is required' });
    }

    if (!member) return res.status(404).json({ error: 'Member not found' });

    // Check for duplicate check-in today
    const today = new Date().toISOString().split('T')[0];
    const existing = db.prepare(
        "SELECT * FROM attendance WHERE member_id = ? AND date(check_in_time) = ? AND method != 'booking'"
    ).get(member.id, today) as any;

    if (existing) {
        return res.json({ message: 'Already checked in today', attendance: existing, duplicate: true });
    }

    const id = uuidv4();
    const now = new Date().toISOString();
    db.prepare(
        'INSERT INTO attendance (id, member_id, check_in_time, method) VALUES (?, ?, ?, ?)'
    ).run(id, member.id, now, 'manual');

    db.prepare('INSERT INTO activity_log (type, description, member_id) VALUES (?, ?, ?)').run(
        'check_in', `${member.name} checked in (manual)`, member.id
    );

    res.status(201).json({ id, memberId: member.id, memberName: member.name, checkInTime: now, method: 'manual' });
});

// POST /api/checkin/scan — QR scan check-in
router.post('/scan', requireAuth, (req: AuthRequest, res: Response) => {
    const { memberId } = req.body;
    if (!memberId) return res.status(400).json({ error: 'memberId is required' });

    const member = db.prepare('SELECT * FROM members WHERE id = ?').get(memberId) as any;
    if (!member) return res.status(404).json({ error: 'Member not found' });

    // Check for duplicate check-in today
    const today = new Date().toISOString().split('T')[0];
    const existing = db.prepare(
        "SELECT * FROM attendance WHERE member_id = ? AND date(check_in_time) = ? AND method = 'qr'"
    ).get(member.id, today) as any;

    if (existing) {
        return res.json({ message: 'Already checked in today via QR', memberName: member.name, duplicate: true });
    }

    const id = uuidv4();
    const now = new Date().toISOString();
    db.prepare(
        'INSERT INTO attendance (id, member_id, check_in_time, method) VALUES (?, ?, ?, ?)'
    ).run(id, member.id, now, 'qr');

    db.prepare('INSERT INTO activity_log (type, description, member_id) VALUES (?, ?, ?)').run(
        'check_in', `${member.name} checked in via QR`, member.id
    );

    // Check membership status
    const isExpired = new Date(member.expiry_date) < new Date();

    res.status(201).json({
        id, memberId: member.id, memberName: member.name,
        checkInTime: now, method: 'qr',
        membershipStatus: isExpired ? 'expired' : 'active',
        expiryDate: member.expiry_date,
    });
});

// GET /api/checkin/qr/:memberId — get QR data for a member
router.get('/qr/:memberId', requireAuth, (req: AuthRequest, res: Response) => {
    const member = db.prepare('SELECT id, name FROM members WHERE id = ?').get(req.params.memberId) as any;
    if (!member) return res.status(404).json({ error: 'Member not found' });

    // Return QR data (member ID + name) — frontend generates the QR code image
    res.json({ qrData: JSON.stringify({ memberId: member.id, name: member.name }), member });
});

// GET /api/attendance — list attendance (admin+)
router.get('/attendance', requireAuth, (req: AuthRequest, res: Response) => {
    const { date, memberId, classId, limit } = req.query;

    let sql = `
    SELECT a.*, m.name as member_name, m.phone as member_phone,
      c.name as class_name
    FROM attendance a
    JOIN members m ON a.member_id = m.id
    LEFT JOIN classes c ON a.class_id = c.id
    WHERE 1=1
  `;
    const params: any[] = [];

    if (date) { sql += ' AND date(a.check_in_time) = ?'; params.push(date); }
    if (memberId) { sql += ' AND a.member_id = ?'; params.push(memberId); }
    if (classId) { sql += ' AND a.class_id = ?'; params.push(classId); }

    sql += ' ORDER BY a.check_in_time DESC';
    if (limit) { sql += ' LIMIT ?'; params.push(Number(limit)); }

    const records = db.prepare(sql).all(...params);
    res.json(records);
});

// GET /api/attendance/today-count — today's check-in count
router.get('/attendance/today-count', requireAuth, (req: AuthRequest, res: Response) => {
    const today = new Date().toISOString().split('T')[0];
    const count = db.prepare(
        'SELECT COUNT(DISTINCT member_id) as count FROM attendance WHERE date(check_in_time) = ?'
    ).get(today) as any;
    res.json({ count: count.count });
});

// GET /api/attendance/stats — attendance stats
router.get('/attendance/stats', requireAuth, requireRole('owner', 'admin'), (req: AuthRequest, res: Response) => {
    const today = new Date().toISOString().split('T')[0];

    // Today's check-ins
    const todayCount = db.prepare(
        'SELECT COUNT(DISTINCT member_id) as count FROM attendance WHERE date(check_in_time) = ?'
    ).get(today) as any;

    // This week's average
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const weekData = db.prepare(`
    SELECT date(check_in_time) as day, COUNT(DISTINCT member_id) as count
    FROM attendance WHERE date(check_in_time) >= ?
    GROUP BY date(check_in_time)
  `).all(weekAgo) as any[];
    const avgDaily = weekData.length > 0 ? Math.round(weekData.reduce((s: number, d: any) => s + d.count, 0) / weekData.length) : 0;

    // Peak hours
    const peakHours = db.prepare(`
    SELECT CAST(strftime('%H', check_in_time) AS INTEGER) as hour, COUNT(*) as count
    FROM attendance GROUP BY hour ORDER BY count DESC LIMIT 3
  `).all();

    // Most attended classes
    const topClasses = db.prepare(`
    SELECT c.name, COUNT(*) as count
    FROM attendance a JOIN classes c ON a.class_id = c.id
    GROUP BY a.class_id ORDER BY count DESC LIMIT 5
  `).all();

    res.json({ todayCount: todayCount.count, avgDaily, peakHours, topClasses });
});

export default router;
