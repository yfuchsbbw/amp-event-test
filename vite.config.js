import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  cacheDir: 'node_modules/.vite-amp-event-test',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    manifest: true,
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        app: resolve(__dirname, 'src/js/app.js')
      }
    }
  }
});
