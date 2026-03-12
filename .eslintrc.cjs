module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    // Block raw console usage - must use logger instead
    // All console usage must go through logger.ts
    'no-console': 'error',
  },
  overrides: [
    {
      // Allow console in logger.ts only (it's the logger implementation)
      files: ['src/lib/logger.ts'],
      rules: {
        'no-console': 'off',
      },
    },
    {
      // Allow console in productionConsoleGuard.ts (it overrides console methods)
      files: ['src/lib/productionConsoleGuard.ts'],
      rules: {
        'no-console': 'off',
      },
    },
  ],
}
