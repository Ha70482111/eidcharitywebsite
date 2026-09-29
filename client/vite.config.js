import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const here = path.dirname(fileURLToPath(import.meta.url))

// The logo is stored as base64 text in the repo; write the real image into public/ before building.
const logo = path.resolve(here, 'public/logo.jpg')
const logoB64 = path.resolve(here, 'logo.jpg.b64')
if (!fs.existsSync(logo) && fs.existsSync(logoB64)) {
  fs.mkdirSync(path.dirname(logo), { recursive: true })
  fs.writeFileSync(logo, Buffer.from(fs.readFileSync(logoB64, 'utf8').replace(/\s+/g, ''), 'base64'))
}

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
