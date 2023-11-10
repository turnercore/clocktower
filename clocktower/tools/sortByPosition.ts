type SortableByPosition =
  | {
      id: Key | null | undefined
      position?: number
    }
  | null
  | undefined
export function sortByPosition(
  array: Array<SortableByPosition>,
): Array<SortableByPosition> {
  // Pair each item with its original index
  const arrayWithIndices: Array<[SortableByPosition, number]> = array.map(
    (item, index) => [item, index],
  )

  // Sort the array first by position (or index if position doesn't exist), then by original index
  const sortedArrayWithIndices = arrayWithIndices.sort((a, b) => {
    const positionA =
      a[0] && typeof a[0] === 'object' && 'position' in a[0]
        ? a[0].position ?? a[1]
        : a[1]
    const positionB =
      b[0] && typeof b[0] === 'object' && 'position' in b[0]
        ? b[0].position ?? b[1]
        : b[1]

    // If positions are equal, use original index as tie-breaker
    if (positionA === positionB) {
      return a[1] - b[1]
    }
    return positionA - positionB
  })

  // Extract the sorted items from the pairs
  const sortedArray = sortedArrayWithIndices.map(([item, _]) => item)
  return sortedArray
}
