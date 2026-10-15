// pnpm doctor — are this machine's tools and access ready for dr4w?
// ✅ ok · ⚠️ needed only for cloud work (or advisory) · ❌ blocks local dev. Exit 1 on any ❌.
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { repoRoot } from './lib/projects.ts'

type Level = 'ok' | 'warn' | 'fail'
interface Check {
  name: string
  level: Level
  detail: string
  fix?: string
}

const read = (f: string) => readFileSync(join(repoRoot, f), 'utf8').trim()
const run = (cmd: string, args: string[], cwd = repoRoot) => {
  try {
    return execFileSync(cmd, args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 20_000,
    }).trim()
  } catch {
    return null
  }
}
const versionOf = (out: string | null) =>
  out
    ?.match(/(\d+)\.(\d+)\.(\d+)/)
    ?.slice(1)
    .map(Number)
const atLeast = (v: number[] | undefined, min: number[]) =>
  !!v &&
  (v[0]! !== min[0]! ? v[0]! > min[0]! : v[1]! !== min[1]! ? v[1]! > min[1]! : v[2]! >= min[2]!)

export function checks(): Check[] {
  const out: Check[] = []
  const add = (name: string, ok: boolean, detail: string, fix: string, failLevel: Level = 'fail') =>
    out.push({ name, level: ok ? 'ok' : failLevel, detail, fix: ok ? undefined : fix })

  // Local dev (required) — versions come from the same files docs/stack.md cites.
  const nodeMajor = read('.nvmrc')
  add(
    'node',
    process.versions.node.split('.')[0] === nodeMajor,
    `v${process.versions.node} (want ${nodeMajor}.x, .nvmrc)`,
    `nvm install ${nodeMajor}`,
  )
  const pnpmWant = JSON.parse(read('package.json')).packageManager.split('@')[1]
  const pnpmHave = run('pnpm', ['--version'])
  add(
    'pnpm',
    pnpmHave === pnpmWant,
    `${pnpmHave ?? 'missing'} (want ${pnpmWant})`,
    `corepack prepare pnpm@${pnpmWant} --activate`,
  )
  const docker = run('docker', ['info', '--format', '{{.ServerVersion}}'])
  add(
    'docker running',
    !!docker,
    docker ? `server ${docker}` : 'not reachable',
    'start Docker (Docker Desktop, or: sudo systemctl start docker)',
  )
  add(
    'docker compose',
    !!run('docker', ['compose', 'version']),
    'compose v2',
    'install the Docker Compose plugin',
  )

  // Cloud work (warn)
  const tofuWant = read('.opentofu-version')
  const tofuHave = versionOf(run('tofu', ['version']))?.join('.')
  add(
    'opentofu',
    tofuHave === tofuWant,
    `${tofuHave ?? 'missing'} (want ${tofuWant}, .opentofu-version)`,
    'docs/setup-new-machine.md §1',
    'warn',
  )
  const awsV = versionOf(run('aws', ['--version']))
  add(
    'aws cli',
    atLeast(awsV, [2, 9, 0]),
    `${awsV?.join('.') ?? 'missing'} (want ≥ 2.9)`,
    'docs/setup-new-machine.md §1',
    'warn',
  )
  const gh = run('gh', ['auth', 'status'])
  add(
    'github cli',
    gh !== null,
    gh !== null ? 'logged in' : 'missing or logged out',
    'gh auth login',
    'warn',
  )
  const sso = run('aws', [
    'sts',
    'get-caller-identity',
    '--profile',
    'dr4w',
    '--query',
    'Arn',
    '--output',
    'text',
  ])
  add(
    'aws sso (profile dr4w)',
    !!sso?.includes('AWSReservedSSO'),
    sso ?? 'no valid session',
    'aws sso login --profile dr4w (setup: docs/setup-new-machine.md §3)',
    'warn',
  )
  const wrangler = run('pnpm', ['exec', 'wrangler', 'whoami'], join(repoRoot, 'apps/hello/web'))
  const cfLoggedIn = !!wrangler && !/not authenticated/i.test(wrangler)
  add(
    'cloudflare (optional)',
    cfLoggedIn,
    cfLoggedIn ? 'wrangler logged in' : 'not logged in — fine, CI deploys',
    'cd apps/hello/web && pnpm exec wrangler login',
    'warn',
  )

  // Agent plugins (docs/agent-tools.md) — enabled for this repo in its project settings.
  const listed = run('claude', ['plugin', 'list', '--json'])
  let plugins: { id?: string; name?: string; enabled?: boolean }[] = []
  try {
    const parsed = listed ? JSON.parse(listed) : []
    plugins = Array.isArray(parsed) ? parsed : (parsed.plugins ?? [])
  } catch {
    plugins = []
  }
  for (const [id, cmds] of [
    ['caveman@caveman', '/plugin marketplace add JuliusBrussee/caveman  then  /plugin install caveman@caveman'],
    ['ponytail@ponytail', '/plugin marketplace add DietrichGebert/ponytail  then  /plugin install ponytail@ponytail'],
  ] as const) {
    const p = plugins.find((x) => (x.id ?? x.name) === id || x.name === id.split('@')[0])
    const ok = !!p && p.enabled !== false
    add(`plugin ${id.split('@')[0]}`, ok, listed === null ? 'claude CLI not found' : p ? (ok ? 'installed, enabled' : 'installed, disabled') : 'not installed', `in Claude Code: ${cmds}`, 'warn')
  }
  const cavemanCli = run('sh', ['-c', 'command -v caveman'])
  add('caveman CLI absent', !cavemanCli, cavemanCli ? `found at ${cavemanCli} (sends telemetry by default)` : 'not installed (good)', 'see docs/agent-tools.md → Optional: the caveman CLI', 'warn')

  // Advisory
  const creds = join(homedir(), '.aws', 'credentials')
  const hasKeys = existsSync(creds) && /aws_access_key_id\s*=/.test(readFileSync(creds, 'utf8'))
  add(
    'no long-lived AWS keys',
    !hasKeys,
    hasKeys ? `access keys found in ${creds}` : 'none',
    'delete the keys (console + file); use SSO',
    'warn',
  )
  return out
}

if (import.meta.main) {
  const icon = { ok: '✅', warn: '⚠️ ', fail: '❌' }
  const results = checks()
  for (const c of results) {
    console.info(`${icon[c.level]} ${c.name.padEnd(24)} ${c.detail}${c.fix ? `  → ${c.fix}` : ''}`)
  }
  if (results.some((c) => c.level === 'fail')) process.exit(1)
}
