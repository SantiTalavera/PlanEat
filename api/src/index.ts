import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './env';
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import inventoryRoutes from './routes/inventory';
import planRoutes from './routes/plan';


const app = express();
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN.split(',') }));
app.use(express.json());
app.use(morgan('dev'));


app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/auth', authRoutes);
app.use('/products', productRoutes);
app.use('/inventory', inventoryRoutes);
app.use('/plan', planRoutes);


const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API listening on :${port}`));