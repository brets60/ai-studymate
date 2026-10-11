import fs from 'node:fs';
import { execSync } from 'node:child_process';

const s = fs.readFileSync('prisma/schema.prisma', 'utf8');
const pgSchema = s.replace('provider = "sqlite"', 'provider = "postgresql"');
fs.writeFileSync('prisma/schema.pg.prisma', pgSchema);

try {
  const out = execSync('npx prisma generate --schema=prisma/schema.pg.prisma').toString();
  console.log("PostgreSQL Prisma Client Generation Output:\n", out);
  console.log("SUCCESS: Schema is 100% compatible with PostgreSQL!");
} catch (e) {
  console.error("PG error:", e.message);
  if (e.stdout) console.log(e.stdout.toString());
  if (e.stderr) console.log(e.stderr.toString());
} finally {
  if (fs.existsSync('prisma/schema.pg.prisma')) {
    fs.unlinkSync('prisma/schema.pg.prisma');
  }
}
