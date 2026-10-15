// pnpm ideas — the idea board: every ideas/<slug>/00-idea.md with its frontmatter status.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { repoRoot } from './lib/projects.ts'

export interface Idea {
  slug: string
  title: string
  status: string
  project: string
  updated: string
}

const ORDER = ['idea', 'refined', 'specified', 'planned', 'poc', 'live', 'dropped']

export function parseFrontmatter(text: string): Record<string, string> {
  const block = text.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? ''
  return Object.fromEntries(
    block
      .split('\n')
      .map((line) => line.match(/^([\w-]+):\s*(.*)$/))
      .filter((m): m is RegExpMatchArray => m !== null)
      .map((m) => [m[1], (m[2] ?? '').replace(/^["']|["']$/g, '')]),
  )
}

export function readIdeas(dir = join(repoRoot, 'ideas')): Idea[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('_'))
    .flatMap((d) => {
      const file = join(dir, d.name, '00-idea.md')
      if (!existsSync(file)) return []
      const fm = parseFrontmatter(readFileSync(file, 'utf8'))
      return [
        {
          slug: d.name,
          title: fm.title ?? '',
          status: fm.status ?? '?',
          project: fm.project ?? '',
          updated: fm.updated ?? '',
        },
      ]
    })
    .sort(
      (a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status) || a.slug.localeCompare(b.slug),
    )
}

if (import.meta.main) {
  const ideas = readIdeas()
  if (ideas.length === 0) {
    console.info('No ideas yet — start one with /idea <one-liner>')
  } else {
    const rows = [
      ['SLUG', 'STATUS', 'PROJECT', 'UPDATED', 'TITLE'],
      ...ideas.map((i) => [i.slug, i.status, i.project, i.updated, i.title]),
    ]
    const widths = rows[0]?.map((_, c) => Math.max(...rows.map((r) => (r[c] ?? '').length))) ?? []
    for (const r of rows)
      console.info(
        r
          .map((cell, c) => cell.padEnd(widths[c] ?? 0))
          .join('  ')
          .trimEnd(),
      )
  }
}
