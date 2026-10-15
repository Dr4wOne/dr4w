import { cloudflare } from '@cloudflare/vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import project from '../project.json' with { type: 'json' }

export default defineConfig({
  plugins: [react(), cloudflare()],
  server: { port: project.ports.web, strictPort: true },
})
