import js from '@eslint/js'
import tseslint from 'typescript-eslint'

export default [
  { 
    ignores: [
      'node_modules', 
      'dist', 
      'coverage', 
      'dist/**', 
      'build/**',
      'api/**',  // Ignore Python API directory
      '**/.venv/**',  // Ignore Python virtual environments
      '**/.venv-workers/**',
    ] 
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        document: 'readonly',
        window: 'readonly',
        console: 'readonly',
        navigator: 'readonly',
        fetch: 'readonly'
      }
    }
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: 'module',
        ecmaFeatures: { jsx: true }
      }
    },
    rules: {
      // TypeScript rules
      '@typescript-eslint/explicit-function-return-types': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      
      // General rules
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'no-debugger': 'warn',
      'prefer-const': 'warn',
      'no-var': 'error'
    }
  },
  {
    files: ['**/*.mjs', 'tests/e2e/**/*.mjs'],
    languageOptions: {
      globals: {
        process: 'readonly',
        Buffer: 'readonly',
        console: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly'
      }
    }
  }
]

