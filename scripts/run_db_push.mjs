import { execSync } from 'node:child_process';

const url =
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL;

if (url) {
  console.log("Detected active database URL, running prisma db push...");
  try {
    execSync('npx prisma db push --accept-data-loss', {
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: url,
        DIRECT_URL: process.env.POSTGRES_URL_NON_POOLING || url
      }
    });
    console.log("Prisma tables created successfully in PostgreSQL!");
  } catch (error) {
    console.error("Prisma db push error:", error.message);
  }
} else {
  console.log("No database URL detected, skipping db push.");
}
