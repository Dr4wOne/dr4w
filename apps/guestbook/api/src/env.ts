import { parseEnv } from '@dr4w/api-kit'
import { z } from 'zod'

/** Every env var the app reads. Lambda values come from infra; local ones from .env.local. */
export const env = parseEnv(
  z.object({
    TABLE_NAME: z.string().min(1),
  }),
)
