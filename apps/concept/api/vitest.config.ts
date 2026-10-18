import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    env: {
      ORIGIN_SECRET: 'test-secret',
      LOG_LEVEL: 'warn',
    },
  },
})
