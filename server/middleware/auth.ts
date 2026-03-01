import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'gym-manager-secret-key-2026';

export interface AuthRequest extends Request {
    user?: { id: string; username: string; role: string; fullName: string };
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        req.user = { id: decoded.id, username: decoded.username, role: decoded.role, fullName: decoded.fullName };
        next();
    } catch {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

export function requireRole(...roles: string[]) {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) return res.status(401).json({ error: 'Authentication required' });
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
}

export function signToken(user: { id: string; username: string; role: string; fullName: string }) {
    return jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
}
