import { defineConfig } from '@entwico/eslint-config';

export default defineConfig({
  root: import.meta.dirname,
  react: true,
  // each package entry point is a published barrel
  imports: { noReexport: { allow: ['src/*/index.ts'] } },
  extra: [
    {
      files: ['**/*.test.ts'],
      rules: {
        '@typescript-eslint/require-await': 'off',
      },
    },
  ],
});
