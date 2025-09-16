import { Router } from 'express';
import axios from 'axios';
import { prisma } from '../lib/prisma';
import { env } from '../env';
import { requireAuth } from '../middleware/auth';


const router = Router();


// GET /products/lookup?barcode=EAN13
router.get('/lookup', requireAuth, async (req, res) => {
const barcode = String(req.query.barcode || '').trim();
if (!barcode) return res.status(400).json({ error: 'barcode required' });


// 1) Buscar en cache local
const cached = await prisma.product.findUnique({ where: { barcode } });
if (cached) return res.json(mapDbProduct(cached));


// 2) Buscar en Open Food Facts (v0)
try {
const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;
const { data } = await axios.get(url, { timeout: env.HTTP_TIMEOUT_MS });
if (data?.status !== 1 || !data?.product) {
return res.status(404).json({ error: 'Product not found' });
}
const p = data.product;
const prod = await prisma.product.create({
data: {
barcode,
name: p.product_name || p.generic_name || 'Producto',
brand: Array.isArray(p.brands_tags) && p.brands_tags.length ? p.brands_tags[0] : p.brands || null,
kcal100: Number(p.nutriments?.['energy-kcal_100g'] ?? p.nutriments?.energy_100g ? p.nutriments.energy_100g / 4.184 : 0) || 0,
protein100: Number(p.nutriments?.proteins_100g ?? 0) || 0,
carbs100: Number(p.nutriments?.carbohydrates_100g ?? 0) || 0,
fat100: Number(p.nutriments?.fat_100g ?? 0) || 0,
source: 'off',
},
});
return res.json(mapDbProduct(prod));
} catch (e) {
return res.status(502).json({ error: 'Lookup upstream failed' });
}
});


function mapDbProduct(p: any) {
return {
id: p.id,
barcode: p.barcode,
name: p.name,
brand: p.brand,
kcal_per_100g: p.kcal100,
protein_g_per_100g: p.protein100,
carbs_g_per_100g: p.carbs100,
fat_g_per_100g: p.fat100,
source: p.source,
};
}


export default router;