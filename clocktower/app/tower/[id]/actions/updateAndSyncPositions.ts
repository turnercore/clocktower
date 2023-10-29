'use server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { UpdateAndSyncPositionParamsSchema, type UpdateAndSyncPositionParams, type UUID } from '@/types'


// Server action to update and sync positions of entities
// works on rows and clocks
// Is not async, it is fire and forget. If the database update fail, it will just continue, 
// the returned array will still be updated and sorted
export async function updateAndSyncPositions(params: UpdateAndSyncPositionParams) {
  try {
    const validatedParams = UpdateAndSyncPositionParamsSchema.safeParse(params)
    if (!validatedParams.success) {
      const errorMessages = validatedParams.error.errors.map(err => err.message).join(' ')
      throw new Error(`Invalid params object in updateAndSyncPositions: ${errorMessages}`)
    }
    const { entityType, entities } = validatedParams.data
    const supabase = createRouteHandlerClient({cookies})

    const { data: sortedEntities, error: sortedError } = sortByPosition(entities)  // Updated argument
    if (sortedError) throw sortedError
    if (!sortedEntities) throw new Error('No data returned from sortByPosition')

    const tableName = entityType === "row" ? 'tower_rows' : 'clocks'  // Updated comparison
    sortedEntities.forEach((sortedEntity, index) => { 
      // Ensure the entity has an id so we know how to update it
      if (!sortedEntity.id) throw new Error(`Entity with position ${index} is missing an id`)
      if (sortedEntity.position !== index) {
        sortedEntity.position = index
        return supabase  // Added return
          .from(tableName)
          .update({ position: index })
          .eq('id', sortedEntity.id)
          .then(({ error }) => {
            if (error) {
              console.error(`Failed to update position for ${entityType} with id ${sortedEntity.id}`, error)
            }
          })
      }
    })

    return { data: sortedEntities }

  } catch (error) {
    if (error instanceof Error) return { error: error.message }
    else console.error(error)
  }
}

type SortableEntity = {
  id: UUID;
  position?: number;
  [key: string]: unknown;
};

function sortByPosition(entities: SortableEntity[]): { data?: SortableEntity[], error?: Error } {
  try {
    // Ensure all entities have a position field, using array index if necessary
    const entitiesWithPositions: { id: UUID; position: number; [key: string]: unknown }[] = entities.map((entity, index) => {
      return {
        ...entity,
        position: entity.position !== undefined ? entity.position : index,
      };
    });

    // Sort the entities based on the position field, using input array index as tie-breaker
    entitiesWithPositions.sort((a, b) => {
      if (a.position === b.position) return 0;
      return a.position - b.position;
    });

    // Update the position field to match the index in the sorted array
    const sortedArray = entitiesWithPositions.map((entity, index) => {
      return {
        ...entity,
        position: index,
      };
    });

    return { data: sortedArray };
  } catch (error) {
    if (error instanceof Error) return {error};
    console.error(error);
    return { error: new Error('An unexpected error occurred') };
  }
}
