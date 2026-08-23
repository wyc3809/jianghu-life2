import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          // 只拆分框架依賴，其餘讓 Rollup 自行處理
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('zustand') || id.includes('immer') || id.includes('zod')) {
              return 'vendor';
            }
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, 'core'),
      '@interfaces': path.resolve(__dirname, 'interfaces'),
      '@data': path.resolve(__dirname, 'data'),
      '@content': path.resolve(__dirname, 'content'),
    },
  },
});
