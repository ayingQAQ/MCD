import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
export default defineConfig({ plugins: [react()], base: './', build: { rolldownOptions: { input: {
  main: fileURLToPath(new URL('./index.html', import.meta.url)),
  illustrations: fileURLToPath(new URL('./illustrations.html', import.meta.url)),
} } } });
