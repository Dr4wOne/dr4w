import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Separate from vite.config.ts so tests don't boot the Cloudflare runtime.
// Component tests opt into jsdom per file; worker tests run in node.
export default defineConfig({ plugins: [react()] })
