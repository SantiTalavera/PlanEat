import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { z } from 'zod';


const router = Router();
router.use(requireAuth);


const genSchema = z.object({ date: z.string().date().optional() });


router.post('/generate', async (req, res) => {
const parse = genSchema.safeParse(req.body);
if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
const date = parse.data.date ? new Date(parse.data.date) : new Date();


const goal = await prisma.goal.findFirst({ where: { userId: req.user!.id }, orderBy: { createdAt: 'desc' } });
if (!goal) return res.status(400).json({ error: 'Set goals first' });


// inventario disponible
const inv = await prisma.userProduct.findMany({ where: { userId: req.user!.id }, include: { product: true } });
if (!inv.length) return res.status(400).json({ error: 'No inventory' });


// heurística: agarrar 3-4 items priorizando por vencimiento y repartir kcal target proporcional a kcal/100g
const sorted = [...inv].sort((a,b) => {
const ax = a.expiresAt ? new Date(a.expiresAt).getTime() : Infinity;
const bx = b.expiresAt ? new Date(b.expiresAt).getTime() : Infinity;
return ax - bx;
});


const slots: Array<'breakfast'|'lunch'|'snack'|'dinner'> = ['breakfast','lunch','snack','dinner'];
const target = goal.kcalTarget;
const pick = sorted.slice(0, Math.min(6, sorted.length));
const kcal100s = pick.map(p => Math.max(1, p.product.kcal100));
const sumK = kcal100s.reduce((a,b)=>a+b,0);


// distribuir kcal por item de forma proporcional, luego por slot
const gramsPerItem = pick.map((p,idx) => {
const share = (kcal100s[idx] / sumK) * target;
// gramos necesarios para esa energía (kcal) dado kcal/100g
const grams = Math.min(p.gramsRemaining, Math.round((share / p.product.kcal100) * 100));
return Math.max(30, grams); // mínimo 30g para evitar porciones ridículas
});


const plan = await prisma.mealPlan.create({ data: { userId: req.user!.id, date, totalKcal: target, status: 'draft' } });


const items = await Promise.all(pick.map((p, i) => prisma.mealItem.create({
data: {
mealPlanId: plan.id,
slot: slots[i % slots.length],
source: 'product',
sourceId: p.id,
grams: gramsPerItem[i],
kcal: Math.round((p.product.kcal100/100) * gramsPerItem[i]),
protein: (p.product.protein100/100) * gramsPerItem[i],
carbs: (p.product.carbs100/100) * gramsPerItem[i],
fat: (p.product.fat100/100) * gramsPerItem[i],
}
})));


res.json({
id: plan.id,
date: plan.date,
total_kcal: plan.totalKcal,
items: items.map(i => ({
id: i.id, slot: i.slot, source: i.source, source_id: i.sourceId, grams: i.grams,
kcal: i.kcal, protein_g: i.protein, carbs_g: i.carbs, fat_g: i.fat
}))
});
});


export default router;