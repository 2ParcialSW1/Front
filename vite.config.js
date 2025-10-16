import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Permite acceso desde cualquier IP
    port: 5173,
    proxy: {
      '/spring-initializr': {
        target: 'https://start.spring.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/spring-initializr/, ''),
        secure: true
      }
    }
  },
  optimizeDeps: {
    include: ["xml2js", "glob", "fs-extra", "graceful-fs"]
  }
})
