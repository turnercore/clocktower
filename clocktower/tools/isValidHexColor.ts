export const isValidHexColor = (colorString: string): boolean => {
  const hexColorRegex = /^#([0-9A-F]{3}){1,2}$/i
  return hexColorRegex.test(colorString)
}