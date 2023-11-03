export default function extractErrorMessage(
  error: string | Error | unknown,
  defaultErrorMessage?: string,
): string {
  if (typeof error === 'string') return error

  if (error instanceof Error) return error.message

  return defaultErrorMessage || 'Unknown error has occured.'
}
