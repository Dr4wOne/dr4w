import { cloudflare } from '@cloudflare/vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import project from '../project.json' with { type: 'json' }

export default defineConfig({
  // One Worker debugger port per project, so several projects can run side by side.
  plugins: [react(), cloudflare({ inspectorPort: 9229 + project.ports.web - 5173 })],
  server: { port: project.ports.web, strictPort: true },
})
