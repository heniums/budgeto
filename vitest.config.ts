import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    projects: [
      {
        test: {
          name: 'server',
          environment: 'node',
          include: ['server/test/**/*.test.ts'],
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
      },
      {
        test: {
          name: 'client',
          environment: 'jsdom',
          include: ['client/src/**/*.test.{ts,tsx}'],
          setupFiles: ['./client/test/setup.ts'],
        },
      },
    ],
  },
});
