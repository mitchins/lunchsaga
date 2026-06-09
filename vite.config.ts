import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

import { resolve } from 'path'
import { configDefaults } from 'vitest/config'

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src')
    }
  },
  server: {
    host: '127.0.0.1', // Bind to IPv4 localhost for curl compatibility
    port: 5173, // Vite default, avoids macOS system services
    strictPort: false, // Allow fallback to other ports if busy
    proxy: {
      // Proxy /api requests to pywrangler dev server
      '/api': {
        target: 'http://localhost:3757',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [resolve(projectRoot, 'tests/unit/vitest.setup.ts')],
    exclude: [...configDefaults.exclude, 'tests/e2e/**/*'],
    coverage: {
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: 'coverage',
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: [
        'tests/**/*',
        '**/*.d.ts',
        'src/**/*.spec.ts',
        'src/**/*.test.ts',
        'src/main.tsx',
        'src/vite-end.d.ts',
        'src/mocks/**/*',
        'src/components/ui/**/*',
        'playwright.config.ts'
      ],
      all: true,
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80
    },
    tsconfig: './tsconfig.vitest.json'
  }
});
