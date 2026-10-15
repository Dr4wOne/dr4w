import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  type AttributeDefinition,
  CreateTableCommand,
  DeleteTableCommand,
  DynamoDBClient,
  ResourceInUseException,
  ResourceNotFoundException,
} from '@aws-sdk/client-dynamodb'
import { z } from 'zod'

/**
 * `apps/<p>/infra/tables.json` — the single source of a project's table key schemas.
 * OpenTofu reads the same file with `jsondecode`, so local and cloud cannot drift.
 */
const KeyType = z.enum(['S', 'N', 'B'])
const TableSpec = z.object({
  hashKey: z.string(),
  rangeKey: z.string().optional(),
  attributes: z.record(z.string(), KeyType),
  globalSecondaryIndexes: z
    .array(z.object({ name: z.string(), hashKey: z.string(), rangeKey: z.string().optional() }))
    .default([]),
  ttlAttribute: z.string().optional(),
})
export const TablesFile = z.record(z.string().regex(/^[a-z][a-z0-9-]*$/), TableSpec)
export type TablesFile = z.infer<typeof TablesFile>

export const tableName = (project: string, env: string, key: string) =>
  `dr4w-${project}-${env}-${key}`

export function readTables(projectDir: string): TablesFile {
  const raw = readFileSync(join(projectDir, 'infra', 'tables.json'), 'utf8')
  return TablesFile.parse(JSON.parse(raw))
}

export function localClient(endpoint = 'http://localhost:8100') {
  return new DynamoDBClient({
    endpoint,
    region: 'us-east-1',
    credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
  })
}

/** Create (or with `fresh`, recreate) every table of a project. Idempotent. */
export async function ensureTables(opts: {
  project: string
  env: string
  tables: TablesFile
  endpoint?: string
  fresh?: boolean
}) {
  const client = localClient(opts.endpoint)
  const names: string[] = []
  for (const [key, spec] of Object.entries(opts.tables)) {
    const TableName = tableName(opts.project, opts.env, key)
    names.push(TableName)
    if (opts.fresh) {
      await client.send(new DeleteTableCommand({ TableName })).catch((err) => {
        if (!(err instanceof ResourceNotFoundException)) throw err
      })
    }
    const keySchema = (hash: string, range?: string) => [
      { AttributeName: hash, KeyType: 'HASH' as const },
      ...(range ? [{ AttributeName: range, KeyType: 'RANGE' as const }] : []),
    ]
    const AttributeDefinitions: AttributeDefinition[] = Object.entries(spec.attributes).map(
      ([AttributeName, AttributeType]) => ({ AttributeName, AttributeType }),
    )
    const gsis = spec.globalSecondaryIndexes.map((g) => ({
      IndexName: g.name,
      KeySchema: keySchema(g.hashKey, g.rangeKey),
      Projection: { ProjectionType: 'ALL' as const },
    }))
    await client
      .send(
        new CreateTableCommand({
          TableName,
          BillingMode: 'PAY_PER_REQUEST',
          AttributeDefinitions,
          KeySchema: keySchema(spec.hashKey, spec.rangeKey),
          ...(gsis.length ? { GlobalSecondaryIndexes: gsis } : {}),
        }),
      )
      .catch((err) => {
        if (!(err instanceof ResourceInUseException)) throw err
      })
  }
  client.destroy()
  return names
}
