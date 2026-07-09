import { defineConfig } from '@entwico/eslint-config';

export default defineConfig({
  root: import.meta.dirname,
  react: true,
  extra: [
    {
      files: ['**/*.test.ts'],
      rules: {
        '@typescript-eslint/require-await': 'off',
      },
    },
  ],
});
