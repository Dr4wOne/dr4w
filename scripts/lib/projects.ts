import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'

export const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
export const appsDir = join(repoRoot, 'apps')

export const Grant = z.enum(['table:read', 'table:write', 'bucket:read', 'queue:send', 'events'])

/** Schema of apps/<p>/project.json — see docs/architecture.md §3. */
export const Project = z.object({
  name: z.string().regex(/^[a-z][a-z0-9-]{1,19}$/),
  subdomain: z.string().regex(/^[a-z0-9][a-z0-9-]{0,62}$/),
  db: z.enum(['dynamo', 'pg', 'none']),
  uses: z.array(z.string()).default([]),
  exposes: z.record(z.string(), z.array(Grant)).default({}),
  status: z.enum(['poc', 'live', 'paused']),
  ports: z.object({ web: z.number().int(), api: z.number().int() }),
})
export type Project = z.infer<typeof Project>

export function readProject(name: string): Project {
  const file = join(appsDir, name, 'project.json')
  return Project.parse(JSON.parse(readFileSync(file, 'utf8')))
}

export function listProjects(): Project[] {
  if (!existsSync(appsDir)) return []
  return readdirSync(appsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(appsDir, d.name, 'project.json')))
    .map((d) => readProject(d.name))
}

/** Providers before consumers (by `uses`), so deploys apply in a safe order. */
export function sortByDependencies(projects: Project[]): Project[] {
  const byName = new Map(projects.map((p) => [p.name, p]))
  const out: Project[] = []
  const state = new Map<string, 'visiting' | 'done'>()
  const visit = (p: Project) => {
    if (state.get(p.name) === 'done') return
    if (state.get(p.name) === 'visiting') throw new Error(`Dependency cycle at ${p.name}`)
    state.set(p.name, 'visiting')
    for (const dep of p.uses) {
      const d = byName.get(dep)
      if (d) visit(d)
    }
    state.set(p.name, 'done')
    out.push(p)
  }
  for (const p of [...projects].sort((a, b) => a.name.localeCompare(b.name))) visit(p)
  return out
}
