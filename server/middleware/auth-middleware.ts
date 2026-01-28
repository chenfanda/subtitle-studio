import { Request, Response, NextFunction } from 'express';
import { authUtils } from '../utils/auth';

export interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
    };
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    const payload = authUtils.verifyAccessToken(token);
    if (!payload) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = payload;
    next();
};
