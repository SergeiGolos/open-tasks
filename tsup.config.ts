import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/tasks/*.ts',
  ],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  shims: false,
  outDir: 'dist',
});
