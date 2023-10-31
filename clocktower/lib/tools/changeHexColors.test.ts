import { lightenHexColor, darkenHexColor } from './changeHexColors'

describe('Color manipulation functions', () => {
  describe('lightenHexColor', () => {
    it('should lighten the color by the given factor', () => {
      expect(lightenHexColor('#000000', 0.5)).toBe('#7f7f7f')
      expect(lightenHexColor('#00ff00', 0.5)).toBe('#7fff7f')
      expect(lightenHexColor('#ff0000', 0.5)).toBe('#ff7f7f')
    })

    it('should handle hex values without a #', () => {
      expect(lightenHexColor('000000', 0.5)).toBe('#7f7f7f')
    })

    it('should not exceed #ffffff when lightening', () => {
      expect(lightenHexColor('#ffffff', 0.5)).toBe('#ffffff')
    })
  })

  describe('darkenHexColor', () => {
    it('should darken the color by the given factor', () => {
      expect(darkenHexColor('#ffffff', 0.5)).toBe('#7f7f7f')
      expect(darkenHexColor('#00ff00', 0.5)).toBe('#007f00')
      expect(darkenHexColor('#ff0000', 0.5)).toBe('#7f0000')
    })

    it('should handle hex values without a #', () => {
      expect(darkenHexColor('ffffff', 0.5)).toBe('#7f7f7f')
    })

    it('should not go below #000000 when darkening', () => {
      expect(darkenHexColor('#000000', 0.5)).toBe('#000000')
    })
  })
})
