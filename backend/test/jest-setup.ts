/**
 * Jest setup file for e2e tests
 * Runs before each test file
 */

// Extend timeout for e2e tests
jest.setTimeout(30000);

// Global error handlers for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Global beforeAll hook can be added here if needed
beforeAll(() => {
  // Any per-file setup can go here
});

// Global afterAll hook for cleanup
afterAll(async () => {
  // Give time for any pending operations to complete
  await new Promise((resolve) => setTimeout(resolve, 500));
});
