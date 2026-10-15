// pnpm dev [project...]  — run one or more projects fully offline.
// Starts local services, seeds tables, then runs each project's api + web with prefixed logs.
import { type ChildProcess, execFileSync, spawn } from 'node:child_process'
import { copyFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { createInterface } from 'node:readline/promises'
import { appsDir, listProjects, readProject, repoRoot } from './lib/projects.ts'
import { seed } from './seed.ts'

let names = process.argv.slice(2)
if (names.length === 0) {
  const all = listProjects()
  if (all.length === 0) throw new Error('No projects yet — run `pnpm new <name>`')
  for (const [i, p] of all.entries()) console.info(`  ${i + 1}) ${p.name}`)
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const answer = await rl.question('Project(s) to run (e.g. 1 or 1,2): ')
  rl.close()
  names = answer.split(',').map((n) => {
    const p = all[Number(n.trim()) - 1]
    if (!p) throw new Error(`No project #${n}`)
    return p.name
  })
}

const children: ChildProcess[] = []
for (const name of names) {
  const project = readProject(name)
  const dir = join(appsDir, name)
  for (const [example, local] of [
    ['api/.env.example', 'api/.env.local'],
    ['web/.dev.vars.example', 'web/.dev.vars'],
  ] as const) {
    if (!existsSync(join(dir, local))) copyFileSync(join(dir, example), join(dir, local))
  }
  if (project.db === 'pg') {
    execFileSync('docker', ['compose', '--profile', 'pg', 'up', '-d', '--wait', 'postgres'], {
      cwd: repoRoot,
      stdio: 'inherit',
    })
  }
  await seed(name)
  console.info(`▶ ${name}: web http://localhost:${project.ports.web} · api :${project.ports.api}`)
  children.push(run(`${name}:api`, `${name}-api`), run(`${name}:web`, `${name}-web`))
}

function run(label: string, pkg: string) {
  // Own process group, so shutdown can stop pnpm *and* the vite/tsx/workerd it spawned.
  const child = spawn('pnpm', ['--filter', pkg, 'dev'], {
    cwd: repoRoot,
    env: process.env,
    detached: true,
  })
  const prefix = (chunk: Buffer) =>
    chunk
      .toString()
      .split('\n')
      .filter(Boolean)
      .map((line) => `[${label}] ${line}`)
      .join('\n')
  // Once stopping, pnpm prints "recursive run failed" for the killed child — just noise.
  child.stdout?.on('data', (c: Buffer) => stopping || console.info(prefix(c)))
  child.stderr?.on('data', (c: Buffer) => stopping || console.error(prefix(c)))
  child.on('exit', (code) => {
    if (code && !stopping) console.error(`[${label}] exited with ${code}`)
    shutdown()
  })
  return child
}

let stopping = false
function shutdown() {
  if (stopping) return
  stopping = true
  for (const c of children) {
    try {
      if (c.pid) process.kill(-c.pid, 'SIGTERM')
    } catch {
      // group already gone
    }
  }
  setTimeout(() => process.exit(0), 3000).unref()
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
