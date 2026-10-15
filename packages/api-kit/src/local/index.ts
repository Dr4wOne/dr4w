// Node-only helpers for local dev, seeding and tests. Never imported by Lambda code.
export { ensureDynamoLocal } from './dynamo-local.ts'
export { ensureTables, localClient, readTables, TablesFile, tableName } from './tables.ts'
