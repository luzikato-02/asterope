import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,        // bind to 0.0.0.0 so Codespaces can reach it
    port: 5173,
    strictPort: true,
    allowedHosts: true,  // allow *.app.github.dev Codespace domains
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
