import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'

let client: DynamoDBDocumentClient | undefined

/** DocumentClient; points at dynamodb-local when `DYNAMO_ENDPOINT` is set. */
export function ddb(): DynamoDBDocumentClient {
  client ??= DynamoDBDocumentClient.from(new DynamoDBClient(localConfig()), {
    marshallOptions: { removeUndefinedValues: true },
  })
  return client
}

function localConfig() {
  const endpoint = process.env.DYNAMO_ENDPOINT
  if (!endpoint) return {}
  return {
    endpoint,
    region: process.env.AWS_REGION ?? 'us-east-1',
    credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
  }
}
