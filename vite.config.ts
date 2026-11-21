/// <reference types="vitest/config" />

import path from 'path'
import { defineConfig } from 'vite'
import { crx } from '@crxjs/vite-plugin'
import react from '@vitejs/plugin-react'
import manifest from './src/manifest'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    build: {
      emptyOutDir: true,
      outDir: 'build',
      // dev 模式保留 console.log，生产构建移除（与原 rollup-plugin-terser drop_console 等价）
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: mode !== 'development',
        },
      },
      rollupOptions: {
        output: {
          chunkFileNames: 'assets/chunk-[hash].js',
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    plugins: [
      crx({ manifest }),
      react({
        // 有点bug，先注释
        // babel: {
        //   plugins: ['babel-plugin-react-compiler'],
        // },
      }),
    ],
    test: {
      include: ['./tests/**/*.{test,spec}.{tsx,ts}'],
      globals: true,
      environment: 'jsdom',
    },
  }
})
