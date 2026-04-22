/**
 * Global teardown for e2e tests
 * Runs once after all test files complete
 */

import { PrismaClient } from '@prisma/client';

export default async function globalTeardown() {
  console.log('🧹 Global e2e test teardown starting...');

  const prisma = new PrismaClient();

  try {
    // Clean up test database
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
      console.log('✅ Test database cleaned');
    }
  } catch (error) {
    console.warn('⚠️  Warning: Could not clean test database:', error);
  } finally {
    await prisma.$disconnect();
  }

  console.log('🎉 Global e2e test teardown complete');
}
