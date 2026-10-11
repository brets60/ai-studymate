import fs from 'node:fs';
import path from 'node:path';

const targetProvider = process.argv[2]?.toLowerCase();
if (!targetProvider || !['sqlite', 'postgresql', 'postgres'].includes(targetProvider)) {
  console.log("Usage: node scripts/switch_db.mjs [sqlite|postgresql]");
  process.exit(1);
}

const provider = targetProvider === 'postgres' ? 'postgresql' : targetProvider;
const schemaPath = path.resolve('prisma', 'schema.prisma');

if (!fs.existsSync(schemaPath)) {
  console.error("schema.prisma not found at", schemaPath);
  process.exit(1);
}

let content = fs.readFileSync(schemaPath, 'utf8');

// Replace datasource provider
content = content.replace(
  /datasource\s+db\s*\{\s*provider\s*=\s*"(sqlite|postgresql)"/g,
  `datasource db {\n  provider = "${provider}"`
);

fs.writeFileSync(schemaPath, content, 'utf8');
console.log(`Successfully updated prisma/schema.prisma datasource provider to: ${provider}`);
