
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// Explicitly import process to resolve typing issues with cwd and env in the Vite config environment.
import process from 'process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
    // Load env file. Thứ ba tham số '' cho phép load cả biến không có prefix VITE_
    const env = loadEnv(mode, process.cwd(), '');
    
    // Ưu tiên lấy từ biến hệ thống (Vercel/GitHub) trước, sau đó mới đến file .env
    const apiKey = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || '';

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // Ánh xạ để dùng được trong process.env.API_KEY của @google/genai
        'process.env.API_KEY': JSON.stringify(apiKey),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (id.includes('node_modules')) {
                // Gom nhóm React và các thư viện UI lớn (Recharts, Lucide) vào chunk 'vendor'
                // Điều này giúp trình duyệt cache các thư viện nền tảng ít thay đổi
                if (
                  id.includes('react') || 
                  id.includes('react-dom') || 
                  id.includes('scheduler') ||
                  id.includes('recharts') ||
                  id.includes('lucide-react')
                ) {
                  return 'vendor';
                }
                
                // Tách các thư viện khác (như Gemini SDK) sang chunk riêng để cân bằng kích thước
                return 'libs';
              }
            },
          },
        },
        // Tăng giới hạn cảnh báo lên 1000KB vì app sử dụng nhiều thư viện nặng như Recharts và Gemini SDK
        chunkSizeWarningLimit: 1000,
      },
    };
});
