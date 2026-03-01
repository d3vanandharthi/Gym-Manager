import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { AuthRequest, requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/classes — list all active classes with trainer name
router.get('/', requireAuth, (req: AuthRequest, res: Response) => {
    const classes = db.prepare(`
    SELECT c.*, u.full_name as trainer_name
    FROM classes c
    LEFT JOIN users u ON c.trainer_id = u.id
    WHERE c.is_active = 1
    ORDER BY c.start_time ASC
  `).all();
    res.json(classes);
});

// GET /api/classes/today — classes for today with booking counts
router.get('/today', requireAuth, (req: AuthRequest, res: Response) => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[new Date().getDay()];
    const todayDate = new Date().toISOString().split('T')[0];

    const classes = db.prepare(`
    SELECT c.*, u.full_name as trainer_name,
      (SELECT COUNT(*) FROM class_bookings WHERE class_id = c.id AND booking_date = ? AND status != 'cancelled') as booked_count
    FROM classes c
    LEFT JOIN users u ON c.trainer_id = u.id
    WHERE c.is_active = 1 AND (c.day_of_week = ? OR c.day_of_week = 'daily')
    ORDER BY c.start_time ASC
  `).all(todayDate, today);
    res.json(classes);
});

// GET /api/classes/:id/schedule?date=YYYY-MM-DD — bookings for a class on a date
router.get('/:id/schedule', requireAuth, (req: AuthRequest, res: Response) => {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'date query param required' });

    const bookings = db.prepare(`
    SELECT cb.*, m.name as member_name, m.phone as member_phone
    FROM class_bookings cb
    JOIN members m ON cb.member_id = m.id
    WHERE cb.class_id = ? AND cb.booking_date = ?
    ORDER BY cb.created_at ASC
  `).all(req.params.id, date);

    const cls = db.prepare('SELECT * FROM classes WHERE id = ?').get(req.params.id) as any;
    res.json({ class: cls, bookings, booked: bookings.filter((b: any) => b.status !== 'cancelled').length });
});

// POST /api/classes — create class (admin+)
router.post('/', requireAuth, requireRole('owner', 'admin'), (req: AuthRequest, res: Response) => {
    const { name, trainerId, dayOfWeek, startTime, endTime, maxCapacity } = req.body;

    if (!name || !dayOfWeek || !startTime || !endTime) {
        return res.status(400).json({ error: 'Name, day, start time, and end time are required' });
    }

    if (startTime >= endTime) {
        return res.status(400).json({ error: 'End time must be after start time' });
    }

    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'daily'];
    if (!validDays.includes(dayOfWeek.toLowerCase())) {
        return res.status(400).json({ error: 'Invalid day of week' });
    }

    const id = uuidv4();
    db.prepare(
        'INSERT INTO classes (id, name, trainer_id, day_of_week, start_time, end_time, max_capacity) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(id, name, trainerId || null, dayOfWeek.toLowerCase(), startTime, endTime, maxCapacity || 30);

    db.prepare('INSERT INTO activity_log (type, description) VALUES (?, ?)').run(
        'class_created', `Class "${name}" created by ${req.user?.fullName}`
    );

    const created = db.prepare('SELECT c.*, u.full_name as trainer_name FROM classes c LEFT JOIN users u ON c.trainer_id = u.id WHERE c.id = ?').get(id);
    res.status(201).json(created);
});

// PUT /api/classes/:id — update (admin+)
router.put('/:id', requireAuth, requireRole('owner', 'admin'), (req: AuthRequest, res: Response) => {
    const existing = db.prepare('SELECT * FROM classes WHERE id = ?').get(req.params.id) as any;
    if (!existing) return res.status(404).json({ error: 'Class not found' });

    const { name, trainerId, dayOfWeek, startTime, endTime, maxCapacity } = req.body;

    if (startTime && endTime && startTime >= endTime) {
        return res.status(400).json({ error: 'End time must be after start time' });
    }

    db.prepare(
        'UPDATE classes SET name = ?, trainer_id = ?, day_of_week = ?, start_time = ?, end_time = ?, max_capacity = ? WHERE id = ?'
    ).run(
        name ?? existing.name,
        trainerId !== undefined ? trainerId : existing.trainer_id,
        (dayOfWeek || existing.day_of_week).toLowerCase(),
        startTime ?? existing.start_time,
        endTime ?? existing.end_time,
        maxCapacity ?? existing.max_capacity,
        req.params.id
    );

    const updated = db.prepare('SELECT c.*, u.full_name as trainer_name FROM classes c LEFT JOIN users u ON c.trainer_id = u.id WHERE c.id = ?').get(req.params.id);
    res.json(updated);
});

// DELETE /api/classes/:id — soft delete (admin+)
router.delete('/:id', requireAuth, requireRole('owner', 'admin'), (req: AuthRequest, res: Response) => {
    const existing = db.prepare('SELECT * FROM classes WHERE id = ?').get(req.params.id) as any;
    if (!existing) return res.status(404).json({ error: 'Class not found' });

    db.prepare('UPDATE classes SET is_active = 0 WHERE id = ?').run(req.params.id);
    res.json({ message: 'Class deactivated' });
});

export default router;
