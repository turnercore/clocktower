import {
  clockFilledDisplayValue,
  clockFilledFromInput,
  clockFilledPercentage,
} from './clockFilled'

describe('clockFilled', () => {
  it('maps internal filled values to screen-reader display values', () => {
    expect(clockFilledDisplayValue(null)).toBe(0)
    expect(clockFilledDisplayValue(0)).toBe(1)
    expect(clockFilledDisplayValue(3)).toBe(4)
  })

  it('maps screen-reader input values back to zero-based filled values', () => {
    expect(clockFilledFromInput('1', 4)).toBe(0)
    expect(clockFilledFromInput('4', 4)).toBe(3)
    expect(clockFilledFromInput('0', 4)).toBeNull()
    expect(clockFilledFromInput('5', 4)).toBeNull()
  })

  it('calculates percentage filled from the stored value', () => {
    expect(clockFilledPercentage(null, 4)).toBe(0)
    expect(clockFilledPercentage(0, 4)).toBe(25)
    expect(clockFilledPercentage(1, 4)).toBe(50)
    expect(clockFilledPercentage(3, 4)).toBe(100)
  })
})
