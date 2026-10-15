import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb'
import { ddb } from '@dr4w/api-kit'
import type { CreateNote, Note, UpdateNote } from '@dr4w/contracts'
import { env } from '../env.ts'

// Single-table layout: pk = "NOTE", sk = <id>. Fine for small lists; add a GSI when it isn't.
const PK = 'NOTE'
const key = (id: string) => ({ pk: PK, sk: id })
const toNote = ({ pk: _pk, sk: _sk, ...note }: Record<string, unknown>) => note as Note
const isMissing = (err: unknown) =>
  err instanceof Error && err.name === 'ConditionalCheckFailedException'

export async function listNotes(): Promise<Note[]> {
  const res = await ddb().send(
    new QueryCommand({
      TableName: env.TABLE_NAME,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: { ':pk': PK },
    }),
  )
  return (res.Items ?? []).map(toNote).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function getNote(id: string): Promise<Note | undefined> {
  const res = await ddb().send(new GetCommand({ TableName: env.TABLE_NAME, Key: key(id) }))
  return res.Item && toNote(res.Item)
}

export async function createNote(input: CreateNote): Promise<Note> {
  const now = new Date().toISOString()
  const note: Note = {
    id: crypto.randomUUID(),
    title: input.title,
    body: input.body ?? '',
    createdAt: now,
    updatedAt: now,
  }
  await ddb().send(
    new PutCommand({ TableName: env.TABLE_NAME, Item: { ...key(note.id), ...note } }),
  )
  return note
}

export async function updateNote(id: string, input: UpdateNote): Promise<Note | undefined> {
  const fields = { ...input, updatedAt: new Date().toISOString() }
  const names = Object.keys(fields)
  try {
    const res = await ddb().send(
      new UpdateCommand({
        TableName: env.TABLE_NAME,
        Key: key(id),
        UpdateExpression: `SET ${names.map((n) => `#${n} = :${n}`).join(', ')}`,
        ExpressionAttributeNames: Object.fromEntries(names.map((n) => [`#${n}`, n])),
        ExpressionAttributeValues: Object.fromEntries(
          Object.entries(fields).map(([n, v]) => [`:${n}`, v]),
        ),
        ConditionExpression: 'attribute_exists(pk)',
        ReturnValues: 'ALL_NEW',
      }),
    )
    return res.Attributes && toNote(res.Attributes)
  } catch (err) {
    if (isMissing(err)) return undefined
    throw err
  }
}

export async function deleteNote(id: string): Promise<boolean> {
  try {
    await ddb().send(
      new DeleteCommand({
        TableName: env.TABLE_NAME,
        Key: key(id),
        ConditionExpression: 'attribute_exists(pk)',
      }),
    )
    return true
  } catch (err) {
    if (isMissing(err)) return false
    throw err
  }
}
