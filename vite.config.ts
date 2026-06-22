import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // In dev, forward /api to the local Hono dev server (vercel dev) or mock.
      // When running `vite` alone, these routes 404 gracefully and the app
      // falls back to bundled mock data.
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'es2021',
    sourcemap: false,
    // three.js + drei is an expected large vendor chunk, loaded on demand.
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        // Function form so a vendor chunk is only emitted when its packages
        // are actually part of the graph (commit 1 ships no 3D, so no three
        // chunk; commit 2 adds it).
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('three') || id.includes('@react-three')) return 'three';
          if (id.includes('recharts') || id.includes('/d3-')) return 'charts';
          return undefined;
        },
      },
    },
  },
});
