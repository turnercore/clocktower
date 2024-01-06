import { UUID } from '@/types/schemas'
import { v4 as uuv4 } from 'uuid'

export default function generateUUID(): UUID {
  return uuv4()
}
