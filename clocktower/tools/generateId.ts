import { UUID } from '@/types'
import { randomUUID } from 'crypto'

export default function generateUUID(): UUID {
  return randomUUID()
}
