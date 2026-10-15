// pnpm new <name> [--subdomain <sub>] [--no-install]
// Copies templates/project to apps/<name>, fills tokens, assigns free dev ports.
import { execFileSync } from 'node:child_process'
import {
  copyFileSync,
  cpSync,
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import { appsDir, listProjects, Project, repoRoot } from './lib/projects.ts'

const RESERVED = new Set(['www', 'dr4w', 'api', 'mail'])

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: { subdomain: { type: 'string' }, 'no-install': { type: 'boolean', default: false } },
})
const name = positionals[0]
if (!name) {
  console.error('Usage: pnpm new <name> [--subdomain <sub>]')
  process.exit(1)
}
const subdomain = values.subdomain ?? name

const existing = listProjects()
const ports = {
  web: Math.max(5172, ...existing.map((p) => p.ports.web)) + 1,
  api: Math.max(8786, ...existing.map((p) => p.ports.api)) + 1,
}
const manifest = Project.safeParse({ name, subdomain, db: 'dynamo', status: 'poc', ports })
if (!manifest.success) {
  console.error(`Invalid name/subdomain: ${manifest.error.issues.map((i) => i.message).join('; ')}`)
  process.exit(1)
}
if (RESERVED.has(subdomain) || existing.some((p) => p.subdomain === subdomain)) {
  console.error(`Subdomain "${subdomain}" is reserved or taken`)
  process.exit(1)
}
const target = join(appsDir, name)
if (existsSync(target)) {
  console.error(`apps/${name} already exists`)
  process.exit(1)
}

const tokens: Record<string, string> = {
  __NAME__: name,
  __SUBDOMAIN__: subdomain,
  __WEB_PORT__: String(ports.web),
  __API_PORT__: String(ports.api),
  __COMPAT_DATE__: new Date().toISOString().slice(0, 10),
}

cpSync(join(repoRoot, 'templates/project'), target, { recursive: true })
for (const file of walk(target)) {
  const text = readFileSync(file, 'utf8')
  const filled = text.replace(/__[A-Z_]+__/g, (t) => tokens[t] ?? t)
  if (filled !== text) writeFileSync(file, filled)
}
copyFileSync(join(target, 'api/.env.example'), join(target, 'api/.env.local'))
copyFileSync(join(target, 'web/.dev.vars.example'), join(target, 'web/.dev.vars'))

console.info(`Created apps/${name} (web :${ports.web}, api :${ports.api})`)
if (!values['no-install']) execFileSync('pnpm', ['install'], { cwd: repoRoot, stdio: 'inherit' })
console.info(`Next: pnpm --filter ${name} dev`)

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry)
    if (statSync(p).isDirectory()) yield* walk(p)
    else yield p
  }
}
