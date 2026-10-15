import type { z } from 'zod'

/** Parse process.env once at startup; fail fast with a readable message. */
export function parseEnv<S extends z.ZodType>(schema: S, source = process.env): z.infer<S> {
  const result = schema.safeParse(source)
  if (!result.success) {
    const fields = result.error.issues.map((i) => i.path.join('.')).join(', ')
    throw new Error(`Invalid environment: ${fields}`)
  }
  return result.data
}
