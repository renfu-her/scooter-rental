import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        // 開發環境：不構建，直接使用源碼
        // 生產環境：構建到 public/backend 目錄
        outDir: path.resolve(__dirname, '../../public/backend'),
        emptyOutDir: true, // 構建時清空 backend 目錄
        rollupOptions: {
          input: path.resolve(__dirname, 'index.html'),
        },
        // 確保資源路徑正確（對應 /backend 路徑）
        base: '/backend/',
      },
    };
});
