import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/stores': path.resolve(__dirname, './src/stores'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/constants': path.resolve(__dirname, './src/constants'),
      '@/assets': path.resolve(__dirname, './src/assets'),
    },
  },

  optimizeDeps: {
    exclude: [
      '@ffmpeg/ffmpeg', 
      '@ffmpeg/util'
    ],
  },
  
  server: {
    host: true,
    port: 3000,
    
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },

    // --- (这是新增的配置) ---
    // 明确允许服务器访问 FFMPEG 的文件
    fs: {
      allow: [
        // 允许访问项目根目录 (..)
        path.resolve(__dirname, '.'),
        // 允许访问 FFMPEG 包的特定目录
        path.resolve(__dirname, 'node_modules/@ffmpeg/ffmpeg/dist'),
        path.resolve(__dirname, 'node_modules/@ffmpeg/util/dist'),
      ],
    },
    // --- (新增配置结束) ---
  },

  build: {
    target: 'esnext',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@headlessui/react', 'framer-motion'],
          utils: ['lodash', 'dayjs', 'zustand'],
        },
      },
    },
  },
})