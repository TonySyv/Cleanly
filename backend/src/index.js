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
import servicesRoutes from './routes/services.js';
import bookingsRoutes from './routes/bookings.js';
import addressesRoutes from './routes/addresses.js';
import jobsRoutes from './routes/jobs.js';
import providerRoutes from './routes/provider.js';
import adminServicesRoutes from './routes/admin/services.js';
import adminProvidersRoutes from './routes/admin/providers.js';
import adminJobResultsRoutes from './routes/admin/jobResults.js';
import stripeWebhookRoutes from './routes/webhooks/stripe.js';
import { requestLogger } from './middleware/requestLogger.js';
import { prisma } from './lib/db.js';

const PORT = parseInt(process.env.PORT || '3000', 10);

const app = express();
app.use(requestLogger);
app.use(cors());

// Stripe webhook needs raw body for signature verification
app.use('/api/v1/webhooks/stripe', express.raw({ type: 'application/json' }), stripeWebhookRoutes);

app.use(express.json());

app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/services', servicesRoutes);
app.use('/api/v1/bookings', bookingsRoutes);
app.use('/api/v1/addresses', addressesRoutes);
app.use('/api/v1/jobs', jobsRoutes);
app.use('/api/v1/provider', providerRoutes);
app.use('/api/v1/admin/services', adminServicesRoutes);
app.use('/api/v1/admin/job-results', adminJobResultsRoutes);
app.use('/api/v1/admin/providers', adminProvidersRoutes);

app.use((err, req, res, next) => {
  const requestId = req.id ?? res.locals?.requestId ?? '-';
  console.error(
    `[${new Date().toISOString()}] id=${requestId} method=${req.method} path=${req.originalUrl} userId=${req.userId ?? '-'} error=`,
    err
  );
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong',
    },
  });
});

async function main() {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
  } catch (e) {
    console.error(
      'Database connection failed. Check DATABASE_URL in .env.' + (process.env.ENV ? ` (ENV=${process.env.ENV}, file .env.${process.env.ENV})` : '') + '\n' +
      'If using Neon: ensure the project is not suspended (log into Neon console to wake it).\n' +
      'Error:',
      e.message || e
    );
    process.exit(1);
  }
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
