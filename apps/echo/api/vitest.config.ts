import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globalSetup: './test/global-setup.ts',
    env: {
      TABLE_NAME: 'dr4w-echo-test-main',
      DYNAMO_ENDPOINT: 'http://localhost:8100',
      ORIGIN_SECRET: 'test-secret',
      LOG_LEVEL: 'warn',
    },
  },
})
