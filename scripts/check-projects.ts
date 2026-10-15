// pnpm check:projects — validate every apps/*/project.json and the cross-project contract:
// `uses` must name existing projects that list the consumer in their `exposes`.
import { listProjects, type Project } from './lib/projects.ts'

export function contractErrors(projects: Project[]): string[] {
  const byName = new Map(projects.map((p) => [p.name, p]))
  const errors: string[] = []
  const subdomains = new Map<string, string>()
  for (const p of projects) {
    const clash = subdomains.get(p.subdomain)
    if (clash) errors.push(`${p.name}: subdomain "${p.subdomain}" also used by ${clash}`)
    subdomains.set(p.subdomain, p.name)
    for (const dep of p.uses) {
      const provider = byName.get(dep)
      if (!provider) errors.push(`${p.name}: uses unknown project "${dep}"`)
      else if (!provider.exposes[p.name]?.length)
        errors.push(`${p.name}: uses "${dep}", but ${dep}.exposes has no entry for ${p.name}`)
    }
    for (const consumer of Object.keys(p.exposes)) {
      if (!byName.has(consumer)) errors.push(`${p.name}: exposes to unknown project "${consumer}"`)
    }
  }
  return errors
}

if (import.meta.main) {
  const errors = contractErrors(listProjects()) // listProjects() already zod-validates each file
  for (const e of errors) console.error(`✗ ${e}`)
  if (errors.length) process.exit(1)
  console.info('✓ project manifests and cross-project contract are valid')
}
