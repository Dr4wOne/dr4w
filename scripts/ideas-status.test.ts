import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseFrontmatter, readIdeas } from './ideas-status.ts'

describe('parseFrontmatter', () => {
  it('reads simple key: value pairs', () => {
    expect(parseFrontmatter('---\ntitle: "A thing"\nstatus: poc\n---\nbody')).toEqual({
      title: 'A thing',
      status: 'poc',
    })
  })
})

describe('readIdeas', () => {
  it('lists ideas by stage and skips _template', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ideas-'))
    for (const [slug, status] of [
      ['b', 'live'],
      ['a', 'idea'],
      ['_template', 'idea'],
    ] as const) {
      mkdirSync(join(dir, slug))
      writeFileSync(join(dir, slug, '00-idea.md'), `---\ntitle: ${slug}\nstatus: ${status}\n---\n`)
    }
    expect(readIdeas(dir).map((i) => [i.slug, i.status])).toEqual([
      ['a', 'idea'],
      ['b', 'live'],
    ])
  })
})
