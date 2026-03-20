// ESLint configuration for Expo/React Native mobile app
// Using ESLint 9 flat config format with compatibility layer
import { FlatCompat } from '@eslint/eslintrc';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  ...compat.extends('expo'),
  {
    ignores: [
      'node_modules/',
      '.expo/',
      'android/',
      'ios/',
      'dist/',
      'dev-dist/',
      '*.log',
      'babel.config.js',
      'metro.config.js',
      'tailwind.config.js',
    ],
  },
];
