import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Build output goes to ../dist, which the Node server serves.
// During development (npm run dev) API calls are forwarded to the Node server on port 3000.
export default defineConfig({
  plugins: [react()],
  build: { outDir: '../dist', emptyOutDir: true },
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
      '/uploads': 'http://localhost:3000',
    },
  },
})
