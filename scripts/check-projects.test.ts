import { describe, expect, it } from 'vitest'
import { contractErrors } from './check-projects.ts'
import type { Project } from './lib/projects.ts'

const p = (name: string, extra: Partial<Project> = {}): Project => ({
  name,
  subdomain: name,
  db: 'dynamo',
  uses: [],
  exposes: {},
  status: 'poc',
  ports: { web: 1, api: 2 },
  ...extra,
})

describe('contractErrors', () => {
  it('accepts a consumer the provider exposes to', () => {
    expect(
      contractErrors([
        p('hello', { exposes: { echo: ['events'] } }),
        p('echo', { uses: ['hello'] }),
      ]),
    ).toEqual([])
  })
  it('rejects uses without a matching exposes entry', () => {
    expect(contractErrors([p('hello'), p('echo', { uses: ['hello'] })])).toEqual([
      'echo: uses "hello", but hello.exposes has no entry for echo',
    ])
  })
  it('rejects unknown projects and duplicate subdomains', () => {
    const errors = contractErrors([
      p('a', { uses: ['ghost'], exposes: { nobody: ['events'] } }),
      p('b', { subdomain: 'a' }),
    ])
    expect(errors).toHaveLength(3)
  })
})
