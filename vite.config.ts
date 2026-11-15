import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // Cho phép chạy trực tiếp bằng cách bấm đúp vào file index.html mà không cần server!
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
});
