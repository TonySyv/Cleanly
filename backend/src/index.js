import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env.local | .env.dev | .env.prod (default: local). See ENVIRONMENTS.md.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envName = process.env.ENV || 'local';
const envPath = path.resolve(__dirname, '..', `.env.${envName}`);
dotenv.config({ path: envPath });

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import taskRoutes from './routes/tasks.js';
import servicesRoutes from './routes/services.js';
import bookingsRoutes from './routes/bookings.js';
import jobsRoutes from './routes/jobs.js';
import providerRoutes from './routes/provider.js';
import adminServicesRoutes from './routes/admin/services.js';
import stripeWebhookRoutes from './routes/webhooks/stripe.js';
import { prisma } from './lib/db.js';

const PORT = parseInt(process.env.PORT || '3000', 10);

const app = express();
app.use(cors());

// Stripe webhook needs raw body for signature verification
app.use('/api/v1/webhooks/stripe', express.raw({ type: 'application/json' }), stripeWebhookRoutes);

app.use(express.json());

app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/services', servicesRoutes);
app.use('/api/v1/bookings', bookingsRoutes);
app.use('/api/v1/jobs', jobsRoutes);
app.use('/api/v1/provider', providerRoutes);
app.use('/api/v1/admin/services', adminServicesRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong',
    },
  });
});

async function main() {
  await prisma.$connect();
  const host = process.env.HOST || '0.0.0.0';
  app.listen(PORT, host, () => {
    console.log(`Cleanly API running on http://${host}:${PORT}`);
    console.log(`Health: http://localhost:${PORT}/api/v1/health`);
    console.log(`Android Emulator: set API_BASE_URL to http://10.0.2.2:${PORT}/api/v1/`);
  });
}

main().catch((e) => {
  console.error('Failed to start:', e);
  process.exit(1);
});

process.on('SIGINT', () => prisma.$disconnect().then(() => process.exit(0)));
process.on('SIGTERM', () => prisma.$disconnect().then(() => process.exit(0)));
