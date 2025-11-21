import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, PluginOption } from "vite";

import sparkPlugin from "@github/spark/spark-vite-plugin";
import createIconImportProxy from "@github/spark/vitePhosphorIconProxyPlugin";
import { resolve } from 'path'
import { configDefaults } from 'vitest/config'

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // DO NOT REMOVE
    createIconImportProxy() as PluginOption,
    sparkPlugin() as PluginOption,
  ],
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src')
    }
  },
  server: {
    port: 5000,
    strictPort: false, // Allow fallback if port is in use
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: [],
    exclude: [...configDefaults.exclude, 'tests/e2e/**/*'],
    coverage: {
      reporter: ['text', 'lcov'],
      reportsDirectory: 'coverage',
      include: ['src/utils/navigation.ts'],
      exclude: ['tests/**/*.spec.ts', 'playwright.config.ts', 'tests/e2e/helpers.ts']
    },
    tsconfig: './tsconfig.vitest.json'
  }
});
