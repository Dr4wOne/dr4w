import { z } from 'zod'

export const Entry = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1).max(40),
  message: z.string().trim().min(1).max(280),
  createdAt: z.iso.datetime(),
})
export type Entry = z.infer<typeof Entry>

export const CreateEntry = Entry.pick({ name: true, message: true })
export type CreateEntry = z.infer<typeof CreateEntry>

export const GuestbookStats = z.object({ total: z.number().int().nonnegative() })
export type GuestbookStats = z.infer<typeof GuestbookStats>
