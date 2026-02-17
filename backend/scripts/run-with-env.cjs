// Load .env.local (same as app default) so migrations use the dev database
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

execSync('npx prisma migrate deploy', { stdio: 'inherit', env, shell: true });
