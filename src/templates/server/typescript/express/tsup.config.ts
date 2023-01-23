import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  splitting: true,
  clean: true,
  format: 'esm',
  platform: 'node',
  dts: false,
  treeshake: true,
  shims: true,
});
