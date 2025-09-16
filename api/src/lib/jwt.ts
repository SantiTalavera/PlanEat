import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../env.js';

export function signJwt(payload: object) {
  const opts: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as any };
  return jwt.sign(payload, env.JWT_SECRET, opts);
}

export function verifyJwt<T = unknown>(token: string): T | null {
  try { return jwt.verify(token, env.JWT_SECRET) as T; }
  catch { return null; }
}
