export function getActionErrorMessage(error: unknown, fallback: string): string {
  return typeof error === 'string' ? error : fallback
}
