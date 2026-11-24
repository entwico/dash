import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/core/index.ts',
    async: 'src/async/index.ts',
    match: 'src/match/index.ts',
    cn: 'src/cn/index.ts',
    react: 'src/react/index.ts',
    testing: 'src/testing/index.ts',
    'testing/node': 'src/testing-node/index.ts',
  },
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  fixedExtension: false,
});
