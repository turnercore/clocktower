import {
  MAX_CLOCK_LINE_WIDTH,
  clockChartLineWidth,
  clockChartPaddingAngle,
  clockChartRounded,
} from './clockChartGeometry'

describe('clockChartGeometry', () => {
  it('uses the stored donut geometry below max line width', () => {
    expect(clockChartLineWidth(20, false)).toBe(20)
    expect(clockChartLineWidth(20, true)).toBe(10)
    expect(clockChartPaddingAngle(20, false)).toBe(5)
    expect(clockChartPaddingAngle(20, true)).toBe(20)
    expect(clockChartRounded(20, true)).toBe(true)
  })

  it('renders max line width as full wedges', () => {
    expect(clockChartLineWidth(MAX_CLOCK_LINE_WIDTH, false)).toBe(100)
    expect(clockChartLineWidth(MAX_CLOCK_LINE_WIDTH, true)).toBe(100)
    expect(clockChartPaddingAngle(MAX_CLOCK_LINE_WIDTH, false)).toBe(0)
    expect(clockChartPaddingAngle(MAX_CLOCK_LINE_WIDTH, true)).toBe(0)
    expect(clockChartRounded(MAX_CLOCK_LINE_WIDTH, true)).toBe(false)
  })
})
