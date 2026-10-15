import { execFileSync } from 'node:child_process'
import { ListTablesCommand } from '@aws-sdk/client-dynamodb'
import { localClient } from './tables.ts'

async function isUp(endpoint: string) {
  const client = localClient(endpoint)
  try {
    await client.send(new ListTablesCommand({ Limit: 1 }))
    return true
  } catch {
    return false
  } finally {
    client.destroy()
  }
}

/** Starts the docker-compose `dynamodb-local` service if it is not reachable, then waits. */
export async function ensureDynamoLocal(repoRoot: string, endpoint = 'http://localhost:8100') {
  if (await isUp(endpoint)) return
  execFileSync('docker', ['compose', 'up', '-d', 'dynamodb-local'], {
    cwd: repoRoot,
    stdio: 'inherit',
  })
  for (let i = 0; i < 60; i++) {
    if (await isUp(endpoint)) return
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`dynamodb-local did not come up at ${endpoint}`)
}
