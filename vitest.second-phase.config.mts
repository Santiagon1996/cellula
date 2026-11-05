import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    include: [
      'src/tests/about-section.test.tsx',
      'src/tests/about-hydration.test.tsx',
      'src/tests/about-integration.test.tsx',
      'src/features/contact/components/contact-integration.test.tsx',
    ],
    maxWorkers: 2,
    css: false,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
