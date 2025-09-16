import { Request, Response, NextFunction } from 'express';
import { verifyJwt } from '../lib/jwt';


declare global {
namespace Express {
interface Request { user?: { id: string; email: string }; }
}
}


export function requireAuth(req: Request, res: Response, next: NextFunction) {
const header = req.headers.authorization;
if (!header?.startsWith('Bearer ')) {
return res.status(401).json({ error: 'Missing token' });
}
const token = header.slice(7);
const payload = verifyJwt<{ id: string; email: string }>(token);
if (!payload) return res.status(401).json({ error: 'Invalid token' });
req.user = payload;
next();
}