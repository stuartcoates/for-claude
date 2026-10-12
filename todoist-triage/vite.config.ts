/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base: './'` keeps asset paths relative so the build works from any folder
// (GitHub Pages, a local file server, or the single-file artifact build).
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    // One JS and one CSS file, so scripts/build-artifact.mjs can inline them.
    cssCodeSplit: false,
    assetsInlineLimit: 100_000,
    rollupOptions: { output: { codeSplitting: false } },
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
