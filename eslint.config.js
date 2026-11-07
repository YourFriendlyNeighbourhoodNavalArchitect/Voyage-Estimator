import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default defineConfig(
  js.configs.recommended,
  tseslint.configs.recommended,
  { files: ['src/**/*.{ts,tsx}'], extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite] },
  { rules: { '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }] } },
  { rules: { 'no-restricted-imports': ['error', { patterns: [{ group: ['../*'], message: 'Import from the source root, as "#...".' }] }] } },
);
