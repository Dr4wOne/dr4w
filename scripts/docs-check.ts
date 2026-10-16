// pnpm docs:check — broken relative links and paths in Markdown, missing per-project docs,
// and a stale docs/STATUS.md (warning only). Exit 1 on errors.
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { listProjects, repoRoot } from './lib/projects.ts'

/** Paths a Markdown file points at: [text](link) targets and `backticked/repo/paths.ext`. */
export function referencedPaths(markdown: string): string[] {
  const text = markdown.replace(/^(```|~~~)[\s\S]*?^\1/gm, '') // skip fenced code blocks
  const links = [...text.matchAll(/\]\(([^)\s]+)\)/g)].map((m) => m[1] ?? '')
  const ticks = [...text.matchAll(/`([^`\s]+)`/g)].map((m) => m[1] ?? '')
  const isRepoPath = (p: string) =>
    /^[\w.@-]+(\/[\w.@-]+)*\/?$/.test(p) &&
    p.includes('/') &&
    !p.startsWith('@') &&
    (p.endsWith('/') || /\.[a-z0-9]+$/i.test(p.split('/').pop() ?? ''))
  return [
    ...links.filter((l) => !/^([a-z]+:|#|mailto:)/i.test(l)).map((l) => l.split('#')[0] ?? ''),
    ...ticks.filter(isRepoPath),
  ].filter(Boolean)
}

const GENERATED =
  /(^|\/)(dist|\.wrangler|node_modules|\.terraform|\.build)(\/|$)|\.tfstate$|\.env\.local$|\.dev\.vars$/

/**
 * A path resolves if it exists relative to the doc or the repo root, or if it is a
 * project-relative path (e.g. `api/src/env.ts`) that matches the end of a tracked file.
 */
export function resolves(path: string, fromFile: string, tracked: string[] = []): boolean {
  if (GENERATED.test(path)) return true
  // apps/<name>/… for a project that doesn't exist yet: a doc describing what to create.
  const project = path.match(/^apps\/([^/]+)\//)?.[1]
  if (project && !existsSync(join(repoRoot, 'apps', project))) return true
  if (existsSync(join(dirname(fromFile), path)) || existsSync(join(repoRoot, path))) return true
  const tail = path.replace(/^(\.\.\/)+/, '')
  return tracked.some((t) => t.endsWith(`/${tail}`) || t.includes(`/${tail.replace(/\/$/, '')}/`))
}

if (import.meta.main) {
  const errors: string[] = []
  const files = execFileSync('git', ['ls-files', '*.md'], { cwd: repoRoot, encoding: 'utf8' })
    .split('\n')
    // SPEC is historical; idea specs/plans name files that don't exist yet.
    .filter(
      (f) =>
        f && !f.startsWith('templates/') && f !== 'docs/SPEC.md' && !/^ideas\/[^/]+\/0\d/.test(f),
    )
  const tracked = execFileSync('git', ['ls-files'], { cwd: repoRoot, encoding: 'utf8' }).split('\n')
  for (const f of files) {
    const abs = join(repoRoot, f)
    for (const p of new Set(referencedPaths(readFileSync(abs, 'utf8')))) {
      if (!resolves(p, abs, tracked)) errors.push(`${f}: broken reference \`${p}\``)
    }
  }
  for (const p of listProjects()) {
    for (const doc of ['README.md', 'CLAUDE.md']) {
      if (!existsSync(join(repoRoot, 'apps', p.name, doc)))
        errors.push(`apps/${p.name}/${doc} is missing`)
    }
  }
  const lastStatus = execFileSync('git', ['log', '-1', '--format=%H', '--', 'docs/STATUS.md'], {
    cwd: repoRoot,
    encoding: 'utf8',
  }).trim()
  const behind = lastStatus
    ? Number(
        execFileSync('git', ['rev-list', '--count', `${lastStatus}..HEAD`], {
          cwd: repoRoot,
          encoding: 'utf8',
        }).trim(),
      )
    : 0
  if (behind > 20)
    console.warn(`⚠️  docs/STATUS.md last changed ${behind} commits ago — run /handoff`)

  for (const e of errors) console.error(`✗ ${e}`)
  if (errors.length) process.exit(1)
  console.info(`✓ ${files.length} Markdown files checked, per-project docs present`)
}
