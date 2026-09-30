import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  outDir: './dist-astro',
  vite: {
    plugins: [tailwindcss()],
    server: {
      proxy: {
        '/api': 'http://localhost:8000',
        '/auth': 'http://localhost:8000',
        '/ws': {
          target: 'ws://localhost:8000',
          ws: true,
        },
      },
    },
  },
});
