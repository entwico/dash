import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // gc() for the tests of what stays in memory
    execArgv: ['--expose-gc'],
    coverage: {
      provider: 'istanbul',
      // a file no test imports counts as uncovered, instead of not at all
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts'],
    },
  },
});
