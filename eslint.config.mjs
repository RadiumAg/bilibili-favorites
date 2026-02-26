import reactHooks from 'eslint-plugin-react-hooks'
import tsParser from '@typescript-eslint/parser'

export default [
  {
    // 忽略文件
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'build.zip',
      'public/**',
      '*.min.js',
      'pnpm-lock.yaml',
      '.codebuddy/**',
      '.qoder/**',
      '**/*.md',
    ],
  },
  {
    // 只检查 TSX/JSX 文件
    files: ['**/*.tsx', '**/*.jsx', '**/*.ts', '**/*.js'],

    // 使用 TypeScript 解析器
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },

    // 只启用 React Hooks 插件
    plugins: {
      'react-hooks': reactHooks,
    },

    // 只启用 Hooks 规则
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
]
