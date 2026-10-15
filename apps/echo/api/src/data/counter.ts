import { GetCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb'
import { ddb } from '@dr4w/api-kit'
import { env } from '../env.ts'

const COUNTER = { pk: 'COUNTER', sk: 'notes-created' }
const DEDUPE_TTL_S = 7 * 24 * 3600

export interface NoteCount {
  count: number
  lastTitle: string | null
  lastAt: string | null
}

/**
 * Count a Note.Created event exactly once. EventBridge delivers at-least-once, so the event id
 * is recorded in the same transaction; a redelivery fails the condition and is ignored.
 */
export async function recordNoteCreated(eventId: string, title: string, at: string) {
  try {
    await ddb().send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: env.TABLE_NAME,
              Item: {
                pk: `EVENT#${eventId}`,
                sk: 'seen',
                expiresAt: Math.floor(Date.now() / 1000) + DEDUPE_TTL_S,
              },
              ConditionExpression: 'attribute_not_exists(pk)',
            },
          },
          {
            Update: {
              TableName: env.TABLE_NAME,
              Key: COUNTER,
              UpdateExpression: 'ADD #count :one SET lastTitle = :title, lastAt = :at',
              ExpressionAttributeNames: { '#count': 'count' },
              ExpressionAttributeValues: { ':one': 1, ':title': title, ':at': at },
            },
          },
        ],
      }),
    )
    return true
  } catch (err) {
    if (err instanceof Error && err.name === 'TransactionCanceledException') return false
    throw err
  }
}

export async function getNoteCount(): Promise<NoteCount> {
  const res = await ddb().send(new GetCommand({ TableName: env.TABLE_NAME, Key: COUNTER }))
  return {
    count: Number(res.Item?.count ?? 0),
    lastTitle: (res.Item?.lastTitle as string | undefined) ?? null,
    lastAt: (res.Item?.lastAt as string | undefined) ?? null,
  }
}
