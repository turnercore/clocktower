import { type UUID } from '@/types/schemas'
import { useTowerAccess } from '@/app/tower/[id]/components/TowerAccessContext'

const useEditAccess = (towerId: UUID): boolean => {
  void towerId
  return useTowerAccess().hasEditAccess
}

export default useEditAccess
