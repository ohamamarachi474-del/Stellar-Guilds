/**
 * Global setup for e2e tests
 * Runs once before all test files
 */

export default async function globalSetup() {
  // Verify we're using test database
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  if (!databaseUrl.includes('_test')) {
    throw new Error(
      `E2E tests must use a test database. Current DATABASE_URL: ${databaseUrl}. ` +
        'Please set DATABASE_URL to a database ending with _test',
    );
  }

  console.log('🚀 Global e2e test setup complete');
  console.log(
    `📦 Using database: ${databaseUrl.split('@')[1] || 'configured'}`,
  );
}
