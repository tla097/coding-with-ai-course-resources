import { z } from 'zod'

type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; fieldErrors: Record<string, string[] | undefined> }

export function parseActionInput<T>(
  schema: z.ZodType<T>,
  input: unknown,
): ParseResult<T> {
  const parsed = schema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors }
  }
  return { ok: true, data: parsed.data }
}
