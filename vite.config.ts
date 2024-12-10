import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/ocs': {
        target: 'http://10.41.8.139:5050', // 'http://localhost:5050', // Backend URL
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
