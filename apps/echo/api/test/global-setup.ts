import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ensureDynamoLocal, ensureTables, readTables } from '@dr4w/api-kit/local'

const projectDir = join(dirname(fileURLToPath(import.meta.url)), '../..')

/** Fresh test tables in dynamodb-local (started via docker compose if needed). */
export default async function setup() {
  await ensureDynamoLocal(join(projectDir, '../..'))
  await ensureTables({
    project: 'echo',
    env: 'test',
    tables: readTables(projectDir),
    fresh: true,
  })
}
