import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

// GET /inventory
router.get('/', async (req, res) => {
  const items = await prisma.userProduct.findMany({
    where: { userId: req.user!.id },
    include: { product: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json(items.map(mapItem));
});

// POST /inventory
const createSchema = z.object({
  product_id: z.string().uuid().optional(),
  custom_food_id: z.string().uuid().optional(), // reservado MVP+1
  grams: z.number().int().positive(),
  location: z.enum(['fridge','freezer','pantry']),
  expires_at: z.string().datetime().optional(),
});

router.use(requireAuth);
// POST /consume {source, source_id, grams}
const consumeSchema = z.object({
source: z.enum(['product','custom']),
source_id: z.string().uuid(),
grams: z.number().int().positive(),
});

router.post('/', async (req, res) => {
  const parse = createSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  const { product_id, grams, location, expires_at } = parse.data;
  if (!product_id) return res.status(400).json({ error: 'product_id required (custom_food en MVP+1)' });

  const created = await prisma.userProduct.create({
    data: {
      userId: req.user!.id,
      productId: product_id,
      gramsRemaining: grams,
      location,
      expiresAt: expires_at ? new Date(expires_at) : null,
    },
    include: { product: true },
  });
  res.status(201).json(mapItem(created));
});

// PATCH /inventory/:id
const patchSchema = z.object({
  grams_remaining: z.number().int().nonnegative().optional(),
  location: z.enum(['fridge','freezer','pantry']).optional(),
  expires_at: z.string().datetime().nullable().optional(),
});

router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const parse = patchSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });

  // validar ownership
  const item = await prisma.userProduct.findUnique({ where: { id } });
  if (!item || item.userId !== req.user!.id) return res.status(404).json({ error: 'Not found' });

  const { grams_remaining, location, expires_at } = parse.data;
  const updated = await prisma.userProduct.update({
    where: { id },
    data: {
      gramsRemaining: grams_remaining ?? item.gramsRemaining,
      location: location ?? item.location,
      expiresAt: expires_at === undefined ? item.expiresAt : (expires_at ? new Date(expires_at) : null),
    },
    include: { product: true },
  });
  res.json(mapItem(updated));
});

// DELETE /inventory/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const item = await prisma.userProduct.findUnique({ where: { id } });
  if (!item || item.userId !== req.user!.id) return res.status(404).json({ error: 'Not found' });
  await prisma.userProduct.delete({ where: { id } });
  res.json({ ok: true });
});


router.post('/consume', async (req, res) => {
  const parse = consumeSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  const { source, source_id, grams } = parse.data;

  if (source === 'product') {
    const inv = await prisma.userProduct.findUnique({ where: { id: source_id }, include: { product: true } });
    if (!inv || inv.userId !== req.user!.id) return res.status(404).json({ error: 'Inventory item not found' });
    const grams_after = Math.max(0, inv.gramsRemaining - grams);
    const updated = await prisma.userProduct.update({ where: { id: inv.id }, data: { gramsRemaining: grams_after } });
    // registrar consumo
    await prisma.consumption.create({
      data: {
        userId: req.user!.id,
        source: 'product',
        sourceId: inv.id,
        grams,
        kcal: Math.round((inv.product.kcal100 / 100) * grams),
        protein: (inv.product.protein100 / 100) * grams,
        carbs: (inv.product.carbs100 / 100) * grams,
        fat: (inv.product.fat100 / 100) * grams,
      }
    });
    return res.json({ ok: true, inventory_delta: [{ inventory_id: inv.id, grams_before: inv.gramsRemaining, grams_after }] });
  }

// custom en MVP+1
  return res.status(400).json({ error: 'Custom consumption not implemented in MVP' });
});

function mapItem(i: any) {
  return {
    id: i.id,
    product: {
      id: i.product.id,
      barcode: i.product.barcode,
      name: i.product.name,
      brand: i.product.brand,
      kcal_per_100g: i.product.kcal100,
      protein_g_per_100g: i.product.protein100,
      carbs_g_per_100g: i.product.carbs100,
      fat_g_per_100g: i.product.fat100,
    },
    location: i.location,
    grams_remaining: i.gramsRemaining,
    opened_at: i.openedAt,
    expires_at: i.expiresAt,
    created_at: i.createdAt,
    updated_at: i.updatedAt,
  };
}

export default router;
