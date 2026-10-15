import { createApi } from '@dr4w/web-kit'
import type { AppType } from 'guestbook-api'

export const api = createApi<AppType>().api
