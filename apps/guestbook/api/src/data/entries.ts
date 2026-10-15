import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { ddb } from '@dr4w/api-kit'
import type { CreateEntry, Entry } from '@dr4w/contracts'
import { env } from '../env.ts'

// pk = "ENTRY", sk = "<createdAt>#<id>" → a descending Query returns the newest first.
const PK = 'ENTRY'

export async function createEntry(input: CreateEntry): Promise<Entry> {
  const entry: Entry = { id: crypto.randomUUID(), ...input, createdAt: new Date().toISOString() }
  await ddb().send(
    new PutCommand({
      TableName: env.TABLE_NAME,
      Item: { pk: PK, sk: `${entry.createdAt}#${entry.id}`, ...entry },
    }),
  )
  return entry
}

export async function latestEntries(limit = 20): Promise<Entry[]> {
  const res = await ddb().send(
    new QueryCommand({
      TableName: env.TABLE_NAME,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: { ':pk': PK },
      ScanIndexForward: false,
      Limit: limit,
    }),
  )
  return (res.Items ?? []).map(({ pk: _pk, sk: _sk, ...e }) => e as Entry)
}

export async function countEntries(): Promise<number> {
  let total = 0
  let ExclusiveStartKey: Record<string, unknown> | undefined
  do {
    const res = await ddb().send(
      new QueryCommand({
        TableName: env.TABLE_NAME,
        KeyConditionExpression: 'pk = :pk',
        ExpressionAttributeValues: { ':pk': PK },
        Select: 'COUNT',
        ExclusiveStartKey,
      }),
    )
    total += res.Count ?? 0
    ExclusiveStartKey = res.LastEvaluatedKey
  } while (ExclusiveStartKey)
  return total
}
