import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    fileParallelism: false,
    include: ['server/test/**/*.test.ts', 'server/src/**/*.test.ts'],
    globalSetup: ['./server/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage/server',
      include: ['server/src/**/*.ts'],
      exclude: ['server/src/index.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
