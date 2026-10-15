import { describe, expect, it } from 'vitest'
import { referencedPaths } from './docs-check.ts'

describe('referencedPaths', () => {
  it('finds links and backticked repo paths, skipping code, URLs, packages and placeholders', () => {
    const md = [
      'See [guide](guides/deploy.md#steps) and `docs/stack.md` or `infra/modules/`.',
      'Not: `hono/client`, `@dr4w/api-kit`, `apps/<p>/README.md`, `/dr4w/hello/prod/api_url`, [x](https://a.b).',
      '```bash',
      'cat docs/does-not-exist.md',
      '```',
    ].join('\n')
    expect(referencedPaths(md)).toEqual(['guides/deploy.md', 'docs/stack.md', 'infra/modules/'])
  })
})
