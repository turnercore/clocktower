'use server'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import {
  UpdateAndSyncPositionParamsSchema,
  UpdateAndSyncPositionParams,
  ServerActionError,
  SortableEntity,
  SortableEntitySchema,
  ServerActionReturn,
} from '@/types/schemas'
import { Database } from '@/types/supabase'

// Server action to update and sync positions of entities
// works on rows and clocks
// Is not async, it is fire and forget. If the database update fail, it will just continue,
// the returned array will still be updated and sorted
export const updateAndSyncPositions = async (
  params: UpdateAndSyncPositionParams,
): Promise<ServerActionReturn<SortableEntity[]>> => {
  try {
    // If entities is empty, return empty array
    if (params.entities.length === 0) return { data: [] }
    const validatedParams = UpdateAndSyncPositionParamsSchema.safeParse(params)
    if (!validatedParams.success) {
      const errorMessages = validatedParams.error.errors
        .map((err) => err.message)
        .join(' ')
      throw new Error(
        `Invalid params object in updateAndSyncPositions: ${errorMessages}`,
      )
    }
    const { entityType, entities } = validatedParams.data
    const supabase = createServerActionClient<Database>({ cookies })

    const sortResult = sortByPosition(entities)
    if ('error' in sortResult) throw new Error(sortResult.error)
    const sortedEntities = sortResult.data

    const tableName = entityType === 'row' ? 'tower_rows' : 'clocks' // Updated comparison
    sortedEntities.forEach((sortedEntity, index) => {
      // Ensure the entity has an id so we know how to update it
      if (!sortedEntity.id)
        throw new Error(`Entity with position ${index} is missing an id`)
      if (sortedEntity.position !== index) {
        sortedEntity.position = index
        return supabase // Added return
          .from(tableName)
          .update({ position: index })
          .eq('id', sortedEntity.id)
          .then(({ error }) => {
            if (error) {
              console.error(
                `Failed to update position for ${entityType} with id ${sortedEntity.id}`,
                error,
              )
              throw error
            }
          })
      }
    })

    return { data: sortedEntities }
  } catch (error) {
    return error instanceof Error
      ? { error: error.message ? error.message : 'Unknown error' }
      : { error: 'Unknown error from fetchClockData.' }
  }
}

// This function sorts an array of objects based on their position field,
// which is defined in the SortableEntitySchema. If the position field is
// undefined or null, it will be set to 100, which will cause it to be sorted
// to the end of the array. If the position field is not a number, it will be
// set to 100, which will cause it to be sorted to the end of the array.
// If there is a tie in the position field, the object whose position field is
// defined first in the array will be sorted first.

type SortResult = { data: SortableEntity[] } | ServerActionError

function sortByPosition(entities: SortableEntity[]): SortResult {
  try {
    // Ensure valid input data
    let errorInValidatingEntities
    const validatedEntities = entities.map((entity) => {
      const safeParseResult = SortableEntitySchema.safeParse(entity)
      if (safeParseResult.success) return safeParseResult.data
      else errorInValidatingEntities = safeParseResult.error
    })

    // Error out if there was an issue
    if (errorInValidatingEntities) {
      throw new Error(
        `Invalid entities array in sortByPosition: ${errorInValidatingEntities}`,
      )
    }

    // At this point all entities have a position field or their position was set to 100 by zod
    // Sort the entities based on the position field, using input array index as tie-breaker
    if (validatedEntities.length === 0) throw new Error('No entities to sort')

    if (validatedEntities.length === 1)
      return { data: validatedEntities as SortableEntity[] }

    const entitiesWithPositions = validatedEntities.sort((a, b) => {
      if (!a || !b) throw new Error('Missing entity in sortByPosition')
      if (a.position === b.position) return 0
      if (a.position === 100) return 1
      if (b.position === 100) return -1
      return a.position - b.position
    })

    // Update the position field to match the index in the sorted array
    const sortedArray: SortableEntity[] = entitiesWithPositions.map(
      (object, index) => {
        const entity = { ...object }
        entity.position = index
        entity.id = entity.id ? entity.id : 'unknownId'
        return entity
      },
    ) as SortableEntity[]

    return { data: sortedArray }
  } catch (error) {
    return error instanceof Error
      ? { error: error.message }
      : { error: 'Unknown error from fetchTowerRowData.' }
  }
}
