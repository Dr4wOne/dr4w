// pnpm changed [base-ref]  →  JSON array of project names to plan/deploy, providers first.
// A change under a shared path (packages/, infra/modules/, lockfile, …) affects every project.
import { execFileSync } from 'node:child_process'
import { listProjects, sortByDependencies } from './lib/projects.ts'

export const SHARED_PATHS = [
  'packages/',
  'infra/modules/',
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  'tsconfig.base.json',
  'scripts/build-lambda.ts',
]

export function changedProjects(files: string[], projects: string[]): string[] {
  if (files.some((f) => SHARED_PATHS.some((s) => f === s || f.startsWith(s)))) return projects
  const touched = new Set(files.map((f) => f.match(/^apps\/([^/]+)\//)?.[1]).filter(Boolean))
  return projects.filter((p) => touched.has(p))
}

if (import.meta.main) {
  const base = process.argv[2] ?? process.env.BASE_SHA ?? 'origin/main'
  const files = execFileSync('git', ['diff', '--name-only', `${base}...HEAD`], { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean)
  const names = sortByDependencies(listProjects()).map((p) => p.name)
  console.info(JSON.stringify(changedProjects(files, names)))
}
