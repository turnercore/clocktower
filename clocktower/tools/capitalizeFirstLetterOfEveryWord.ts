//capitalizeFirstLetterOfEveryWord.ts
// Capitilize the first letter of every word in a string
export function capitalizeFirstLetterOfEveryWord(string: string) {
  return string
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
