import { defineConfig } from 'tsup';

export default defineConfig({
  // Entry point for the library build.
  entry: {
    index: 'src/index.tsx'
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: true,
  sourcemap: false,
  clean: false,
  minify: true,
  treeshake: true,
  external: [],
  // Shims handles __dirname and __filename in ESM
  shims: true,
  // Ensures the bin file has the #!/usr/bin/env node header
  banner: ({ format }) => {
    if (format === 'cjs') return { js: '/* ZuzJS Process Manager */' };
    return {};
  },
  onSuccess: async () => {
    console.log('✅ ZuzJS Process Manager Build Complete');
  }
});