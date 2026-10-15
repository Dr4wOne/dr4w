// pnpm dev [project...]  — run one or more projects fully offline.
// Starts local services, seeds tables, then runs each project's api + web with prefixed logs.
// pnpm dev:cloud <project> — same, but the API uses the project's REAL prod resources
// (AWS_PROFILE=dr4w, names from SSM /dr4w/<p>/prod/*). Events are logged, not published.
import { type ChildProcess, execFileSync, spawn } from 'node:child_process'
import { copyFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { createInterface } from 'node:readline/promises'
import { GetParametersByPathCommand, SSMClient } from '@aws-sdk/client-ssm'
import { appsDir, listProjects, readProject, repoRoot } from './lib/projects.ts'
import { seed } from './seed.ts'

const cloud = process.argv.includes('--cloud')
let names = process.argv.slice(2).filter((a) => a !== '--cloud')
if (cloud && names.length !== 1) throw new Error('Usage: pnpm dev:cloud <project>')
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

// Local event wiring: a provider's publish() POSTs to every *running* consumer that it
// exposes `events` to (mirrors the event-subscription modules in the cloud).
const running = names.map(readProject)
const eventTargets = (provider: string) =>
  running
    .filter((c) => c.uses.includes(provider))
    .filter((c) => readProject(provider).exposes[c.name]?.includes('events'))
    .map((c) => `http://localhost:${c.ports.api}/api/_events`)
    .join(',')

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
  if (cloud) {
    const env = await cloudEnv(name)
    console.info(
      `☁ ${name}: API uses REAL prod resources (${Object.values(env).filter(Boolean).join(', ')})`,
    )
    console.info(`▶ ${name}: web http://localhost:${project.ports.web} · api :${project.ports.api}`)
    children.push(run(`${name}:api`, `${name}-api`, env), run(`${name}:web`, `${name}-web`))
    continue
  }
  if (project.db === 'pg') {
    execFileSync('docker', ['compose', '--profile', 'pg', 'up', '-d', '--wait', 'postgres'], {
      cwd: repoRoot,
      stdio: 'inherit',
    })
  }
  await seed(name)
  console.info(`▶ ${name}: web http://localhost:${project.ports.web} · api :${project.ports.api}`)
  const targets = eventTargets(name)
  if (targets) console.info(`  ${name} events → ${targets}`)
  children.push(
    run(`${name}:api`, `${name}-api`, { DEV_EVENT_TARGETS: targets }),
    run(`${name}:web`, `${name}-web`),
  )
}

/** Env for a local API pointed at the deployed stack: resource names from SSM, SSO creds. */
async function cloudEnv(name: string): Promise<Record<string, string>> {
  const profile = process.env.AWS_PROFILE ?? 'dr4w'
  const prefix = `/dr4w/${name}/prod/`
  const ssm = new SSMClient({ profile, region: 'us-east-1' })
  const params: Record<string, string> = {}
  let NextToken: string | undefined
  do {
    const res = await ssm.send(new GetParametersByPathCommand({ Path: prefix, NextToken }))
    for (const p of res.Parameters ?? []) {
      if (p.Type === 'String' && p.Name && p.Value) params[p.Name.slice(prefix.length)] = p.Value
    }
    NextToken = res.NextToken
  } while (NextToken)
  if (!params.api_url) throw new Error(`${name} isn't deployed (no ${prefix}api_url)`)
  const tables = Object.fromEntries(
    Object.entries(params)
      .filter(([k]) => /^table_.+_name$/.test(k))
      .map(([k, v]) => [k === 'table_main_name' ? 'TABLE_NAME' : k.toUpperCase(), v]),
  )
  // Empty values override .env.local (process.loadEnvFile never replaces existing vars).
  return {
    AWS_PROFILE: profile,
    AWS_REGION: 'us-east-1',
    DYNAMO_ENDPOINT: '',
    BUS_NAME: '',
    DEV_EVENT_TARGETS: '',
    ...tables,
  }
}

function run(label: string, pkg: string, extraEnv: Record<string, string> = {}) {
  // Own process group, so shutdown can stop pnpm *and* the vite/tsx/workerd it spawned.
  const child = spawn('pnpm', ['--filter', pkg, 'dev'], {
    cwd: repoRoot,
    env: { ...process.env, ...extraEnv },
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
