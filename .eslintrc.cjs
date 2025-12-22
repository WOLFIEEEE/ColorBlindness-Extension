module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    webextensions: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    // React rules
    'react/react-in-jsx-scope': 'off', // Not needed with React 17+ JSX transform
    'react/prop-types': 'off', // We use TypeScript for prop validation
    
    // TypeScript rules
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    
    // General rules
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'prefer-const': 'warn',
    'no-unused-expressions': 'warn',
    
    // React hooks rules
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  },
  ignorePatterns: [
    'dist/',
    'node_modules/',
    '*.config.js',
    '*.config.ts',
    '*.cjs',
  ],
}

