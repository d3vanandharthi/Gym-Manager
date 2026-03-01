import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { AuthRequest, requireAuth, requireRole, signToken } from '../middleware/auth.js';

const router = Router();

// POST /api/login — public
router.post('/login', (req: AuthRequest, res: Response) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = db.prepare(
        'SELECT id, username, password_hash, full_name, role, is_active FROM users WHERE username = ?'
    ).get(username) as any;

    if (!user) {
        return res.status(401).json({ error: 'Invalid username or password' });
    }

    if (!user.is_active) {
        return res.status(403).json({ error: 'Account is deactivated. Contact the gym owner.' });
    }

    if (!bcrypt.compareSync(password, user.password_hash)) {
        return res.status(401).json({ error: 'Invalid username or password' });
    }

    const tokenPayload = { id: user.id, username: user.username, role: user.role, fullName: user.full_name };
    const token = signToken(tokenPayload);

    res.json({
        token,
        user: { id: user.id, username: user.username, fullName: user.full_name, role: user.role }
    });
});

// GET /api/users — owner/admin only
router.get('/users', requireAuth, requireRole('owner', 'admin'), (req: AuthRequest, res: Response) => {
    const users = db.prepare(
        'SELECT id, username, full_name, role, phone, email, is_active, created_at FROM users ORDER BY created_at DESC'
    ).all();
    res.json(users);
});

// POST /api/users — owner/admin: register new staff/trainer
router.post('/users', requireAuth, requireRole('owner', 'admin'), (req: AuthRequest, res: Response) => {
    const { username, password, fullName, role, phone, email } = req.body;

    if (!username || !password || !fullName) {
        return res.status(400).json({ error: 'Username, password, and full name are required' });
    }

    const validRoles = ['admin', 'trainer', 'staff'];
    if (role && !validRoles.includes(role)) {
        return res.status(400).json({ error: 'Role must be admin, trainer, or staff' });
    }

    // Only owner can create admin users
    if (role === 'admin' && req.user?.role !== 'owner') {
        return res.status(403).json({ error: 'Only the owner can create admin accounts' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
        return res.status(409).json({ error: 'Username already taken' });
    }

    const id = uuidv4();
    const hash = bcrypt.hashSync(password, 10);

    db.prepare(
        'INSERT INTO users (id, username, password_hash, full_name, role, phone, email) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(id, username, hash, fullName, role || 'staff', phone || '', email || '');

    db.prepare(
        'INSERT INTO activity_log (type, description) VALUES (?, ?)'
    ).run('user_created', `New ${role || 'staff'} "${fullName}" created by ${req.user?.fullName}`);

    res.status(201).json({ id, username, fullName, role: role || 'staff', phone, email, isActive: true });
});

// PUT /api/users/:id — owner/admin: update user
router.put('/users/:id', requireAuth, requireRole('owner', 'admin'), (req: AuthRequest, res: Response) => {
    const { fullName, role, phone, email, isActive, password } = req.body;

    const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id) as any;
    if (!existing) return res.status(404).json({ error: 'User not found' });

    // Prevent changing owner role
    if (existing.role === 'owner' && role && role !== 'owner') {
        return res.status(403).json({ error: 'Cannot change owner role' });
    }

    // Only owner can promote to admin
    if (role === 'admin' && req.user?.role !== 'owner') {
        return res.status(403).json({ error: 'Only the owner can assign admin role' });
    }

    let hash = existing.password_hash;
    if (password) {
        hash = bcrypt.hashSync(password, 10);
    }

    db.prepare(
        'UPDATE users SET full_name = ?, role = ?, phone = ?, email = ?, is_active = ?, password_hash = ? WHERE id = ?'
    ).run(
        fullName ?? existing.full_name,
        role ?? existing.role,
        phone ?? existing.phone,
        email ?? existing.email,
        isActive !== undefined ? (isActive ? 1 : 0) : existing.is_active,
        hash,
        req.params.id
    );

    res.json({ message: 'User updated' });
});

// DELETE /api/users/:id — owner only
router.delete('/users/:id', requireAuth, requireRole('owner'), (req: AuthRequest, res: Response) => {
    const existing = db.prepare('SELECT role, full_name FROM users WHERE id = ?').get(req.params.id) as any;
    if (!existing) return res.status(404).json({ error: 'User not found' });
    if (existing.role === 'owner') return res.status(403).json({ error: 'Cannot delete the owner account' });

    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);

    db.prepare(
        'INSERT INTO activity_log (type, description) VALUES (?, ?)'
    ).run('user_deleted', `User "${existing.full_name}" deleted by ${req.user?.fullName}`);

    res.status(204).send();
});

// GET /api/me — get current user info (any authenticated user)
router.get('/me', requireAuth, (req: AuthRequest, res: Response) => {
    res.json(req.user);
});

export default router;
