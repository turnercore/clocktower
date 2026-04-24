export const clockFilledDisplayValue = (filled: number | null): number =>
  filled === null ? 0 : filled + 1

export const clockFilledPercentage = (
  filled: number | null,
  segments: number,
): number => {
  if (filled === null || segments <= 0) {
    return 0
  }

  return Math.floor((clockFilledDisplayValue(filled) / segments) * 100)
}

export const clockFilledFromInput = (
  value: string,
  segments: number,
): number | null => {
  const parsedValue = Number.parseInt(value, 10)

  if (Number.isNaN(parsedValue)) {
    return null
  }

  const filled = parsedValue - 1

  if (filled < 0 || filled >= segments) {
    return null
  }

  return filled
}
