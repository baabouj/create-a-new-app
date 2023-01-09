import path from 'path';
import { defineConfig } from 'tsup';

import { copy } from './src/utils';

export default defineConfig(async (options) => {
  return {
    minify: !options.watch,
    metafile: !options.watch,
    sourcemap: !options.watch,
    entry: ['src/index.ts', 'src/bin.ts'],
    format: 'esm',
    clean: true,
    dts: 'src/index.ts',
    onSuccess: async () => {
      await copy(
        path.join(process.cwd(), 'src/templates'),
        path.join(process.cwd(), 'dist/templates')
      );
      await copy(
        path.join(process.cwd(), 'src/shared'),
        path.join(process.cwd(), 'dist/shared')
      );
    },
    ...(!options.watch && {
      env: {
        NODE_ENV: 'production',
      },
    }),
  };
});
