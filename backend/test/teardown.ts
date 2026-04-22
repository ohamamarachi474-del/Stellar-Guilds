/**
 * Teardown script for e2e test database
 * Run this script to clean up the test database after test runs
 *
 * Usage:
 *   ts-node test/teardown.ts
 *
 * Or add to package.json scripts:
 *   "test:e2e:teardown": "ts-node test/teardown.ts"
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function teardownTestDatabase() {
  console.log('🧹 Starting test database teardown...');

  try {
    // Get all table names from the public schema
    const tablenames = await prisma.$queryRaw<
      { tablename: string }[]
    >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

    const tables = tablenames
      .map(({ tablename }) => tablename)
      .filter((name: string) => name !== '_prisma_migrations')
      .map((name: string) => `"public"."${name}"`)
      .join(', ');

    if (tables.length > 0) {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
      console.log('✅ All tables truncated successfully');
    } else {
      console.log('ℹ️  No tables to truncate');
    }

    // Reset sequences (auto-increment counters)
    const sequences = await prisma.$queryRaw<{ sequencename: string }[]>`
      SELECT sequencename FROM pg_sequences WHERE schemaname = 'public'
    `;

    for (const { sequencename } of sequences) {
      await prisma.$executeRawUnsafe(
        `ALTER SEQUENCE "public"."${sequencename}" RESTART WITH 1;`,
      );
    }
    console.log(`✅ Reset ${sequences.length} sequences`);
  } catch (error) {
    console.error('❌ Teardown failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }

  console.log('🎉 Test database teardown complete');
}

teardownTestDatabase();
