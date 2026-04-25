export const MAX_CLOCK_LINE_WIDTH = 50

export const isFullWedgeLineWidth = (lineWidth: number) =>
  lineWidth >= MAX_CLOCK_LINE_WIDTH

export const clockChartLineWidth = (lineWidth: number, rounded: boolean) => {
  if (isFullWedgeLineWidth(lineWidth)) return 100

  return rounded ? lineWidth / 2 : lineWidth
}

export const clockChartPaddingAngle = (lineWidth: number, rounded: boolean) => {
  if (isFullWedgeLineWidth(lineWidth)) return 0

  return rounded ? lineWidth : lineWidth / 4
}

export const clockChartRounded = (lineWidth: number, rounded: boolean) => {
  if (isFullWedgeLineWidth(lineWidth)) return false

  return rounded
}
