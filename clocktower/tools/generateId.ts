import { UUID } from '@/types/schemas'
import { randomUUID } from 'crypto'

export default function generateUUID(): UUID {
  return randomUUID()
}
