// Extracts an error message from an error object
// Returns the error message as a string
// If no error message is present, returns the default error message
const extractErrorMessage = (
  error: string | Error | unknown,
  defaultErrorMessage?: string,
): string => {
  if (typeof error === 'string') return error

  if (error instanceof Error) return error.message

  return defaultErrorMessage || 'Unknown error has occured.'
}

export default extractErrorMessage
