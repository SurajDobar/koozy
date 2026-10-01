import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || 'http://localhost:4321',
  integrations: [react()],
  outDir: './dist-astro',
  vite: {
    plugins: [tailwindcss()],
    server: {
      proxy: {
        '/api': 'http://localhost:8000',
        '^/auth/(google|logout)': {
          target: 'http://localhost:8000',
        },
        '/ws': {
          target: 'ws://localhost:8000',
          ws: true,
        },
        '/static': 'http://localhost:8000',
        '/admin': 'http://localhost:8000',
        '/host/sessions': 'http://localhost:8000',
        '/dev': 'http://localhost:8000',
        '^/host/quizzes/\\d+/questions': {
          target: 'http://localhost:8000',
        },
        '^/join/[A-Za-z0-9]{5}(/|$)': {
          target: 'http://localhost:8000',
        },
      },
    },
  },
});
