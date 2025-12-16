#!/usr/bin/env node
/**
 * Start the mock API server for E2E tests
 */

import { startMockAPI } from './mock-api.mjs';

startMockAPI().then(() => {
  console.log('Mock API server started successfully');
}).catch((error) => {
  console.error('Failed to start mock API server:', error);
  process.exit(1);
});
