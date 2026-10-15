import { createLambdaHandler } from '@dr4w/api-kit'
import { app } from './app.ts'
import { events } from './events.ts'

// API Gateway requests → Hono app; dr4w-bus events → ./events.ts
export const handler = createLambdaHandler(app, events)
