export const lightenHexColor = (hex: string, factor: number): string => {
  // Remove the '#' from the beginning of the hex code if it exists
  hex = hex.replace('#', '')

  // Convert hex to RGB
  const [r, g, b] = hex.match(/\w\w/g)!.map((x) => parseInt(x, 16))

  // Lighten each color component
  const lighten = (color: number) => Math.min(255, Math.max(0, Math.floor(color + (255 - color) * factor)))

  // Convert back to hex
  const componentToHex = (color: number) => {
    const hex = color.toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }

  return `#${componentToHex(lighten(r))}${componentToHex(lighten(g))}${componentToHex(lighten(b))}`
}

export const darkenHexColor = (hex: string, factor: number): string => {
  // Remove the '#' from the beginning of the hex code if it exists
  hex = hex.replace('#', '')

  // Convert hex to RGB
  const [r, g, b] = hex.match(/\w\w/g)!.map((x) => parseInt(x, 16))

  // Darken each color component
  const darken = (color: number) => Math.min(255, Math.max(0, Math.floor(color * (1 - factor))))

  // Convert back to hex
  const componentToHex = (color: number) => {
    const hex = color.toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }

  return `#${componentToHex(darken(r))}${componentToHex(darken(g))}${componentToHex(darken(b))}`
}