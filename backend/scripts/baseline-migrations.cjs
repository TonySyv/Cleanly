// One-time: mark migrations already in the DB as applied (same env as run-with-env.cjs)
const path = require('path');
const { execSync } = require('child_process');

const envName = process.env.ENV || 'local';
const envPath = path.resolve(path.dirname(__dirname), `.env.${envName}`);
const result = require('dotenv').config({ path: envPath });
if (result.error && result.error.code !== 'ENOENT') {
  console.error('dotenv error:', result.error.message);
  process.exit(1);
}
if (result.error && result.error.code === 'ENOENT') {
  console.error(`Missing ${path.basename(envPath)}. Create it for the dev database.`);
  process.exit(1);
}

const env = { ...process.env };
if (!env.DATABASE_URL) {
  console.error(`DATABASE_URL not set in .env.${envName}. Add DATABASE_URL=...`);
  process.exit(1);
}

const applied = [
  '20250209000000_init',
  '20250209120000_add_tasks',
  '20250209180000_booking_platform_schema',
];

console.log('Marking existing migrations as applied (baseline)...');
for (const name of applied) {
  execSync(`npx prisma migrate resolve --applied "${name}"`, { stdio: 'inherit', env, shell: true });
}
console.log('Done. Run: npm run db:migrate');
