import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Separate from vite.config.ts so tests don't boot the Cloudflare runtime.
// Component tests opt into jsdom per file; worker tests run in node. e2e/ is Playwright's.
export default defineConfig({
  plugins: [react()],
  test: { include: ['src/**/*.test.{ts,tsx}', 'worker/**/*.test.ts'] },
})
