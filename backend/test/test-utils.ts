import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { HttpAdapterHost } from '@nestjs/core';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';

export interface TestApp {
  app: INestApplication;
  prisma: PrismaService;
  module: TestingModule;
}

/**
 * Creates a fully initialized NestJS application for e2e testing
 * with real database connection
 */
export async function createTestApp(): Promise<TestApp> {
  // Ensure we're using test database
  if (!process.env.DATABASE_URL?.includes('_test')) {
    throw new Error(
      'E2E tests must use a test database. Set DATABASE_URL to a database ending with _test',
    );
  }

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  const prisma = app.get<PrismaService>(PrismaService);
  const httpAdapterHost = app.get(HttpAdapterHost);

  // Configure global pipes, filters, and interceptors to match production setup
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapterHost));
  app.useGlobalInterceptors(new ResponseInterceptor());

  await app.init();
  await prisma.$connect();

  return { app, prisma, module: moduleFixture };
}

/**
 * Closes the test application and disconnects from database
 */
export async function closeTestApp(testApp: TestApp): Promise<void> {
  const { app, prisma } = testApp;
  await prisma.$disconnect();
  await app.close();
}

/**
 * Clears all tables in the test database while respecting foreign key constraints
 * Uses transactional deletion with proper ordering
 */
export async function clearDatabase(prisma: PrismaService): Promise<void> {
  const tablenames = await prisma.$queryRaw<
    { tablename: string }[]
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== '_prisma_migrations')
    .map((name) => `"public"."${name}"`)
    .join(', ');

  if (tables.length > 0) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
    } catch (error) {
      console.error('Failed to clear database:', error);
      throw error;
    }
  }
}

/**
 * Seeds the database with required base data for tests
 */
export async function seedTestDatabase(prisma: PrismaService): Promise<void> {
  // Add any essential seed data here if needed
  // For example, default roles, permissions, etc.
}

/**
 * Helper to generate unique test identifiers
 */
export function generateTestId(prefix: string = 'test'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Helper to create a test user
 */
export async function createTestUser(
  prisma: PrismaService,
  overrides: Partial<{
    email: string;
    username: string;
    password: string;
    firstName: string;
    lastName: string;
  }> = {},
) {
  const testId = generateTestId('user');
  return prisma.user.create({
    data: {
      email: overrides.email || `${testId}@test.com`,
      username: overrides.username || testId,
      password: overrides.password || 'hashedpassword123',
      firstName: overrides.firstName || 'Test',
      lastName: overrides.lastName || 'User',
    },
  });
}

/**
 * Helper to create a test guild
 */
export async function createTestGuild(
  prisma: PrismaService,
  ownerId: string,
  overrides: Partial<{
    name: string;
    slug: string;
    description: string;
  }> = {},
) {
  const testId = generateTestId('guild');
  return prisma.guild.create({
    data: {
      name: overrides.name || `Test Guild ${testId}`,
      slug: overrides.slug || testId,
      description: overrides.description || 'A test guild',
      ownerId,
    },
  });
}
