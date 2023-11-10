import type { UUID } from '@/types/schemas'

type SortableByPosition = {
  id: UUID
  position?: number | null
  [key: string]: any // Allow any other properties
}

export function sortByPosition(
  items: Array<SortableByPosition | null>,
): Array<SortableByPosition | null> {
  return items
    .map((item, index) => ({ item, index })) // Pair each item with its original index
    .sort((a, b) => {
      // Use the position if it exists, otherwise fall back to the index
      const positionA = a.item?.position ?? a.index
      const positionB = b.item?.position ?? b.index

      // If positions are equal, use the original index as a tie-breaker
      return positionA - positionB
    })
    .map(({ item }) => item) // Extract the sorted items
}
