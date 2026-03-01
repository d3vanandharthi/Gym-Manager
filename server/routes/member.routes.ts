import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';

const router = Router();

// GET all members
router.get('/', (req: Request, res: Response) => {
    const members = db.prepare(`
    SELECT id, name, phone, email, dob, join_date as joinDate, expiry_date as expiryDate, 
           address, emergency_contact as emergencyContact, emergency_phone as emergencyPhone, gender, blood_group as bloodGroup, created_at as createdAt
    FROM members ORDER BY created_at DESC
  `).all();
    res.json(members);
});

// GET single member
router.get('/:id', (req: Request, res: Response) => {
    const member = db.prepare(`
    SELECT id, name, phone, email, dob, join_date as joinDate, expiry_date as expiryDate,
           address, emergency_contact as emergencyContact, emergency_phone as emergencyPhone, gender, blood_group as bloodGroup, created_at as createdAt
    FROM members WHERE id = ?
  `).get(req.params.id);
    if (member) {
        res.json(member);
    } else {
        res.status(404).json({ error: 'Member not found' });
    }
});

// POST create member
router.post('/', (req: Request, res: Response) => {
    const { name, phone, email, dob, joinDate, expiryDate, address, emergencyContact, emergencyPhone, gender, bloodGroup } = req.body;
    const id = uuidv4();
    const createdAt = new Date().toISOString();

    db.prepare(
        'INSERT INTO members (id, name, phone, email, dob, join_date, expiry_date, address, emergency_contact, emergency_phone, gender, blood_group, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(id, name, phone, email || '', dob || '', joinDate, expiryDate, address || '', emergencyContact || '', emergencyPhone || '', gender || '', bloodGroup || '', createdAt);

    // Log activity
    db.prepare(
        'INSERT INTO activity_log (type, description, member_id) VALUES (?, ?, ?)'
    ).run('member_added', `New member "${name}" joined`, id);

    res.status(201).json({ id, name, phone, email, dob, joinDate, expiryDate, address, emergencyContact, emergencyPhone, gender, bloodGroup, createdAt });
});

// PUT update member
router.put('/:id', (req: Request, res: Response) => {
    const { name, phone, email, dob, joinDate, expiryDate, address, emergencyContact, emergencyPhone, gender, bloodGroup } = req.body;
    const existing = db.prepare('SELECT * FROM members WHERE id = ?').get(req.params.id);
    if (!existing) {
        return res.status(404).json({ error: 'Member not found' });
    }

    db.prepare(
        'UPDATE members SET name = ?, phone = ?, email = ?, dob = ?, join_date = ?, expiry_date = ?, address = ?, emergency_contact = ?, emergency_phone = ?, gender = ?, blood_group = ? WHERE id = ?'
    ).run(
        name ?? (existing as any).name,
        phone ?? (existing as any).phone,
        email ?? (existing as any).email,
        dob ?? (existing as any).dob,
        joinDate ?? (existing as any).join_date,
        expiryDate ?? (existing as any).expiry_date,
        address ?? (existing as any).address,
        emergencyContact ?? (existing as any).emergency_contact,
        emergencyPhone ?? (existing as any).emergency_phone,
        gender ?? (existing as any).gender,
        bloodGroup ?? (existing as any).blood_group,
        req.params.id
    );

    const updated = db.prepare(`
    SELECT id, name, phone, email, dob, join_date as joinDate, expiry_date as expiryDate,
           address, emergency_contact as emergencyContact, emergency_phone as emergencyPhone, gender, blood_group as bloodGroup, created_at as createdAt
    FROM members WHERE id = ?
  `).get(req.params.id);

    res.json(updated);
});

// DELETE member
router.delete('/:id', (req: Request, res: Response) => {
    const existing = db.prepare('SELECT name FROM members WHERE id = ?').get(req.params.id) as any;
    if (existing) {
        db.prepare('DELETE FROM members WHERE id = ?').run(req.params.id);
        db.prepare(
            'INSERT INTO activity_log (type, description) VALUES (?, ?)'
        ).run('member_deleted', `Member "${existing.name}" was removed`);
    }
    res.status(204).send();
});

export default router;
