import { Router } from 'express';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { signJwt } from '../lib/jwt';
import { z } from 'zod';


const router = Router();


const credsSchema = z.object({
email: z.string().email(),
password: z.string().min(6),
name: z.string().optional(),
});


router.post('/signup', async (req, res) => {
const parse = credsSchema.safeParse(req.body);
if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
const { email, password, name } = parse.data;
const existing = await prisma.user.findUnique({ where: { email } });
if (existing) return res.status(409).json({ error: 'Email already registered' });
const hashed = await bcrypt.hash(password, 10);
const user = await prisma.user.create({ data: { email, password: hashed, name } });
const token = signJwt({ id: user.id, email: user.email });
res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name } });
});


router.post('/login', async (req, res) => {
const parse = credsSchema.pick({ email: true, password: true }).safeParse(req.body);
if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
const { email, password } = parse.data;
const user = await prisma.user.findUnique({ where: { email } });
if (!user) return res.status(401).json({ error: 'Invalid credentials' });
const ok = await bcrypt.compare(password, user.password);
if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
const token = signJwt({ id: user.id, email: user.email });
res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});


export default router;