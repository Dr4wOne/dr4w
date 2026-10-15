import { describe, expect, it } from 'vitest'
import { changedProjects } from './changed-projects.ts'
import { type Project, sortByDependencies } from './lib/projects.ts'

const all = ['hello', 'echo']

describe('changedProjects', () => {
  it('maps app paths to their project', () => {
    expect(changedProjects(['apps/echo/api/src/app.ts'], all)).toEqual(['echo'])
  })
  it('ignores docs and ideas', () => {
    expect(changedProjects(['docs/runbook.md', 'ideas/x/00-idea.md'], all)).toEqual([])
  })
  it('marks every project changed for shared packages and modules', () => {
    expect(changedProjects(['packages/api-kit/src/log.ts'], all)).toEqual(all)
    expect(changedProjects(['infra/modules/queue/main.tf'], all)).toEqual(all)
    expect(changedProjects(['pnpm-lock.yaml'], all)).toEqual(all)
  })
  it('ignores projects that no longer exist', () => {
    expect(changedProjects(['apps/gone/README.md'], all)).toEqual([])
  })
})

describe('sortByDependencies', () => {
  const p = (name: string, uses: string[] = []) => ({ name, uses }) as Project
  it('puts providers before consumers', () => {
    const order = sortByDependencies([p('echo', ['hello']), p('hello')]).map((x) => x.name)
    expect(order).toEqual(['hello', 'echo'])
  })
  it('throws on cycles', () => {
    expect(() => sortByDependencies([p('a', ['b']), p('b', ['a'])])).toThrow(/cycle/)
  })
})
