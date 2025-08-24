// Global test setup

// Set timezone to UTC for consistent test results
process.env.TZ = 'UTC';

// Increase test timeout for slower environments
jest.setTimeout(10000);
