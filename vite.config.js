import { defineConfig } from 'vite';

export default defineConfig({
  cacheDir: 'node_modules/.vite-amp-event-test',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    manifest: true,
    rollupOptions: {
      input: '/src/js/app.js'
    }
  }
});
