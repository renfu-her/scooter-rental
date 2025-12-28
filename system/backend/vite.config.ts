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
      base: '/backend/',
      build: {
        // 開發環境：不構建，直接使用源碼
        // 生產環境：構建到 public/backend 目錄
        outDir: path.resolve(__dirname, '../../public/backend'),
        emptyOutDir: true, // 構建時清空 backend 目錄
        rollupOptions: {
          input: path.resolve(__dirname, 'index.html'),
          output: {
            manualChunks: (id) => {
              // Separate node_modules into vendor chunks
              if (id.includes('node_modules')) {
                // React and React DOM in one chunk
                if (id.includes('react') || id.includes('react-dom')) {
                  return 'react-vendor';
                }
                // React Router in its own chunk
                if (id.includes('react-router')) {
                  return 'router-vendor';
                }
                // Large libraries in separate chunks
                if (id.includes('@google/genai')) {
                  return 'genai-vendor';
                }
                if (id.includes('exceljs') || id.includes('xlsx')) {
                  return 'excel-vendor';
                }
                if (id.includes('recharts')) {
                  return 'charts-vendor';
                }
                if (id.includes('html2canvas')) {
                  return 'canvas-vendor';
                }
                if (id.includes('flatpickr')) {
                  return 'flatpickr-vendor';
                }
                if (id.includes('lucide-react')) {
                  return 'icons-vendor';
                }
                // All other node_modules
                return 'vendor';
              }
            },
          },
        },
        chunkSizeWarningLimit: 600,
      },
    };
});
