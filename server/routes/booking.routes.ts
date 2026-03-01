import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { AuthRequest, requireAuth } from '../middleware/auth.js';

const router = Router();

// POST /api/bookings — book a member into a class
router.post('/', requireAuth, (req: AuthRequest, res: Response) => {
    const { classId, memberId, bookingDate } = req.body;

    if (!classId || !memberId || !bookingDate) {
        return res.status(400).json({ error: 'classId, memberId, and bookingDate are required' });
    }

    // Validate class exists and is active
    const cls = db.prepare('SELECT * FROM classes WHERE id = ? AND is_active = 1').get(classId) as any;
    if (!cls) return res.status(404).json({ error: 'Class not found or inactive' });

    // Validate member exists
    const member = db.prepare('SELECT * FROM members WHERE id = ?').get(memberId) as any;
    if (!member) return res.status(404).json({ error: 'Member not found' });

    // Check capacity
    const bookedCount = db.prepare(
        "SELECT COUNT(*) as count FROM class_bookings WHERE class_id = ? AND booking_date = ? AND status != 'cancelled'"
    ).get(classId, bookingDate) as any;

    if (bookedCount.count >= cls.max_capacity) {
        return res.status(400).json({ error: 'Class is full' });
    }

    // Check for duplicate booking
    const existing = db.prepare(
        'SELECT * FROM class_bookings WHERE class_id = ? AND member_id = ? AND booking_date = ?'
    ).get(classId, memberId, bookingDate) as any;

    if (existing) {
        if (existing.status === 'cancelled') {
            // Re-book cancelled booking
            db.prepare("UPDATE class_bookings SET status = 'booked', checked_in_at = NULL WHERE id = ?").run(existing.id);
            return res.json({ ...existing, status: 'booked' });
        }
        return res.status(409).json({ error: 'Already booked for this class on this date' });
    }

    const id = uuidv4();
    db.prepare(
        'INSERT INTO class_bookings (id, class_id, member_id, booking_date) VALUES (?, ?, ?, ?)'
    ).run(id, classId, memberId, bookingDate);

    db.prepare('INSERT INTO activity_log (type, description, member_id) VALUES (?, ?, ?)').run(
        'booking_created', `${member.name} booked "${cls.name}" for ${bookingDate}`, memberId
    );

    res.status(201).json({ id, classId, memberId, bookingDate, status: 'booked' });
});

// PUT /api/bookings/:id/cancel — cancel a booking
router.put('/:id/cancel', requireAuth, (req: AuthRequest, res: Response) => {
    const booking = db.prepare('SELECT * FROM class_bookings WHERE id = ?').get(req.params.id) as any;
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.status === 'cancelled') return res.status(400).json({ error: 'Already cancelled' });

    db.prepare("UPDATE class_bookings SET status = 'cancelled' WHERE id = ?").run(req.params.id);
    res.json({ message: 'Booking cancelled' });
});

// PUT /api/bookings/:id/checkin — check in via booking
router.put('/:id/checkin', requireAuth, (req: AuthRequest, res: Response) => {
    const booking = db.prepare(`
    SELECT cb.*, c.name as class_name, m.name as member_name
    FROM class_bookings cb
    JOIN classes c ON cb.class_id = c.id
    JOIN members m ON cb.member_id = m.id
    WHERE cb.id = ?
  `).get(req.params.id) as any;

    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.status === 'checked_in') return res.status(400).json({ error: 'Already checked in' });
    if (booking.status === 'cancelled') return res.status(400).json({ error: 'Booking is cancelled' });

    const now = new Date().toISOString();
    db.prepare("UPDATE class_bookings SET status = 'checked_in', checked_in_at = ? WHERE id = ?").run(now, req.params.id);

    // Also create attendance record
    const attId = uuidv4();
    db.prepare(
        'INSERT INTO attendance (id, member_id, check_in_time, method, class_id) VALUES (?, ?, ?, ?, ?)'
    ).run(attId, booking.member_id, now, 'booking', booking.class_id);

    db.prepare('INSERT INTO activity_log (type, description, member_id) VALUES (?, ?, ?)').run(
        'check_in', `${booking.member_name} checked in to "${booking.class_name}"`, booking.member_id
    );

    res.json({ message: 'Checked in', attendanceId: attId, checkedInAt: now });
});

// GET /api/bookings/member/:memberId — member's bookings
router.get('/member/:memberId', requireAuth, (req: AuthRequest, res: Response) => {
    const bookings = db.prepare(`
    SELECT cb.*, c.name as class_name, c.start_time, c.end_time
    FROM class_bookings cb
    JOIN classes c ON cb.class_id = c.id
    WHERE cb.member_id = ?
    ORDER BY cb.booking_date DESC, c.start_time ASC
  `).all(req.params.memberId);
    res.json(bookings);
});

export default router;
