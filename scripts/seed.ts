// pnpm seed <project> [env]  — create the project's DynamoDB tables in dynamodb-local.
import { join } from 'node:path'
import { ensureDynamoLocal, ensureTables, readTables } from '@dr4w/api-kit/local'
import { appsDir, readProject, repoRoot } from './lib/projects.ts'

export async function seed(name: string, env = 'local') {
  const project = readProject(name)
  if (project.db !== 'dynamo') return []
  await ensureDynamoLocal(repoRoot)
  return ensureTables({ project: name, env, tables: readTables(join(appsDir, name)) })
}

if (import.meta.main) {
  const [name, env] = process.argv.slice(2)
  if (!name) throw new Error('Usage: pnpm seed <project> [env]')
  console.info(`Tables ready: ${(await seed(name, env)).join(', ')}`)
}
